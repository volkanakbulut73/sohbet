
import React, { useState, useEffect, useRef } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import LandingPage from './components/LandingPage';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/AdminDashboard';
import { ChatModuleProps } from './types';
import { storageService } from './services/storageService';
import { Menu, X, Send, Lock, Clock, Smile, Users as UsersIcon, Hash } from 'lucide-react';

type AppView = 'landing' | 'login' | 'register' | 'pending' | 'chat' | 'admin_login' | 'admin_panel';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "", embedded = false }) => {
  const [viewportHeight, setViewportHeight] = useState('100%');
  const [showUserList, setShowUserList] = useState(false);
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

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        // Gömülü modda 100% kullan, standalone modda viewport yüksekliği kullan.
        setViewportHeight(embedded ? '100%' : `${window.visualViewport.height}px`);
      }
    };

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
    
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', handleResize);
    };
  }, [embedded]);

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
      <div className="absolute inset-0 bg-[#d4dce8] flex items-center justify-center p-4 z-[100] font-mono overflow-hidden">
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
                <label className="text-[10px] font-bold text-gray-700 uppercase">E-MAIL:</label>
                <input type="email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full bg-white border border-gray-400 p-2 text-sm outline-none focus:border-[#000080]" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase">PASSWORD:</label>
                <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-white border border-gray-400 p-2 text-sm outline-none focus:border-[#000080]" />
              </div>
              {loginError && <p className="text-red-600 text-[10px] font-bold text-center">{loginError}</p>}
              <button disabled={isLoggingIn} className="w-full bg-[#d4dce8] border-2 border-white shadow-[1px_1px_0_gray] text-black py-2 text-xs font-bold active:translate-y-[1px] active:shadow-none uppercase">GİRİŞ YAP</button>
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
  if (view === 'pending') return <div className="absolute inset-0 bg-[#d4dce8] flex items-center justify-center p-4 text-[#000080] font-mono text-center italic"><div className="space-y-4 border-2 border-white p-8"><Clock size={48} className="mx-auto"/><h2 className="text-lg font-bold uppercase">Onay Bekleniyor</h2><button onClick={() => setView('landing')} className="text-[10px] border border-[#000080] px-4 py-1">Geri Dön</button></div></div>;

  return (
    <div 
      ref={containerRef}
      style={{ height: viewportHeight }}
      className={`flex flex-col bg-[#d4dce8] overflow-hidden font-mono w-full ${embedded ? 'relative h-full' : 'fixed inset-0'} ${className}`}
    >
      
      {/* 1. Status Bar - Gömülü modda üst boşluğu tamamen sildik (pt-0) */}
      <div className={`bg-[#000080] text-white px-2 py-1 flex items-center justify-between z-10 text-[11px] font-bold shrink-0 border-b border-white/10 ${!embedded ? 'safe-top' : 'pt-0'}`}>
        <div className="flex items-center gap-2">
          <Menu size={18} className="cursor-pointer sm:hidden" onClick={() => setIsLeftDrawerOpen(true)} />
          <span className="truncate sm:inline hidden">Connected: workigomchat.online</span>
          <span className="truncate sm:hidden text-[10px] py-1 uppercase tracking-tighter">IRC Online</span>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setShowUserList(!showUserList)} className="hover:bg-blue-700 p-1 rounded transition-colors"><UsersIcon size={16} /></button>
        </div>
      </div>

      {/* 2. Channel Tabs */}
      <div className="bg-[#d4dce8] border-b border-gray-400 flex shrink-0 overflow-x-auto no-scrollbar py-0.5 px-1 gap-1">
        <button 
          onClick={() => setActiveTab('Status')} 
          className={`px-3 py-1 text-[10px] font-bold border transition-all whitespace-nowrap ${activeTab === 'Status' ? 'bg-white border-gray-500 text-black shadow-inner' : 'bg-gray-200 border-transparent text-[#000080]'}`}
        >
          Status
        </button>
        {['#Sohbet', '#Yardim'].map(chan => (
          <button 
            key={chan} 
            onClick={() => setActiveTab(chan)} 
            className={`px-3 py-1 text-[10px] font-bold border transition-all flex items-center gap-1 whitespace-nowrap ${activeTab === chan ? 'bg-white border-gray-500 text-black shadow-inner' : 'bg-gray-200 border-transparent text-[#000080]'}`}
          >
            {chan} <span className="text-red-700 text-[8px] opacity-60 ml-0.5">x</span>
          </button>
        ))}
      </div>

      {/* 3. Main Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-white relative mx-1 my-0.5 border border-gray-400">
        <div className="flex-1 flex flex-col min-w-0 bg-white relative">
          {isAILoading && <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500 animate-pulse z-10" />}
          <MessageList messages={messages} currentUser={userName} blockedUsers={[]} onNickClick={(e, n) => initiatePrivateChat(n)} />
        </div>

        {/* User List Panel */}
        {showUserList && (
          <div className="absolute right-0 top-0 bottom-0 w-32 md:w-40 border-l border-gray-300 bg-white z-[30] flex flex-col shadow-2xl md:shadow-none md:relative">
            <div className="bg-gray-100 p-1 border-b border-gray-200 flex justify-between items-center px-2">
              <span className="italic text-[9px] font-bold text-gray-500 uppercase tracking-tighter">User List</span>
              <X size={14} className="md:hidden cursor-pointer" onClick={() => setShowUserList(false)} />
            </div>
            <UserList 
              users={[userName, 'GeminiBot', 'Admin', 'SevimLi', 'Ercan', 'Esraa', 'NoNNiCK', 'Renk', 'w00t', 'aLin', 'Arazi', 'Asya', 'Ace', 'Bol', 'DeryureK', 'CeyLin', 'DiVeeT', 'Kaya', 'Letch']} 
              currentUser={userName} 
              onUserClick={(e, n) => initiatePrivateChat(n)}
              onClose={() => setShowUserList(false)} 
              currentOps={['Admin', 'GeminiBot', 'SevimLi']}
            />
          </div>
        )}
      </div>

      {/* 4. Input Area - Mesaj kutusunun görünmesi için alt boşluk pb-32 (128px) yapıldı */}
      <div className={`shrink-0 bg-[#d4dce8] border-t border-gray-400 p-1 md:p-1.5 z-50 ${embedded ? 'sm:pb-1.5 pb-32' : ''}`}>
        <form onSubmit={handleSend} className="flex items-center gap-1 w-full max-w-screen-2xl mx-auto">
          <div className="hidden sm:flex bg-white border border-gray-500 h-8 px-2 items-center shadow-inner rounded-sm w-20 shrink-0 justify-center">
            <span className="text-[#000080] text-[10px] font-bold truncate">{userName}</span>
          </div>
          <div className="flex-1 bg-white border border-gray-500 h-10 px-2 flex items-center shadow-inner rounded-sm overflow-hidden">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 bg-transparent text-[16px] md:text-[13px] outline-none font-medium h-full text-black placeholder:text-gray-400"
              placeholder="Mesaj gönder..."
              autoFocus
            />
          </div>
          <button 
            type="submit" 
            className="bg-[#000080] text-white px-4 h-10 text-[11px] font-bold rounded-sm shadow active:bg-blue-800 transition-colors flex items-center justify-center shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isLeftDrawerOpen && (
        <div className="fixed inset-0 z-[1000]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLeftDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#d4dce8] border-r border-white p-0 shadow-2xl flex flex-col font-mono">
            <div className="bg-[#000080] text-white p-3 font-bold text-[12px] flex justify-between items-center">
               <span className="flex items-center gap-2 uppercase tracking-tighter">IRC NAVIGATION</span>
               <X size={20} onClick={() => setIsLeftDrawerOpen(false)} className="cursor-pointer" />
            </div>
            <div className="p-4 space-y-2 overflow-y-auto flex-1 bg-[#d4dce8]">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-2 border-b border-gray-400 pb-1">Channels</p>
              {['#Sohbet', '#Yardim', '#Radyo', '#Oyun'].map(c => (
                <button 
                  key={c} 
                  onClick={() => { setActiveTab(c); setIsLeftDrawerOpen(false); }} 
                  className={`w-full text-left p-2.5 text-xs font-bold uppercase transition-all border border-transparent hover:border-white ${activeTab === c ? 'bg-[#000080] text-white' : 'text-[#000080] hover:bg-white/50'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-gray-400 bg-gray-200">
               <button onClick={() => setView('landing')} className="w-full p-3 bg-red-800 text-white font-bold text-[11px] rounded uppercase shadow-md active:translate-y-0.5">ÇIKIŞ YAP</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
