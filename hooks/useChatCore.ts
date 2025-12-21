
import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, MessageType, Channel, RadioState, PlaylistItem } from '../types';
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
  
  // Radyo ve Ses Ayarları
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('mirc_muted') === 'true');
  const [radioState, setRadioState] = useState<RadioState>({
    currentUrl: 'https://streaming.radio.co/s647d78018/listen', // Varsayılan radyo
    isPlaying: false,
    playlist: []
  });

  const subscriptionRef = useRef<any>(null);
  const radioSubRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  // Radyo Senkronizasyonu
  useEffect(() => {
    const fetchRadio = async () => {
      const { data } = await supabase.from('app_configs').select('value').eq('key', 'radio_config').maybeSingle();
      if (data) setRadioState(data.value);
    };
    fetchRadio();

    radioSubRef.current = supabase.channel('radio_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_configs', filter: 'key=eq.radio_config' }, 
      (payload) => {
        if (payload.new) setRadioState((payload.new as any).value);
      }).subscribe();

    return () => { radioSubRef.current?.unsubscribe(); };
  }, []);

  const updateRadioConfig = async (newState: Partial<RadioState>) => {
    if (!isAdmin) return;
    const updated = { ...radioState, ...newState };
    await supabase.from('app_configs').upsert({ key: 'radio_config', value: updated });
  };

  const isOp = (channelName: string) => {
    if (isAdmin) return true;
    const chan = channels.find(c => c.name === channelName);
    return chan?.operators?.includes(userName) || false;
  };

  useEffect(() => {
    if (!isConfigured()) return;
    const loadChannels = async () => {
      const fetched = await storageService.getChannels();
      if (fetched.length === 0) {
        const defaultChan = { name: 'sohbet', description: 'Ana Oda', unreadCount: 0, users: [userName], operators: [userName] };
        await storageService.createChannel(defaultChan);
        setChannels([defaultChan]);
      } else {
        setChannels(fetched);
      }
    };
    loadChannels();
  }, [userName]);

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

  const handleAdminAction = async (action: string, target: string) => {
    if (!isAdmin && !isOp(activeTab)) return;
    // ... admin logic
  };

  const toggleRadio = () => {
    setRadioState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
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
    radioState, toggleRadio, updateRadioConfig,
    handleAdminAction,
    initiatePrivateChat: (u: string) => { if(!privateChats.includes(u)) setPrivateChats(p => [...p, u]); setActiveTab(u); }
  };
};
