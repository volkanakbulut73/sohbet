
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
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Sohbete Giriş Yap</h2>
            <p className="text-[10px] text-gray-500 uppercase font-bold italic tracking-widest">Workigom Güvenli Sohbet Ağı</p>
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
            {!embedded && (
              <button onClick={() => setView('landing')} className="text-gray-600 text-[9px] font-bold uppercase hover:text-gray-400">
                Geri Dön
              </button>
            )}
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
            Onaylandığında e-posta ile bilgilendirileceksiniz.
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
            <button type="button" onClick={() => setView('landing')} className="w-full text-[10px] text-gray-500 uppercase">Geri</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full flex flex-col bg-[#f0f2f5] overflow-hidden select-none font-mono ${className}`}>
      {/* Header Panel */}
      <div className="h-10 bg-[#000080] flex items-center justify-between px-3 text-white shrink-0 z-50 border-b border-white/20">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsLeftDrawerOpen(!isLeftDrawerOpen)} className="p-1.5 hover:bg-white/20 rounded-sm">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-[11px] font-black tracking-tight uppercase italic">Workigom Connect</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 bg-black/20 rounded border border-white/10">
             <Globe size={10} className="text-blue-300" />
             <span className="text-[9px] font-bold">HOST: {CHAT_MODULE_CONFIG.DOMAIN}</span>
          </div>
          <button onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)} className={`p-1.5 rounded-sm transition-colors ${isRightDrawerOpen ? 'bg-white text-[#000080]' : 'hover:bg-white/10'}`}>
            <Users size={18} />
          </button>
          <button onClick={() => setView(embedded ? 'login' : 'landing')} className="p-1.5 hover:bg-red-600 rounded-sm transition-colors">
             <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="h-9 bg-[#d4dce8] border-b border-gray-400 flex items-center gap-0.5 px-1 shrink-0 overflow-x-auto no-scrollbar">
        {['#sohbet', ...privateChats].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 h-full text-[10px] font-black border-t border-l border-r border-gray-500 flex items-center gap-2 transition-all shrink-0 ${activeTab === tab ? 'bg-white border-b-transparent translate-y-[1px] z-10' : 'bg-gray-300 opacity-70 grayscale hover:grayscale-0'}`}
          >
            {tab.startsWith('#') ? <Hash size={11} className="text-blue-800" /> : <MessageSquare size={11} className="text-purple-800" />}
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Channels) */}
        <div className={`absolute lg:relative inset-y-0 left-0 w-64 bg-[#d4dce8] border-r border-gray-400 z-[60] transition-transform duration-300 ease-in-out ${isLeftDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-48'}`}>
          <div className="p-2 h-full flex flex-col">
             <div className="bg-white border border-gray-500 flex-1 overflow-y-auto shadow-inner">
                <div className="bg-gray-800 text-[#00ff99] p-2 text-[10px] font-black flex justify-between items-center border-b border-gray-700">
                  <span>CHANNELS</span>
                  <X size={14} className="lg:hidden cursor-pointer" onClick={() => setIsLeftDrawerOpen(false)} />
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
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative shadow-lg">
           {isAILoading && <div className="absolute top-0 left-0 right-0 h-1 bg-[#00ff99] animate-pulse z-20" />}
           <div className="flex-1 border-r border-gray-200">
             <MessageList 
               messages={messages} 
               currentUser={userName} 
               blockedUsers={[]} 
               onNickClick={(e, n) => initiatePrivateChat(n)} 
             />
           </div>
        </div>

        {/* Right Sidebar: Narrower width for mobile (w-48 instead of w-64) */}
        <div className={`absolute right-0 top-0 bottom-0 w-48 bg-[#f3f4f6] border-l-2 border-gray-300 z-[60] transition-transform duration-300 ease-in-out ${isRightDrawerOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:w-44'}`}>
           <UserList 
            users={[userName, 'GeminiBot', 'Admin']} 
            currentUser={userName} 
            onUserClick={(e, n) => { initiatePrivateChat(n); setIsRightDrawerOpen(false); }}
            onClose={() => setIsRightDrawerOpen(false)} 
            currentOps={['Admin', 'GeminiBot']}
           />
        </div>
      </div>

      {/* Input Panel */}
      <div className="p-2 bg-[#d4dce8] border-t border-gray-400 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2 h-11">
          <div className="flex-1 bg-white border-2 border-gray-500 px-3 flex items-center shadow-inner rounded-sm group focus-within:border-blue-700 transition-colors">
             <span className="text-[10px] font-black text-blue-900 mr-3 hidden sm:inline select-none">[{userName}]</span>
             <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 text-[13px] outline-none bg-transparent font-bold h-full placeholder-gray-400"
              placeholder="Mesaj yazın..."
              onFocus={() => { if(window.innerWidth < 768) { setIsLeftDrawerOpen(false); setIsRightDrawerOpen(false); } }}
             />
          </div>
          <button type="submit" className="bg-[#c0c0c0] border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.6)] px-6 flex items-center justify-center active:shadow-none active:translate-y-[1px] transition-all hover:bg-white group">
            <Send size={20} className="text-gray-800 group-hover:text-blue-800" />
          </button>
        </form>
      </div>

      {/* Mobile Overlays */}
      {(isLeftDrawerOpen || isRightDrawerOpen) && (
        <div className="fixed inset-0 bg-black/40 z-[45] lg:hidden backdrop-blur-[1px]" onClick={() => { setIsLeftDrawerOpen(false); setIsRightDrawerOpen(false); }} />
      )}
    </div>
  );
};

export default App;
