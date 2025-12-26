
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
import { Menu, X, Hash, Users, LogOut, MessageSquare, Send, Lock, Clock, Settings } from 'lucide-react';

type AppView = 'landing' | 'login' | 'register' | 'pending' | 'chat' | 'admin_login' | 'admin_panel';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "", embedded = false }) => {
  const getInitialView = (): AppView => {
    if (externalUser && externalUser.trim() !== "") return 'chat';
    if (embedded) return 'login';
    return 'landing';
  };

  const [view, setView] = useState<AppView>(getInitialView());
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

  const posClass = embedded ? "absolute" : "fixed";
  const zClass = embedded ? "z-10" : "z-[100]";

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

  if (view === 'landing' && !embedded) {
    return <LandingPage onEnter={() => setView('login')} onAdminClick={() => setView('admin_login')} />;
  }

  if (view === 'login' || (view === 'landing' && embedded)) {
    return (
      <div className={`${posClass} inset-0 bg-[#0b0f14] flex items-center justify-center p-4 ${zClass} font-mono ${className}`}>
        <div className="w-full max-w-sm bg-gray-900 border border-gray-800 p-8 space-y-8 shadow-2xl relative">
          <div className="text-center space-y-2">
            <Lock size={40} className="text-[#00ff99] mx-auto mb-2" />
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter text-center">Sohbete Giriş Yap</h2>
            <p className="text-[10px] text-gray-500 uppercase font-bold italic tracking-widest text-center">Workigom Güvenli Sohbet Ağı</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-4">
              <input 
                type="email" 
                placeholder="EMAIL ADRESİNİZ" 
                required
                value={loginForm.email}
                onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                className="w-full bg-black border border-gray-800 p-4 text-white text-xs outline-none focus:border-[#00ff99] transition-all" 
              />
              <input 
                type="password" 
                placeholder="ŞİFRENİZ" 
                required
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full bg-black border border-gray-800 p-4 text-white text-xs outline-none focus:border-[#00ff99] transition-all" 
              />
            </div>
            
            {loginError && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{loginError}</p>}
            
            <button 
              disabled={isLoggingIn}
              className="w-full bg-[#00ff99] text-black py-4 text-xs font-black uppercase shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50"
            >
              {isLoggingIn ? 'DOĞRULANIYOR...' : 'GİRİŞ YAP'}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-800 flex flex-col gap-3 items-center">
            <button onClick={() => setView('register')} className="text-[#00ff99] text-[10px] font-black uppercase hover:underline">
              Henüz üye değil misiniz? Başvuru yapın →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'register') return <RegistrationForm onClose={() => setView(embedded ? 'login' : 'landing')} onSuccess={() => setView('pending')} />;
  
  if (view === 'pending') {
    return (
      <div className={`${posClass} inset-0 bg-[#0b0f14] flex items-center justify-center p-4 ${zClass} font-mono text-center`}>
        <div className="max-w-md space-y-6 p-8 border border-gray-800 bg-gray-900/50">
          <Clock size={48} className="text-orange-500 mx-auto animate-spin-slow" />
          <h2 className="text-2xl font-black text-white uppercase italic">Başvurunuz İnceleniyor</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Güvenliğiniz için belgeleriniz moderatörlerimiz tarafından kontrol ediliyor. 
          </p>
          <button onClick={() => setView(embedded ? 'login' : 'landing')} className="text-[#00ff99] text-[10px] font-black uppercase border border-[#00ff99]/30 px-6 py-2">
            Tamam
          </button>
        </div>
      </div>
    );
  }

  if (view === 'admin_panel') return <AdminDashboard onLogout={() => setView('landing')} />;
  
  if (view === 'admin_login') {
    return (
      <div className={`${posClass} inset-0 bg-black flex items-center justify-center p-4 ${zClass} font-mono`}>
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
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[100dvh] w-full flex flex-col bg-[#0b0f14] overflow-hidden select-none font-mono ${className}`}>
      {/* Header Panel - Optimized Height */}
      <div className="h-9 sm:h-11 bg-[#1a1f26] flex items-center justify-between px-2 sm:px-3 text-white shrink-0 z-50 border-b border-gray-800">
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
          <button 
            onClick={() => { setIsLeftDrawerOpen(!isLeftDrawerOpen); setIsRightDrawerOpen(false); }} 
            className={`p-1 sm:p-2 rounded-sm transition-colors ${isLeftDrawerOpen ? 'bg-[#00ff99] text-black' : 'hover:bg-white/10'}`}
          >
            <Menu size={18} />
          </button>
          <div className="flex flex-col justify-center min-w-0">
             <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-[10px] sm:text-[12px] font-black tracking-tight uppercase italic text-white truncate">Global Sohbet</span>
                <span className="text-[7px] sm:text-[9px] bg-[#00ff99]/20 text-[#00ff99] px-1 rounded font-bold shrink-0">V1.1.1</span>
             </div>
             <div className="flex items-center gap-1 opacity-60">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full animate-pulse shrink-0"></div>
                <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider truncate">Bağlantı: {userName}</span>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button 
            onClick={() => { setIsRightDrawerOpen(!isRightDrawerOpen); setIsLeftDrawerOpen(false); }} 
            className={`p-1.5 sm:p-2 rounded-sm transition-colors ${isRightDrawerOpen ? 'bg-[#00ff99] text-black' : 'hover:bg-white/10'}`}
          >
            <Users size={18} />
          </button>
          <button onClick={() => setView(embedded ? 'login' : 'landing')} className="p-1.5 sm:p-2 hover:bg-red-600 rounded-sm transition-colors">
             <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Tabs Row - Narrowed Height */}
      <div className="h-7 sm:h-8 bg-[#d4dce8] border-b border-gray-400 flex items-center gap-0.5 px-1 shrink-0 overflow-x-auto no-scrollbar">
        {['#sohbet', ...privateChats].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 sm:px-4 h-full text-[9px] sm:text-[10px] font-black border-t border-l border-r border-gray-500 flex items-center gap-1.5 transition-all shrink-0 ${activeTab === tab ? 'bg-white border-b-transparent translate-y-[1px] z-10 shadow-sm' : 'bg-gray-300 opacity-70 hover:opacity-100'}`}
          >
            {tab.startsWith('#') ? <Hash size={10} className="text-blue-800" /> : <MessageSquare size={10} className="text-purple-800" />}
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Left Sidebar (Channels) */}
        <div 
          className={`absolute lg:relative inset-y-0 left-0 w-64 bg-[#d4dce8] border-r border-gray-400 z-[70] transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${isLeftDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-48 lg:hidden'}`}
        >
          <div className="p-2 h-full flex flex-col">
             <div className="bg-white border border-gray-500 flex-1 overflow-y-auto shadow-inner">
                <div className="bg-gray-800 text-[#00ff99] p-2 text-[10px] font-black flex justify-between items-center border-b border-gray-700">
                  <span>KANALLAR</span>
                  <X size={14} className="cursor-pointer" onClick={() => setIsLeftDrawerOpen(false)} />
                </div>
                <div className="p-1 space-y-0.5">
                   {['#sohbet', '#yardim', '#teknoloji', '#is-dunyasi'].map(c => (
                     <button 
                      key={c} 
                      onClick={() => { setActiveTab(c); setIsLeftDrawerOpen(false); }} 
                      className={`w-full text-left px-3 py-2 text-[11px] font-bold border-b border-gray-100 hover:bg-blue-600 hover:text-white transition-colors ${activeTab === c ? 'bg-blue-800 text-white' : 'text-gray-700'}`}
                     >
                       <span className="mr-2 text-gray-400 opacity-50">#</span>{c.replace('#','')}
                     </button>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Center: Chat Window */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
           {isAILoading && <div className="absolute top-0 left-0 right-0 h-1 bg-[#00ff99] animate-pulse z-20" />}
           <div className="flex-1 overflow-hidden">
             <MessageList 
               messages={messages} 
               currentUser={userName} 
               blockedUsers={[]} 
               onNickClick={(e, n) => initiatePrivateChat(n)} 
             />
           </div>
        </div>

        {/* Right Sidebar: Users */}
        <div 
          className={`absolute lg:relative inset-y-0 right-0 w-36 bg-[#f3f4f6] border-l border-gray-300 z-[70] transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${isRightDrawerOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:block'}`}
        >
           <UserList 
            users={[userName, 'GeminiBot', 'Admin']} 
            currentUser={userName} 
            onUserClick={(e, n) => { initiatePrivateChat(n); setIsRightDrawerOpen(false); }}
            onClose={() => setIsRightDrawerOpen(false)} 
            currentOps={['Admin', 'GeminiBot']}
           />
        </div>
      </div>

      {/* Input Panel - Fixed Visibility & Styling */}
      <div className="p-2 bg-[#d4dce8] border-t border-gray-400 shrink-0 z-[60]">
        <form onSubmit={handleSend} className="flex gap-1.5 h-10">
          <div className="flex-1 bg-white border-2 border-gray-500 px-3 flex items-center shadow-inner rounded-sm group focus-within:border-blue-700 transition-colors">
             <span className="text-[10px] font-black text-blue-900 mr-2 hidden sm:inline select-none">[{userName}]</span>
             <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 text-[13px] outline-none bg-transparent font-bold h-full placeholder-gray-400"
              placeholder="Mesaj yazın..."
              onFocus={() => { if(window.innerWidth < 1024) { setIsLeftDrawerOpen(false); setIsRightDrawerOpen(false); } }}
             />
          </div>
          <button type="submit" className="bg-white border-2 border-white shadow-[1px_1px_0px_1px_rgba(0,0,0,0.3)] px-4 flex items-center justify-center active:shadow-none active:translate-y-[1px] transition-all hover:bg-gray-50 group min-w-[50px]">
            <Send size={18} className="text-blue-700 group-hover:scale-110 transition-transform" />
          </button>
        </form>
      </div>

      {/* Mobile Backdrops */}
      {(isLeftDrawerOpen || isRightDrawerOpen) && (
        <div className="fixed inset-0 bg-black/40 z-[65] lg:hidden backdrop-blur-[1px]" onClick={() => { setIsLeftDrawerOpen(false); setIsRightDrawerOpen(false); }} />
      )}
    </div>
  );
};

export default App;
