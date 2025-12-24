
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
  const [updateRequired, setUpdateRequired] = useState(false);

  const subscriptionRef = useRef<any>(null);
  const channelSubRef = useRef<any>(null);

  const handleError = (err: any) => {
    let rawMsg = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
    setError(rawMsg);
    setTimeout(() => setError(null), 4000);
  };

  useEffect(() => {
    if (!userName) return;
    const fetchSettings = async () => {
      const settings = await storageService.getUserSettings(userName);
      setAllowPrivate(settings.allow_private);
      const instruction = await storageService.getBotInstruction();
      setBotInstruction(instruction);
    };
    fetchSettings();
  }, [userName]);

  const saveBotInstruction = async (val: string) => {
    if (!isAdmin) return;
    try {
      await storageService.updateBotInstruction(val);
      setBotInstruction(val);
      setError("Bot talimatları güncellendi.");
    } catch (e) { handleError(e); }
  };

  const refreshBlocks = async () => {
    if (!userName) return;
    const { data } = await supabase.from('user_blocks').select('blocked').eq('blocker', userName);
    if (data) setBlockedUsers(data.map(d => d.blocked));
  };

  useEffect(() => {
    refreshBlocks();
  }, [userName, activeTab]);

  const toggleAllowPrivate = async (val: boolean) => {
    setAllowPrivate(val);
    await storageService.updateUserSettings(userName, val);
  };

  const blockUser = async (target: string) => {
    try {
      await storageService.addBlock(userName, target);
      await refreshBlocks();
      await storageService.saveMessage({
        sender: 'SYSTEM', text: `${target} engellendi.`, type: MessageType.SYSTEM, channel: activeTab
      });
    } catch (e) { handleError(e); }
  };

  const unblockUser = async (target: string) => {
    try {
      await storageService.removeBlock(userName, target);
      await refreshBlocks();
      await storageService.saveMessage({
        sender: 'SYSTEM', text: `${target} engeli kaldırıldı.`, type: MessageType.SYSTEM, channel: activeTab
      });
    } catch (e) { handleError(e); }
  };

  const closeTab = (name: string) => {
    if (name === 'sohbet') return;
    if (name.startsWith('#') || channels.some(c => c.name === name)) {
      setChannels(prev => prev.filter(c => c.name !== name));
    } else {
      setPrivateChats(prev => prev.filter(n => n !== name));
    }
    if (activeTab === name) setActiveTab('sohbet');
  };

  const sendMessage = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;
    const isPrivate = !activeTab.startsWith('#') && activeTab !== 'sohbet';
    
    if (isPrivate && activeTab !== 'GeminiBot') {
      const blockedMe = await storageService.checkIsBlocked(activeTab, userName);
      if (blockedMe) { handleError("Bu kullanıcıya mesaj gönderemezsiniz (Engellendiniz)."); return; }
      const targetSettings = await storageService.getUserSettings(activeTab);
      if (!targetSettings.allow_private) { handleError("Bu kullanıcı özel mesaj kabul etmiyor."); return; }
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
        const res = await getGeminiResponse(text, "Private AI Chat", undefined, botInstruction);
        await storageService.saveMessage({ sender: 'GeminiBot', text: res, type: MessageType.AI, channel: 'GeminiBot' });
        setIsAILoading(false);
      }
    } catch (err: any) { handleError(err); }
  };

  const loadChannels = async () => {
    if (!userName) return;
    try {
      const fetched = await storageService.getChannels();
      // "system" veya "radio" isimli odaları arayüzden kaldır
      const filtered = fetched.filter(c => 
        c.name.toLowerCase() !== 'system' && 
        c.name.toLowerCase() !== 'radio' &&
        c.name.toLowerCase() !== '#system' &&
        c.name.toLowerCase() !== '#radio'
      );
      setChannels(filtered);
    } catch (e) { handleError(e); }
  };

  useEffect(() => {
    if (!isConfigured() || !userName) return;
    loadChannels();
    channelSubRef.current = storageService.subscribeToChannels(() => loadChannels());
    return () => channelSubRef.current?.unsubscribe();
  }, [userName]);

  useEffect(() => {
    if (!userName) return;
    storageService.getMessagesByChannel(activeTab).then(setMessages);
    subscriptionRef.current = storageService.subscribeToMessages((payload) => {
      if (payload.new && payload.new.channel === activeTab) {
        setMessages(prev => [...prev, { ...payload.new, timestamp: new Date(payload.new.created_at) }]);
      }
      if (payload.new && !payload.new.channel.startsWith('#') && payload.new.channel !== 'sohbet' && payload.new.sender !== userName) {
        setPrivateChats(prev => prev.includes(payload.new.channel) ? prev : [...prev, payload.new.channel]);
      }
    });
    return () => subscriptionRef.current?.unsubscribe();
  }, [activeTab, userName]);

  return {
    userName, setUserName,
    isAdmin, setIsAdmin,
    channels, privateChats, 
    blockedUsers, blockUser, unblockUser,
    allowPrivate, toggleAllowPrivate,
    activeTab, setActiveTab,
    messages, sendMessage,
    isAILoading, isOp: isAdmin || (channels.find(c => c.name === activeTab)?.ops || []).includes(userName),
    error, isMuted, setIsMuted, updateRequired, closeTab,
    botInstruction, setBotInstruction, saveBotInstruction,
    initiatePrivateChat: (u: string) => { if(!privateChats.includes(u)) setPrivateChats(p => [...p, u]); setActiveTab(u); },
    clearScreen: () => setMessages([])
  };
};
