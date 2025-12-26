
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

  // Mobil Klavye ve Viewport Yönetimi
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      if (embedded) {
        // Gömülü modda sadece parent elementin yüksekliğini kullan
        containerRef.current.style.height = '100%';
      } else if (window.visualViewport) {
        // Ana domainde klavye açıldığında viewport küçülmesini baz al
        containerRef.current.style.height = `${window.visualViewport.height}px`;
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateSize);
      window.visualViewport.addEventListener('scroll', updateSize);
    }
    window.addEventListener('resize', updateSize);
    updateSize();

    return () => {
      window.visualViewport?.removeEventListener('resize', updateSize);
      window.visualViewport?.removeEventListener('scroll', updateSize);
      window.removeEventListener('resize', updateSize);
    };
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
  
  if (view === 'login' || view === 'landing' && embedded) {
    return (
      <div className="absolute inset-0 bg-[#d4dce8] flex items-center justify-center p-4 font-mono z-[100]">
        <div className="w-full max-w-[320px] bg-[#d4dce8] border-2 border-white shadow-[2px_2px_10px_rgba(0,0,0,0.2)]">
          <div className="bg-[#000080] text-white px-2 py-1 text-[11px] font-bold flex justify-between items-center">
            <span>Connect to Workigom</span>
            {!embedded && <X size={14} className="cursor-pointer" onClick={() => setView('landing')} />}
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-center">
              <div className="bg-white p-3 border-2 border-gray-400">
                <Lock size={32} className="text-[#000080]" />
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <input type="email" placeholder="E-mail" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full bg-white border border-gray-400 p-2 text-sm outline-none focus:border-[#000080]" />
              <input type="password" placeholder="Şifre" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-white border border-gray-400 p-2 text-sm outline-none focus:border-[#000080]" />
              <button disabled={isLoggingIn} className="w-full bg-[#d4dce8] border-2 border-white shadow-[1px_1px_0_gray] text-black py-2 text-xs font-bold active:translate-y-[1px] active:shadow-none uppercase">Giriş Yap</button>
            </form>
            <div className="text-center">
               <button onClick={() => setView('register')} className="text-[#000080] text-[10px] font-bold hover:underline italic uppercase">Kayıt Olmak İstiyorum</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'register') return <RegistrationForm onClose={() => setView('login')} onSuccess={() => setView('pending')} />;
  if (view === 'pending') return <div className="absolute inset-0 bg-[#d4dce8] flex items-center justify-center p-4 text-[#000080] font-mono text-center"><div className="space-y-4 border-2 border-white p-8 bg-white/50"><Clock size={48} className="mx-auto"/><h2 className="text-lg font-bold uppercase">Onay Bekleniyor</h2></div></div>;

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 flex flex-col bg-[#d4dce8] overflow-hidden font-mono ${className}`}
    >
      {/* 1. Header (Sabit Yükseklik) */}
      <div className="bg-black text-white border-b border-gray-800 flex-none h-10 flex items-center z-50 px-2">
        <button className="p-1 text-gray-400" onClick={() => setIsLeftDrawerOpen(true)}>
          <Menu size={20} />
        </button>
        <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar items-center px-2">
          {['Status', '#Sohbet', '#Yardim'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab.startsWith('#') ? tab.toLowerCase() : tab)} 
              className={`px-3 py-1 text-[11px] font-black uppercase whitespace-nowrap border-b-2 ${activeTab === (tab.startsWith('#') ? tab.toLowerCase() : tab) ? 'border-white text-white' : 'border-transparent text-gray-500'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button 
          onClick={() => setShowUserList(!showUserList)} 
          className={`p-1 ${showUserList ? 'text-green-400' : 'text-gray-400'}`}
        >
          <UsersIcon size={20} />
        </button>
      </div>

      {/* 2. Content Area (Esnek Orta Bölüm) */}
      <div className="flex-1 flex overflow-hidden relative bg-white">
        <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
          <MessageList messages={messages} currentUser={userName} blockedUsers={[]} onNickClick={(e, n) => initiatePrivateChat(n)} />
        </div>

        {/* User List Drawer (Absolute within content) */}
        {showUserList && (
          <div className="absolute right-0 top-0 bottom-0 w-48 border-l border-gray-300 bg-white z-[70] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="bg-gray-100 p-2 border-b border-gray-200 flex justify-between items-center px-2 shrink-0">
              <span className="italic text-[9px] font-black text-gray-600 uppercase">Online</span>
              <X size={16} className="cursor-pointer text-gray-400" onClick={() => setShowUserList(false)} />
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

      {/* 3. Input Area (ALTA ÇAKILI - ZORUNLU GÖRÜNÜR) */}
      <div className="flex-none bg-[#d4dce8] border-t border-gray-400 p-2 z-[60] shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
        <form onSubmit={handleSend} className="flex items-center gap-1 w-full h-11">
          <div className="flex-1 bg-white border-2 border-gray-400 h-full px-3 flex items-center shadow-inner rounded-sm focus-within:border-[#000080]">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 bg-transparent text-[16px] outline-none font-medium h-full text-black placeholder:text-gray-400"
              placeholder="Mesaj gönder..."
              autoComplete="off"
            />
          </div>
          <button 
            type="submit" 
            className="h-full px-5 bg-[#000080] text-white rounded-sm font-black uppercase text-[11px] active:scale-95 transition-all"
          >
            OK
          </button>
        </form>
      </div>

      {/* Left Sidebar Overlay */}
      {isLeftDrawerOpen && (
        <div className="absolute inset-0 z-[1000]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLeftDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#d4dce8] border-r border-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="bg-[#000080] text-white p-4 font-bold text-[13px] flex justify-between items-center">
               <span className="uppercase tracking-tighter">Kanallar</span>
               <X size={20} onClick={() => setIsLeftDrawerOpen(false)} className="cursor-pointer" />
            </div>
            <div className="p-4 space-y-2 overflow-y-auto flex-1">
              {['#Sohbet', '#Yardim', '#Radyo', '#Oyun'].map(c => (
                <button 
                  key={c} 
                  onClick={() => { setActiveTab(c.toLowerCase()); setIsLeftDrawerOpen(false); }} 
                  className={`w-full text-left p-4 text-xs font-black uppercase border rounded-sm transition-colors ${activeTab === c.toLowerCase() ? 'bg-[#000080] text-white border-[#000080]' : 'bg-white/40 text-[#000080] border-transparent hover:bg-white'}`}
                >
                  <Hash size={14} className="inline mr-2" />
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
