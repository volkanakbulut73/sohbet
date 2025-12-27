
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
  Users as UsersIcon, Hash, Send
} from 'lucide-react';

type AppView = 'landing' | 'login' | 'register' | 'pending' | 'chat';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "", embedded = false }) => {
  const [view, setView] = useState<AppView>(externalUser ? 'chat' : 'landing');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showUserList, setShowUserList] = useState(false);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    userName, setUserName, activeTab, setActiveTab, 
    messages, sendMessage, initiatePrivateChat 
  } = useChatCore(externalUser || '');

  // Ekran boyutu ve yerleşim kontrolü
  useEffect(() => {
    const updateLayout = () => {
      setIsMobile(window.innerWidth < 1024);
      if (containerRef.current) {
        // Embedded modda yüksekliği 100% tut, standalone modda viewport height kullan
        if (embedded) {
          containerRef.current.style.height = '100%';
        } else {
          containerRef.current.style.height = `${window.innerHeight}px`;
        }
      }
    };
    window.addEventListener('resize', updateLayout);
    updateLayout();
    return () => window.removeEventListener('resize', updateLayout);
  }, [embedded]);

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
      } else alert('Hata: Geçersiz giriş.');
    } catch (err) { alert('Sistem hatası.'); }
    finally { setIsLoggingIn(false); }
  };

  if (view === 'landing' && !embedded) return <LandingPage onEnter={() => setView('login')} />;
  
  if (view === 'login' || (view === 'landing' && embedded)) {
    return (
      <div className="h-full w-full bg-[#d4dce8] flex items-center justify-center p-4 font-mono overflow-hidden">
        <div className="w-full max-w-[320px] bg-[#d4dce8] border-2 border-white shadow-xl">
          <div className="bg-[#000080] text-white px-2 py-1 text-[11px] font-bold flex justify-between">
            <span>Workigom Login</span>
            {!embedded && <X size={14} onClick={() => setView('landing')} />}
          </div>
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <input type="email" placeholder="E-mail" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-2 border-2 border-gray-400 outline-none" />
            <input type="password" placeholder="Şifre" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-2 border-2 border-gray-400 outline-none" />
            <button disabled={isLoggingIn} className="w-full bg-[#d4dce8] border-2 border-white py-2 font-bold shadow-md">BAŞLAT</button>
            <button type="button" onClick={() => setView('register')} className="w-full text-[#000080] text-[10px] font-bold underline uppercase">KAYIT OL</button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'register') return <RegistrationForm onClose={() => setView('login')} onSuccess={() => setView('pending')} />;
  if (view === 'pending') return <div className="h-full w-full bg-[#d4dce8] flex items-center justify-center font-mono uppercase font-bold italic">Onay Bekleniyor...</div>;

  // --- MOBİL GÖRÜNÜM ---
  if (isMobile) {
    return (
      <div ref={containerRef} className="flex flex-col bg-white overflow-hidden font-mono w-full h-full relative">
        {/* Header */}
        <div className="h-12 bg-[#000080] text-white flex items-center px-3 shrink-0 z-50">
          <button onClick={() => setIsLeftDrawerOpen(true)} className="p-2"><Menu size={20} /></button>
          <div className="flex-1 font-bold text-xs truncate ml-2 uppercase italic">{activeTab}</div>
          <button onClick={() => setShowUserList(true)} className="p-2"><UsersIcon size={20} /></button>
        </div>

        {/* Mesaj Listesi (Alan Doldurucu) */}
        <div className="flex-1 min-h-0 relative bg-white">
          <MessageList messages={messages} currentUser={userName} blockedUsers={[]} onNickClick={(e, n) => initiatePrivateChat(n)} />
          
          {/* Sağ User Drawer */}
          {showUserList && (
            <div className="absolute inset-0 z-[100] animate-in slide-in-from-right duration-200">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowUserList(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-[75%] bg-white shadow-2xl flex flex-col">
                <div className="p-4 bg-gray-100 border-b flex justify-between items-center"><span className="font-bold text-xs uppercase">Online</span><X onClick={() => setShowUserList(false)} /></div>
                <UserList users={[userName, 'Admin', 'GeminiBot']} currentUser={userName} onClose={() => setShowUserList(false)} />
              </div>
            </div>
          )}
        </div>

        {/* MESAJ YAZMA ALANI (ANA SİTENİN MENÜSÜNÜN ÜSTÜNE ÇIKARILDI) */}
        <div className="shrink-0 bg-[#d4dce8] border-t-2 border-gray-400 p-2 z-[60] shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
          <form onSubmit={handleSend} className="flex gap-1 h-11">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 bg-white border-2 border-gray-500 rounded-sm px-3 text-[16px] outline-none"
              placeholder="Mesajınızı yazın..."
              autoComplete="off"
            />
            <button type="submit" className="w-11 h-11 bg-[#000080] text-white rounded-sm flex items-center justify-center shrink-0">
              <Send size={18} />
            </button>
          </form>
          {/* DİKKAT: Ana sitenin alt menü barı burayı kapatmasın diye boşluk bırakıldı */}
          <div className="h-[75px] md:h-2 w-full"></div>
        </div>

        {/* Sol Kanal Drawer */}
        {isLeftDrawerOpen && (
          <div className="absolute inset-0 z-[200] animate-in slide-in-from-left duration-200">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsLeftDrawerOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-[75%] bg-[#d4dce8] shadow-2xl flex flex-col">
              <div className="p-4 bg-[#000080] text-white font-bold flex justify-between items-center"><span>KANALLAR</span><X onClick={() => setIsLeftDrawerOpen(false)} /></div>
              <div className="p-2 space-y-1">
                {['#Sohbet', '#Yardim'].map(c => (
                  <button key={c} onClick={() => { setActiveTab(c.toLowerCase()); setIsLeftDrawerOpen(false); }} className={`w-full text-left p-4 rounded text-xs font-bold uppercase ${activeTab === c.toLowerCase() ? 'bg-[#000080] text-white' : 'bg-white border'}`}>
                    <Hash size={14} className="inline mr-2" /> {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- DESKTOP GÖRÜNÜM ---
  return (
    <div ref={containerRef} className="flex flex-col bg-[#d4dce8] overflow-hidden font-mono w-full h-full border-2 border-white shadow-inner relative">
      <div className="h-8 bg-[#000080] text-white flex items-center px-2 text-[10px] font-bold shrink-0">
        <div className="flex-1 flex gap-1 h-full items-center">
          {['#Sohbet', '#Yardim'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} className={`px-4 h-[80%] uppercase transition-all ${activeTab === tab.toLowerCase() ? 'bg-[#d4dce8] text-black border-t border-white' : 'hover:bg-blue-800'}`}>{tab}</button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 min-h-0 flex overflow-hidden bg-white">
        <div className="flex-1 relative">
          <MessageList messages={messages} currentUser={userName} blockedUsers={[]} onNickClick={(e, n) => initiatePrivateChat(n)} />
        </div>
        <div className="w-48 bg-[#d4dce8] border-l border-gray-300 shrink-0">
          <UserList users={[userName, 'Admin', 'GeminiBot']} currentUser={userName} onClose={() => {}} />
        </div>
      </div>

      <div className="shrink-0 bg-[#d4dce8] border-t-2 border-white p-2">
        <form onSubmit={handleSend} className="flex gap-1 h-10">
          <div className="flex-1 bg-white border border-gray-400 shadow-inner px-2 flex items-center">
            <span className="text-[#000080] font-bold mr-1 text-xs truncate max-w-[80px]">{userName}:</span>
            <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} className="flex-1 outline-none text-xs" placeholder="Mesajınızı buraya girin..." />
          </div>
          <button type="submit" className="px-6 bg-[#d4dce8] border-2 border-white shadow-[1px_1px_0_gray] text-[10px] font-bold active:shadow-none active:translate-y-[1px]">GÖNDER</button>
        </form>
        {/* Masaüstünde ana site menüsü yoksa bu boşluk minimal kalır */}
        <div className="h-2 w-full"></div>
      </div>
    </div>
  );
};

export default App;
