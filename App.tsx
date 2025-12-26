
import React, { useState, useEffect, useRef } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import LandingPage from './components/LandingPage';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/AdminDashboard';
import { ChatModuleProps } from './types';
import { storageService } from './services/storageService';
import { Menu, X, Send, Lock, Clock, Smile, Users as UsersIcon } from 'lucide-react';

type AppView = 'landing' | 'login' | 'register' | 'pending' | 'chat' | 'admin_login' | 'admin_panel';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "", embedded = false }) => {
  const [viewportHeight, setViewportHeight] = useState('100%');
  const [showUserList, setShowUserList] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const getInitialView = (): AppView => {
    if (externalUser && externalUser.trim() !== "") return 'chat';
    if (embedded) return 'login';
    return 'landing';
  };

  const [view, setView] = useState<AppView>(getInitialView());
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const { 
    userName, setUserName,
    activeTab, setActiveTab, 
    messages, sendMessage, 
    isAILoading,
    initiatePrivateChat
  } = useChatCore(externalUser || '');

  const [inputText, setInputText] = useState('');

  // Sadece mobilde klavye açıldığında daralma efektini uygula
  useEffect(() => {
    const handleVisualViewportResize = () => {
      if (window.visualViewport && window.innerWidth < 768) {
        setViewportHeight(`${window.visualViewport.height}px`);
      } else {
        setViewportHeight('100%');
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
    }
    
    handleVisualViewportResize();
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
      }
    };
  }, []);

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
        setLoginError('Hata: Bilgiler geçersiz.');
      } else if (user.status === 'pending') {
        setView('pending');
      } else {
        setUserName(user.nickname);
        localStorage.setItem('mirc_nick', user.nickname);
        setView('chat');
      }
    } catch (err) {
      setLoginError('Giriş hatası.');
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

  if (view === 'landing' && !embedded) return <LandingPage onEnter={() => setView('login')} onAdminClick={() => setView('admin_login')} />;
  
  if (view === 'login' || (view === 'landing' && embedded)) {
    return (
      <div className="absolute inset-0 bg-[#d4dce8] flex items-center justify-center p-4 z-[100] font-mono">
        <div className="w-full max-w-[320px] bg-[#d4dce8] border-2 border-white shadow-[2px_2px_10px_rgba(0,0,0,0.2)]">
          <div className="bg-[#000080] text-white px-2 py-1 text-[11px] font-bold flex justify-between items-center">
            <span>Connect</span>
            <X size={14} className="cursor-pointer" />
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-center mb-2">
              <div className="bg-white p-3 border-2 border-gray-400">
                <Lock size={32} className="text-[#000080]" />
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700">E-MAIL:</label>
                <input type="email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full bg-white border border-gray-400 p-1 text-xs outline-none focus:border-[#000080]" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700">PASSWORD:</label>
                <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-white border border-gray-400 p-1 text-xs outline-none focus:border-[#000080]" />
              </div>
              {loginError && <p className="text-red-600 text-[10px] font-bold text-center">{loginError}</p>}
              <button disabled={isLoggingIn} className="w-full bg-[#d4dce8] border-2 border-white shadow-[1px_1px_0_gray] text-black py-1.5 text-xs font-bold active:translate-y-[1px] active:shadow-none uppercase">GİRİŞ YAP</button>
            </form>
            <div className="border-t border-gray-400 pt-2 flex justify-between items-center">
               <button onClick={() => setView('register')} className="text-[#000080] text-[10px] font-bold hover:underline italic">Kayıt Ol...</button>
               <span className="text-[9px] text-gray-500 uppercase">mIRC v1.1.1</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'register') return <RegistrationForm onClose={() => setView(embedded ? 'login' : 'landing')} onSuccess={() => setView('pending')} />;
  if (view === 'pending') return <div className="absolute inset-0 bg-[#d4dce8] flex items-center justify-center p-4 text-[#000080] font-mono text-center italic"><div className="space-y-4 border-2 border-white p-8"><Clock size={48} className="mx-auto"/><h2 className="text-lg font-bold">ONAY BEKLENİYOR...</h2><button onClick={() => setView('landing')} className="text-[10px] border border-[#000080] px-4 py-1">Geri Dön</button></div></div>;

  return (
    <div 
      ref={containerRef}
      style={{ height: viewportHeight }}
      className={`w-full flex flex-col bg-[#d4dce8] overflow-hidden font-mono ${embedded ? 'relative h-full' : 'fixed inset-0'} ${className}`}
    >
      
      {/* 1. Status Bar - Klasik mIRC */}
      <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between safe-top z-10 text-[11px] font-bold shrink-0">
        <div className="flex items-center gap-3">
          <span className="opacity-80">IRC</span>
          <span className="truncate">Connected to workigomchat.online (6667)</span>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setShowUserList(!showUserList)} className="hover:bg-blue-700 p-0.5"><UsersIcon size={14} /></button>
           <button onClick={() => setIsLeftDrawerOpen(true)} className="sm:hidden"><Menu size={14} /></button>
        </div>
      </div>

      {/* 2. Channel Tabs - Geveze/mIRC stili */}
      <div className="bg-[#d4dce8] border-b border-gray-400 flex shrink-0 overflow-x-auto no-scrollbar py-0.5 px-1 gap-0.5">
        <button onClick={() => setActiveTab('Status')} className={`px-2 py-0.5 text-[10px] font-bold border ${activeTab === 'Status' ? 'bg-white border-gray-400 shadow-inner' : 'text-[#000080] border-transparent hover:bg-gray-200'}`}>Status</button>
        {['#Sohbet', '#Yardim'].map(chan => (
          <button key={chan} onClick={() => setActiveTab(chan)} className={`px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1 ${activeTab === chan ? 'bg-white border-gray-400 shadow-inner' : 'text-[#000080] border-transparent hover:bg-gray-200'}`}>{chan} <span className="text-red-600 text-[8px] opacity-50">x</span></button>
        ))}
      </div>

      {/* 3. Main Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-white relative mx-0.5 mb-0.5 border border-gray-400">
        <div className="flex-1 flex flex-col min-w-0 bg-white relative">
          {isAILoading && <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500 animate-pulse z-10" />}
          <MessageList messages={messages} currentUser={userName} blockedUsers={[]} onNickClick={(e, n) => initiatePrivateChat(n)} />
        </div>

        {/* User List - Masaüstünde görünür, mobilde toggle ile gelir */}
        {showUserList && (
          <div className="w-28 md:w-36 border-l border-gray-300 bg-white shrink-0 flex flex-col overflow-hidden">
            <div className="bg-gray-100 p-1 border-b border-gray-200 flex justify-center italic text-[9px] font-bold text-gray-500 uppercase">User List</div>
            <UserList 
              users={[userName, 'GeminiBot', 'Admin', 'SevimLi', 'Ercan', 'Esraa', 'NoNNiCK', 'Renk', 'w00t', 'aLin', 'Arazi', 'Asya', 'Ace', 'Bol', 'DeryureK', 'CeyLin', 'DiVeeT', 'Kaya', 'Letch']} 
              currentUser={userName} 
              onUserClick={(e, n) => initiatePrivateChat(n)}
              onClose={() => {}} 
              currentOps={['Admin', 'GeminiBot', 'SevimLi']}
            />
          </div>
        )}
      </div>

      {/* 4. Input Area - Geveze stili ince ve net */}
      <div className="shrink-0 bg-[#d4dce8] border-t border-gray-400 p-1 px-1.5 z-20">
        <form onSubmit={handleSend} className="flex items-center gap-1 w-full max-w-screen-2xl mx-auto">
          <div className="bg-white border border-gray-500 h-8 px-2 flex items-center shadow-inner rounded-sm w-12 md:w-16 shrink-0 justify-center">
            <span className="text-[#000080] text-[10px] font-bold truncate">{userName}</span>
          </div>
          <div className="flex-1 bg-white border border-gray-500 h-8 px-2 flex items-center shadow-inner rounded-sm">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 bg-transparent text-[12px] outline-none font-medium h-full text-black placeholder:text-gray-300"
              placeholder="Mesaj gönder..."
              autoFocus
            />
          </div>
          <button type="submit" className="bg-[#d4dce8] border border-gray-600 text-black px-4 h-8 text-[10px] font-bold rounded-sm shadow-[1px_1px_0_white_inset] active:translate-y-[1px] active:shadow-none uppercase">GÖNDER</button>
        </form>
        {/* Sitenin alt menüleri için mobilde minik boşluk */}
        <div className="h-2 sm:h-0 block md:hidden" />
      </div>

      {/* Mobile Menu Drawer */}
      {isLeftDrawerOpen && (
        <div className="fixed inset-0 z-[1000]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsLeftDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-[#d4dce8] border-l border-white p-4 space-y-4 shadow-2xl">
            <div className="bg-[#000080] text-white p-2 font-bold text-[11px] flex justify-between items-center">
               <span>MENU</span>
               <X size={16} onClick={() => setIsLeftDrawerOpen(false)} className="cursor-pointer" />
            </div>
            <div className="space-y-1">
              {['#Sohbet', '#Yardim', '#Radyo', '#Oyun'].map(c => (
                <button key={c} onClick={() => { setActiveTab(c); setIsLeftDrawerOpen(false); }} className="w-full text-left p-2 text-[#000080] hover:bg-white text-xs font-bold uppercase transition-colors">{c}</button>
              ))}
            </div>
            <button onClick={() => setView('landing')} className="w-full p-2 bg-red-600 text-white font-bold text-[10px] rounded uppercase mt-10">GÜVENLİ ÇIKIŞ</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
