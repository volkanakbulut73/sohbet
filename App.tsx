
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
  ShieldBan,
  MessageSquareOff,
  MessageSquare,
  AlertCircle,
  Cpu,
  ExternalLink,
  Chrome,
  Clock,
  Zap,
  ZapOff
} from 'lucide-react';

const GOOGLE_CLIENT_ID = "567190649892-qtn4q7lufvacdpmfbooamtcc4i92nnmv.apps.googleusercontent.com";

const App: React.FC<ChatModuleProps> = () => {
  const [view, setView] = useState<'landing' | 'register' | 'login' | 'chat' | 'admin' | 'pending'>('landing');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [inputText, setInputText] = useState('');
  
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
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

  // AI Key seçimini kontrol et
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
    } else {
      alert("API Anahtarı seçiciye şu an ulaşılamıyor.");
    }
  };

  // Google Login Hazırlığı
  useEffect(() => {
    if (view === 'login' && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      (window as any).google.accounts.id.renderButton(
        document.getElementById("google-login-btn"),
        { theme: "outline", size: "large", text: "continue_with", shape: "rectangular" }
      );
    }
  }, [view]);

  const handleGoogleResponse = async (response: any) => {
    setIsLoggingIn(true);
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const email = payload.email;

      const { data, error } = await (storageService as any).supabase
        .from('registrations')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        if (data.status === 'approved') {
          setUserName(data.nickname);
          setView('chat');
        } else if (data.status === 'pending') {
          setView('pending');
        } else {
          alert('Üzgünüz, başvurunuz reddedilmiş.');
        }
      } else {
        if (confirm('Sistemde bu e-posta ile onaylı bir kayıt bulunamadı. Kayıt sayfasına gitmek ister misiniz?')) {
          setView('register');
        }
      }
    } catch (err) {
      console.error("Google login error:", err);
      alert('Google ile giriş yapılırken bir hata oluştu.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    const handleUnload = () => {
      if (userName) {
        storageService.deleteAllPrivateMessagesForUser(userName);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [userName]);

  useEffect(() => {
    if (activeTab === '#radyo') {
      setRadioActive(true);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setDbConnected(storageService.isConfigured());
  }, [isOnline]);

  const handleLogout = async () => {
    if (!confirm('Güvenli çıkış yapılsın mı?')) return;
    setIsCleaningUp(true);
    try {
      await storageService.deleteAllPrivateMessagesForUser(userName);
      localStorage.removeItem('mirc_nick');
      setTimeout(() => window.location.reload(), 1000);
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
    if (selectedColor) formattedText = `<span style="color: ${selectedColor}">${formattedText}</span>`;

    sendMessage(formattedText);
    setInputText('');
    setShowEmojiPicker(false);
    setShowColorPicker(false);
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
      <div className="fixed inset-0 bg-[#0b0f14] z-[5000] flex flex-col items-center justify-center font-mono text-center px-4">
        <Loader2 size={40} className="text-[#00ff99] animate-spin mb-4" />
        <p className="text-[#00ff99] text-[10px] font-black uppercase tracking-widest">TEMİZLENİYOR...</p>
      </div>
    );
  }

  if (view === 'landing') return <LandingPage onEnter={() => setView('login')} onRegisterClick={() => setView('register')} />;
  if (view === 'register') return <RegistrationForm onClose={() => setView('login')} onSuccess={() => setView('pending')} />;
  
  if (view === 'pending') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0f14] fixed inset-0 z-[2000] p-4">
        <div className="w-full max-w-[320px] bg-[#d4dce8] border-2 border-white shadow-[8px_8px_0px_rgba(0,0,0,0.5)] p-6 text-center space-y-4">
          <Clock className="mx-auto text-[#000080]" size={48} />
          <h2 className="font-black text-xs uppercase tracking-tighter">BAŞVURUNUZ İNCELENİYOR</h2>
          <button onClick={() => setView('landing')} className="w-full bg-[#000080] text-white py-2 text-[10px] font-black uppercase">Ana Sayfaya Dön</button>
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0f14] fixed inset-0 z-[2000] p-4">
        <div className="w-full max-w-[320px] bg-[#d4dce8] border-2 border-white shadow-[8px_8px_0px_rgba(0,0,0,0.5)]">
          <div className="bg-[#000080] text-white px-3 py-1.5 text-[10px] font-black flex justify-between items-center">
            <span className="flex items-center gap-2 uppercase tracking-tighter"><Key size={12} /> Workigom Login</span>
            <X size={16} className="cursor-pointer" onClick={() => setView('landing')} />
          </div>
          <div className="p-6 space-y-4">
            <form onSubmit={async (e) => { e.preventDefault(); setIsLoggingIn(true); try { const user = await storageService.loginUser(loginForm.email, loginForm.password); if (user && user.status === 'approved') { setUserName(user.nickname); setView('chat'); } else if (user?.status === 'pending') { setView('pending'); } else { alert('Hatalı giriş.'); } } catch(e:any) { alert(e.message); } finally { setIsLoggingIn(false); } }} className="space-y-3">
              <input type="email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-2 border border-gray-400 text-xs outline-none focus:border-[#000080]" placeholder="E-posta" />
              <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-2 border border-gray-400 text-xs outline-none focus:border-[#000080]" placeholder="Şifre" />
              <button disabled={isLoggingIn} className="w-full bg-[#000080] text-white py-2.5 font-bold uppercase text-[10px] shadow-md transition-all active:scale-95">{isLoggingIn ? 'Bağlanıyor...' : 'Giriş Yap'}</button>
            </form>
            <div className="relative flex items-center py-2"><div className="flex-grow border-t border-gray-400"></div><span className="flex-shrink mx-4 text-[8px] font-black text-gray-500 uppercase italic">Veya</span><div className="flex-grow border-t border-gray-400"></div></div>
            <div id="google-login-btn" className="w-full flex justify-center"></div>
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
            <div className={`w-2.5 h-2.5 ${dbConnected ? 'bg-[#00ff99]' : 'bg-red-500'} rounded-full`}></div>
            <span className="text-[8px] font-black tracking-widest uppercase">DB</span>
          </div>
          <div className="h-4 w-px bg-white/20 mx-1"></div>
          <div className="text-[12px] font-black italic truncate uppercase">{activeTab}</div>
          {radioActive && activeTab !== '#radyo' && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-600 rounded-sm text-[8px] font-black uppercase animate-pulse ml-2 shadow-sm border border-red-400">
              <Radio size={10} className="shrink-0" />
              <span>RADYO</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { if (!hasAiKey) setShowAiOverlay(true); else handleOpenKey(); }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-[8px] font-black uppercase transition-all border ${hasAiKey ? 'bg-green-600/30 border-green-500 text-green-400' : 'bg-gray-700/50 border-gray-500 text-gray-400 opacity-50 hover:opacity-100'}`}
            title={hasAiKey ? "AI Aktif" : "AI Pasif (Tıkla ve Anahtar Seç)"}
          >
            {hasAiKey ? <Zap size={12} className="fill-current" /> : <ZapOff size={12} />}
            AI {hasAiKey ? 'ON' : 'OFF'}
          </button>
          {!isOnline && <WifiOff size={16} className="text-red-400 animate-pulse" />}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 hover:bg-white/20 rounded transition-colors" title="Ayarlar"><Settings size={18} /></button>
          {isMenuOpen && (
            <div className="absolute top-8 right-2 w-56 bg-[#f0f2f5] border-2 border-[#000080] shadow-2xl z-[2000] text-black p-1 mirc-window">
              <button 
                onClick={() => { setAllowPrivateMessages(!allowPrivateMessages); setIsMenuOpen(false); }} 
                className="w-full text-left p-2 hover:bg-[#000080] hover:text-white text-[9px] font-black flex items-center justify-between uppercase"
              >
                <span>{allowPrivateMessages ? 'Özel Mesajları Kapat' : 'Özel Mesajları Aç'}</span>
                <div className={`w-2.5 h-2.5 rounded-full ${allowPrivateMessages ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </button>
              <div className="h-px bg-gray-300 my-1"></div>
              <button onClick={() => { setShowAiOverlay(true); setIsMenuOpen(false); }} className="w-full text-left p-2 hover:bg-purple-600 hover:text-white text-[9px] font-black flex items-center gap-2 uppercase"><Cpu size={14} /> AI Ayarları</button>
              <div className="h-px bg-gray-300 my-1"></div>
              <button onClick={handleLogout} className="w-full text-left p-2 hover:bg-red-600 hover:text-white text-[9px] font-black flex items-center gap-2 uppercase"><LogOut size={14} /> Çıkış</button>
            </div>
          )}
        </div>
      </header>

      <nav className="bg-[#000080]/90 px-1 py-0.5 flex gap-0.5 overflow-x-auto no-scrollbar border-b border-white/20">
        {openTabs.map(tab => {
          const isUnread = unreadTabs.includes(tab);
          const isPrivate = !tab.startsWith('#');
          return (
            <div key={tab} className={`flex items-center transition-all border-t-2 border-x-2 ${activeTab === tab ? 'bg-[#d4dce8] border-white' : 'border-transparent'} ${isUnread && activeTab !== tab ? 'blink-red' : ''}`}>
              <button onClick={() => setActiveTab(tab)} className={`pl-3 pr-1 py-1.5 text-[9px] font-black uppercase whitespace-nowrap ${activeTab === tab ? 'text-[#000080]' : (isUnread ? 'text-white' : 'text-white/40 hover:text-white')}`}>
                {isPrivate && '👤 '}{tab}
              </button>
              <button onClick={(e) => { e.stopPropagation(); closeTab(tab); }} className={`p-1 mr-1 rounded hover:bg-black/10 ${activeTab === tab ? 'text-red-700' : (isUnread ? 'text-white' : 'text-white/20')}`}>
                <X size={10} strokeWidth={4} />
              </button>
            </div>
          );
        })}
      </nav>
      
      <div className="flex-1 flex overflow-hidden bg-white border-2 border-gray-400 m-1 mirc-inset relative">
        {/* AI Key Missing Overlay - Kapatılabilir hale getirildi */}
        {!hasAiKey && showAiOverlay && (
          <div className="absolute inset-0 z-[500] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="w-full max-w-[340px] bg-[#d4dce8] border-2 border-white shadow-2xl mirc-window animate-in zoom-in-95">
              <div className="bg-[#000080] text-white px-3 py-1.5 text-[10px] font-black flex justify-between items-center">
                <span className="flex items-center gap-2 uppercase tracking-tighter"><Cpu size={12} /> AI Aktivasyonu Gerekli</span>
                <X size={16} className="cursor-pointer hover:bg-red-600" onClick={() => setShowAiOverlay(false)} />
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-purple-700 mb-2">
                  <Cpu size={32} className="animate-pulse" />
                  <h3 className="font-black text-xs uppercase italic tracking-tighter">GEMINI AI ASİSTANLARI</h3>
                </div>
                <p className="text-[10px] text-gray-700 font-bold leading-relaxed">
                  Lara ve Gemini operatör botlarının çalışabilmesi için bir API projesi seçmelisiniz. Google AI Studio ile tamamen ücretsizdir.
                </p>
                <div className="space-y-2">
                  <button 
                    onClick={handleOpenKey}
                    className="w-full bg-purple-600 text-white py-3 text-[10px] font-black uppercase shadow-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Key size={14} /> BİR PROJE SEÇ
                  </button>
                  <button 
                    onClick={() => setShowAiOverlay(false)}
                    className="w-full border-2 border-gray-400 text-gray-600 py-2 text-[10px] font-black uppercase hover:bg-white"
                  >
                    AI OLMADAN DEVAM ET
                  </button>
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-1 text-[9px] font-black text-[#000080] hover:underline uppercase py-1">
                    Billing Bilgisi <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 relative flex flex-col overflow-hidden bg-[#f0f0f0]">
          {!activeTab.startsWith('#') && (
            <div className="bg-[#f8f9fa] border-b border-gray-200 px-4 py-1.5 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-black text-[#000080] uppercase tracking-tighter italic">>> {activeTab} ile özel görüşme</span>
              <button onClick={() => toggleBlock(activeTab)} className={`text-[8px] font-black uppercase px-2 py-1 border ${blockedUsers.includes(activeTab) ? 'bg-red-600 text-white' : 'text-red-600 border-red-200'}`}>
                {blockedUsers.includes(activeTab) ? 'ENGELİ KALDIR' : 'ENGELLE'}
              </button>
            </div>
          )}
          <div className={`flex-1 flex flex-col relative ${activeTab === '#radyo' ? 'hidden' : ''}`}>
            <MessageList messages={messages} currentUser={userName} blockedUsers={blockedUsers} onNickClick={(e, n) => initiatePrivateChat(n)} />
          </div>
          {radioActive && activeTab === '#radyo' && (
            <div className="flex flex-col items-center justify-center flex-1 bg-white p-6 animate-in fade-in">
              <iframe width="345" height="65" src="https://www.radyod.com/iframe-small" frameBorder="0" allow="autoplay; encrypted-media" className="shadow-lg border border-[#000080]"></iframe>
            </div>
          )}
        </main>
        {!isMobile && (
          <aside className="w-44 bg-[#d4dce8] border-l-2 border-white shrink-0 overflow-hidden">
            <UserList users={onlineUsers} currentUser={userName} onClose={() => {}} onUserClick={(nick) => initiatePrivateChat(nick)} />
          </aside>
        )}
      </div>

      <footer className="bg-[#d4dce8] border-t-2 border-white p-2 shrink-0">
        <div className="flex flex-col gap-1 w-full max-w-4xl mx-auto">
          {showColorPicker && <div className="relative"><ColorPicker selectedColor={selectedColor} onSelect={(c) => setSelectedColor(c)} /></div>}
          <div className="flex items-center gap-2 mb-1 px-1">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-1.5 hover:bg-white rounded transition-all ${showEmojiPicker ? 'bg-white shadow-inner' : ''}`}><Smile size={20} className="text-yellow-600" /></button>
            <button onClick={() => setShowColorPicker(!showColorPicker)} className="p-1.5 hover:bg-white rounded transition-all"><Palette size={20} style={{ color: selectedColor || '#000080' }} /></button>
            <div className="h-4 w-px bg-gray-400 mx-1"></div>
            <button onClick={() => setIsBold(!isBold)} className={`w-8 h-8 flex items-center justify-center rounded text-xs font-black border ${isBold ? 'bg-[#000080] text-white border-[#000080]' : 'bg-white/50 text-gray-700'}`}>B</button>
            <button onClick={() => setIsItalic(!isItalic)} className={`w-8 h-8 flex items-center justify-center rounded text-xs italic font-black border ${isItalic ? 'bg-[#000080] text-white border-[#000080]' : 'bg-white/50 text-gray-700'}`}>I</button>
            {showEmojiPicker && <div className="absolute bottom-12 left-0 z-[3000]"><EmojiPicker onSelect={(emoji) => setInputText(prev => prev + emoji)} onClose={() => setShowEmojiPicker(false)} /></div>}
          </div>
          <form onSubmit={handleSend} className="flex gap-2">
            <div className="flex-1 bg-white border-2 border-gray-500 px-3 flex items-center py-1.5 focus-within:border-[#000080]">
              <span className="text-[#000080] font-black text-[10px] mr-2 uppercase tracking-tighter">{userName}:</span>
              <textarea ref={inputRef} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown} className="flex-1 outline-none text-sm bg-transparent resize-none h-6 pt-0.5 font-medium overflow-hidden" style={{ fontWeight: isBold ? 'bold' : 'normal', fontStyle: isItalic ? 'italic' : 'normal', textDecoration: isUnderline ? 'underline' : 'none', color: selectedColor || 'black' }} placeholder="Mesaj yaz..." />
            </div>
            <button type="submit" className="bg-[#000080] text-white px-5 font-black uppercase text-[10px] shadow-sm active:translate-y-0.5 transition-all">GÖNDER</button>
          </form>
        </div>
      </footer>
    </div>
  );
};

export default App;
