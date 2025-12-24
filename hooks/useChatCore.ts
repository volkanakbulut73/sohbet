
import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, MessageType, Channel } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { storageService, isConfigured, supabase } from '../services/storageService';
import { CHAT_MODULE_CONFIG } from '../config';

export const useChatCore = (initialUserName: string) => {
  const [userName, setUserName] = useState(() => localStorage.getItem('mirc_nick') || initialUserName);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [privateChats, setPrivateChats] = useState<string[]>(['GeminiBot']);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<string>('#sohbet');
  const [isAILoading, setIsAILoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          await storageService.saveMessage({ sender: 'SYSTEM', text: `* ${old} artık ${args[0]} olarak biliniyor.`, type: MessageType.SYSTEM, channel: activeTab });
        }
        break;
      case '/join':
        if (args[0]) {
          const cname = args[0].startsWith('#') ? args[0] : `#${args[0]}`;
          setActiveTab(cname);
        }
        break;
      case '/query':
        if (args[0]) {
          const target = args[0];
          setPrivateChats(prev => prev.includes(target) ? prev : [...prev, target]);
          setActiveTab(target);
        }
        break;
      case '/clear':
        setMessages([]);
        break;
      case '/yardim':
        const helpMsg = "Komutlar: /nick <isim>, /join <kanal>, /query <kullanıcı>, /clear, /me <eylem>";
        setMessages(prev => [...prev, { id: 'help', sender: 'SYSTEM', text: helpMsg, type: MessageType.SYSTEM, channel: activeTab, timestamp: new Date() }]);
        break;
      default:
        setError(`Bilinmeyen komut: ${cmd}`);
    }
  };

  const sendMessage = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;
    
    if (text.startsWith('/')) {
      await handleCommand(text);
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
        const res = await getGeminiResponse(text, "Sohbet", undefined);
        await storageService.saveMessage({ sender: 'GeminiBot', text: res, type: MessageType.AI, channel: 'GeminiBot' });
        setIsAILoading(false);
      }
    } catch (err: any) { setError(err.message); }
  };

  useEffect(() => {
    if (!userName) return;
    storageService.getMessagesByChannel(activeTab).then(setMessages);
    
    const sub = storageService.subscribeToMessages((payload) => {
      if (payload.new && payload.new.channel === activeTab) {
        const newMessage = { ...payload.new, timestamp: new Date(payload.new.created_at) };
        setMessages(prev => [...prev.filter(m => m.id !== newMessage.id), newMessage]);
      }
    });
    
    return () => { sub?.unsubscribe(); };
  }, [activeTab, userName]);

  return {
    userName, setUserName,
    channels, privateChats, 
    activeTab, setActiveTab,
    messages, sendMessage,
    isAILoading, error,
    initiatePrivateChat: (u: string) => { 
      if(!privateChats.includes(u)) setPrivateChats(p => [...p, u]); 
      setActiveTab(u); 
    }
  };
};
