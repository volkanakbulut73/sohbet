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
import { Menu, X, Hash, Users, LogOut, MessageSquare, Send, Lock, Clock, Settings, ChevronLeft, Plus, Home, Heart, User } from 'lucide-react';

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
  const [activeNav, setActiveNav] = useState('sohbet');
  
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
    <div className={`h-screen-safe w-full flex flex-col bg-[#0b0f14] overflow-hidden select-none font-mono ${className}`}>
      
      {/* Header - As per screenshot */}
      <div className="safe-top bg-[#1a1f26] border-b border-gray-800 shrink-0 z-50">
        <div className="h-12 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView(embedded ? 'login' : 'landing')}
              className="w-8 h-8 rounded-full bg-gray-800/50 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-black text-white tracking-tight">Global Sohbet</span>
                <span className="text-[9px] text-[#00ff99] font-bold">V1.1.1</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#00ff99] rounded-full animate-pulse shadow-[0_0_8px_#00ff99]"></div>
                <span className="text-[10px] text-gray-400 font-bold">Hattasız Bağlantı: <span className="text-gray-300">{userName}</span></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)} className="p-2 text-gray-400 hover:text-white">
               <Users size={20} />
             </button>
          </div>
        </div>
      </div>

      {/* Sub-Header / Branding */}
      <div className="bg-[#0b0f14] py-3 px-6 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-black text-[#00ff99] uppercase tracking-widest italic">Global Sohbet V1.1.1</h2>
          <h3 className="text-[12px] font-black text-white uppercase tracking-tighter">BAĞLANTI: {userName?.toUpperCase()}</h3>
        </div>
        <button onClick={() => setIsLeftDrawerOpen(true)} className="p-2 text-white">
          <Menu size={24} />
        </button>
      </div>

      {/* Tabs Row */}
      <div className="bg-gray-800 flex shrink-0 overflow-x-auto no-scrollbar">
        {['#sohbet', 'GEMINIBOT', ...privateChats.filter(n => n !== 'GeminiBot')].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-b-2 ${activeTab === tab ? 'bg-white text-black border-[#00ff99]' : 'text-gray-400 border-transparent hover:text-white'}`}
          >
            {tab.startsWith('#') ? <Hash size={12} className="inline mr-1" /> : ''}
            {tab}
          </button>
        ))}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex overflow-hidden relative min-h-0 bg-white">
        {/* Left Drawer (Mobile) */}
        {isLeftDrawerOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 z-[100] lg:hidden" onClick={() => setIsLeftDrawerOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 z-[110] p-4 flex flex-col fade-in">
              <div className="flex justify-between items-center mb-6">
                <span className="text-white font-black text-sm italic">MENÜ</span>
                <X size={20} className="text-gray-500" onClick={() => setIsLeftDrawerOpen(false)} />
              </div>
              <div className="space-y-1">
                {['#sohbet', '#yardim', '#teknoloji', '#is-dunyasi'].map(c => (
                  <button key={c} onClick={() => { setActiveTab(c); setIsLeftDrawerOpen(false); }} className={`w-full text-left px-4 py-3 text-xs font-bold rounded-sm ${activeTab === c ? 'bg-[#00ff99] text-black' : 'text-gray-400 hover:bg-gray-800'}`}>
                    {c}
                  </button>
                ))}
              </div>
              <button onClick={() => setView('landing')} className="mt-auto flex items-center gap-2 text-red-500 text-xs font-bold p-4">
                <LogOut size={16} /> ÇIKIŞ YAP
              </button>
            </div>
          </>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {isAILoading && <div className="h-1 bg-[#00ff99] animate-pulse shrink-0" />}
          <MessageList 
            messages={messages} 
            currentUser={userName} 
            blockedUsers={[]} 
            onNickClick={(e, n) => initiatePrivateChat(n)} 
          />
        </div>

        {/* Right User List Panel */}
        {isRightDrawerOpen && (
          <div className="absolute inset-y-0 right-0 w-64 bg-gray-100 border-l border-gray-300 z-50 fade-in flex flex-col">
            <UserList 
              users={[userName, 'GeminiBot', 'Admin']} 
              currentUser={userName} 
              onUserClick={(e, n) => { initiatePrivateChat(n); setIsRightDrawerOpen(false); }}
              onClose={() => setIsRightDrawerOpen(false)} 
              currentOps={['Admin', 'GeminiBot']}
            />
          </div>
        )}
      </div>

      {/* FAB - Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <button className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center text-white shadow-2xl border-2 border-white/10 active:scale-95 transition-all">
          <Plus size={32} />
        </button>
      </div>

      {/* Input Panel - Fixed visibility */}
      <div className="bg-white border-t border-gray-200 p-2 sm:p-4 pb-20 sm:pb-24">
        <form onSubmit={handleSend} className="flex gap-2">
          <div className="flex-1 bg-gray-100 rounded-full px-4 flex items-center focus-within:ring-2 ring-[#00ff99]/30 transition-all h-12">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 bg-transparent text-[15px] outline-none font-medium h-full placeholder-gray-400 text-black"
              placeholder="Mesaj yazın..."
            />
          </div>
          <button type="submit" className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center active:scale-90 transition-all">
            <Send size={20} />
          </button>
        </form>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 z-50">
        {[
          { id: 'home', icon: <Home size={22} />, label: 'Ana Sayfa' },
          { id: 'requests', icon: <Heart size={22} />, label: 'Talepler' },
          { id: 'sohbet', icon: <MessageSquare size={22} />, label: 'Sohbet' },
          { id: 'profile', icon: <User size={22} />, label: 'Profil' }
        ].map(nav => (
          <button 
            key={nav.id}
            onClick={() => setActiveNav(nav.id)}
            className={`flex flex-col items-center gap-1 ${activeNav === nav.id ? 'text-black font-bold' : 'text-gray-400'}`}
          >
            {nav.icon}
            <span className="text-[9px] uppercase font-black">{nav.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default App;