
import { useState, useCallback, useEffect } from 'react';
import { Message, MessageType, Channel } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { storageService, supabase } from '../services/storageService';

export const useChatCore = (initialUserName: string) => {
  const [userName, setUserName] = useState(() => localStorage.getItem('mirc_nick') || initialUserName);
  const [openTabs, setOpenTabs] = useState<string[]>(['#sohbet', '#yardim', '#radyo', 'GeminiBot']);
  const [unreadTabs, setUnreadTabs] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<string>('#sohbet');
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [allowPrivateMessages, setAllowPrivateMessages] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Veritabanındaki tüm onaylı kullanıcıları getir (Gerçek zamanlı görünüm için)
  const fetchUsers = useCallback(async () => {
    try {
      const regs = await storageService.getAllRegistrations();
      // Sadece onaylı olanları ve kendimizi listeye dahil ediyoruz
      const approvedNicks = regs
        .filter(r => r.status === 'approved')
        .map(r => r.nickname);
      
      // Botları ve adminleri manuel ekle (opsiyonel)
      const list = Array.from(new Set([...approvedNicks, 'Admin', 'GeminiBot']));
      setOnlineUsers(list);
    } catch (e) {
      console.error("Kullanıcı listesi çekilemedi:", e);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 10000); // 10 saniyede bir güncelle
    return () => clearInterval(interval);
  }, [fetchUsers]);

  // Özel mesajlar için ortak kanal ID oluştur (Alfabetik sıralı)
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
    if (!allowPrivateMessages && u !== 'GeminiBot') {
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

    const channel = activeTab.startsWith('#') || activeTab === 'GeminiBot' 
      ? activeTab 
      : getPrivateChannelId(userName, activeTab);

    try {
      await storageService.saveMessage({
        sender: userName,
        text: text,
        type: MessageType.USER,
        channel: channel
      });

      if (activeTab === 'GeminiBot') {
        const res = await getGeminiResponse(text, "Sohbet", undefined);
        await storageService.saveMessage({ sender: 'GeminiBot', text: res, type: MessageType.AI, channel: 'GeminiBot' });
      }
    } catch (err: any) { console.error(err); }
  };

  // Aktif sekme değiştiğinde unread'den (yanıp sönme listesinden) çıkar
  useEffect(() => {
    setUnreadTabs(prev => prev.filter(t => t !== activeTab));
  }, [activeTab]);

  useEffect(() => {
    if (!userName) return;

    const currentChannel = activeTab.startsWith('#') || activeTab === 'GeminiBot'
      ? activeTab
      : getPrivateChannelId(userName, activeTab);
    
    storageService.getMessagesByChannel(currentChannel).then(setMessages);
    
    // Global dinleyici - Özel mesajları ve diğer kanal bildirimlerini yakalar
    const sub = supabase
      .channel('realtime_core')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        const msgChannel = newMsg.channel as string;

        // 1. Durum: Mesaj aktif olduğumuz kanala mı geldi?
        if (msgChannel === currentChannel) {
          if (!blockedUsers.includes(newMsg.sender)) {
            const m = { ...newMsg, id: newMsg.id.toString(), timestamp: new Date(newMsg.created_at) } as Message;
            setMessages(prev => [...prev.filter(x => x.id !== m.id), m]);
          }
        }

        // 2. Durum: Birisi bize özel mesaj mı attı?
        if (msgChannel.startsWith('private:') && msgChannel.includes(userName)) {
          // Karşı tarafın nickini bul
          const otherUser = newMsg.sender === userName 
            ? msgChannel.split(':').find(part => part !== 'private' && part !== userName)
            : newMsg.sender;

          if (otherUser && otherUser !== userName && !blockedUsers.includes(otherUser)) {
            // Pencereyi otomatik aç (eğer açık değilse)
            setOpenTabs(prev => prev.includes(otherUser) ? prev : [...prev, otherUser]);
            
            // Eğer aktif olarak o kişiyle konuşmuyorsak, sekmeyi yanıp söndür
            if (activeTab !== otherUser) {
              setUnreadTabs(prev => prev.includes(otherUser) ? prev : [...prev, otherUser]);
            }
          }
        }

        // 3. Durum: Diğer kanallardan (#sohbet vb.) gelenleri de unread yap (sekmeler arasındaysak)
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
