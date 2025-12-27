
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
  X, Hash, Send, LogOut, UserPlus, Key,
  Smile, Bold, Italic, Underline, Settings, 
  MessageCircleOff, MessageCircle, Music, Volume2, 
  Loader2, Sparkles
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
    userName, setUserName, activeTab, setActiveTab, openTabs, closeTab, unreadTabs,
    messages, sendMessage, initiatePrivateChat, onlineUsers,
    blockedUsers, toggleBlock, allowPrivateMessages, setAllowPrivateMessages
  } = useChatCore('');

  // AI Hata Yakalama ve Otomatik Seçici (Döngü Engellemeli)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === CHAT_MODULE_CONFIG.BOT_NAME) {
      if (lastMessage.text.includes("Requested entity was not found")) {
        // Döngüyü engellemek için sadece yeni bir hata mesajı geldiğinde tetikle
        if (lastProcessedErrorId.current !== lastMessage.id) {
          lastProcessedErrorId.current = lastMessage.id;
          console.warn("AI Key error detected. Prompting key selection dialog...");
          const aistudio = (window as any).aistudio;
          if (aistudio) {
            aistudio.openSelectKey().then(() => {
              setHasAiKey(true);
            });
          }
        }
      }
    }
  }, [messages]);

  useEffect(() => {
    const checkStatus = async () => {
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
  }, []);

  useEffect(() => {
    const handleViewport = () => {
      setIsMobile(window.innerWidth < 1024);
      if (containerRef.current && window.visualViewport) {
        containerRef.current.style.height = `${window.visualViewport.height}px`;
      }
    };
    window.visualViewport?.addEventListener('resize', handleViewport);
    handleViewport();
    return () => window.visualViewport?.removeEventListener('resize', handleViewport);
  }, []);

  const handleAiConnect = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        setHasAiKey(true);
      } catch (e) {
        console.error("Key selection failed:", e);
      }
    }
  };

  const handleLogout = async () => {
    if (!confirm('Güvenli çıkış yapmak ve tüm özel mesaj geçmişinizi kalıcı olarak silmek istiyor musunuz?')) return;
    
    setIsCleaningUp(true);
    try {
      await storageService.deleteAllPrivateMessagesForUser(userName);
      localStorage.removeItem('mirc_nick');
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      console.error("Logout error:", e);
      window.location.reload();
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    let formattedText = inputText.replace(/\n/g, '<br/>');
    if (isBold) formattedText = `<b>${formattedText}</b>`;
    if (isItalic) formattedText = `<i>${formattedText}</i>`;
    if (isUnderline) formattedText = `<u>${formattedText}</u>`;

    sendMessage(formattedText);
    setInputText('');
    setShowEmojiPicker(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const addEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const emojis = ['😊', '😂', '🤣', '❤️', '😍', '🥰', '😘', '😋', '😎', '😉', '😜', '🤩', '🥳', '😭', '😡', '😱', '👍', '👎', '👏', '🙌', '🔥', '✨', '⚡', '🎉', '🎈', '🌹', '🌸', '💔', '☕', '🍺', '🍔', '🍕', '🚀', '🐱', '🐶', '🦄', '🌈', '⭐', '🌙', '☀️', '☁️', '❄️', '⚽', '🎮', '🎧', '📸', '📱', '💻', '👋', '🙏', '💯', '🤔', '🙄', '🤫', '🤡', '👽', '👻', '💀', '💩', '🤝', '👀', '💪', '🧠', '💼', '📍', '⏰', '🎁', '💎', '💡', '🔔', '✅', '❌', '⚠️', '🛡️', '🌍', '🏳️‍🌈', '🇹🇷', '🔥', '🌊', '💨'];

  if (isCleaningUp) {
    return (
      <div className="fixed inset-0 bg-[#0b0f14] z-[5000] flex flex-col items-center justify-center font-mono text-center px-6">
        <Loader2 size={64} className="text-[#00ff99] animate-spin mb-6" />
        <div className="space-y-4">
          <p className="text-white font-black uppercase italic tracking-[0.4em] animate-pulse">Gizlilik Protokolü v2.9</p>
          <div className="bg-white/5 p-4 border border-[#00ff99]/20 rounded mirc-inset">
             <p className="text-[#00ff99] text-[10px] font-bold uppercase tracking-widest leading-relaxed">
               Gizlilik protokolleri gereği veriler siliniyor ve oturum sonlandırılıyor...
             </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'landing') return <LandingPage onEnter={() => setView('login')} onRegisterClick={() => setView('register')} onAdminClick={() => { const pass = prompt('Admin Şifresi:'); if (pass === 'admin123') setView('admin'); }} />;
  if (view === 'register') return <RegistrationForm onClose={() => setView('login')} onSuccess={() => setView('pending')} />;
  if (view === 'pending') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0f14] fixed inset-0 z-[3000] p-4 font-mono">
        <div className="w-full max-w-md bg-[#d4dce8] border-2 border-white shadow-[20px_20px_0px_rgba(0,0,0,0.5)]">
           <div className="bg-[#000080] text-white px-3 py-1.5 text-xs font-black flex justify-between items-center">
             <span>SYSTEM MESSAGE</span>
             <X size={16} className="cursor-pointer" onClick={() => setView('landing')} />
           </div>
           <div className="p-8 text-center space-y-6">
              <div className="flex justify-center"><div className="bg-white p-4 rounded-full border-2 border-[#000080] animate-pulse"><Loader2 size={48} className="text-[#000080]" /></div></div>
              <h2 className="text-xl font-black text-[#000080] uppercase italic">BAŞVURUNUZ ALINDI</h2>
              <p className="text-xs text-gray-700 font-bold">Güvenlik kontrolü sonrası onaylanacaktır.</p>
              <button onClick={() => setView('landing')} className="w-full bg-[#000080] text-white py-3 font-black text-xs uppercase shadow-md">ANA SAYFAYA DÖN</button>
           </div>
        </div>
      </div>
    );
  }
  if (view === 'admin') return <AdminDashboard onLogout={() => setView('landing')} />;
  if (view === 'login') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0f14]/95 fixed inset-0 z-[2000] p-4">
        <div className="w-full max-w-[360px] bg-[#d4dce8] border-2 border-white shadow-[10px_10px_0px_0px_rgba(0,0,0,0.5)]">
          <div className="bg-[#000080] text-white px-3 py-2 text-xs font-black flex justify-between items-center"><span><Key size={14} className="inline mr-2" /> Güvenli Giriş</span><X size={18} className="cursor-pointer" onClick={() => setView('landing')} /></div>
          <div className="p-8 space-y-4">
            <form onSubmit={async (e) => { e.preventDefault(); setIsLoggingIn(true); const user = await storageService.loginUser(loginForm.email, loginForm.password); if (user && user.status === 'approved') { setUserName(user.nickname); setView('chat'); } else if (user && user.status === 'pending') { setView('pending'); } else { alert('Hatalı giriş veya onaylanmamış hesap.'); } setIsLoggingIn(false); }} className="space-y-3">
              <input type="email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-2 border border-gray-400 text-sm outline-none focus:border-[#000080]" placeholder="E-posta" />
              <input type="password" required autoComplete="current-password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-2 border border-gray-400 text-sm outline-none focus:border-[#000080]" placeholder="Şifre" />
              <button disabled={isLoggingIn} className="w-full bg-[#000080] text-white py-3 font-bold uppercase text-xs shadow-md active:translate-y-0.5">{isLoggingIn ? 'Bağlanıyor...' : 'Giriş'}</button>
            </form>
            <div className="pt-4 border-t border-gray-400 text-center"><button onClick={() => setView('register')} className="text-[#000080] text-xs font-black uppercase hover:underline flex items-center justify-center gap-2 mx-auto"><UserPlus size={14} /> Kayıt Başvurusu</button></div>
          </div>
        </div>
      </div>
    );
  }

  const isBotRoom = activeTab === CHAT_MODULE_CONFIG.BOT_NAME;
  const filteredOnlineUsers = activeTab.startsWith('#') ? onlineUsers : onlineUsers.filter(u => u === activeTab || u === userName);

  return (
    <div ref={containerRef} className="flex flex-col bg-[#d4dce8] w-full border-2 border-white shadow-2xl overflow-hidden font-mono fixed inset-0 z-[1000]">
      <header className="h-14 bg-[#000080] text-white flex items-center px-4 shrink-0 border-b border-white/30">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3.5 h-3.5 ${hasAiKey ? 'bg-[#00ff99] shadow-[0_0_12px_#00ff99]' : 'bg-red-500 shadow-[0_0_12px_red]'} rounded-full animate-pulse`}></div>
              <span className={`text-[9px] font-black tracking-widest ${hasAiKey ? 'text-[#00ff99]' : 'text-red-400'} uppercase`}>AI</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3.5 h-3.5 ${dbConnected ? 'bg-[#00ff99] shadow-[0_0_12px_#00ff99]' : 'bg-red-500 shadow-[0_0_12px_red]'} rounded-full animate-pulse`}></div>
              <span className="text-[9px] font-black tracking-widest text-[#00ff99] uppercase">DB</span>
            </div>
          </div>
          <div className="h-7 w-px bg-white/20 mx-2"></div>
          <div className="text-[14px] font-black italic truncate uppercase">{activeTab}</div>
        </div>
        <div className="flex items-center gap-3">
          {isBotRoom && !hasAiKey && (window as any).aistudio && (
            <button onClick={handleAiConnect} className="bg-[#00ff99] text-black px-3 py-1.5 rounded-sm text-[10px] font-black shadow-lg border-2 border-white animate-bounce">ANAHTARI BAĞLA</button>
          )}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-white/20 border border-transparent rounded"><Settings size={20} /></button>
          {isMenuOpen && (
            <div className="absolute top-12 right-0 w-64 bg-[#f0f2f5] border-2 border-[#000080] shadow-2xl z-[2000] p-1 text-black">
              {(window as any).aistudio && (
                <button onClick={() => { handleAiConnect(); setIsMenuOpen(false); }} className="w-full text-left p-3 bg-yellow-100 hover:bg-[#000080] hover:text-white text-[11px] font-black flex flex-col gap-1 border-b border-gray-300">
                  <span className="flex items-center gap-3"><Sparkles size={16} /> AI YAPILANDIRMASI</span>
                  <span className="text-[8px] text-gray-500 ml-7">Anahtarınızı buradan seçin veya güncelleyin</span>
                </button>
              )}
              <button onClick={() => { const n = prompt('Yeni Nickname:'); if(n) setUserName(n); setIsMenuOpen(false); }} className="w-full text-left p-3 hover:bg-[#000080] hover:text-white text-[11px] font-black flex items-center gap-3 border-b border-gray-300"><UserPlus size={16} /> NICKNAME DEĞİŞTİR</button>
              <button onClick={() => { setAllowPrivateMessages(!allowPrivateMessages); setIsMenuOpen(false); }} className="w-full text-left p-3 hover:bg-[#000080] hover:text-white text-[11px] font-black flex items-center gap-3 border-b border-gray-300">
                {allowPrivateMessages ? <MessageCircleOff size={16}/> : <MessageCircle size={16}/>}
                ÖZEL MESAJLARI {allowPrivateMessages ? 'KAPAT' : 'AÇ'}
              </button>
              <button onClick={handleLogout} className="w-full text-left p-3 hover:bg-red-600 hover:text-white text-[11px] font-black flex items-center gap-3"><LogOut size={16} /> GÜVENLİ ÇIKIŞ</button>
            </div>
          )}
        </div>
      </header>

      <nav className="bg-[#000080]/95 px-2 py-0.5 flex gap-0.5 overflow-x-auto no-scrollbar border-b border-white/20">
        {openTabs.map(tab => (
          <div key={tab} className="relative flex items-center shrink-0">
            <button onClick={() => setActiveTab(tab)} className={`pl-4 pr-10 py-2 text-[11px] font-black uppercase whitespace-nowrap border-t-2 border-x-2 ${activeTab === tab ? 'bg-[#d4dce8] text-[#000080] border-white shadow-sm' : 'text-white/60 border-transparent'}`}>{tab}</button>
            <button onClick={(e) => { e.stopPropagation(); closeTab(tab); }} className={`absolute right-2 p-1 ${activeTab === tab ? 'text-[#000080]' : 'text-white/40'}`}><X size={12} /></button>
          </div>
        ))}
      </nav>
      
      <div className="flex-1 flex overflow-hidden bg-white border-2 border-gray-400 m-1 mirc-inset relative">
        <main className="flex-1 relative bg-[#f0f0f0] flex flex-col overflow-hidden">
          <div className="flex-1 relative bg-white"><MessageList messages={messages} currentUser={userName} blockedUsers={blockedUsers} onNickClick={(e, n) => initiatePrivateChat(n)} /></div>
        </main>
        <aside className={`${isMobile ? 'w-[100px]' : 'w-56'} bg-[#d4dce8] border-l-2 border-white shrink-0 shadow-lg z-10 overflow-hidden`}><UserList users={filteredOnlineUsers} currentUser={userName} onClose={() => {}} onUserClick={(nick) => initiatePrivateChat(nick)} /></aside>
      </div>

      {activeTab === '#radyo' && (
        <div className="h-20 bg-black border-t-2 border-white flex items-center justify-center px-4 gap-4 overflow-hidden shrink-0">
          <Music className="text-[#00ff99] animate-bounce shrink-0" size={24} />
          <div className="flex-1 max-w-lg bg-[#d4dce8] p-1 border border-gray-400 mirc-inset">
            <iframe width="100%" height="40" src="https://www.radyod.com/iframe-small" frameBorder="0" scrolling="no" className="block"></iframe>
          </div>
          <Volume2 className="text-[#00ff99] shrink-0" size={20} />
        </div>
      )}

      <footer className="bg-[#d4dce8] border-t-2 border-white p-2 shrink-0">
        <div className="flex flex-col gap-1 w-full max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-between px-2 py-1.5 bg-white/40 border border-gray-400 rounded-t-sm shadow-sm">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 hover:bg-white rounded"><Smile size={22} className="text-yellow-500" /></button>
              <div className="flex gap-1">
                <button onClick={() => setIsBold(!isBold)} className={`p-1.5 rounded ${isBold ? 'bg-[#000080] text-white' : 'hover:bg-white'}`}><Bold size={16}/></button>
                <button onClick={() => setIsItalic(!isItalic)} className={`p-1.5 rounded ${isItalic ? 'bg-[#000080] text-white' : 'hover:bg-white'}`}><Italic size={16}/></button>
                <button onClick={() => setIsUnderline(!isUnderline)} className={`p-1.5 rounded ${isUnderline ? 'bg-[#000080] text-white' : 'hover:bg-white'}`}><Underline size={16}/></button>
              </div>
            </div>
          </div>
          <form onSubmit={handleSend} className="flex gap-1 min-h-[3.5rem] items-stretch">
            <div className="flex-1 bg-white border-2 border-[#808080] shadow-inner px-4 flex items-start py-2 group focus-within:border-[#000080] overflow-hidden">
              <span className="text-[#000080] font-black text-[12px] mt-0.5 mr-3 shrink-0">{userName}:</span>
              <textarea ref={inputRef} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown} className="flex-1 outline-none text-sm bg-transparent resize-none py-0.5 self-center" style={{ fontWeight: isBold ? 'bold' : 'normal', fontStyle: isItalic ? 'italic' : 'normal', textDecoration: isUnderline ? 'underline' : 'none' }} placeholder={`[${activeTab}] odasına yaz...`} autoComplete="off" />
            </div>
            <button type="submit" className="bg-[#000080] text-white px-8 font-black uppercase shadow-[4px_4px_0px_gray] active:shadow-none active:translate-y-1"><Send size={20} /></button>
          </form>
        </div>
      </footer>
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 w-72 bg-white border-2 border-gray-400 shadow-2xl p-2 z-[3000] mirc-window">
          <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto no-scrollbar">
            {emojis.map(e => <button key={e} onClick={() => addEmoji(e)} className="text-xl hover:bg-gray-100 p-1 rounded">{e}</button>)}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
