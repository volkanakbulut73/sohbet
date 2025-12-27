
import React, { useState, useEffect, useRef } from 'react';
import LandingPage from './components/LandingPage';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/AdminDashboard';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import { useChatCore } from './hooks/useChatCore';
import { storageService } from './services/storageService';
import { ChatModuleProps } from './types';
import { CHAT_MODULE_CONFIG } from './config';
import { 
  X, Send, LogOut, UserPlus, Key,
  Smile, Bold, Italic, Underline, Settings, 
  MessageCircleOff, MessageCircle, Music, Volume2, 
  Loader2, Sparkles, WifiOff
} from 'lucide-react';

const App: React.FC<ChatModuleProps> = () => {
  const [view, setView] = useState<'landing' | 'register' | 'login' | 'chat' | 'admin' | 'pending'>('landing');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [inputText, setInputText] = useState('');
  
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [hasAiKey, setHasAiKey] = useState(true);
  const [dbConnected, setDbConnected] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    userName, setUserName, activeTab, setActiveTab, openTabs, closeTab,
    messages, sendMessage, initiatePrivateChat, onlineUsers,
    blockedUsers, allowPrivateMessages, setAllowPrivateMessages,
    isOnline
  } = useChatCore('');

  // Mobil Viewport Optimizasyonu (Klavye açıldığında inputun görünür kalması için)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (containerRef.current && window.visualViewport) {
        containerRef.current.style.height = `${window.visualViewport.height}px`;
      }
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    handleResize();
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  // AI Durum ve Bağlantı Kontrolü
  useEffect(() => {
    const checkStatus = async () => {
      if (!navigator.onLine) {
        setDbConnected(false);
        return;
      }

      const aistudio = (window as any).aistudio;
      if (aistudio) {
        try {
          const selected = await aistudio.hasSelectedApiKey();
          setHasAiKey(selected);
        } catch {
          setHasAiKey(false);
        }
      } else {
        const key = process.env.API_KEY;
        setHasAiKey(!!key && key !== "undefined" && key.length > 5);
      }
      setDbConnected(storageService.isConfigured());
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const handleAiConnect = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        setHasAiKey(true);
      } catch (e) {
        console.error("AI Key Selection Failed:", e);
      }
    }
  };

  const handleLogout = async () => {
    if (!confirm('Güvenli çıkış yapılsın mı?')) return;
    setIsCleaningUp(true);
    try {
      await storageService.deleteAllPrivateMessagesForUser(userName);
      localStorage.removeItem('mirc_nick');
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      window.location.reload();
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    let formattedText = inputText;
    if (isBold) formattedText = `<b>${formattedText}</b>`;
    if (isItalic) formattedText = `<i>${formattedText}</i>`;
    if (isUnderline) formattedText = `<u>${formattedText}</u>`;

    sendMessage(formattedText);
    setInputText('');
    setShowEmojiPicker(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isCleaningUp) {
    return (
      <div className="fixed inset-0 bg-[#0b0f14] z-[5000] flex flex-col items-center justify-center font-mono">
        <Loader2 size={40} className="text-[#00ff99] animate-spin mb-4" />
        <p className="text-[#00ff99] text-[9px] font-black uppercase tracking-[0.3em]">Oturum Kapatılıyor...</p>
      </div>
    );
  }

  if (view === 'landing') return <LandingPage onEnter={() => setView('login')} onRegisterClick={() => setView('register')} />;
  if (view === 'register') return <RegistrationForm onClose={() => setView('login')} onSuccess={() => setView('pending')} />;
  if (view === 'login') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0f14] fixed inset-0 z-[2000] p-4">
        <div className="w-full max-w-[320px] bg-[#d4dce8] border-2 border-white shadow-[8px_8px_0px_rgba(0,0,0,0.5)]">
          <div className="bg-[#000080] text-white px-3 py-1.5 text-[10px] font-black flex justify-between items-center">
            <span className="flex items-center gap-2 uppercase tracking-widest"><Key size={12} /> Authentication</span>
            <X size={16} className="cursor-pointer" onClick={() => setView('landing')} />
          </div>
          <div className="p-6 space-y-4">
            <form onSubmit={async (e) => { e.preventDefault(); setIsLoggingIn(true); try { const user = await storageService.loginUser(loginForm.email, loginForm.password); if (user && user.status === 'approved') { setUserName(user.nickname); setView('chat'); } else if (user?.status === 'pending') { setView('pending'); } else { alert('Hatalı giriş veya onay bekleyen hesap.'); } } catch(e:any) { alert(e.message); } finally { setIsLoggingIn(false); } }} className="space-y-3">
              <input type="email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-2 border border-gray-400 text-xs outline-none focus:border-[#000080]" placeholder="E-posta" />
              <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-2 border border-gray-400 text-xs outline-none focus:border-[#000080]" placeholder="Şifre" />
              <button disabled={isLoggingIn} className="w-full bg-[#000080] text-white py-2.5 font-bold uppercase text-[10px] shadow-md">{isLoggingIn ? 'Veriler Doğrulanıyor...' : 'Sisteme Bağlan'}</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col bg-[#d4dce8] w-full border-2 border-white shadow-2xl overflow-hidden font-mono fixed inset-0 z-[1000] mirc-window">
      <header className="h-10 bg-[#000080] text-white flex items-center px-3 shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 ${hasAiKey ? 'bg-[#00ff99]' : 'bg-red-500'} rounded-full animate-pulse shadow-[0_0_5px_#00ff99]`}></div>
            <span className="text-[8px] font-black tracking-widest uppercase">AI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 ${dbConnected ? 'bg-[#00ff99]' : 'bg-red-500'} rounded-full`}></div>
            <span className="text-[8px] font-black tracking-widest uppercase">SUPABASE</span>
          </div>
          <div className="h-4 w-px bg-white/20 mx-1"></div>
          <div className="text-[12px] font-black italic truncate uppercase">{activeTab}</div>
        </div>
        <div className="flex items-center gap-2">
          {!isOnline && <WifiOff size={16} className="text-red-400 animate-bounce" />}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 hover:bg-white/20 rounded"><Settings size={16} /></button>
          {isMenuOpen && (
            <div className="absolute top-8 right-2 w-48 bg-[#f0f2f5] border-2 border-[#000080] shadow-2xl z-[2000] text-black p-0.5 mirc-window">
              <button onClick={() => { handleAiConnect(); setIsMenuOpen(false); }} className="w-full text-left p-2 hover:bg-[#000080] hover:text-white text-[9px] font-black flex items-center gap-2 border-b border-gray-300 uppercase"><Sparkles size={14} /> AI Ayarları</button>
              <button onClick={handleLogout} className="w-full text-left p-2 hover:bg-red-600 hover:text-white text-[9px] font-black flex items-center gap-2 uppercase"><LogOut size={14} /> Çıkış</button>
            </div>
          )}
        </div>
      </header>

      <nav className="bg-[#000080]/90 px-1 py-0.5 flex gap-0.5 overflow-x-auto no-scrollbar border-b border-white/20">
        {openTabs.map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-3 py-1.5 text-[9px] font-black uppercase whitespace-nowrap border-t-2 border-x-2 transition-colors ${activeTab === tab ? 'bg-[#d4dce8] text-[#000080] border-white' : 'text-white/40 border-transparent hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </nav>
      
      <div className="flex-1 flex overflow-hidden bg-white border-2 border-gray-400 m-1 mirc-inset relative">
        <main className="flex-1 relative flex flex-col overflow-hidden bg-[#f5f5f5]">
          <MessageList messages={messages} currentUser={userName} blockedUsers={blockedUsers} onNickClick={(e, n) => initiatePrivateChat(n)} />
        </main>
        <aside className={`${isMobile ? 'w-[90px]' : 'w-48'} bg-[#d4dce8] border-l-2 border-white shrink-0 overflow-hidden`}>
          <UserList users={onlineUsers} currentUser={userName} onClose={() => {}} onUserClick={(nick) => initiatePrivateChat(nick)} />
        </aside>
      </div>

      <footer className="bg-[#d4dce8] border-t-2 border-white p-2 shrink-0">
        <div className="flex flex-col gap-1 w-full max-w-4xl mx-auto">
          <div className="flex items-center gap-1 mb-0.5">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1 hover:bg-white rounded"><Smile size={18} className="text-yellow-600" /></button>
            <div className="h-4 w-px bg-gray-400 mx-0.5"></div>
            <button onClick={() => setIsBold(!isBold)} className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${isBold ? 'bg-[#000080] text-white border-[#000080]' : 'hover:bg-white text-gray-600 border-transparent'}`}>B</button>
            <button onClick={() => setIsItalic(!isItalic)} className={`px-1.5 py-0.5 rounded text-[10px] italic font-black border ${isItalic ? 'bg-[#000080] text-white border-[#000080]' : 'hover:bg-white text-gray-600 border-transparent'}`}>I</button>
          </div>
          <form onSubmit={handleSend} className="flex gap-1">
            <div className="flex-1 bg-white border-2 border-gray-500 px-2 flex items-center py-0.5 focus-within:border-[#000080] shadow-inner">
              <span className="text-[#000080] font-black text-[10px] mr-2 shrink-0 uppercase">{userName}:</span>
              <textarea 
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 outline-none text-xs bg-transparent resize-none h-5 pt-0.5 font-medium no-scrollbar"
                style={{ fontWeight: isBold ? 'bold' : 'normal', fontStyle: isItalic ? 'italic' : 'normal', textDecoration: isUnderline ? 'underline' : 'none' }}
                placeholder={`${activeTab} odaya yaz...`}
                autoComplete="off"
              />
            </div>
            <button type="submit" className="bg-[#000080] text-white px-5 font-black uppercase text-[10px] shadow-[3px_3px_0px_gray] active:shadow-none active:translate-y-0.5 transition-all">OK</button>
          </form>
        </div>
      </footer>
    </div>
  );
};

export default App;
