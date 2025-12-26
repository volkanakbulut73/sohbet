
import React, { useState, useEffect } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import LandingPage from './components/LandingPage';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/AdminDashboard';
import { ChatModuleProps } from './types';
import { storageService } from './services/storageService';
import { Menu, X, Hash, Users, LogOut, MessageSquare, Send, Lock, Clock, Settings, ChevronLeft, Plus, Home, Heart, User, LogIn } from 'lucide-react';

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
            <input type="text" placeholder="Admin Nick" value={adminForm.username} onChange={e => setAdminForm({...adminForm, username: e.target.value})} className="w-full bg-black border border-gray-700 p-3 text-white text-xs" />
            <input type="password" placeholder="Şifre" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="w-full bg-black border border-gray-700 p-3 text-white text-xs" />
            <button className="w-full bg-[#00ff99] text-black py-4 text-xs font-black uppercase">Giriş</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen-safe w-full flex flex-col bg-[#0b0f14] overflow-hidden select-none font-mono ${className}`}>
      
      {/* 1. Header Area - Exactly as screenshot */}
      <div className="safe-top bg-black border-b border-gray-800 shrink-0 z-50">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsLeftDrawerOpen(true)} className="p-1 text-white hover:bg-gray-800 rounded-sm">
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-[14px] font-black text-white tracking-tighter italic uppercase">GLOBAL SOHBET</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase">V1.1.1</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></div>
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  BAĞLANTI: <span className="text-gray-200">{userName?.toUpperCase()}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)} className="p-2 text-gray-400 hover:text-white transition-colors">
               <Users size={22} />
             </button>
             <button onClick={() => setView(embedded ? 'login' : 'landing')} className="p-2 text-gray-400 hover:text-white transition-colors">
               <LogIn size={22} className="rotate-180" />
             </button>
          </div>
        </div>
      </div>

      {/* 2. Tabs Row */}
      <div className="bg-black flex shrink-0 border-b border-gray-800 overflow-x-auto no-scrollbar">
        <div className="flex items-center h-10">
          <button 
            onClick={() => setActiveTab('#sohbet')}
            className={`h-full px-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === '#sohbet' ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}
          >
            # #SOHBET
          </button>
          <button 
            onClick={() => setActiveTab('GEMINIBOT')}
            className={`h-full px-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'GEMINIBOT' ? 'bg-gray-400 text-black' : 'text-gray-500 hover:text-gray-300 border-l border-gray-800'}`}
          >
            <MessageSquare size={12} /> GEMINIBOT
          </button>
          {privateChats.filter(n => n !== 'GeminiBot').map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`h-full px-6 text-[10px] font-black uppercase tracking-widest transition-all border-l border-gray-800 ${activeTab === tab ? 'bg-white text-black' : 'text-gray-500'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Chat Container */}
      <div className="flex-1 flex overflow-hidden relative min-h-0 bg-white">
        {/* Left Mobile Drawer */}
        {isLeftDrawerOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 z-[100]" onClick={() => setIsLeftDrawerOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 z-[110] p-4 flex flex-col fade-in">
              <div className="flex justify-between items-center mb-6">
                <span className="text-white font-black text-sm italic uppercase tracking-widest">Kanal Menüsü</span>
                <X size={24} className="text-gray-500 cursor-pointer" onClick={() => setIsLeftDrawerOpen(false)} />
              </div>
              <div className="space-y-1 overflow-y-auto flex-1">
                {['#sohbet', '#yardim', '#teknoloji', '#is-dunyasi'].map(c => (
                  <button 
                    key={c} 
                    onClick={() => { setActiveTab(c); setIsLeftDrawerOpen(false); }} 
                    className={`w-full text-left px-4 py-3 text-xs font-bold rounded-sm border-l-4 transition-all ${activeTab === c ? 'bg-white text-black border-green-500' : 'text-gray-400 border-transparent hover:bg-gray-800'}`}
                  >
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
              <button onClick={() => setView('landing')} className="mt-auto flex items-center gap-2 text-red-500 text-xs font-black p-4 border-t border-gray-800">
                <LogOut size={16} /> GÜVENLİ ÇIKIŞ
              </button>
            </div>
          </>
        )}

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {isAILoading && <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 animate-pulse z-10" />}
          <MessageList 
            messages={messages} 
            currentUser={userName} 
            blockedUsers={[]} 
            onNickClick={(e, n) => initiatePrivateChat(n)} 
          />
        </div>

        {/* Right User List - exactly as screenshot rank mapping */}
        {isRightDrawerOpen && (
          <div className="absolute inset-y-0 right-0 w-64 bg-white border-l border-gray-200 z-50 fade-in shadow-2xl">
            <UserList 
              users={[userName, 'GeminiBot', 'Admin', 'Fatih demirkaya', 'mehmet aslan']} 
              currentUser={userName} 
              onUserClick={(e, n) => { initiatePrivateChat(n); setIsRightDrawerOpen(false); }}
              onClose={() => setIsRightDrawerOpen(false)} 
              currentOps={['Admin', 'GeminiBot']}
            />
          </div>
        )}
      </div>

      {/* 4. Input Area - Adjusted for mIRC style (no mobile nav bar) */}
      <div className="relative bg-white pb-2 sm:pb-4">
        <div className="p-3 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
            <div className="flex-1 bg-gray-100 rounded-full px-5 flex items-center focus-within:ring-2 ring-black/5 transition-all h-12">
              <input 
                type="text" 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="flex-1 bg-transparent text-[15px] outline-none font-medium h-full placeholder-gray-400 text-black"
                placeholder="Mesaj yazın..."
              />
            </div>
            <button type="submit" className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center active:scale-90 transition-all shrink-0 shadow-lg">
              <Send size={20} className="ml-0.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile-only Bottom Navigation (Section 5) removed to clean up UI as requested */}
    </div>
  );
};

export default App;
