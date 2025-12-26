
import React, { useState, useEffect, useRef } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import LandingPage from './components/LandingPage';
import RegistrationForm from './components/RegistrationForm';
import { ChatModuleProps } from './types';
import { storageService } from './services/storageService';
import { 
  Menu, X, Lock, Clock, 
  Users as UsersIcon, Hash 
} from 'lucide-react';

type AppView = 'landing' | 'login' | 'register' | 'pending' | 'chat';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "", embedded = false }) => {
  const [showUserList, setShowUserList] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getInitialView = (): AppView => {
    if (externalUser && externalUser.trim() !== "") return 'chat';
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

  // Sadece mobil klavye açıldığında visualViewport.height kullanarak 
  // chat'in parent dışına taşmasını engelliyoruz.
  useEffect(() => {
    const handleViewport = () => {
      if (window.visualViewport && !embedded) {
        document.body.style.height = `${window.visualViewport.height}px`;
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewport);
    }
    return () => window.visualViewport?.removeEventListener('resize', handleViewport);
  }, [embedded]);

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

  if (view === 'landing' && !embedded) return <LandingPage onEnter={() => setView('login')} />;
  
  if (view === 'login') {
    return (
      <div className="h-full w-full bg-[#d4dce8] flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-[320px] bg-[#d4dce8] border-2 border-white shadow-[2px_2px_10px_rgba(0,0,0,0.2)]">
          <div className="bg-[#000080] text-white px-2 py-1 text-[11px] font-bold flex justify-between items-center">
            <span>Connect</span>
            {!embedded && <X size={14} className="cursor-pointer" onClick={() => setView('landing')} />}
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-center">
              <div className="bg-white p-3 border-2 border-gray-400">
                <Lock size={32} className="text-[#000080]" />
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <input type="email" placeholder="Email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full bg-white border border-gray-400 p-2 text-sm outline-none focus:border-[#000080]" />
              <input type="password" placeholder="Şifre" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-white border border-gray-400 p-2 text-sm outline-none focus:border-[#000080]" />
              {loginError && <p className="text-red-600 text-[10px] font-bold text-center">{loginError}</p>}
              <button disabled={isLoggingIn} className="w-full bg-[#d4dce8] border-2 border-white shadow-[1px_1px_0_gray] text-black py-2 text-xs font-bold active:translate-y-[1px] active:shadow-none uppercase">GİRİŞ YAP</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'register') return <RegistrationForm onClose={() => setView('login')} onSuccess={() => setView('pending')} />;
  if (view === 'pending') return <div className="h-full w-full bg-[#d4dce8] flex items-center justify-center p-4 text-[#000080] font-mono text-center"><div className="space-y-4 border-2 border-white p-8 bg-white/50"><Clock size={48} className="mx-auto"/><h2 className="text-lg font-bold uppercase">Onay Bekleniyor</h2></div></div>;

  return (
    <div 
      ref={containerRef}
      className={`h-full w-full flex flex-col bg-[#d4dce8] overflow-hidden font-mono relative ${className}`}
    >
      {/* 1. Header (Fixed height) */}
      <div className="bg-black text-white border-b border-gray-800 flex-none h-9 flex items-center z-50">
        <button className="px-3 text-gray-400 hover:text-white" onClick={() => setIsLeftDrawerOpen(true)}>
          <Menu size={18} />
        </button>
        <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar h-full items-center">
          {['Status', '#Sohbet', '#Yardim'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab.startsWith('#') ? tab.toLowerCase() : tab)} 
              className={`px-3 h-full text-[11px] font-black uppercase transition-all whitespace-nowrap border-b-2 flex items-center ${activeTab === (tab.startsWith('#') ? tab.toLowerCase() : tab) ? 'border-white text-white bg-white/10' : 'border-transparent text-gray-500'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button 
          onClick={() => setShowUserList(!showUserList)} 
          className={`px-3 h-full text-gray-400 ${showUserList ? 'text-green-400' : ''}`}
        >
          <UsersIcon size={16} />
        </button>
      </div>

      {/* 2. Chat Area (Flex-1: Takes available space) */}
      <div className="flex-1 flex overflow-hidden bg-white relative">
        <div className="flex-1 flex flex-col min-w-0 bg-white relative overflow-hidden">
          <MessageList messages={messages} currentUser={userName} blockedUsers={[]} onNickClick={(e, n) => initiatePrivateChat(n)} />
        </div>

        {/* User List Overlay (Absolute inside chat area) */}
        {showUserList && (
          <div className="absolute right-0 top-0 bottom-0 w-48 border-l border-gray-300 bg-white z-[70] flex flex-col shadow-2xl">
            <div className="bg-gray-100 p-2 border-b border-gray-200 flex justify-between items-center px-2 shrink-0">
              <span className="italic text-[9px] font-black text-gray-600 uppercase">Online</span>
              <X size={14} className="cursor-pointer text-gray-400" onClick={() => setShowUserList(false)} />
            </div>
            <UserList 
              users={[userName, 'GeminiBot', 'Admin', 'SevimLi', 'Ercan', 'Esraa', 'NoNNiCK', 'Renk', 'w00t']} 
              currentUser={userName} 
              onUserClick={(e, n) => initiatePrivateChat(n)}
              onClose={() => setShowUserList(false)} 
            />
          </div>
        )}
      </div>

      {/* 3. Input Area (Fixed height at bottom) */}
      <div className="flex-none bg-[#d4dce8] border-t border-gray-400 p-1.5 z-[60]">
        <form onSubmit={handleSend} className="flex items-center gap-1 w-full h-11">
          <div className="flex-1 bg-white border border-gray-400 h-full px-2 flex items-center shadow-inner rounded-sm overflow-hidden focus-within:border-[#000080]">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 bg-transparent text-[16px] outline-none font-medium h-full text-black placeholder:text-gray-400 font-mono"
              placeholder="Mesajınızı buraya yazın..."
              autoComplete="off"
            />
          </div>
          <button 
            type="submit" 
            className="h-full px-4 bg-[#000080] text-white rounded-sm font-black uppercase text-[11px] active:scale-95 transition-transform"
          >
            GÖNDER
          </button>
        </form>
      </div>

      {/* Drawer Overlay */}
      {isLeftDrawerOpen && (
        <div className="absolute inset-0 z-[1000]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsLeftDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#d4dce8] border-r border-white shadow-2xl flex flex-col font-mono">
            <div className="bg-[#000080] text-white p-3 font-bold text-[13px] flex justify-between items-center">
               <span className="uppercase tracking-tighter">Kanallar</span>
               <X size={20} onClick={() => setIsLeftDrawerOpen(false)} className="cursor-pointer" />
            </div>
            <div className="p-4 space-y-2 overflow-y-auto flex-1">
              {['#Sohbet', '#Yardim', '#Radyo', '#Oyun'].map(c => (
                <button 
                  key={c} 
                  onClick={() => { setActiveTab(c.toLowerCase()); setIsLeftDrawerOpen(false); }} 
                  className={`w-full text-left p-3 text-xs font-black uppercase border ${activeTab === c.toLowerCase() ? 'bg-[#000080] text-white border-[#000080]' : 'text-[#000080] hover:bg-white/50 border-transparent'}`}
                >
                  <Hash size={12} className="inline mr-2" />
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
