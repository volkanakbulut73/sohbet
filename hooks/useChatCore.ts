
import { useState, useCallback, useEffect } from 'react';
import { Message, MessageType, Channel } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { storageService, supabase } from '../services/storageService';
import { CHAT_MODULE_CONFIG } from '../config';

export const useChatCore = (initialUserName: string) => {
  const [userName, setUserName] = useState(() => localStorage.getItem('mirc_nick') || initialUserName);
  const [openTabs, setOpenTabs] = useState<string[]>(['#sohbet', '#yardim', '#radyo', CHAT_MODULE_CONFIG.BOT_NAME]);
  const [unreadTabs, setUnreadTabs] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<string>('#sohbet');
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [allowPrivateMessages, setAllowPrivateMessages] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      const regs = await storageService.getAllRegistrations();
      const approvedNicks = regs
        .filter(r => r.status === 'approved')
        .map(r => r.nickname);
      
      const list = Array.from(new Set([...approvedNicks, 'Admin', CHAT_MODULE_CONFIG.BOT_NAME]));
      setOnlineUsers(list);
    } catch (e) {
      console.error("Kullanıcı listesi çekilemedi:", e);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 10000);
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
          await storageService.saveMessage({ sender: 'SYSTEM', text: `* ${old} ismini ${args[0]} olarak güncelledi.`, type: MessageType.SYSTEM, channel: activeTab });
        }
        break;
      case '/query':
        if (args[0]) initiatePrivateChat(args[0]);
        break;
      case '/close':
        closeTab(activeTab);
        break;
      case '/block':
        if (args[0]) toggleBlock(args[0]);
        break;
      default:
        console.log("Bilinmeyen komut");
    }
  };

  const toggleBlock = (nick: string) => {
    setBlockedUsers(prev => 
      prev.includes(nick) ? prev.filter(u => u !== nick) : [...prev, nick]
    );
  };

  const closeTab = (tabName: string) => {
    if (openTabs.length <= 1) return;
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
        const res = await getGeminiResponse(text, "Workigom VIP Sohbet", undefined);
        await storageService.saveMessage({ sender: CHAT_MODULE_CONFIG.BOT_NAME, text: res, type: MessageType.AI, channel: CHAT_MODULE_CONFIG.BOT_NAME });
      }
    } catch (err: any) { console.error(err); }
  };

  useEffect(() => {
    setUnreadTabs(prev => prev.filter(t => t !== activeTab));
  }, [activeTab]);

  useEffect(() => {
    if (!userName) return;

    const currentChannel = activeTab.startsWith('#') || activeTab === CHAT_MODULE_CONFIG.BOT_NAME
      ? activeTab
      : getPrivateChannelId(userName, activeTab);
    
    storageService.getMessagesByChannel(currentChannel).then(setMessages);
    
    const sub = supabase
      .channel('realtime_core')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        const msgChannel = newMsg.channel as string;

        if (msgChannel === currentChannel) {
          if (!blockedUsers.includes(newMsg.sender)) {
            const m = { ...newMsg, id: newMsg.id.toString(), timestamp: new Date(newMsg.created_at) } as Message;
            setMessages(prev => [...prev.filter(x => x.id !== m.id), m]);
          }
        }

        if (msgChannel.startsWith('private:') && msgChannel.includes(userName)) {
          const otherUser = newMsg.sender === userName 
            ? msgChannel.split(':').find(part => part !== 'private' && part !== userName)
            : newMsg.sender;

          if (otherUser && otherUser !== userName && !blockedUsers.includes(otherUser)) {
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
  }, [activeTab, userName, blockedUsers]);

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
    onlineUsers
  };
};
