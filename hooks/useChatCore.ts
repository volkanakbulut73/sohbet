
import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, MessageType, Channel } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { storageService, isConfigured, supabase } from '../services/storageService';
import { CHAT_MODULE_CONFIG } from '../config';

export const useChatCore = (initialUserName: string) => {
  const [userName, setUserName] = useState(() => localStorage.getItem('mirc_nick') || initialUserName);
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('mirc_is_admin') === 'true');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [privateChats, setPrivateChats] = useState<string[]>(['GeminiBot']);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [allowPrivate, setAllowPrivate] = useState(true);
  const [botInstruction, setBotInstruction] = useState(CHAT_MODULE_CONFIG.BOT_SYSTEM_INSTRUCTION);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<string>('sohbet');
  const [isAILoading, setIsAILoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('mirc_muted') === 'true');

  const subscriptionRef = useRef<any>(null);

  const handleError = (err: any) => {
    let rawMsg = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
    setError(rawMsg);
    setTimeout(() => setError(null), 4000);
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
          await storageService.saveMessage({ sender: 'SYSTEM', text: `* ${old} is now known as ${args[0]}`, type: MessageType.SYSTEM, channel: activeTab });
        }
        break;
      case '/join':
        if (args[0]) {
          const cname = args[0].startsWith('#') ? args[0] : `#${args[0]}`;
          setActiveTab(cname);
        }
        break;
      case '/me':
        if (args.length > 0) {
          await storageService.saveMessage({ sender: userName, text: args.join(' '), type: MessageType.ACTION, channel: activeTab });
        }
        break;
      case '/clear':
        setMessages([]);
        break;
      case '/query':
        if (args[0]) {
          const target = args[0];
          setPrivateChats(prev => prev.includes(target) ? prev : [...prev, target]);
          setActiveTab(target);
        }
        break;
      default:
        handleError(`Unknown command: ${cmd}`);
    }
  };

  const sendMessage = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;
    
    if (text.startsWith('/')) {
      await handleCommand(text);
      return;
    }

    const isPrivate = !activeTab.startsWith('#') && activeTab !== 'sohbet';
    
    try {
      await storageService.saveMessage({
        sender: userName,
        text: imageBase64 || text,
        type: imageBase64 ? MessageType.IMAGE : MessageType.USER,
        channel: activeTab
      });

      if (activeTab === 'GeminiBot') {
        setIsAILoading(true);
        const context = messages.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');
        const res = await getGeminiResponse(text, context, undefined, botInstruction);
        await storageService.saveMessage({ sender: 'GeminiBot', text: res, type: MessageType.AI, channel: 'GeminiBot' });
        setIsAILoading(false);
      }
    } catch (err: any) { handleError(err); }
  };

  // Sync logic
  useEffect(() => {
    if (!userName) return;
    storageService.getMessagesByChannel(activeTab).then(setMessages);
    
    const sub = storageService.subscribeToMessages((payload) => {
      if (payload.new && payload.new.channel === activeTab) {
        const newMessage = { ...payload.new, timestamp: new Date(payload.new.created_at) };
        setMessages(prev => {
          if (prev.find(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      }
    });
    
    return () => { sub?.unsubscribe(); };
  }, [activeTab, userName]);

  return {
    userName, setUserName,
    isAdmin, setIsAdmin,
    channels, privateChats, 
    blockedUsers,
    activeTab, setActiveTab,
    messages, sendMessage,
    isAILoading, error,
    botInstruction, setBotInstruction,
    initiatePrivateChat: (u: string) => { if(!privateChats.includes(u)) setPrivateChats(p => [...p, u]); setActiveTab(u); }
  };
};
