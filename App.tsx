
import React, { useState, useEffect, useRef } from 'react';
import LandingPage from './components/LandingPage';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/AdminDashboard';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import { useChatCore } from './hooks/useChatCore';
import { storageService } from './services/storageService';
import { ChatModuleProps } from './types';
import { 
  Terminal, Menu, X, Hash, Send, LogOut, Shield, UserPlus, Key
} from 'lucide-react';

const App: React.FC<ChatModuleProps> = () => {
  const [view, setView] = useState<'landing' | 'register' | 'login' | 'chat' | 'admin' | 'pending'>('landing');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isChannelsOpen, setIsChannelsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { 
    userName, setUserName, activeTab, setActiveTab, 
    messages, sendMessage, initiatePrivateChat 
  } = useChatCore('');

  useEffect(() => {
    if (view === 'chat' || view === 'admin' || view === 'login' || view === 'register') {
      if (window.innerWidth < 768) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
      }
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
    }
  }, [view]);

  useEffect(() => {
    const handleViewport = () => {
      setIsMobile(window.innerWidth < 1024);
      if (containerRef.current && window.visualViewport) {
        const height = window.visualViewport.height;
        containerRef.current.style.height = `${height}px`;
        if (document.activeElement?.tagName === 'INPUT') {
          window.scrollTo(0, 0);
        }
      }
    };
    window.visualViewport?.addEventListener('resize', handleViewport);
    window.visualViewport?.addEventListener('scroll', handleViewport);
    window.addEventListener('resize', handleViewport);
    handleViewport();
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewport);
      window.visualViewport?.removeEventListener('scroll', handleViewport);
      window.removeEventListener('resize', handleViewport);
    };
  }, [view]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    sendMessage(text);
    setInputText('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const user = await storageService.loginUser(loginForm.email, loginForm.password);
      if (user) {
        if (user.status === 'pending') setView('pending');
        else if (user.status === 'rejected') alert('Başvurunuz reddedilmiştir.');
        else {
          setUserName(user.nickname);
          localStorage.setItem('mirc_nick', user.nickname);
          setView('chat');
        }
      } else {
        const isAdmin = await storageService.adminLogin(loginForm.email, loginForm.password);
        if (isAdmin) setView('admin');
        else alert('Hatalı bilgiler.');
      }
    } catch (err) { alert('Hata oluştu.'); }
    finally { setIsLoggingIn(false); }
  };

  if (view === 'landing') return <LandingPage onEnter={() => setView('login')} onAdminClick={() => setView('login')} />;
  if (view === 'register') return <RegistrationForm onClose={() => setView('login')} onSuccess={() => setView('pending')} />;
  if (view === 'admin') return <AdminDashboard onLogout={() => setView('landing')} />;
  
  if (view === 'pending') return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0b0f14] p-10 text-center space-y-6 min-h-screen">
      <div className="w-20 h-20 bg-[#00ff99]/10 rounded-full flex items-center justify-center border border-[#00ff99]/30">
        <Shield size={40} className="text-[#00ff99]" />
      </div>
      <h2 className="text-2xl font-black text-white uppercase italic">Başvurunuz İnceleniyor</h2>
      <button onClick={() => setView('landing')} className="text-[#00ff99] text-xs font-black uppercase underline">Geri Dön</button>
    </div>
  );

  if (view === 'login') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0f14]/95 backdrop-blur-sm fixed inset-0 z-[2000] p-4">
        <div className="w-full max-w-[360px] bg-[#d4dce8] border-2 border-white shadow-[15px_15px_0px_0px_rgba(0,0,0,0.5)] mirc-window">
          <div className="bg-[#000080] text-white px-3 py-2 text-xs font-black flex justify-between items-center">
            <span><Key size={14} className="inline mr-2" /> Giriş Paneli</span>
            <X size={18} className="cursor-pointer" onClick={() => setView('landing')} />
          </div>
          <div className="p-8 space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-3 border-2 border-gray-400 text-sm bg-white" placeholder="E-posta" />
              <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-3 border-2 border-gray-400 text-sm bg-white" placeholder="Şifre" />
              <button disabled={isLoggingIn} className="w-full bg-[#d4dce8] border-2 border-white py-4 font-black shadow-[4px_4px_0_gray] uppercase text-[#000080]">{isLoggingIn ? 'Bağlanıyor...' : 'Giriş Yap'}</button>
            </form>
            <button onClick={() => setView('register')} className="w-full bg-[#00ff99] text-black py-4 text-xs font-black uppercase shadow-[4px_4px_0_gray]">Kayıt Başvurusu Yap</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col bg-[#d4dce8] w-full border-2 border-white shadow-2xl overflow-hidden text-black font-mono fixed left-0 top-0 right-0 z-[1000]`}
      style={{ height: window.visualViewport?.height || '100dvh' }}
    >
      <header className={`${isMobile ? 'h-12' : 'h-9'} bg-[#000080] text-white flex items-center px-2 font-bold shrink-0`}>
        <div className="flex-1 flex gap-1 h-full items-center">
          {isMobile && (
             <button onClick={() => setIsChannelsOpen(true)} className="p-2 mr-2"><Menu size={20} /></button>
          )}
          {['#Sohbet', '#Yardim', '#Radyo'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} className={`px-2 md:px-4 h-[80%] uppercase transition-all flex items-center gap-1 md:gap-2 text-[9px] md:text-[10px] ${activeTab === tab.toLowerCase() ? 'bg-[#d4dce8] text-black border-t-2 border-white' : 'hover:bg-blue-800'}`}>
              <Hash size={12} /> {isMobile ? tab.replace('#', '') : tab}
            </button>
          ))}
        </div>
        {!isMobile && (
          <div className="flex gap-4 items-center opacity-70">
            <span className="flex items-center gap-1 italic text-[10px] tracking-tight"><Terminal size={12} /> workigomchat.online</span>
            <button onClick={() => window.location.reload()}><LogOut size={14} /></button>
          </div>
        )}
      </header>
      
      <div className="flex-1 flex overflow-hidden bg-white border-2 border-gray-400 m-1 mirc-inset relative">
        <main className="flex-1 relative min-w-0">
          <MessageList messages={messages} currentUser={userName} blockedUsers={[]} onNickClick={(e, n) => initiatePrivateChat(n)} />
        </main>
        
        {/* SABİT KULLANICI LİSTESİ - Hem Mobil Hem Web */}
        <aside className={`${isMobile ? 'w-[100px]' : 'w-52'} bg-[#d4dce8] border-l-2 border-white shrink-0 flex flex-col transition-all duration-300`}>
          <UserList users={[userName, 'Admin', 'GeminiBot', 'Selin', 'Caner']} currentUser={userName} onClose={() => {}} />
        </aside>

        {isMobile && isChannelsOpen && (
          <div className="absolute inset-0 z-[1100] flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsChannelsOpen(false)} />
            <div className="relative w-[75%] bg-[#d4dce8] h-full shadow-2xl flex flex-col border-r-2 border-white animate-in slide-in-from-left duration-200">
              <div className="p-3 bg-[#000080] text-white font-bold flex justify-between items-center shrink-0">
                <span className="text-[10px] uppercase">KANALLAR</span>
                <X onClick={() => setIsChannelsOpen(false)} size={18} />
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {['#Sohbet', '#Yardim', '#Radyo'].map(c => (
                  <button key={c} onClick={() => { setActiveTab(c.toLowerCase()); setIsChannelsOpen(false); }} className={`w-full text-left p-4 border-2 border-white flex items-center gap-3 font-bold text-xs uppercase ${activeTab === c.toLowerCase() ? 'bg-[#000080] text-white shadow-inner' : 'bg-gray-100 shadow-sm'}`}>
                    <Hash size={14} /> {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className={`${isMobile ? 'h-16' : 'h-14'} bg-[#d4dce8] border-t-2 border-white p-2 shrink-0`}>
        <form onSubmit={handleSend} className="flex gap-1 h-full">
          <div className="flex-1 bg-white border-2 border-gray-600 shadow-inner px-3 flex items-center overflow-hidden">
            <span className="text-[#000080] font-black mr-2 text-[10px] md:text-[11px] shrink-0 truncate max-w-[60px] md:max-w-none">{userName}:</span>
            <input 
              ref={inputRef}
              type="text" 
              value={inputText} 
              onChange={e => setInputText(e.target.value)} 
              className="flex-1 outline-none text-sm bg-transparent" 
              placeholder="Yaz..." 
              autoComplete="off"
              autoCorrect="off"
              enterKeyHint="send"
            />
          </div>
          <button type="submit" className={`bg-[#d4dce8] border-2 border-white shadow-[2px_2px_0_gray] font-black uppercase active:shadow-none active:translate-y-px flex items-center justify-center shrink-0 ${isMobile ? 'w-12 h-12' : 'px-8 text-[10px]'}`}>
            {isMobile ? <Send size={18} className="text-[#000080]" /> : 'GÖNDER'}
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;
