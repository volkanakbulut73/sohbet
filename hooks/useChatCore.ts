
import { useState, useCallback, useEffect } from 'react';
import { Message, MessageType } from '../types';
import { storageService, supabase } from '../services/storageService';

export const useChatCore = (initialUserName: string) => {
  const [userName, setUserName] = useState(() => localStorage.getItem('mirc_nick') || initialUserName);
  const [openTabs, setOpenTabs] = useState<string[]>(['#sohbet', '#yardim', '#radyo']);
  const [unreadTabs, setUnreadTabs] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<string>('#sohbet');
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>(['Admin']);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => { 
      window.removeEventListener('online', handleStatus); 
      window.removeEventListener('offline', handleStatus); 
    };
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!storageService.isConfigured() || !navigator.onLine) return;
    try {
      const regs = await storageService.getAllRegistrations();
      const approvedNicks = regs.filter(r => r.status === 'approved').map(r => r.nickname);
      setOnlineUsers(Array.from(new Set([...approvedNicks, 'Admin'])));
    } catch { 
      console.warn("Kullanıcı listesi alınamadı."); 
    }
  }, []);

  useEffect(() => { 
    fetchUsers(); 
    const i = setInterval(fetchUsers, 15000); 
    return () => clearInterval(i); 
  }, [fetchUsers]);

  const initiatePrivateChat = (u: string) => {
    if (u === userName) return;
    setOpenTabs(prev => prev.includes(u) ? prev : [...prev, u]);
    setActiveTab(u);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !isOnline) return;
    const channel = activeTab.startsWith('#') ? activeTab : `private:${[userName, activeTab].sort().join(':')}`;
    await storageService.saveMessage({ sender: userName, text, type: MessageType.USER, channel });
  };

  useEffect(() => {
    if (!userName || !storageService.isConfigured()) return;
    const current = activeTab.startsWith('#') ? activeTab : `private:${[userName, activeTab].sort().join(':')}`;
    storageService.getMessagesByChannel(current).then(setMessages);

    const sub = supabase.channel(`chat_${activeTab}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => {
      const n = p.new;
      if (n.channel === current && !blockedUsers.includes(n.sender)) {
        setMessages(prev => [...prev, { ...n, id: n.id.toString(), timestamp: new Date(n.created_at) } as Message]);
      }
    }).subscribe();
    return () => { sub.unsubscribe(); };
  }, [activeTab, userName, blockedUsers]);

  return {
    userName, setUserName, activeTab, setActiveTab, openTabs, unreadTabs,
    messages, sendMessage, initiatePrivateChat, onlineUsers,
    blockedUsers, toggleBlock: (n: string) => setBlockedUsers(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]), 
    closeTab: (t: string) => { if(openTabs.length > 1) { setOpenTabs(p => p.filter(x => x !== t)); if(activeTab === t) setActiveTab(openTabs[0]); }},
    isOnline
  };
};
