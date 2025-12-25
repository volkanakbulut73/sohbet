
import React, { useState, useEffect } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import LandingPage from './components/LandingPage';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/AdminDashboard';
import { ChatModuleProps } from './types';
import { CHAT_MODULE_CONFIG } from './config';
import { storageService } from './services/storageService';
import { Menu, X, Hash, Users, Globe, LogOut, MessageSquare, Send, Lock, ChevronRight, Mail, ShieldCheck, Clock, Settings, User, MonitorSmartphone } from 'lucide-react';

type AppView = 'landing' | 'login' | 'register' | 'pending' | 'chat' | 'admin_login' | 'admin_panel';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "" }) => {
  const [view, setView] = useState<AppView>('landing');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const { 
    userName, setUserName,
    channels, privateChats, 
    activeTab, setActiveTab, 
    messages, sendMessage, 
    isAILoading, error: coreError,
    initiatePrivateChat
  } = useChatCore(externalUser || '');

  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (externalUser && externalUser.trim() !== "") {
      setUserName(externalUser);
      setView('chat');
    }
  }, [externalUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const user = await storageService.loginUser(loginForm.email, loginForm.password);
      if (!user) {
        setLoginError('Email veya şifre hatalı.');
      } else if (user.status === 'pending') {
        setView('pending');
      } else if (user.status === 'rejected') {
        setLoginError('Başvurunuz maalesef reddedildi.');
      } else {
        setUserName(user.nickname);
        localStorage.setItem('mirc_nick', user.nickname);
        setView('chat');
      }
    } catch (err) {
      setLoginError('Sistem hatası.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  if (view === 'landing') return <LandingPage onEnter={() => setView('login')} onAdminClick={() => setView('admin_login')} />;
  if (view === 'register') return <RegistrationForm onClose={() => setView('login')} onSuccess={() => setView('pending')} />;
  if (view === 'admin_panel') return <AdminDashboard onLogout={() => setView('landing')} />;
  if (view === 'admin_login') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4 z-[100] font-mono">
        <div className="w-full max-w-sm bg-gray-900 border border-gray-800 p-8 space-y-8 shadow-2xl">
          <div className="text-center space-y-2">
            <Settings size={48} className="text-[#00ff99] mx-auto mb-4" />
            <h2 className="text-xl font-black text-white uppercase italic">Yönetici Girişi</h2>
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const success = await storageService.adminLogin(adminForm.username, adminForm.password);
            if (success) setView('admin_panel'); else setLoginError('Hata!');
          }} className="space-y-4">
            <input type="text" placeholder="Admin Nick" value={adminForm.username} onChange={e => setAdminForm({...adminForm, username: e.target.value})} className="w-full bg-black border border-gray-800 p-3 text-white text-xs" />
            <input type="password" placeholder="Şifre" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="w-full bg-black border border-gray-800 p-3 text-white text-xs" />
            <button className="w-full bg-[#00ff99] text-black py-4 text-xs font-black uppercase">Giriş</button>
            <button type="button" onClick={() => setView('landing')} className="w-full text-[10px] text-gray-500 uppercase">Geri</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen flex flex-col bg-white overflow-hidden select-none font-mono ${className}`}>
      {/* Dynamic Header */}
      <div className="h-9 bg-[#000080] flex items-center justify-between px-3 text-white shrink-0 z-50">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsLeftDrawerOpen(!isLeftDrawerOpen)} className="p-1.5 hover:bg-white/20 rounded-sm">
            <Menu size={18} />
          </button>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-bold tracking-tight">Workigom Chat</span>
            <span className="text-[8px] opacity-70 truncate max-w-[120px]">{activeTab}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 text-[9px] font-bold bg-green-600 px-2 py-0.5 rounded-sm">
             <MonitorSmartphone size={10} /> MULTI-PLATFORM
          </div>
          <button onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)} className={`p-1.5 rounded-sm ${isRightDrawerOpen ? 'bg-white text-[#000080]' : 'hover:bg-white/20'}`}>
            <Users size={18} />
          </button>
          <button onClick={() => setView('landing')} className="p-1.5 hover:bg-red-600/50 rounded-sm">
             <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Tabs / Channels */}
      <div className="h-8 bg-[#d4dce8] border-b border-gray-400 flex items-center gap-0.5 px-1 shrink-0 overflow-x-auto no-scrollbar">
        {['#sohbet', ...privateChats].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 h-full text-[10px] font-bold border-t border-l border-r border-gray-500 flex items-center gap-1 shrink-0 ${activeTab === tab ? 'bg-white border-b-white z-10' : 'bg-gray-300 opacity-80'}`}
          >
            {tab.startsWith('#') ? <Hash size={10} /> : <MessageSquare size={10} />}
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side (Channels) - Mobile Aware */}
        <div className={`absolute lg:relative inset-y-0 left-0 w-64 bg-[#d4dce8] border-r border-gray-400 z-[60] transition-transform duration-300 ease-in-out ${isLeftDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-48'}`}>
          <div className="p-2 h-full flex flex-col">
             <div className="bg-white border border-gray-500 flex-1 overflow-y-auto">
                <div className="bg-[#000080] text-white p-1 text-[9px] font-bold flex justify-between items-center">
                  <span>KANAL LİSTESİ</span>
                  <X size={12} className="lg:hidden" onClick={() => setIsLeftDrawerOpen(false)} />
                </div>
                <div className="p-1 space-y-0.5">
                   {['#sohbet', '#yardim', '#teknoloji', '#is-dunyasi'].map(c => (
                     <button 
                      key={c} 
                      onClick={() => { setActiveTab(c); setIsLeftDrawerOpen(false); }} 
                      className={`w-full text-left px-2 py-1.5 text-[11px] font-bold hover:bg-blue-600 hover:text-white ${activeTab === c ? 'bg-blue-800 text-white' : 'text-black'}`}
                     >
                       {c}
                     </button>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
           {isAILoading && <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 animate-pulse z-10" />}
           <MessageList 
             messages={messages} 
             currentUser={userName} 
             blockedUsers={[]} 
             onNickClick={(e, n) => initiatePrivateChat(n)} 
           />
        </div>

        {/* Right Side (Users) - Mobile Aware */}
        <div className={`absolute right-0 top-0 bottom-0 w-64 bg-[#d4dce8] border-l border-gray-400 z-[60] transition-transform duration-300 ease-in-out ${isRightDrawerOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:w-48'}`}>
           <UserList 
            users={[userName, 'GeminiBot', 'Admin']} 
            currentUser={userName} 
            onUserClick={(e, n) => { initiatePrivateChat(n); setIsRightDrawerOpen(false); }}
            onClose={() => setIsRightDrawerOpen(false)} 
            currentOps={['Admin', 'GeminiBot']}
           />
        </div>
      </div>

      {/* Input Area - Touch Friendly */}
      <div className="p-1.5 bg-[#d4dce8] border-t border-gray-400 shrink-0">
        <form onSubmit={handleSend} className="flex gap-1.5 h-10">
          <div className="flex-1 bg-white border border-gray-600 px-3 flex items-center shadow-inner rounded-sm">
             <span className="text-[10px] font-black text-[#000080] mr-2 hidden sm:inline">[{userName}]</span>
             <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 text-[13px] outline-none bg-transparent font-bold h-full"
              placeholder="Mesaj gönder..."
              onFocus={() => { if(window.innerWidth < 768) { setIsLeftDrawerOpen(false); setIsRightDrawerOpen(false); } }}
             />
          </div>
          <button type="submit" className="bg-[#c0c0c0] border-2 border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] px-5 flex items-center justify-center active:shadow-none active:translate-y-[1px] transition-all">
            <Send size={18} className="text-gray-800" />
          </button>
        </form>
      </div>

      {/* Overlays for Mobile */}
      {(isLeftDrawerOpen || isRightDrawerOpen) && (
        <div className="fixed inset-0 bg-black/40 z-50 lg:hidden" onClick={() => { setIsLeftDrawerOpen(false); setIsRightDrawerOpen(false); }} />
      )}
    </div>
  );
};

export default App;
