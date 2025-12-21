
import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, MessageType, Channel } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { storageService, isConfigured } from '../services/storageService';

export const useChatCore = (initialUserName: string) => {
  const [userName, setUserName] = useState(() => localStorage.getItem('mirc_nick') || initialUserName);
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('mirc_is_admin') === 'true');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [privateChats, setPrivateChats] = useState<string[]>(['GeminiBot']);
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    const saved = localStorage.getItem('mirc_blocked');
    return saved ? JSON.parse(saved) : [];
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [isAILoading, setIsAILoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const subscriptionRef = useRef<any>(null);
  const channelSubRef = useRef<any>(null);
  const joinedChannelsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem('mirc_blocked', JSON.stringify(blockedUsers));
  }, [blockedUsers]);

  useEffect(() => {
    localStorage.setItem('mirc_nick', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('mirc_is_admin', isAdmin.toString());
  }, [isAdmin]);

  const getDMChannelName = (otherUser: string) => {
    if (otherUser === 'GeminiBot' || otherUser === 'Status') return otherUser;
    const users = [userName, otherUser].sort();
    return `private:${users[0]}:${users[1]}`;
  };

  const isOp = (channelName: string) => {
    if (isAdmin) return true;
    const chan = channels.find(c => c.name === channelName);
    return chan?.operators?.includes(userName) || false;
  };

  useEffect(() => {
    if (isConfigured()) {
      storageService.cleanupOldMessages(24);
    }
  }, []);

  useEffect(() => {
    if (!isConfigured()) return;
    channelSubRef.current = storageService.subscribeToChannels((payload) => {
      const updatedChannel = payload.new as Channel;
      setChannels(prev => {
        const index = prev.findIndex(c => c.name === updatedChannel.name);
        if (index === -1) return [...prev, updatedChannel];
        const newChannels = [...prev];
        newChannels[index] = { ...newChannels[index], ...updatedChannel };
        return newChannels;
      });
    });
    return () => {
      if (channelSubRef.current) channelSubRef.current.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isConfigured()) {
      setError("Supabase yapılandırması eksik.");
      return;
    }

    const loadData = async () => {
      try {
        setError(null);
        const fetchedChannels = await storageService.getChannels();
        let currentChannels = fetchedChannels;
        
        if (!fetchedChannels.find(c => c.name === 'general')) {
          const defaultChan = { 
            name: 'general', 
            description: 'Global Lobby', 
            unreadCount: 0, 
            users: [userName],
            operators: [userName], // İlk kuran Op olur
            bannedUsers: []
          };
          await storageService.createChannel(defaultChan);
          currentChannels = [defaultChan, ...fetchedChannels];
        }
        setChannels(currentChannels);
        
        const isChannel = currentChannels.find(c => c.name === activeTab);
        
        // Ban Kontrolü
        if (isChannel && isChannel.bannedUsers?.includes(userName) && !isAdmin) {
          setError(`Bu kanaldan yasaklısınız: #${activeTab}`);
          setActiveTab('Status');
          return;
        }

        const targetChannelName = isChannel ? activeTab : getDMChannelName(activeTab);
        const fetchedMessages = await storageService.getMessagesByChannel(targetChannelName);
        setMessages(fetchedMessages);

        if (!activeTab.includes('GeminiBot') && activeTab !== 'Status') {
          if (isChannel && !joinedChannelsRef.current.has(activeTab)) {
            await storageService.saveMessage({
              sender: 'System',
              text: `${userName} sohbet odasına girdi.`,
              type: MessageType.SYSTEM,
              channel: activeTab
            });
            await storageService.addUserToChannel(activeTab, userName);
            joinedChannelsRef.current.add(activeTab);
          }
        }
      } catch (err: any) {
        setError(`Hata: ${err.message}`);
      }
    };
    loadData();
  }, [activeTab, userName]);

  useEffect(() => {
    if (!isConfigured()) return;
    if (subscriptionRef.current) subscriptionRef.current.unsubscribe();

    const isChannel = channels.some(c => c.name === activeTab);
    const targetChannel = isChannel ? activeTab : getDMChannelName(activeTab);

    try {
      subscriptionRef.current = storageService.subscribeToMessages((payload) => {
        const newMessage = payload.new;
        if (newMessage.channel === targetChannel) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, {
              ...newMessage,
              timestamp: new Date(newMessage.created_at),
              type: newMessage.type as MessageType
            }];
          });
        }
        // Eğer kicklendiyseniz sekmeyi kapat
        if (newMessage.type === MessageType.SYSTEM && newMessage.text.includes(`${userName} kanaldan atıldı`) && newMessage.channel === activeTab) {
          setActiveTab('Status');
          joinedChannelsRef.current.delete(newMessage.channel);
        }
      });
    } catch (e) {}

    return () => {
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
    };
  }, [activeTab, userName, channels]);

  const handleAdminAction = async (action: 'kick' | 'ban' | 'op' | 'deop', target: string) => {
    if (!isOp(activeTab) && !isAdmin) return;
    
    const chan = channels.find(c => c.name === activeTab);
    if (!chan) return;

    let text = "";
    switch(action) {
      case 'kick':
        text = `${target} kanaldan atıldı. (Admin: ${userName})`;
        await storageService.removeUserFromChannel(activeTab, target);
        break;
      case 'ban':
        text = `${target} kanaldan yasaklandı. (Admin: ${userName})`;
        const banned = Array.from(new Set([...(chan.bannedUsers || []), target]));
        await storageService.updateChannel(activeTab, { bannedUsers: banned });
        await storageService.removeUserFromChannel(activeTab, target);
        break;
      case 'op':
        text = `${target} artık kanal operatörü.`;
        const ops = Array.from(new Set([...(chan.operators || []), target]));
        await storageService.updateChannel(activeTab, { operators: ops });
        break;
      case 'deop':
        text = `${target} operatör yetkileri alındı.`;
        const remainingOps = (chan.operators || []).filter(o => o !== target);
        await storageService.updateChannel(activeTab, { operators: remainingOps });
        break;
    }

    await storageService.saveMessage({
      sender: 'System',
      text,
      type: MessageType.SYSTEM,
      channel: activeTab
    });
  };

  const sendMessage = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;
    
    try {
      if (text.startsWith('/')) {
        await handleCommand(text);
        return;
      }

      const isChannel = channels.some(c => c.name === activeTab);
      const targetChannel = isChannel ? activeTab : getDMChannelName(activeTab);

      await storageService.saveMessage({
        sender: userName,
        text: imageBase64 || text,
        type: imageBase64 ? MessageType.IMAGE : MessageType.USER,
        channel: targetChannel
      });

      if (activeTab === 'GeminiBot') {
        setIsAILoading(true);
        const res = await getGeminiResponse(text, "User DM session", imageBase64);
        await storageService.saveMessage({
          sender: 'GeminiBot',
          text: res,
          type: MessageType.AI,
          channel: 'GeminiBot'
        });
        setIsAILoading(false);
      }
    } catch (err: any) {
      setError(`Mesaj gönderilemedi: ${err.message}`);
    }
  };

  const handleCommand = async (fullCmd: string) => {
    const [cmd, ...args] = fullCmd.slice(1).split(' ');
    const argStr = args.join(' ');

    switch (cmd.toLowerCase()) {
      case 'admin':
        if (argStr === 'admin123') {
          setIsAdmin(true);
          setError("Admin moduna geçildi.");
        } else if (argStr === 'off') {
          setIsAdmin(false);
        }
        break;
      case 'kick':
        if (args[0]) handleAdminAction('kick', args[0]);
        break;
      case 'ban':
        if (args[0]) handleAdminAction('ban', args[0]);
        break;
      case 'op':
        if (args[0]) handleAdminAction('op', args[0]);
        break;
      case 'deop':
        if (args[0]) handleAdminAction('deop', args[0]);
        break;
      case 'nick':
        if (argStr) setUserName(argStr);
        break;
      case 'join':
        const name = argStr.toLowerCase().replace('#', '');
        if (name) setActiveTab(name);
        break;
    }
  };

  const initiatePrivateChat = (targetName: string) => {
    if (targetName === userName) return;
    if (!privateChats.includes(targetName)) setPrivateChats(p => [...p, targetName]);
    setActiveTab(targetName);
  };

  const toggleBlockUser = (targetUser: string) => {
    if (targetUser === userName || targetUser === 'GeminiBot') return;
    setBlockedUsers(prev => prev.includes(targetUser) ? prev.filter(u => u !== targetUser) : [...prev, targetUser]);
  };

  return {
    userName,
    setUserName,
    isAdmin,
    setIsAdmin,
    channels, 
    privateChats, 
    blockedUsers,
    toggleBlockUser,
    activeTab, 
    setActiveTab, 
    messages, 
    sendMessage, 
    initiatePrivateChat,
    handleAdminAction,
    isAILoading,
    isOp,
    error
  };
};
