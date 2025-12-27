
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
  
  const lastProcessedErrorId = useRef<string | null>(null);
  
  const { 
    userName, setUserName, activeTab, setActiveTab, openTabs, closeTab,
    messages, sendMessage, initiatePrivateChat, onlineUsers,
    blockedUsers, allowPrivateMessages, setAllowPrivateMessages,
    isOnline
  } = useChatCore('');

  // AI Hatalarını Yakala ve Kullanıcıyı Bilgilendir
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === CHAT_MODULE_CONFIG.BOT_NAME) {
      if (lastMessage.text.includes("HATA:") || lastMessage.text.includes("found")) {
        if (lastProcessedErrorId.current !== lastMessage.id) {
          lastProcessedErrorId.current = lastMessage.id;
          setHasAiKey(false);
        }
      }
    }
  }, [messages]);

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
        } catch (e) {
          setHasAiKey(false);
        }
      } else {
        const key = process.env.API_KEY;
        setHasAiKey(!!key && key !== "undefined" && key.length > 5);
      }
      setDbConnected(storageService.isConfigured());
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const handleAiConnect = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        setHasAiKey(true);
      } catch (e) {
        console.error("AI Key selection error:", e);
      }
    }
  };

  const handleLogout = async () => {
    if (!confirm('Güvenli çıkış yapılsın mı?')) return;
    setIsCleaningUp(true);
    try {
      await storageService.deleteAllPrivateMessagesForUser(userName);
      localStorage.removeItem('mirc_nick');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
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
    setTimeout(() => inputRef.current?.focus(), 0);
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
        <Loader2 size={48} className="text-[#00ff99] animate-spin mb-4" />
        <p className="text-[#00ff99] text-[10px] font-black uppercase tracking-widest italic">Güvenli Çıkış Yapılıyor...</p>
      </div>
    );
  }

  if (view === 'landing') return <LandingPage onEnter={() => setView('login')} onRegisterClick={() => setView('register')} />;
  if (view === 'register') return <RegistrationForm onClose={() => setView('login')} onSuccess={() => setView('pending')} />;
  if (view === 'pending') {
    return (
      <div className="fixed inset-0 bg-[#0b0f14] flex items-center justify-center p-4 z-[3000]">
        <div className="bg-[#d4dce8] border-2 border-white shadow-[10px_10px_0px_gray] p-8 max-w-sm text-center">
          <Loader2 className="mx-auto text-[#000080] animate-spin mb-4" size={48} />
          <h2 className="text-[#000080] font-black uppercase mb-2">Başvurunuz İnceleniyor</h2>
          <p className="text-xs text-gray-700 mb-6">Belgeleriniz moderatör onayı bekliyor. Onaylandığında sisteme giriş yapabilirsiniz.</p>
          <button onClick={() => setView('landing')} className="w-full bg-[#000080] text-white py-3 text-xs font-bold uppercase">Ana Sayfaya Dön</button>
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0f14] fixed inset-0 z-[2000] p-4">
        <div className="w-full max-w-[340px] bg-[#d4dce8] border-2 border-white shadow-[10px_10px_0px_0px_rgba(0,0,0,0.5)]">
          <div className="bg-[#000080] text-white px-3 py-2 text-xs font-black flex justify-between items-center">
            <span className="flex items-center gap-2"><Key size={14} /> Güvenli Giriş</span>
            <X size={18} className="cursor-pointer" onClick={() => setView('landing')} />
          </div>
          <div className="p-8 space-y-4">
            <form onSubmit={async (e) => { e.preventDefault(); setIsLoggingIn(true); try { const user = await storageService.loginUser(loginForm.email, loginForm.password); if (user && user.status === 'approved') { setUserName(user.nickname); setView('chat'); } else if (user?.status === 'pending') { setView('pending'); } else { alert('Hatalı giriş veya onaylanmamış hesap.'); } } catch(e:any) { alert(e.message); } finally { setIsLoggingIn(false); } }} className="space-y-3">
              <input type="email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-2 border border-gray-400 text-sm outline-none focus:border-[#000080]" placeholder="E-posta" />
              <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-2 border border-gray-400 text-sm outline-none focus:border-[#000080]" placeholder="Şifre" />
              <button disabled={isLoggingIn} className="w-full bg-[#000080] text-white py-3 font-bold uppercase text-xs shadow-md active:translate-y-0.5">{isLoggingIn ? 'Bağlanıyor...' : 'Oturum Aç'}</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col bg-[#d4dce8] w-full border-2 border-white shadow-2xl overflow-hidden font-mono fixed inset-0 z-[1000]">
      <header className="h-12 bg-[#000080] text-white flex items-center px-4 shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${hasAiKey ? 'bg-[#00ff99]' : 'bg-red-500'} rounded-full animate-pulse`}></div>
            <span className="text-[9px] font-black tracking-widest uppercase">AI</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${dbConnected ? 'bg-[#00ff99]' : 'bg-red-500'} rounded-full`}></div>
            <span className="text-[9px] font-black tracking-widest uppercase">DB</span>
          </div>
          <div className="h-4 w-px bg-white/20 mx-2"></div>
          <div className="text-[13px] font-black italic truncate uppercase">{activeTab}</div>
        </div>
        <div className="flex items-center gap-3">
          {!isOnline && <WifiOff size={18} className="text-red-400 animate-pulse" />}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 hover:bg-white/20 rounded"><Settings size={18} /></button>
          {isMenuOpen && (
            <div className="absolute top-10 right-2 w-56 bg-[#f0f2f5] border-2 border-[#000080] shadow-2xl z-[2000] text-black p-1">
              <button onClick={() => { handleAiConnect(); setIsMenuOpen(false); }} className="w-full text-left p-3 hover:bg-[#000080] hover:text-white text-[11px] font-black flex items-center gap-3 border-b border-gray-300"><Sparkles size={16} /> AI AYARLARI</button>
              <button onClick={handleLogout} className="w-full text-left p-3 hover:bg-red-600 hover:text-white text-[11px] font-black flex items-center gap-3"><LogOut size={16} /> ÇIKIŞ YAP</button>
            </div>
          )}
        </div>
      </header>

      <nav className="bg-[#000080]/90 px-1 py-0.5 flex gap-0.5 overflow-x-auto no-scrollbar border-b border-white/20">
        {openTabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 text-[10px] font-black uppercase whitespace-nowrap border-t-2 border-x-2 ${activeTab === tab ? 'bg-[#d4dce8] text-[#000080] border-white' : 'text-white/40 border-transparent'}`}>{tab}</button>
        ))}
      </nav>
      
      <div className="flex-1 flex overflow-hidden bg-white border-2 border-gray-400 m-1 mirc-inset relative">
        <main className="flex-1 relative flex flex-col overflow-hidden bg-[#f0f0f0]">
          <MessageList messages={messages} currentUser={userName} blockedUsers={blockedUsers} onNickClick={(e, n) => initiatePrivateChat(n)} />
        </main>
        <aside className={`${isMobile ? 'w-[100px]' : 'w-52'} bg-[#d4dce8] border-l-2 border-white shrink-0 overflow-hidden`}>
          <UserList users={onlineUsers} currentUser={userName} onClose={() => {}} onUserClick={(nick) => initiatePrivateChat(nick)} />
        </aside>
      </div>

      <footer className="bg-[#d4dce8] border-t-2 border-white p-2 shrink-0">
        <div className="flex flex-col gap-1 w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1 hover:bg-white rounded"><Smile size={20} className="text-yellow-600" /></button>
            <div className="h-4 w-px bg-gray-400 mx-1"></div>
            <button onClick={() => setIsBold(!isBold)} className={`px-2 py-0.5 rounded text-xs font-black ${isBold ? 'bg-[#000080] text-white' : 'hover:bg-white text-gray-600'}`}>B</button>
            <button onClick={() => setIsItalic(!isItalic)} className={`px-2 py-0.5 rounded text-xs italic font-black ${isItalic ? 'bg-[#000080] text-white' : 'hover:bg-white text-gray-600'}`}>I</button>
            <button onClick={() => setIsUnderline(!isUnderline)} className={`px-2 py-0.5 rounded text-xs underline font-black ${isUnderline ? 'bg-[#000080] text-white' : 'hover:bg-white text-gray-600'}`}>U</button>
          </div>
          <form onSubmit={handleSend} className="flex gap-1">
            <div className="flex-1 bg-white border-2 border-gray-500 px-3 flex items-center py-1 focus-within:border-[#000080] shadow-inner">
              <span className="text-[#000080] font-black text-xs mr-2 shrink-0">{userName}:</span>
              <textarea 
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 outline-none text-sm bg-transparent resize-none h-6 pt-0.5 font-medium"
                style={{ fontWeight: isBold ? 'bold' : 'normal', fontStyle: isItalic ? 'italic' : 'normal', textDecoration: isUnderline ? 'underline' : 'none' }}
                placeholder={`${activeTab} odasına yaz...`}
                autoComplete="off"
              />
            </div>
            <button type="submit" className="bg-[#000080] text-white px-8 font-black uppercase text-xs shadow-[4px_4px_0px_gray] active:shadow-none active:translate-y-1 transition-all">GÖNDER</button>
          </form>
        </div>
      </footer>
    </div>
  );
};

export default App;
