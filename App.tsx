
import React, { useState, useEffect, useRef } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import LandingPage from './components/LandingPage';
import RegistrationForm from './components/RegistrationForm';
import { ChatModuleProps } from './types';
import { storageService } from './services/storageService';
import { 
  Menu, X, Send, Lock, Clock, 
  Users as UsersIcon, Hash, 
  Home, Heart, Plus, MessageCircle, User as UserIcon,
  ChevronLeft
} from 'lucide-react';

type AppView = 'landing' | 'login' | 'register' | 'pending' | 'chat';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "", embedded = false }) => {
  const [viewportHeight, setViewportHeight] = useState('100%');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
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

  // Viewport ve Klavye Takibi
  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const height = window.visualViewport.height;
        const isCurrentlyOpen = height < window.innerHeight * 0.8;
        setIsKeyboardOpen(isCurrentlyOpen);
        setViewportHeight(`${height}px`);
      }
    };

    window.visualViewport?.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('scroll', handleViewportChange);
    
    handleViewportChange();
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

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
      <div className="absolute inset-0 bg-[#d4dce8] flex items-center justify-center p-4 z-[100] font-mono">
        <div className="w-full max-w-[320px] bg-[#d4dce8] border-2 border-white shadow-[2px_2px_10px_rgba(0,0,0,0.2)]">
          <div className="bg-[#000080] text-white px-2 py-1 text-[11px] font-bold flex justify-between items-center">
            <span>Connect</span>
            <X size={14} className="cursor-pointer" onClick={() => setView('landing')} />
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-center mb-2">
              <div className="bg-white p-3 border-2 border-gray-400">
                <Lock size={32} className="text-[#000080]" />
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-tighter">E-MAIL:</label>
                <input type="email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full bg-white border border-gray-400 p-2 text-sm outline-none focus:border-[#000080]" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-tighter">PASSWORD:</label>
                <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-white border border-gray-400 p-2 text-sm outline-none focus:border-[#000080]" />
              </div>
              {loginError && <p className="text-red-600 text-[10px] font-bold text-center">{loginError}</p>}
              <button disabled={isLoggingIn} className="w-full bg-[#d4dce8] border-2 border-white shadow-[1px_1px_0_gray] text-black py-2 text-xs font-bold active:translate-y-[1px] active:shadow-none uppercase">GİRİŞ YAP</button>
            </form>
            <div className="border-t border-gray-400 pt-2 flex justify-between items-center">
               <button onClick={() => setView('register')} className="text-[#000080] text-[10px] font-bold hover:underline italic">Kayıt Ol...</button>
               <span className="text-[9px] text-gray-500 uppercase tracking-tighter">Mirch v1.1.1</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'register') return <RegistrationForm onClose={() => setView('login')} onSuccess={() => setView('pending')} />;
  if (view === 'pending') return <div className="absolute inset-0 bg-[#d4dce8] flex items-center justify-center p-4 text-[#000080] font-mono text-center italic"><div className="space-y-4 border-2 border-white p-8 bg-white/50"><Clock size={48} className="mx-auto"/><h2 className="text-lg font-bold uppercase">Onay Bekleniyor</h2><p className="text-[10px]">Başvurunuz incelenmektedir.</p><button onClick={() => setView('landing')} className="text-[10px] border border-[#000080] px-4 py-1">Geri Dön</button></div></div>;

  return (
    <div 
      ref={containerRef}
      style={{ height: viewportHeight }}
      className={`flex flex-col bg-[#d4dce8] overflow-hidden font-mono w-full fixed inset-0 ${className}`}
    >
      
      {/* 1. Header (Status Bar) */}
      <div className={`bg-[#000080] text-white px-3 py-1.5 flex items-center justify-between z-20 text-[12px] font-bold shrink-0 border-b border-white/20 safe-top`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setView('landing')} className="hover:bg-white/10 p-1">
             <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <span className="flex items-center gap-1 uppercase tracking-tighter text-[13px]">
              <span className="text-green-400">●</span> Global Sohbet <span className="text-[10px] bg-green-600 px-1 ml-1">V1.1.1</span>
            </span>
            <span className="text-[10px] opacity-80 font-normal">Hatasız Bağlantı: {userName}</span>
          </div>
        </div>
        <button onClick={() => setShowUserList(!showUserList)} className="p-1.5 hover:bg-blue-700">
           <UsersIcon size={20} />
        </button>
      </div>

      {/* 2. Tabs (Channels) */}
      <div className="bg-black text-white/90 border-b border-gray-600 flex shrink-0 overflow-x-auto no-scrollbar py-1 px-1 gap-1">
        <button className="px-2 py-1 text-gray-400"><Menu size={18} onClick={() => setIsLeftDrawerOpen(true)} /></button>
        <div className="flex-1 flex gap-1">
          {['Status', '#Sohbet', '#Yardim'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab.startsWith('#') ? tab.toLowerCase() : tab)} 
              className={`px-4 py-1 text-[11px] font-bold uppercase transition-all whitespace-nowrap border-b-2 ${activeTab === (tab.startsWith('#') ? tab.toLowerCase() : tab) ? 'border-white text-white' : 'border-transparent text-gray-500'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Area (Message Area) */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-white relative">
        <div className="flex-1 flex flex-col min-w-0 bg-white relative">
          {isAILoading && <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500 animate-pulse z-20" />}
          <MessageList messages={messages} currentUser={userName} blockedUsers={[]} onNickClick={(e, n) => initiatePrivateChat(n)} />
        </div>

        {/* User List Panel (Overlay on mobile) */}
        {showUserList && (
          <div className="absolute right-0 top-0 bottom-0 w-48 border-l border-gray-300 bg-white z-[30] flex flex-col shadow-2xl">
            <div className="bg-gray-100 p-2 border-b border-gray-200 flex justify-between items-center px-3">
              <span className="italic text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Online Kişiler</span>
              <X size={16} className="cursor-pointer" onClick={() => setShowUserList(false)} />
            </div>
            <UserList 
              users={[userName, 'GeminiBot', 'Admin', 'SevimLi', 'Ercan', 'Esraa', 'NoNNiCK', 'Renk', 'w00t', 'aLin', 'Arazi', 'Asya', 'Ace', 'Bol', 'DeryureK', 'CeyLin', 'DiVeeT', 'Kaya', 'Letch']} 
              currentUser={userName} 
              onUserClick={(e, n) => initiatePrivateChat(n)}
              onClose={() => setShowUserList(false)} 
              currentOps={['Admin', 'GeminiBot']}
            />
          </div>
        )}
      </div>

      {/* 4. Input Area (Kırmızı Kutulu Alan) */}
      <div className="shrink-0 bg-white border-t border-gray-300 p-2 md:p-3 z-40">
        <form onSubmit={handleSend} className="flex items-center gap-2 w-full max-w-screen-xl mx-auto">
          <div className="flex-1 bg-white border-2 border-gray-300 h-12 px-3 flex items-center shadow-sm rounded-md overflow-hidden">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 bg-transparent text-[16px] outline-none font-medium h-full text-black placeholder:text-gray-400"
              placeholder="Mesajınızı yazın..."
            />
          </div>
          <button 
            type="submit" 
            className="w-12 h-12 bg-gray-700 text-white rounded-full flex items-center justify-center shadow-lg active:bg-black transition-colors shrink-0"
          >
            <Menu size={22} />
          </button>
        </form>
      </div>

      {/* 5. Bottom Navigation (Sadece klavye kapalıyken ve mobilde göster) */}
      {!isKeyboardOpen && (
        <div className="shrink-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 safe-bottom">
           <button className="flex flex-col items-center gap-1 text-gray-400"><Home size={22} /><span className="text-[9px] font-bold uppercase tracking-tighter">Ana Sayfa</span></button>
           <button className="flex flex-col items-center gap-1 text-gray-400"><Heart size={22} /><span className="text-[9px] font-bold uppercase tracking-tighter">Talepler</span></button>
           <button className="bg-gray-800 text-white p-3 rounded-full -translate-y-4 shadow-xl border-4 border-[#d4dce8]"><Plus size={24} /></button>
           <button className="flex flex-col items-center gap-1 text-[#000080]"><MessageCircle size={22} /><span className="text-[9px] font-bold uppercase tracking-tighter">Sohbet</span></button>
           <button className="flex flex-col items-center gap-1 text-gray-400"><UserIcon size={22} /><span className="text-[9px] font-bold uppercase tracking-tighter">Profil</span></button>
        </div>
      )}

      {/* Mobile Sidebar Drawer */}
      {isLeftDrawerOpen && (
        <div className="fixed inset-0 z-[1000]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLeftDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#d4dce8] border-r border-white shadow-2xl flex flex-col font-mono">
            <div className="bg-[#000080] text-white p-3 font-bold text-[13px] flex justify-between items-center">
               <span className="flex items-center gap-2 uppercase tracking-tighter">Navigasyon</span>
               <X size={20} onClick={() => setIsLeftDrawerOpen(false)} className="cursor-pointer" />
            </div>
            <div className="p-4 space-y-2 overflow-y-auto flex-1">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-2 border-b border-gray-400 pb-1">Kanallar</p>
              {['#Sohbet', '#Yardim', '#Radyo', '#Oyun'].map(c => (
                <button 
                  key={c} 
                  onClick={() => { setActiveTab(c.toLowerCase()); setIsLeftDrawerOpen(false); }} 
                  className={`w-full text-left p-2.5 text-xs font-bold uppercase transition-all border ${activeTab === c.toLowerCase() ? 'bg-[#000080] text-white' : 'text-[#000080] hover:bg-white/50 border-transparent'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-gray-400 bg-gray-200">
               <button onClick={() => setView('landing')} className="w-full p-3 bg-red-800 text-white font-bold text-[11px] rounded uppercase shadow-md">OTURUMU KAPAT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
