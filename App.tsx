import React, { useState, useEffect } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import Sidebar from './components/Sidebar';
import LandingPage from './components/LandingPage';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/AdminDashboard';
import { ChatModuleProps } from './types';
import { storageService } from './services/storageService';
import { Menu, X, Hash, Users, LogOut, Send, Lock, Clock, Settings, ChevronLeft } from 'lucide-react';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserListOpen, setIsUserListOpen] = useState(true);
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
                className="w-full bg-black border border-gray-700 p-3 text-white text-xs outline-none focus:border-[#00ff99] transition-all" 
              />
              <input 
                type="password" 
                placeholder="ŞİFRENİZ" 
                required
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full bg-black border border-gray-700 p-3 text-white text-xs outline-none focus:border-[#00ff99] transition-all" 
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
          <Clock size={48} className="text-orange-500 mx-auto" />
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
            <input type="text" placeholder="Admin Nick" value={adminForm.username} onChange={e => setAdminForm({...adminForm, username: e.target.value})} className="w-full bg-black border border-gray-700 p-3 text-white text-xs" />
            <input type="password" placeholder="Şifre" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="w-full bg-black border border-gray-700 p-3 text-white text-xs" />
            <button className="w-full bg-[#00ff99] text-black py-4 text-xs font-black uppercase">Giriş</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full flex flex-col bg-[#0b0f14] overflow-hidden select-none font-mono ${className}`}>
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 h-14 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400 hover:text-white lg:hidden">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex flex-col">
            <span className="text-white font-black text-xs uppercase italic tracking-tighter">Workigom Chat</span>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{activeTab}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsUserListOpen(!isUserListOpen)} className="p-2 text-gray-400 hover:text-white">
            <Users size={20} />
          </button>
          <button onClick={() => setView(embedded ? 'login' : 'landing')} className="p-2 text-red-500 hover:text-red-400">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Panel */}
        <div className={`
          absolute lg:relative inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800 z-40 transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0'}
        `}>
          <Sidebar 
            channels={channels} 
            privateChats={privateChats} 
            activeTab={activeTab} 
            onSelect={(tab) => { setActiveTab(tab); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} 
          />
        </div>

        {/* Chat Main Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {isAILoading && <div className="h-0.5 bg-[#00ff99] animate-pulse shrink-0" />}
          <div className="flex-1 overflow-hidden">
            <MessageList 
              messages={messages} 
              currentUser={userName} 
              blockedUsers={[]} 
              onNickClick={(e, n) => initiatePrivateChat(n)} 
            />
          </div>

          {/* Input Panel */}
          <div className="bg-gray-50 border-t border-gray-200 p-4 shrink-0">
            <form onSubmit={handleSend} className="flex gap-2">
              <div className="flex-1 bg-white border border-gray-300 rounded px-3 flex items-center focus-within:border-blue-500 transition-colors">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="flex-1 bg-transparent text-sm py-2.5 outline-none font-medium text-black"
                  placeholder="Mesajınızı buraya yazın..."
                />
              </div>
              <button type="submit" className="bg-[#000080] text-white px-6 rounded text-xs font-bold uppercase hover:bg-blue-900 transition-colors flex items-center gap-2">
                <Send size={14} /> GÖNDER
              </button>
            </form>
          </div>
        </div>

        {/* User List Panel */}
        <div className={`
          absolute lg:relative inset-y-0 right-0 w-64 bg-white border-l border-gray-200 z-40 transition-transform duration-300
          ${isUserListOpen ? 'translate-x-0' : 'translate-x-full lg:hidden lg:w-0'}
        `}>
          <UserList 
            users={[userName, 'GeminiBot', 'Admin']} 
            currentUser={userName} 
            onUserClick={(e, n) => initiatePrivateChat(n)}
            onClose={() => setIsUserListOpen(false)} 
            currentOps={['Admin', 'GeminiBot']}
          />
        </div>
      </div>
    </div>
  );
};

export default App;