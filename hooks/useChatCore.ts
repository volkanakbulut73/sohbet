
import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, MessageType, Channel, RadioState, PlaylistItem } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { storageService, isConfigured, supabase } from '../services/storageService';

const RADIO_CONFIG_KEY = '__SYSTEM_RADIO__';

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
  
  // Radyo ve Ses Ayarları
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('mirc_muted') === 'true');
  const [radioState, setRadioState] = useState<RadioState>({
    currentUrl: 'https://streaming.radio.co/s647d78018/listen', // Varsayılan radyo
    isPlaying: false,
    playlist: []
  });

  const subscriptionRef = useRef<any>(null);
  const channelSubRef = useRef<any>(null);
  const notifySound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'));

  useEffect(() => {
    localStorage.setItem('mirc_blocked', JSON.stringify(blockedUsers));
  }, [blockedUsers]);

  useEffect(() => {
    localStorage.setItem('mirc_nick', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('mirc_muted', isMuted.toString());
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem('mirc_is_admin', isAdmin.toString());
  }, [isAdmin]);

  // Radyo Ayarlarını Çek (Channels Tablosu Üzerinden)
  const syncRadioFromChannel = (channelsList: Channel[]) => {
    const radioChannel = channelsList.find(c => c.name === RADIO_CONFIG_KEY);
    if (radioChannel && radioChannel.description) {
      try {
        const config = JSON.parse(radioChannel.description);
        setRadioState(config);
      } catch (e) {
        console.error("Radio config parse error:", e);
      }
    }
  };

  const updateRadioConfig = async (newState: Partial<RadioState>) => {
    if (!isAdmin) return;
    const updated = { ...radioState, ...newState };
    
    // UI'ın anında tepki vermesi için yerel state'i güncelle
    setRadioState(updated);
    
    try {
      await storageService.createChannel({
        name: RADIO_CONFIG_KEY,
        description: JSON.stringify(updated),
        unreadCount: 0,
        users: []
      });
    } catch (err: any) {
      console.error("Radio config update failed:", err.message);
      setError("Ayarlar kaydedilemedi.");
    }
  };

  const isOp = (channelName: string) => {
    // operators kolonu olmadığı için admin olan herkes op sayılır
    return isAdmin;
  };

  // Kanal ve Radyo Senkronizasyonu
  useEffect(() => {
    if (!isConfigured()) return;
    
    const loadChannels = async () => {
      try {
        const fetched = await storageService.getChannels();
        if (fetched.length === 0) {
          const defaultChan = { name: 'sohbet', description: 'Ana Oda', unreadCount: 0, users: [userName] };
          await storageService.createChannel(defaultChan);
          setChannels([defaultChan]);
        } else {
          setChannels(fetched.filter(c => !c.name.startsWith('__SYSTEM')));
          syncRadioFromChannel(fetched);
        }
      } catch (e) {
        console.error("Load channels error:", e);
      }
    };

    loadChannels();

    channelSubRef.current = storageService.subscribeToChannels((payload) => {
      loadChannels();
    });

    return () => channelSubRef.current?.unsubscribe();
  }, [userName]);

  // Mesaj Senkronizasyonu
  useEffect(() => {
    const fetchMsgs = async () => {
      const fetched = await storageService.getMessagesByChannel(activeTab);
      setMessages(fetched);
    };
    fetchMsgs();

    subscriptionRef.current = storageService.subscribeToMessages((payload) => {
      const newMessage = payload.new;
      if (newMessage.channel === activeTab) {
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
    try {
      await storageService.saveMessage({
        sender: userName,
        text: imageBase64 || text,
        type: imageBase64 ? MessageType.IMAGE : MessageType.USER,
        channel: activeTab
      });

      if (activeTab === 'GeminiBot') {
        setIsAILoading(true);
        const res = await getGeminiResponse(text, "Direct message context");
        await storageService.saveMessage({ sender: 'GeminiBot', text: res, type: MessageType.AI, channel: 'GeminiBot' });
        setIsAILoading(false);
      }
    } catch (err: any) {
      setError(err.message);
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
    radioState, toggleRadio: () => updateRadioConfig({ isPlaying: !radioState.isPlaying }), 
    updateRadioConfig,
    initiatePrivateChat: (u: string) => { if(!privateChats.includes(u)) setPrivateChats(p => [...p, u]); setActiveTab(u); }
  };
};
