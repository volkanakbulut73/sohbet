
import { useState, useCallback, useEffect } from 'react';
import { Message, MessageType, Channel } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { storageService } from '../services/storageService';

export const useChatCore = (initialUserName: string) => {
  const [userName, setUserName] = useState(() => localStorage.getItem('mirc_nick') || initialUserName);
  
  // Açık olan tüm odaları (Kanallar + Özel Mesajlar) tutan state
  const [openTabs, setOpenTabs] = useState<string[]>(['#sohbet', '#yardim', '#radyo', 'GeminiBot']);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<string>('#sohbet');
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [allowPrivateMessages, setAllowPrivateMessages] = useState(true);

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
        if (args[0]) {
          initiatePrivateChat(args[0]);
        }
        break;
      case '/close':
        closeTab(activeTab);
        break;
      case '/block':
        if (args[0]) toggleBlock(args[0]);
        break;
      default:
        console.log("Unknown command");
    }
  };

  const toggleBlock = (nick: string) => {
    setBlockedUsers(prev => 
      prev.includes(nick) ? prev.filter(u => u !== nick) : [...prev, nick]
    );
  };

  const closeTab = (tabName: string) => {
    if (openTabs.length <= 1) return; // Son sekmeyi kapatma
    
    setOpenTabs(prev => {
      const newTabs = prev.filter(t => t !== tabName);
      if (activeTab === tabName) {
        setActiveTab(newTabs[0]);
      }
      return newTabs;
    });
  };

  const initiatePrivateChat = (u: string) => {
    if (!allowPrivateMessages && u !== 'GeminiBot') {
      alert("Özel mesajlarınız kapalı.");
      return;
    }
    setOpenTabs(prev => prev.includes(u) ? prev : [...prev, u]);
    setActiveTab(u);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    if (text.startsWith('/')) {
      await handleCommand(text);
      return;
    }

    try {
      await storageService.saveMessage({
        sender: userName,
        text: text,
        type: MessageType.USER,
        channel: activeTab
      });

      if (activeTab === 'GeminiBot') {
        const res = await getGeminiResponse(text, "Sohbet", undefined);
        await storageService.saveMessage({ sender: 'GeminiBot', text: res, type: MessageType.AI, channel: 'GeminiBot' });
      }
    } catch (err: any) { console.error(err); }
  };

  useEffect(() => {
    if (!userName) return;
    storageService.getMessagesByChannel(activeTab).then(setMessages);
    
    const sub = storageService.subscribeToMessages((payload) => {
      if (payload.new && payload.new.channel === activeTab) {
        if (!blockedUsers.includes(payload.new.sender)) {
          const newMessage = { ...payload.new, timestamp: new Date(payload.new.created_at) };
          setMessages(prev => [...prev.filter(m => m.id !== newMessage.id), newMessage]);
        }
      }
    });
    
    return () => { sub?.unsubscribe(); };
  }, [activeTab, userName, blockedUsers]);

  return {
    userName, setUserName,
    openTabs, setOpenTabs,
    activeTab, setActiveTab,
    messages, sendMessage,
    blockedUsers, toggleBlock,
    closeTab,
    allowPrivateMessages, setAllowPrivateMessages,
    initiatePrivateChat
  };
};
