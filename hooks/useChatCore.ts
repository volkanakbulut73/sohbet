
import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, MessageType, Channel } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { storageService, isConfigured, supabase } from '../services/storageService';

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
  const [activeTab, setActiveTab] = useState<string>('sohbet');
  const [isAILoading, setIsAILoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('mirc_muted') === 'true');

  const subscriptionRef = useRef<any>(null);
  const channelSubRef = useRef<any>(null);
  const notifySound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'));

  const handleError = (err: any) => {
    console.error("Chat Error Detail:", err);
    let msg = "Beklenmedik bir hata oluştu.";
    
    if (typeof err === 'string') {
      msg = err;
    } else if (err && typeof err === 'object') {
      // Supabase hata nesnelerini veya standart hataları ayıkla
      msg = err.message || err.error_description || err.details || (err.error && err.error.message) || JSON.stringify(err);
    }
    
    // Sütun eksik hatası için özel yönlendirme
    if (msg.includes("isLocked") && msg.includes("column")) {
      msg = "Sistem Hatası: 'isLocked' özelliği veritabanında aktifleşmemiş görünüyor. Lütfen sayfayı yenileyin veya yöneticiye bildirin.";
    }

    setError(msg);
    setTimeout(() => setError(null), 6000);
  };

  useEffect(() => {
    localStorage.setItem('mirc_blocked', JSON.stringify(blockedUsers));
  }, [blockedUsers]);

  useEffect(() => {
    if (userName && userName.trim() !== '') {
      localStorage.setItem('mirc_nick', String(userName));
    }
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('mirc_muted', isMuted.toString());
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem('mirc_is_admin', isAdmin.toString());
  }, [isAdmin]);

  const currentChannel = channels.find(c => c.name === activeTab);
  
  // ÖNEMLİ: Admin her kanalda OP (Yönetici) sayılır
  const isOp = isAdmin || (currentChannel?.ops || []).includes(userName);

  const loadChannels = async () => {
    if (!userName || userName.trim() === '') return;
    try {
      const fetched = await storageService.getChannels();
      if (fetched.length === 0) {
        const defaultChan = { name: 'sohbet', description: 'Ana Oda', unreadCount: 0, users: [userName] };
        await storageService.createChannel(defaultChan);
        setChannels([defaultChan]);
      } else {
        setChannels(fetched.filter(c => !c.name.startsWith('__SYSTEM')));
      }
    } catch (e) {
      handleError(e);
    }
  };

  useEffect(() => {
    if (!isConfigured() || !userName || userName.trim() === '') return;
    loadChannels();
    channelSubRef.current = storageService.subscribeToChannels(() => {
      loadChannels();
    });
    return () => channelSubRef.current?.unsubscribe();
  }, [userName]);

  const fetchMsgs = async () => {
    if (!userName || userName.trim() === '') return;
    try {
      const fetched = await storageService.getMessagesByChannel(activeTab);
      setMessages(fetched);
    } catch (e) {
      handleError(e);
    }
  };

  useEffect(() => {
    if (!userName || userName.trim() === '') return;
    fetchMsgs();
    subscriptionRef.current = storageService.subscribeToMessages((payload) => {
      if (payload.eventType === 'DELETE') {
        fetchMsgs();
        return;
      }
      const newMessage = payload.new;
      if (newMessage && newMessage.channel === activeTab) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMessage.id)) return prev;
          if (!isMuted && newMessage.sender !== userName) notifySound.current.play().catch(() => {});
          return [...prev, { ...newMessage, timestamp: new Date(newMessage.created_at) }];
        });
      }
    });

    return () => subscriptionRef.current?.unsubscribe();
  }, [activeTab, isMuted, userName]);

  const sendMessage = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;
    
    // Kilit Kontrolü: Eğer kanal kilitliyse ve kullanıcı Op değilse göndermeyi engelle
    if (currentChannel?.isLocked && !isOp) {
      handleError("Bu oda kilitli. Sadece operatörler yazabilir.");
      return;
    }

    if (currentChannel?.bannedUsers?.includes(userName)) {
      handleError("Bu odadan yasaklandınız.");
      return;
    }

    try {
      await storageService.saveMessage({
        sender: userName,
        text: imageBase64 || text,
        type: imageBase64 ? MessageType.IMAGE : MessageType.USER,
        channel: activeTab
      });

      if (activeTab === 'GeminiBot') {
        setIsAILoading(true);
        const res = await getGeminiResponse(text, activeTab);
        await storageService.saveMessage({ sender: 'GeminiBot', text: res, type: MessageType.AI, channel: 'GeminiBot' });
        setIsAILoading(false);
      }
    } catch (err: any) {
      handleError(err);
    }
  };

  const manageUser = async (targetUser: string, action: 'op' | 'deop' | 'kick' | 'ban') => {
    if (!isOp) return;
    const chan = channels.find(c => c.name === activeTab);
    if (!chan) return;

    try {
      let updates: Partial<Channel> = {};
      const ops = chan.ops || [];
      const banned = chan.bannedUsers || [];

      switch (action) {
        case 'op':
          updates.ops = Array.from(new Set([...ops, targetUser]));
          break;
        case 'deop':
          updates.ops = ops.filter(u => u !== targetUser);
          break;
        case 'kick':
          await storageService.saveMessage({ sender: 'SYSTEM', text: `${targetUser} kanaldan atıldı.`, type: MessageType.SYSTEM, channel: activeTab });
          break;
        case 'ban':
          updates.bannedUsers = Array.from(new Set([...banned, targetUser]));
          await storageService.saveMessage({ sender: 'SYSTEM', text: `${targetUser} kanaldan yasaklandı.`, type: MessageType.SYSTEM, channel: activeTab });
          break;
      }

      if (Object.keys(updates).length > 0) {
        await storageService.updateChannel(activeTab, updates);
      }
    } catch (err) {
      handleError(err);
    }
  };

  const toggleLock = async () => {
    // Sadece admin veya op olan odayı kilitleyebilir
    if (!isOp) return;
    
    const chan = channels.find(c => c.name === activeTab);
    if (!chan) {
      handleError("Bu sekme kilitlenemez.");
      return;
    }

    try {
      const newLockState = !chan.isLocked;
      // Aktif olan kanalı hedef al
      await storageService.updateChannel(activeTab, { isLocked: newLockState });
      
      await storageService.saveMessage({ 
        sender: 'SYSTEM', 
        text: newLockState ? "Bu kanal kilitlendi. Mesaj gönderimi kapatıldı." : "Kanal kilidi açıldı. Herkes yazabilir.", 
        type: MessageType.SYSTEM, 
        channel: activeTab 
      });
    } catch (err) {
      handleError(err);
    }
  };

  const clearScreen = async () => {
    if (!isOp) return;
    if (activeTab === 'Status') return;
    
    try {
      // Veritabanından mesajları sil
      await storageService.clearChannelMessages(activeTab);
      
      // Yerel mesajları temizle
      setMessages([]);
      
      // Sistem mesajı göndererek senkronizasyonu başlat
      await storageService.saveMessage({
        sender: 'SYSTEM',
        text: `Kanal içeriği ${userName} tarafından temizlendi.`,
        type: MessageType.SYSTEM,
        channel: activeTab
      });
    } catch (err) {
      handleError(err);
    }
  };

  return {
    userName, setUserName,
    isAdmin, setIsAdmin,
    channels, privateChats, 
    blockedUsers, toggleBlockUser: (u: string) => setBlockedUsers(p => p.includes(u) ? p.filter(x => x!==u) : [...p, u]),
    activeTab, setActiveTab,
    messages, sendMessage,
    isAILoading, isOp, error,
    isMuted, setIsMuted,
    manageUser, toggleLock, clearScreen,
    initiatePrivateChat: (u: string) => { if(!privateChats.includes(u)) setPrivateChats(p => [...p, u]); setActiveTab(u); }
  };
};
