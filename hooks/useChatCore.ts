
import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, MessageType, Channel } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { storageService, isConfigured } from '../services/storageService';

export const useChatCore = (userName: string) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [privateChats, setPrivateChats] = useState<string[]>(['GeminiBot']);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [isAILoading, setIsAILoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Realtime aboneliğini takip etmek için ref
  const subscriptionRef = useRef<any>(null);

  // 1. Veritabanı Yapılandırma ve Başlangıç Verisi
  useEffect(() => {
    if (!isConfigured()) {
      setError("Lütfen services/storageService.ts dosyasındaki SUPABASE_URL ve SUPABASE_ANON_KEY değerlerini kendi projenizinkilerle değiştirin.");
      return;
    }

    const loadData = async () => {
      setError(null);
      const fetchedChannels = await storageService.getChannels();
      
      // Eğer 'general' kanalı yoksa oluştur (İlk kurulum yardımı)
      if (!fetchedChannels.find(c => c.name === 'general')) {
        const defaultChan = { name: 'general', description: 'Global Lobby', unreadCount: 0, users: [userName] };
        await storageService.createChannel(defaultChan);
        setChannels([defaultChan, ...fetchedChannels]);
      } else {
        setChannels(fetchedChannels);
      }
      
      const fetchedMessages = await storageService.getMessagesByChannel(activeTab);
      setMessages(fetchedMessages);
    };

    loadData();
  }, [activeTab, userName]);

  // 2. Realtime Aboneliği (Abonelik yönetimi optimize edildi)
  useEffect(() => {
    if (!isConfigured()) return;

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    subscriptionRef.current = storageService.subscribeToMessages((payload) => {
      const newMessage = payload.new;
      if (newMessage.channel === activeTab) {
        setMessages(prev => {
          // Çift mesaj gelmesini önle
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, {
            ...newMessage,
            timestamp: new Date(newMessage.created_at),
            type: newMessage.type as MessageType
          }];
        });
      }
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [activeTab]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Komut İşleme (IRC Tarzı)
    if (text.startsWith('/')) {
      await handleCommand(text);
      return;
    }

    // Mesajı Supabase'e gönder
    await storageService.saveMessage({
      sender: userName,
      text,
      type: MessageType.USER,
      channel: activeTab
    });

    // AI Yanıtı (Sadece DM ise veya özel tetikleyici varsa)
    if (activeTab === 'GeminiBot') {
      setIsAILoading(true);
      const res = await getGeminiResponse(text, "User DM session");
      await storageService.saveMessage({
        sender: 'GeminiBot',
        text: res,
        type: MessageType.AI,
        channel: 'GeminiBot'
      });
      setIsAILoading(false);
    }
  };

  const handleCommand = async (fullCmd: string) => {
    const [cmd, ...args] = fullCmd.slice(1).split(' ');
    const argStr = args.join(' ');

    switch (cmd.toLowerCase()) {
      case 'join':
        const name = argStr.toLowerCase().replace('#', '');
        if (name) {
          if (!channels.find(c => c.name === name)) {
            const newChan = { name, description: 'Created by User', unreadCount: 0, users: [userName] };
            await storageService.createChannel(newChan);
            setChannels(p => [...p, newChan]);
          }
          setActiveTab(name);
        }
        break;
      case 'ai':
        setIsAILoading(true);
        // Kullanıcı komutunu kanalda göster
        await storageService.saveMessage({ sender: userName, text: fullCmd, type: MessageType.USER, channel: activeTab });
        const res = await getGeminiResponse(argStr, `Context: ${activeTab} channel talk`);
        await storageService.saveMessage({ sender: 'GeminiBot', text: res, type: MessageType.AI, channel: activeTab });
        setIsAILoading(false);
        break;
      case 'me':
        await storageService.saveMessage({ sender: userName, text: argStr, type: MessageType.ACTION, channel: activeTab });
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

  return {
    channels,
    privateChats,
    activeTab,
    setActiveTab,
    messages,
    sendMessage,
    initiatePrivateChat,
    isAILoading,
    error
  };
};
