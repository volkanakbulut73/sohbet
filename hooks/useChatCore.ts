
import { useState, useCallback, useEffect } from 'react';
import { Message, MessageType, Channel } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { storageService } from '../services/storageService';

export const useChatCore = (userName: string) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [privateChats, setPrivateChats] = useState<string[]>(['GeminiBot']);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [isAILoading, setIsAILoading] = useState(false);

  // 1. Kanalları ve Aktif Kanalın Mesajlarını Yükle
  useEffect(() => {
    const loadInitialData = async () => {
      const fetchedChannels = await storageService.getChannels();
      setChannels(fetchedChannels);
      
      const fetchedMessages = await storageService.getMessagesByChannel(activeTab);
      setMessages(fetchedMessages);
    };
    loadInitialData();
  }, [activeTab]);

  // 2. Realtime Aboneliği
  useEffect(() => {
    const subscription = storageService.subscribeToMessages((payload) => {
      const newMessage = payload.new;
      
      // Eğer gelen mesaj şu an açık olan kanala/tab'a aitse listeye ekle
      if (newMessage.channel === activeTab) {
        setMessages(prev => {
          // Mükerrer kaydı önlemek için (kendi gönderdiğimiz mesaj bazen hızlı gelebilir)
          if (prev.find(m => m.id === newMessage.id)) return prev;
          return [...prev, {
            ...newMessage,
            timestamp: new Date(newMessage.created_at),
            type: newMessage.type as MessageType
          }];
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [activeTab]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

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

    // AI Yanıtı
    if (activeTab === 'GeminiBot') {
      setIsAILoading(true);
      const res = await getGeminiResponse(text, "Private DM with Gemini");
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

    if (cmd === 'join') {
      const name = argStr.toLowerCase().replace('#', '');
      if (name) {
        if (!channels.find(c => c.name === name)) {
          const newChan = { name, description: 'New Channel', unreadCount: 0, users: [userName] };
          await storageService.createChannel(newChan);
          setChannels(p => [...p, newChan]);
        }
        setActiveTab(name);
      }
    } else if (cmd === 'ai') {
      setIsAILoading(true);
      await storageService.saveMessage({ sender: userName, text: fullCmd, type: MessageType.USER, channel: activeTab });
      const res = await getGeminiResponse(argStr, `Channel Context: ${activeTab}`);
      await storageService.saveMessage({ sender: 'GeminiBot', text: res, type: MessageType.AI, channel: activeTab });
      setIsAILoading(false);
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
    isAILoading
  };
};
