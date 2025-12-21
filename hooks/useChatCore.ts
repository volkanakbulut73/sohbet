
import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, MessageType, Channel } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { storageService, isConfigured } from '../services/storageService';

export const useChatCore = (initialUserName: string) => {
  const [userName, setUserName] = useState(initialUserName);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [privateChats, setPrivateChats] = useState<string[]>(['GeminiBot']);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [isAILoading, setIsAILoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!isConfigured()) {
      setError("Supabase yapılandırması eksik. Lütfen storageService.ts dosyasındaki SUPABASE_ANON_KEY alanını doldurun.");
      return;
    }

    const loadData = async () => {
      try {
        setError(null);
        const fetchedChannels = await storageService.getChannels();
        
        if (!fetchedChannels.find(c => c.name === 'general')) {
          const defaultChan = { name: 'general', description: 'Global Lobby', unreadCount: 0, users: [userName] };
          await storageService.createChannel(defaultChan);
          setChannels([defaultChan, ...fetchedChannels]);
        } else {
          setChannels(fetchedChannels);
        }
        
        const fetchedMessages = await storageService.getMessagesByChannel(activeTab);
        
        const welcomeMsg: Message = {
          id: 'system-' + Date.now(),
          sender: 'System',
          text: `* ${activeTab} kanalına bağlandınız. Sunucu: Supabase Cloud.`,
          timestamp: new Date(),
          type: MessageType.SYSTEM,
          channel: activeTab
        };
        
        setMessages([welcomeMsg, ...fetchedMessages]);
      } catch (err: any) {
        setError(`Bağlantı Hatası: ${err.message || "Bilinmeyen bir hata oluştu"}`);
      }
    };

    loadData();
  }, [activeTab]);

  useEffect(() => {
    if (!isConfigured()) return;

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    try {
      subscriptionRef.current = storageService.subscribeToMessages((payload) => {
        const newMessage = payload.new;
        if (newMessage.channel === activeTab) {
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
  }, [activeTab]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    try {
      if (text.startsWith('/')) {
        await handleCommand(text);
        return;
      }

      await storageService.saveMessage({
        sender: userName,
        text,
        type: MessageType.USER,
        channel: activeTab
      });

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
            text: `${oldNick} is now known as ${argStr}`,
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
      case 'ai':
        setIsAILoading(true);
        await storageService.saveMessage({ sender: userName, text: fullCmd, type: MessageType.USER, channel: activeTab });
        const res = await getGeminiResponse(argStr, `Context: ${activeTab}`);
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
    userName,
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
