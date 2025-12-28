
import { useState, useCallback, useEffect } from 'react';
import { Message, MessageType } from '../types';
import { storageService, supabase } from '../services/storageService';
import { geminiService } from '../services/geminiService';

const toErrorString = (e: any): string => {
  if (!e) return "Bilinmeyen hata";
  if (typeof e === 'string') return e;
  return e.message || String(e);
};

export const useChatCore = (initialUserName: string) => {
  const [userName, setUserName] = useState(() => localStorage.getItem('mirc_nick') || initialUserName);
  const [openTabs, setOpenTabs] = useState<string[]>(['#sohbet', '#yardim', '#radyo']);
  const [unreadTabs, setUnreadTabs] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<string>('#sohbet');
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [allowPrivateMessages, setAllowPrivateMessages] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>(['Admin', 'Gemini AI', 'Lara']);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!storageService.isConfigured() || !navigator.onLine) return;
    try {
      const regs = await storageService.getAllRegistrations();
      const approvedNicks = regs
        .filter(r => r.status === 'approved' && !r.nickname.toLowerCase().includes('bot'))
        .map(r => r.nickname);
      setOnlineUsers(Array.from(new Set([...approvedNicks, 'Admin', 'Gemini AI', 'Lara'])));
    } catch (e) {
      console.warn("User list fetch partial error.");
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 15000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  const getPrivateChannelId = (user1: string, user2: string) => {
    const sorted = [user1, user2].sort();
    return `private:${sorted[0]}:${sorted[1]}`;
  };

  const handleCommand = async (text: string) => {
    const parts = text.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    if (cmd === '/nick' && args[0]) {
      const old = userName;
      setUserName(args[0]);
      localStorage.setItem('mirc_nick', args[0]);
      await storageService.saveMessage({ 
        sender: 'SYSTEM', 
        text: `* ${old} ismini ${args[0]} olarak güncelledi.`, 
        type: MessageType.SYSTEM, 
        channel: activeTab 
      });
    } else if (cmd === '/query' && args[0]) {
      initiatePrivateChat(args[0]);
    } else if (cmd === '/gemini' || cmd === '/lara') {
      const botType = cmd === '/lara' ? 'lara' : 'gemini';
      const botNick = botType === 'lara' ? 'Lara' : 'Gemini AI';
      const prompt = args.join(' ');
      if (!prompt) return;
      
      const channel = activeTab.startsWith('#') ? activeTab : getPrivateChannelId(userName, activeTab);
      
      await storageService.saveMessage({
        sender: userName,
        text: text,
        type: MessageType.USER,
        channel
      });

      const aiResponse = await geminiService.getChatResponse(prompt, botType);
      await storageService.saveMessage({
        sender: botNick,
        text: aiResponse,
        type: MessageType.USER,
        channel
      });
    }
  };

  const toggleBlock = (nick: string) => {
    setBlockedUsers(prev => prev.includes(nick) ? prev.filter(u => u !== nick) : [...prev, nick]);
  };

  const closeTab = async (tabName: string) => {
    if (openTabs.length <= 1) return;
    if (!tabName.startsWith('#')) {
      const channelId = getPrivateChannelId(userName, tabName);
      await storageService.deleteMessagesByChannel(channelId);
    }
    setOpenTabs(prev => {
      const newTabs = prev.filter(t => t !== tabName);
      if (activeTab === tabName) setActiveTab(newTabs[0]);
      return newTabs;
    });
  };

  const initiatePrivateChat = (u: string) => {
    if (u === userName) return;
    setOpenTabs(prev => prev.includes(u) ? prev : [...prev, u]);
    setActiveTab(u);
    setUnreadTabs(prev => prev.filter(t => t !== u));
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    if (!isOnline) { alert("Bağlantı yok."); return; }
    
    if (text.startsWith('/')) {
      await handleCommand(text);
      return;
    }

    const channel = activeTab.startsWith('#') ? activeTab : getPrivateChannelId(userName, activeTab);

    try {
      await storageService.saveMessage({
        sender: userName,
        text,
        type: MessageType.USER,
        channel
      });

      const lowerText = text.toLowerCase();
      
      // AI Tetikleyiciler
      const isGeminiTarget = lowerText.includes('gemini') || activeTab === 'Gemini AI';
      const isLaraTarget = lowerText.includes('lara') || activeTab === 'Lara' || lowerText.includes('yardım') || lowerText === 'selam' || lowerText === 'slm';

      if (userName === 'Gemini AI' || userName === 'Lara') return;

      if (isGeminiTarget) {
        const aiResponse = await geminiService.getChatResponse(text, 'gemini');
        await storageService.saveMessage({
          sender: 'Gemini AI',
          text: aiResponse,
          type: MessageType.USER,
          channel
        });
      } else if (isLaraTarget) {
        const aiResponse = await geminiService.getChatResponse(text, 'lara');
        await storageService.saveMessage({
          sender: 'Lara',
          text: aiResponse,
          type: MessageType.USER,
          channel
        });
      }
    } catch (err) {
      console.error("SendMessage error:", toErrorString(err));
    }
  };

  useEffect(() => {
    if (!userName || !storageService.isConfigured()) return;
    const currentChannel = activeTab.startsWith('#') ? activeTab : getPrivateChannelId(userName, activeTab);
    storageService.getMessagesByChannel(currentChannel).then(setMessages);

    const sub = supabase
      .channel(`chat_${activeTab.replace(/[^a-zA-Z0-9]/g, '_')}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        if (newMsg.channel === currentChannel) {
          if (!blockedUsers.includes(newMsg.sender)) {
            const m = { ...newMsg, id: newMsg.id.toString(), timestamp: new Date(newMsg.created_at) } as Message;
            setMessages(prev => (prev.some(x => x.id === m.id) ? prev : [...prev, m]));
          }
        }
        if (newMsg.channel !== currentChannel && (newMsg.channel.startsWith('#') || newMsg.channel.includes(userName))) {
          const tabLabel = newMsg.channel.startsWith('#') ? newMsg.channel : newMsg.sender;
          if (tabLabel !== userName) {
            setUnreadTabs(prev => Array.from(new Set([...prev, tabLabel])));
          }
        }
      })
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [activeTab, userName, blockedUsers, isOnline]);

  useEffect(() => {
    setUnreadTabs(prev => prev.filter(t => t !== activeTab));
  }, [activeTab]);

  return {
    userName, setUserName, openTabs, unreadTabs, activeTab, setActiveTab,
    messages, sendMessage, initiatePrivateChat, onlineUsers,
    blockedUsers, toggleBlock, closeTab, isOnline,
    allowPrivateMessages, setAllowPrivateMessages
  };
};
