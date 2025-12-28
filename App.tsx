
import React, { useState, useEffect, useRef } from 'react';
import LandingPage from './components/LandingPage';
import RegistrationForm from './components/RegistrationForm';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import EmojiPicker from './components/EmojiPicker';
import ColorPicker from './components/ColorPicker';
import { useChatCore } from './hooks/useChatCore';
import { storageService } from './services/storageService';
import { ChatModuleProps } from './types';
import { 
  X, LogOut, Key,
  Smile, Settings, 
  Loader2, WifiOff,
  Radio,
  Palette,
  Cpu,
  ExternalLink,
  Clock,
  Zap,
  ZapOff
} from 'lucide-react';

const GOOGLE_CLIENT_ID = "567190649892-qtn4q7lufvacdpmfbooamtcc4i92nnmv.apps.googleusercontent.com";

const App: React.FC<ChatModuleProps> = () => {
  const [view, setView] = useState<'landing' | 'register' | 'login' | 'chat' | 'pending'>('landing');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [inputText, setInputText] = useState('');
  
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);
  const [radioActive, setRadioActive] = useState(false);
  
  // AI Key Durumu
  const [hasAiKey, setHasAiKey] = useState(false);
  const [showAiOverlay, setShowAiOverlay] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    userName, setUserName, activeTab, setActiveTab, openTabs, unreadTabs,
    messages, sendMessage, initiatePrivateChat, onlineUsers,
    blockedUsers, toggleBlock, closeTab, isOnline,
    allowPrivateMessages, setAllowPrivateMessages
  } = useChatCore('');

  const checkKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
      const selected = await aistudio.hasSelectedApiKey();
      setHasAiKey(selected);
      if (selected) setShowAiOverlay(false);
    } else {
      const envKey = !!process.env.API_KEY;
      setHasAiKey(envKey);
      if (envKey) setShowAiOverlay(false);
    }
  };

  useEffect(() => {
    checkKey();
    const interval = setInterval(checkKey, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
      checkKey();
    }
  };

  const handleGoogleResponse = async (response: any) => {
    setIsLoggingIn(true);
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const { data, error } = await (storageService as any).supabase
        .from('registrations').select('*').eq('email', payload.email).maybeSingle();
      if (data?.status === 'approved') {
        setUserName(data.nickname);
        setView('chat');
      } else if (data?.status === 'pending') setView('pending');
      else alert('Kayıt bulunamadı veya onaylanmadı.');
    } catch (err) { alert('Hata oluştu.'); }
    finally { setIsLoggingIn(false); }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    let formattedText = inputText;
    if (isBold) formattedText = `<b>${formattedText}</b>`;
    if (isItalic) formattedText = `<i>${formattedText}</i>`;
    if (selectedColor) formattedText = `<span style="color: ${selectedColor}">${formattedText}</span>`;
    sendMessage(formattedText);
    setInputText('');
    setShowEmojiPicker(false);
    setShowColorPicker(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (view === 'landing') return <LandingPage onEnter={() => setView('login')} onRegisterClick={() => setView('register')} />;
  if (view === 'register') return <RegistrationForm onClose={() => setView('login')} onSuccess={() => setView('pending')} />;
  
  if (view === 'login') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0f14] fixed inset-0 z-[2000] p-4">
        <div className="w-full max-w-[320px] bg-[#d4dce8] border-2 border-white shadow-[8px_8px_0px_rgba(0,0,0,0.5)]">
          <div className="bg-[#000080] text-white px-3 py-1.5 text-[10px] font-black flex justify-between items-center">
            <span className="flex items-center gap-2 uppercase tracking-tighter"><Key size={12} /> Workigom Login</span>
            <X size={16} className="cursor-pointer" onClick={() => setView('landing')} />
          </div>
          <div className="p-6 space-y-4">
            <form onSubmit={async (e) => { e.preventDefault(); setIsLoggingIn(true); try { const user = await storageService.loginUser(loginForm.email, loginForm.password); if (user?.status === 'approved') { setUserName(user.nickname); setView('chat'); } else if (user?.status === 'pending') setView('pending'); else alert('Hatalı giriş.'); } catch { alert('Hata!'); } finally { setIsLoggingIn(false); } }} className="space-y-3">
              <input type="email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-2 border border-gray-400 text-xs outline-none focus:border-[#000080]" placeholder="E-posta" />
              <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-2 border border-gray-400 text-xs outline-none focus:border-[#000080]" placeholder="Şifre" />
              <button disabled={isLoggingIn} className="w-full bg-[#000080] text-white py-2.5 font-bold uppercase text-[10px]">{isLoggingIn ? 'Bağlanıyor...' : 'Giriş Yap'}</button>
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
          <div className={`w-2.5 h-2.5 ${dbConnected ? 'bg-[#00ff99]' : 'bg-red-500'} rounded-full`}></div>
          <span className="text-[12px] font-black italic truncate uppercase">{activeTab}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { if (!hasAiKey) setShowAiOverlay(true); else handleOpenKey(); }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-[8px] font-black border ${hasAiKey ? 'bg-green-600/30 border-green-500 text-green-400' : 'bg-gray-700/50 border-gray-500 text-gray-400'}`}
          >
            {hasAiKey ? <Zap size={12} fill="currentColor" /> : <ZapOff size={12} />}
            AI {hasAiKey ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 hover:bg-white/20 rounded transition-colors"><Settings size={18} /></button>
        </div>
      </header>

      <nav className="bg-[#000080]/90 px-1 py-0.5 flex gap-0.5 overflow-x-auto no-scrollbar border-b border-white/20">
        {openTabs.map(tab => (
          <div key={tab} className={`flex items-center border-t-2 border-x-2 ${activeTab === tab ? 'bg-[#d4dce8] border-white' : 'border-transparent'}`}>
            <button onClick={() => setActiveTab(tab)} className={`pl-3 pr-1 py-1.5 text-[9px] font-black uppercase whitespace-nowrap ${activeTab === tab ? 'text-[#000080]' : 'text-white/60 hover:text-white'}`}>
              {tab}
            </button>
            <button onClick={(e) => { e.stopPropagation(); closeTab(tab); }} className="p-1 text-red-700 hover:bg-black/10"><X size={10} /></button>
          </div>
        ))}
      </nav>
      
      <div className="flex-1 flex overflow-hidden bg-white border-2 border-gray-400 m-1 relative mirc-inset">
        {/* Kapatılabilir AI Aktivasyon Kartı */}
        {!hasAiKey && showAiOverlay && (
          <div className="absolute inset-0 z-[500] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="w-full max-w-[340px] bg-[#d4dce8] border-2 border-white shadow-2xl mirc-window">
              <div className="bg-[#000080] text-white px-3 py-1.5 text-[10px] font-black flex justify-between items-center">
                <span className="flex items-center gap-2 uppercase tracking-tighter"><Cpu size={12} /> AI AKTİVASYONU GEREKLİ</span>
                <X size={16} className="cursor-pointer hover:bg-red-600" onClick={() => setShowAiOverlay(false)} />
              </div>
              <div className="p-6 space-y-4">
                <p className="text-[10px] text-gray-700 font-bold leading-relaxed uppercase">
                  Lara ve Gemini operatör botlarının çalışabilmesi için bir API projesi seçmelisiniz. Google AI Studio ile tamamen ücretsizdir.
                </p>
                <button onClick={handleOpenKey} className="w-full bg-purple-600 text-white py-3 text-[10px] font-black uppercase shadow-lg">BİR PROJE SEÇ</button>
                <button onClick={() => setShowAiOverlay(false)} className="w-full border-2 border-gray-400 text-gray-600 py-2 text-[10px] font-black uppercase">AI OLMADAN DEVAM ET</button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 relative flex flex-col overflow-hidden bg-[#f0f0f0]">
          <MessageList messages={messages} currentUser={userName} blockedUsers={blockedUsers} onNickClick={(e, n) => initiatePrivateChat(n)} />
        </main>
        {!isMobile && (
          <aside className="w-44 bg-[#d4dce8] border-l-2 border-white shrink-0 overflow-hidden">
            <UserList users={onlineUsers} currentUser={userName} onClose={() => {}} onUserClick={(nick) => initiatePrivateChat(nick)} />
          </aside>
        )}
      </div>

      <footer className="bg-[#d4dce8] border-t-2 border-white p-2 shrink-0">
        <div className="flex flex-col gap-1 w-full max-w-4xl mx-auto">
          {showColorPicker && <ColorPicker selectedColor={selectedColor} onSelect={(c) => setSelectedColor(c)} />}
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 hover:bg-white rounded"><Smile size={20} className="text-yellow-600" /></button>
            <button onClick={() => setShowColorPicker(!showColorPicker)} className="p-1.5 hover:bg-white rounded"><Palette size={20} style={{ color: selectedColor || '#000080' }} /></button>
            {showEmojiPicker && <div className="absolute bottom-12 z-[3000]"><EmojiPicker onSelect={(emoji) => setInputText(p => p + emoji)} onClose={() => setShowEmojiPicker(false)} /></div>}
          </div>
          <form onSubmit={handleSend} className="flex gap-2">
            <div className="flex-1 bg-white border-2 border-gray-500 px-3 flex items-center py-1.5">
              <span className="text-[#000080] font-black text-[10px] mr-2 uppercase">{userName}:</span>
              <textarea ref={inputRef} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} className="flex-1 outline-none text-sm bg-transparent resize-none h-6 font-medium" placeholder="Mesaj yaz..." />
            </div>
            <button type="submit" className="bg-[#000080] text-white px-5 font-black uppercase text-[10px]">GÖNDER</button>
          </form>
        </div>
      </footer>
    </div>
  );
};

export default App;
