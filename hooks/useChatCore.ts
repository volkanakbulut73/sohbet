
import { useState, useCallback, useEffect } from 'react';
import { Message, MessageType, Channel } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { storageService, supabase } from '../services/storageService';
import { CHAT_MODULE_CONFIG } from '../config';

/**
 * Helper to convert any error into a readable string
 */
const toErrorString = (e: any): string => {
  if (!e) return "Bilinmeyen hata";
  if (typeof e === 'string') return e;
  if (e.message) return e.message;
  try {
    const str = JSON.stringify(e);
    return str === '{}' ? e.toString() : str;
  } catch {
    return String(e);
  }
};

export const useChatCore = (initialUserName: string) => {
  const [userName, setUserName] = useState(() => localStorage.getItem('mirc_nick') || initialUserName);
  const [openTabs, setOpenTabs] = useState<string[]>(['#sohbet', '#yardim', '#radyo', CHAT_MODULE_CONFIG.BOT_NAME]);
  const [unreadTabs, setUnreadTabs] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<string>('#sohbet');
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [allowPrivateMessages, setAllowPrivateMessages] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([CHAT_MODULE_CONFIG.BOT_NAME, 'Admin']);
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
      if (regs && regs.length > 0) {
        const approvedNicks = regs
          .filter(r => r.status === 'approved')
          .map(r => r.nickname);
        
        const list = Array.from(new Set([...approvedNicks, 'Admin', CHAT_MODULE_CONFIG.BOT_NAME]));
        setOnlineUsers(list);
      }
    } catch (e: any) {
      // Sadece kritik hataları konsola bas, "Failed to fetch" hatalarını navigator.onLine durumunda yut
      if (navigator.onLine) {
        console.warn("Kullanıcı listesi güncellenirken geçici bir sorun oluştu.");
      }
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 20000);
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

    switch (cmd) {
      case '/nick':
        if (args[0]) {
          const old = userName;
          setUserName(args[0]);
          localStorage.setItem('mirc_nick', args[0]);
          await storageService.saveMessage({ 
            sender: 'SYSTEM', 
            text: `* ${old} ismini ${args[0]} olarak güncelledi.`, 
            type: MessageType.SYSTEM, 
            channel: activeTab 
          });
        }
        break;
      case '/query':
        if (args[0]) initiatePrivateChat(args[0]);
        break;
      case '/close':
        closeTab(activeTab);
        break;
      default:
        console.warn("Komut tanınmadı:", cmd);
    }
  };

  const toggleBlock = (nick: string) => {
    setBlockedUsers(prev => 
      prev.includes(nick) ? prev.filter(u => u !== nick) : [...prev, nick]
    );
  };

  const closeTab = async (tabName: string) => {
    if (openTabs.length <= 1) return;

    if (!tabName.startsWith('#')) {
      const channelId = tabName === CHAT_MODULE_CONFIG.BOT_NAME ? tabName : getPrivateChannelId(userName, tabName);
      await storageService.deleteMessagesByChannel(channelId);
    }

    setOpenTabs(prev => {
      const newTabs = prev.filter(t => t !== tabName);
      if (activeTab === tabName) setActiveTab(newTabs[0]);
      return newTabs;
    });
    setUnreadTabs(prev => prev.filter(t => t !== tabName));
  };

  const initiatePrivateChat = (u: string) => {
    if (u === userName) return;
    if (!allowPrivateMessages && u !== CHAT_MODULE_CONFIG.BOT_NAME) {
      alert("Özel mesajlarınız kapalı.");
      return;
    }
    setOpenTabs(prev => prev.includes(u) ? prev : [...prev, u]);
    setActiveTab(u);
    setUnreadTabs(prev => prev.filter(t => t !== u));
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    if (!navigator.onLine) {
      alert("Çevrimdışısınız. Mesaj gönderilemez.");
      return;
    }
    
    if (text.startsWith('/')) {
      await handleCommand(text);
      return;
    }

    const channel = activeTab.startsWith('#') || activeTab === CHAT_MODULE_CONFIG.BOT_NAME 
      ? activeTab 
      : getPrivateChannelId(userName, activeTab);

    try {
      await storageService.saveMessage({
        sender: userName,
        text: text,
        type: MessageType.USER,
        channel: channel
      });

      if (activeTab === CHAT_MODULE_CONFIG.BOT_NAME) {
        const res = await getGeminiResponse(text, `Platform: Workigom VIP Network, User: ${userName}`);
        await storageService.saveMessage({ 
          sender: CHAT_MODULE_CONFIG.BOT_NAME, 
          text: res, 
          type: MessageType.AI, 
          channel: CHAT_MODULE_CONFIG.BOT_NAME 
        });
      }
    } catch (err: any) { 
      const errorStr = toErrorString(err);
      if (errorStr.includes("Failed to fetch")) {
        alert("Bağlantı hatası: Sunucuya ulaşılamadı. İnternetinizi kontrol edin.");
      } else {
        console.error("Mesaj gönderme hatası:", errorStr);
      }
    }
  };

  useEffect(() => {
    setUnreadTabs(prev => prev.filter(t => t !== activeTab));
  }, [activeTab]);

  useEffect(() => {
    if (!userName || !storageService.isConfigured()) return;

    const currentChannel = activeTab.startsWith('#') || activeTab === CHAT_MODULE_CONFIG.BOT_NAME
      ? activeTab
      : getPrivateChannelId(userName, activeTab);
    
    storageService.getMessagesByChannel(currentChannel)
      .then(setMessages)
      .catch(e => {
         if (navigator.onLine) console.error("Mesajlar çekilemedi:", toErrorString(e));
      });
    
    const channelName = `realtime_${activeTab.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const sub = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        const msgChannel = newMsg.channel as string;

        if (msgChannel === currentChannel) {
          if (!blockedUsers.includes(newMsg.sender)) {
            const m = { ...newMsg, id: newMsg.id.toString(), timestamp: new Date(newMsg.created_at) } as Message;
            setMessages(prev => {
              const exists = prev.some(x => x.id === m.id);
              return exists ? prev : [...prev, m];
            });
          }
        }

        if (msgChannel.startsWith('private:') && msgChannel.includes(userName)) {
          const parts = msgChannel.split(':');
          const otherUser = parts.find(part => part !== 'private' && part !== userName);

          if (otherUser && !blockedUsers.includes(otherUser)) {
            setOpenTabs(prev => prev.includes(otherUser) ? prev : [...prev, otherUser]);
            if (activeTab !== otherUser) {
              setUnreadTabs(prev => prev.includes(otherUser) ? prev : [...prev, otherUser]);
            }
          }
        }

        if (msgChannel.startsWith('#') && msgChannel !== activeTab) {
           setUnreadTabs(prev => prev.includes(msgChannel) ? prev : [...prev, msgChannel]);
        }
      })
      .subscribe();
    
    return () => { sub?.unsubscribe(); };
  }, [activeTab, userName, blockedUsers, isOnline]);

  return {
    userName, setUserName,
    openTabs, setOpenTabs,
    unreadTabs,
    activeTab, setActiveTab,
    messages, sendMessage,
    blockedUsers, toggleBlock,
    closeTab,
    allowPrivateMessages, setAllowPrivateMessages,
    initiatePrivateChat,
    onlineUsers,
    isOnline
  };
};
