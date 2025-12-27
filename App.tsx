
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
  Terminal, Menu, X, Users as UsersIcon, Hash, Send, LogOut, MessageSquare, Shield
} from 'lucide-react';

const App: React.FC<ChatModuleProps> = () => {
  const [view, setView] = useState<'landing' | 'register' | 'login' | 'chat' | 'admin' | 'pending'>('landing');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isChannelsOpen, setIsChannelsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    userName, setUserName, activeTab, setActiveTab, 
    messages, sendMessage, initiatePrivateChat 
  } = useChatCore('');

  // View değiştikçe body scroll kilidini yönet
  useEffect(() => {
    if (view === 'chat' || view === 'admin') {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
    }
  }, [view]);

  useEffect(() => {
    const handleViewport = () => {
      setIsMobile(window.innerWidth < 1024);
      if (containerRef.current && window.visualViewport && (view === 'chat')) {
        containerRef.current.style.height = `${window.visualViewport.height}px`;
      }
    };
    window.visualViewport?.addEventListener('resize', handleViewport);
    window.addEventListener('resize', handleViewport);
    handleViewport();
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewport);
      window.removeEventListener('resize', handleViewport);
    };
  }, [view]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const user = await storageService.loginUser(loginForm.email, loginForm.password);
      if (user) {
        if (user.status === 'pending') setView('pending');
        else {
          setUserName(user.nickname);
          localStorage.setItem('mirc_nick', user.nickname);
          setView('chat');
        }
      } else {
        const isAdmin = await storageService.adminLogin(loginForm.email, loginForm.password);
        if (isAdmin) setView('admin');
        else alert('Hatalı giriş bilgileri.');
      }
    } catch (err) { alert('Sistem hatası.'); }
    finally { setIsLoggingIn(false); }
  };

  if (view === 'landing') return <LandingPage onEnter={() => setView('register')} onAdminClick={() => setView('login')} />;
  if (view === 'register') return <RegistrationForm onClose={() => setView('landing')} onSuccess={() => setView('pending')} />;
  if (view === 'admin') return <AdminDashboard onLogout={() => setView('landing')} />;
  
  if (view === 'pending') return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0b0f14] p-10 text-center space-y-6 min-h-screen">
      <div className="w-20 h-20 bg-[#00ff99]/10 rounded-full flex items-center justify-center border border-[#00ff99]/30 animate-pulse">
        <Shield size={40} className="text-[#00ff99]" />
      </div>
      <h2 className="text-2xl font-black text-white uppercase italic">Başvurunuz İnceleniyor</h2>
      <p className="text-gray-400 text-sm max-w-md font-mono italic leading-relaxed">
        Güvenlik ekibimiz belgelerinizi doğruladıktan sonra nickname'iniz ile giriş yapabileceksiniz. Lütfen beklemede kalın.
      </p>
      <button onClick={() => setView('landing')} className="text-[#00ff99] text-xs font-black uppercase underline tracking-widest">Giriş Ekranına Dön</button>
    </div>
  );

  if (view === 'login') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0f14] p-4 min-h-screen">
        <div className="w-full max-w-[320px] bg-[#d4dce8] border-2 border-white shadow-2xl overflow-hidden mirc-window">
          <div className="bg-[#000080] text-white px-2 py-1 text-xs font-bold flex justify-between items-center">
            <span className="flex items-center gap-2"><Terminal size={14} /> Workigom v2.1 Login</span>
            <X size={14} className="cursor-pointer" onClick={() => setView('landing')} />
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-600 uppercase">E-posta / Nickname</label>
              <input type="text" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-2 border-2 border-gray-400 outline-none focus:border-[#000080] text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-600 uppercase">Şifre</label>
              <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-2 border-2 border-gray-400 outline-none focus:border-[#000080] text-sm" />
            </div>
            <button disabled={isLoggingIn} className="w-full bg-[#d4dce8] border-2 border-white py-3 font-black shadow-[3px_3px_0_gray] active:shadow-none active:translate-y-px uppercase text-xs">BAĞLAN</button>
          </form>
        </div>
      </div>
    );
  }

  // --- SOHBET MODU ---
  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col bg-[#d4dce8] w-full h-full border-2 border-white shadow-2xl overflow-hidden text-black font-mono fixed inset-0 z-[1000] ${isMobile ? '' : 'm-0'}`}
    >
      <header className={`${isMobile ? 'h-12' : 'h-9'} bg-[#000080] text-white flex items-center px-2 font-bold shrink-0`}>
        <div className="flex-1 flex gap-1 h-full items-center">
          {isMobile && (
             <button onClick={() => setIsChannelsOpen(true)} className="p-2 mr-2"><Menu size={20} /></button>
          )}
          {['#Sohbet', '#Yardim', '#Radyo'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} className={`px-4 h-[80%] uppercase transition-all flex items-center gap-2 text-[10px] ${activeTab === tab.toLowerCase() ? 'bg-[#d4dce8] text-black border-t-2 border-white' : 'hover:bg-blue-800'}`}>
              <Hash size={12} /> {tab}
            </button>
          ))}
        </div>
        {!isMobile && (
          <div className="flex gap-4 items-center opacity-70">
            <span className="flex items-center gap-1 italic text-[10px] tracking-tight"><Terminal size={12} /> workigomchat.online</span>
            <button onClick={() => window.location.reload()} title="Çıkış"><LogOut size={14} /></button>
          </div>
        )}
        {isMobile && (
           <button onClick={() => setIsUserListOpen(true)} className="p-2 ml-2"><UsersIcon size={20} /></button>
        )}
      </header>
      
      <div className="flex-1 flex overflow-hidden bg-white border-2 border-gray-400 m-1 mirc-inset relative">
        <main className="flex-1 relative min-w-0">
          <MessageList messages={messages} currentUser={userName} blockedUsers={[]} onNickClick={(e, n) => initiatePrivateChat(n)} />
        </main>
        
        {!isMobile && (
          <aside className="w-52 bg-[#d4dce8] border-l-2 border-white shrink-0 flex flex-col">
            <UserList users={[userName, 'Admin', 'GeminiBot', 'Selin', 'Caner']} currentUser={userName} onClose={() => {}} />
          </aside>
        )}

        {isMobile && isUserListOpen && (
          <div className="absolute inset-0 z-[1100] flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsUserListOpen(false)} />
            <div className="relative w-[75%] bg-[#d4dce8] h-full shadow-2xl flex flex-col border-l-2 border-white animate-in slide-in-from-right duration-200">
              <div className="p-3 bg-[#000080] text-white flex justify-between items-center shrink-0">
                <span className="font-bold text-[10px] uppercase">Kanal Üyeleri</span>
                <X onClick={() => setIsUserListOpen(false)} size={18} />
              </div>
              <UserList users={[userName, 'Admin', 'GeminiBot', 'Esra', 'Can']} currentUser={userName} onClose={() => setIsUserListOpen(false)} />
            </div>
          </div>
        )}

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
            <span className="text-[#000080] font-black mr-2 text-[11px] shrink-0">{userName}:</span>
            <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} className="flex-1 outline-none text-sm bg-transparent" placeholder="Mesajınızı yazın..." />
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
