
import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, MessageType, Channel } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { storageService, isConfigured } from '../services/storageService';

export const useChatCore = (initialUserName: string) => {
  const [userName, setUserName] = useState(() => localStorage.getItem('mirc_nick') || initialUserName);
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

  const getDMChannelName = (otherUser: string) => {
    if (otherUser === 'GeminiBot' || otherUser === 'Status') return otherUser;
    const users = [userName, otherUser].sort();
    return `private:${users[0]}:${users[1]}`;
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
          const defaultChan = { name: 'general', description: 'Global Lobby', unreadCount: 0, users: [userName] };
          await storageService.createChannel(defaultChan);
          currentChannels = [defaultChan, ...fetchedChannels];
        }
        setChannels(currentChannels);
        
        const targetChannel = channels.some(c => c.name === activeTab) ? activeTab : getDMChannelName(activeTab);
        const fetchedMessages = await storageService.getMessagesByChannel(targetChannel);
        setMessages(fetchedMessages);

        if (!activeTab.includes('GeminiBot') && activeTab !== 'Status') {
          const isChannel = currentChannels.some(c => c.name === activeTab);
          if (isChannel && !joinedChannelsRef.current.has(activeTab)) {
            await storageService.saveMessage({
              sender: 'System',
              text: `${userName} sohbet odasına girdi.`,
              type: MessageType.SYSTEM,
              channel: activeTab
            });
            await storageService.addUserToChannel(activeTab, userName);
            setChannels(prev => prev.map(c => {
              if (c.name === activeTab) {
                const updatedUsers = Array.from(new Set([...(c.users || []), userName]));
                return { ...c, users: updatedUsers };
              }
              return c;
            }));
            joinedChannelsRef.current.add(activeTab);
          }
        }
      } catch (err: any) {
        setError(`Bağlantı Hatası: ${err.message}`);
      }
    };
    loadData();
  }, [activeTab, userName]);

  useEffect(() => {
    if (!isConfigured()) return;
    if (subscriptionRef.current) subscriptionRef.current.unsubscribe();

    const targetChannel = channels.some(c => c.name === activeTab) ? activeTab : getDMChannelName(activeTab);

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
      });
    } catch (e) {}

    return () => {
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
    };
  }, [activeTab, userName, channels]);

  const sendMessage = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;
    
    try {
      if (text.startsWith('/')) {
        await handleCommand(text);
        return;
      }

      const targetChannel = channels.some(c => c.name === activeTab) ? activeTab : getDMChannelName(activeTab);

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
      case 'nick':
        if (argStr) {
          const oldNick = userName;
          setUserName(argStr);
          await storageService.saveMessage({
            sender: 'System',
            text: `${oldNick} artık ${argStr} olarak biliniyor.`,
            type: MessageType.SYSTEM,
            channel: activeTab
          });
        }
        break;
      case 'clear':
        setMessages([]);
        break;
      case 'join':
        const name = argStr.toLowerCase().replace('#', '');
        if (name) {
          try {
            if (!channels.find(c => c.name === name)) {
              const newChan = { name, description: 'User Channel', unreadCount: 0, users: [userName] };
              await storageService.createChannel(newChan);
              setChannels(p => [...p, newChan]);
            }
            setActiveTab(name);
          } catch (e) {}
        }
        break;
      case 'block':
        if (argStr) toggleBlockUser(argStr);
        break;
    }
  };

  const initiatePrivateChat = (targetName: string) => {
    if (targetName === userName) return;
    if (!privateChats.includes(targetName)) {
      setPrivateChats(p => [...p, targetName]);
    }
    setActiveTab(targetName);
  };

  const toggleBlockUser = (targetUser: string) => {
    if (targetUser === userName || targetUser === 'GeminiBot') return;
    setBlockedUsers(prev => 
      prev.includes(targetUser) 
        ? prev.filter(u => u !== targetUser) 
        : [...prev, targetUser]
    );
  };

  return {
    userName,
    setUserName,
    channels, 
    privateChats, 
    blockedUsers,
    toggleBlockUser,
    activeTab, 
    setActiveTab, 
    messages, 
    sendMessage, 
    initiatePrivateChat,
    isAILoading,
    error
  };
};
