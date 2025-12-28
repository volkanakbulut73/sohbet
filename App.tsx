
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
  Clock
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
    } else {
      setHasAiKey(!!process.env.API_KEY);
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
      setHasAiKey(true);
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
      const fullName = payload.name;

      // Supabase'den bu e-postaya sahip onaylı kullanıcıyı kontrol et
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
          alert('Üzgünüz, başvurunuz reddedilmiş. Lütfen yönetici ile iletişime geçin.');
        }
      } else {
        // Kullanıcı bulunamadı, kayıt formuna yönlendir ama bilgileri önceden doldurma imkanımız yok şu anki yapıda.
        // Kullanıcıya bir uyarı verip kayda yönlendirebiliriz.
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
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.sender === 'Gemini AI' && lastMsg.text.includes("SİSTEM HATASI")) {
      handleOpenKey();
    }
  }, [messages]);

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
    if (!confirm('Güvenli çıkış yapılsın mı? Tüm özel mesajlarınız silinecek.')) return;
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
        <p className="text-[#00ff99] text-[10px] font-black uppercase tracking-widest">GÜVENLİĞİNİZ İÇİN ÖZEL VERİLER TEMİZLENİYOR...</p>
      </div>
    );
  }

  if (view === 'landing') return <LandingPage onEnter={() => setView('login')} onRegisterClick={() => setView('register')} />;
  if (view === 'register') return <RegistrationForm onClose={() => setView('login')} onSuccess={() => setView('pending')} />;
  
  if (view === 'pending') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0f14] fixed inset-0 z-[2000] p-4">
        <div className="w-full max-w-[320px] bg-[#d4dce8] border-2 border-white shadow-[8px_8px_0px_rgba(0,0,0,0.5)] p-6 text-center space-y-4">
          {/* Fix: Replaced missing Clock with imported Clock from lucide-react */}
          <Clock className="mx-auto text-[#000080]" size={48} />
          <h2 className="font-black text-xs uppercase tracking-tighter">BAŞVURUNUZ İNCELENİYOR</h2>
          <p className="text-[10px] font-bold text-gray-700 leading-relaxed uppercase">
            Sistem operatörlerimiz belgelerinizi inceliyor. Onaylandığında e-posta ile bilgilendirileceksiniz.
          </p>
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
            <form onSubmit={async (e) => { e.preventDefault(); setIsLoggingIn(true); try { const user = await storageService.loginUser(loginForm.email, loginForm.password); if (user && user.status === 'approved') { setUserName(user.nickname); setView('chat'); } else if (user?.status === 'pending') { setView('pending'); } else { alert('Hatalı giriş veya onay bekleyen hesap.'); } } catch(e:any) { alert(e.message); } finally { setIsLoggingIn(false); } }} className="space-y-3">
              <input type="email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-2 border border-gray-400 text-xs outline-none focus:border-[#000080]" placeholder="E-posta" />
              <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-2 border border-gray-400 text-xs outline-none focus:border-[#000080]" placeholder="Şifre" />
              <button disabled={isLoggingIn} className="w-full bg-[#000080] text-white py-2.5 font-bold uppercase text-[10px] shadow-md transition-all active:scale-95">{isLoggingIn ? 'Bağlanıyor...' : 'Giriş Yap'}</button>
            </form>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-400"></div>
              <span className="flex-shrink mx-4 text-[8px] font-black text-gray-500 uppercase italic">Veya</span>
              <div className="flex-grow border-t border-gray-400"></div>
            </div>

            <div className="space-y-2">
              <div id="google-login-btn" className="w-full flex justify-center"></div>
              <p className="text-[8px] text-gray-500 text-center font-bold uppercase tracking-widest mt-2 italic">
                Sadece onaylı üyeler giriş yapabilir.
              </p>
            </div>
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
              <span>RADYO AKTİF</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!hasAiKey ? (
            <button 
              onClick={handleOpenKey}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-[9px] font-black uppercase px-2 py-1 rounded-sm shadow-sm animate-bounce border border-purple-400 transition-all"
            >
              <AlertCircle size={12} />
              AI KEY SEÇ
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-600/20 border border-green-500/30 rounded-sm text-[8px] font-black text-green-400 uppercase">
              <Cpu size={12} /> AI AKTİF
            </div>
          )}
          {!isOnline && <WifiOff size={16} className="text-red-400 animate-pulse" />}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 hover:bg-white/20 rounded transition-colors" title="Ayarlar"><Settings size={18} /></button>
          {isMenuOpen && (
            <div className="absolute top-8 right-2 w-56 bg-[#f0f2f5] border-2 border-[#000080] shadow-2xl z-[2000] text-black p-1 mirc-window">
              <button 
                onClick={() => { setAllowPrivateMessages(!allowPrivateMessages); setIsMenuOpen(false); }} 
                className="w-full text-left p-2 hover:bg-[#000080] hover:text-white text-[9px] font-black flex items-center justify-between uppercase transition-colors"
              >
                <span className="flex items-center gap-2">
                  {allowPrivateMessages ? <MessageSquareOff size={14} /> : <MessageSquare size={14} />}
                  {allowPrivateMessages ? 'Özel Mesajları Kapat' : 'Özel Mesajları Aç'}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full ${allowPrivateMessages ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </button>
              <div className="h-px bg-gray-300 my-1"></div>
              <button onClick={handleOpenKey} className="w-full text-left p-2 hover:bg-purple-600 hover:text-white text-[9px] font-black flex items-center gap-2 uppercase transition-colors"><Cpu size={14} /> Proje Değiştir</button>
              <div className="h-px bg-gray-300 my-1"></div>
              <button onClick={handleLogout} className="w-full text-left p-2 hover:bg-red-600 hover:text-white text-[9px] font-black flex items-center gap-2 uppercase transition-colors"><LogOut size={14} /> Oturumu Kapat</button>
            </div>
          )}
        </div>
      </header>

      <nav className="bg-[#000080]/90 px-1 py-0.5 flex gap-0.5 overflow-x-auto no-scrollbar border-b border-white/20">
        {openTabs.map(tab => {
          const isUnread = unreadTabs.includes(tab);
          const isPrivate = !tab.startsWith('#');
          return (
            <div 
              key={tab} 
              className={`flex items-center transition-all border-t-2 border-x-2 ${activeTab === tab ? 'bg-[#d4dce8] border-white' : 'border-transparent'} ${isUnread && activeTab !== tab ? 'blink-red' : ''}`}
            >
              <button 
                onClick={() => setActiveTab(tab)} 
                className={`pl-3 pr-1 py-1.5 text-[9px] font-black uppercase whitespace-nowrap ${activeTab === tab ? 'text-[#000080]' : (isUnread ? 'text-white' : 'text-white/40 hover:text-white')}`}
              >
                {isPrivate && '👤 '}{tab}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); closeTab(tab); }}
                className={`p-1 mr-1 rounded hover:bg-black/10 ${activeTab === tab ? 'text-red-700' : (isUnread ? 'text-white' : 'text-white/20')}`}
                title="Kapat"
              >
                <X size={10} strokeWidth={4} />
              </button>
            </div>
          );
        })}
      </nav>
      
      <div className="flex-1 flex overflow-hidden bg-white border-2 border-gray-400 m-1 mirc-inset relative">
        {/* AI Key Missing Overlay */}
        {!hasAiKey && (
          <div className="absolute inset-0 z-[50] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="w-full max-w-[340px] bg-[#d4dce8] border-2 border-white shadow-2xl p-6 space-y-4 mirc-window animate-in zoom-in-95">
              <div className="flex items-center gap-3 text-purple-700 mb-2">
                <Cpu size={32} className="animate-pulse" />
                <h3 className="font-black text-xs uppercase italic tracking-tighter">AI AKTİVASYONU GEREKLİ</h3>
              </div>
              <p className="text-[10px] text-gray-700 font-bold leading-relaxed">
                Gemini AI'ın çalışabilmesi için bir API projesi seçmelisiniz. Lütfen ödemesi aktif (paid) bir proje seçtiğinizden emin olun.
              </p>
              <div className="space-y-2">
                <button 
                  onClick={handleOpenKey}
                  className="w-full bg-purple-600 text-white py-3 text-[10px] font-black uppercase shadow-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                >
                  <Key size={14} /> BİR PROJE SEÇ
                </button>
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1 text-[9px] font-black text-[#000080] hover:underline uppercase py-1"
                >
                  Billing Bilgisi <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 relative flex flex-col overflow-hidden bg-[#f0f0f0]">
          {!activeTab.startsWith('#') && (
            <div className="bg-[#f8f9fa] border-b border-gray-200 px-4 py-1.5 flex justify-between items-center shrink-0 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-[10px] font-black text-[#000080] uppercase">ÖZEL: {activeTab}</span>
              </div>
              <button 
                onClick={() => { toggleBlock(activeTab); alert(`${activeTab} ${blockedUsers.includes(activeTab) ? 'engeli kaldırıldı' : 'engellendi'}.`); }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-[8px] font-black uppercase border transition-all ${blockedUsers.includes(activeTab) ? 'bg-green-600 text-white border-green-700' : 'bg-red-500 text-white border-red-700 hover:bg-red-600'}`}
              >
                <ShieldBan size={12} />
                {blockedUsers.includes(activeTab) ? 'ENGELİ KALDIR' : 'KULLANICIYI ENGELLE'}
              </button>
            </div>
          )}

          <div className={`flex-1 flex flex-col relative ${activeTab === '#radyo' ? 'hidden' : ''}`}>
            <MessageList messages={messages} currentUser={userName} blockedUsers={blockedUsers} onNickClick={(e, n) => initiatePrivateChat(n)} />
          </div>

          {radioActive && (
            <div className={`
              ${activeTab === '#radyo' 
                ? 'flex flex-col items-center justify-center flex-1 bg-white p-6 animate-in fade-in z-20' 
                : 'absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none'
              }`}
            >
              {activeTab === '#radyo' && (
                <div className="mb-4 text-[#000080] font-black uppercase text-[10px] flex items-center gap-2 border-b-2 border-red-500 pb-1">
                  <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_5px_red]"></div>
                  WORKIGOM CANLI RADYO YAYINI (RADYO D)
                </div>
              )}
              
              <iframe 
                width="345" 
                height="65" 
                src="https://www.radyod.com/iframe-small" 
                frameBorder="0" 
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="shadow-[8px_8px_0px_rgba(0,0,0,0.1)] border-2 border-[#000080] bg-white"
              ></iframe>
            </div>
          )}
        </main>
        {!isMobile && (
          <aside className="w-44 bg-[#d4dce8] border-l-2 border-white shrink-0 overflow-hidden">
            <UserList users={onlineUsers} currentUser={userName} onClose={() => {}} onUserClick={(nick) => initiatePrivateChat(nick)} />
          </aside>
        )}
      </div>

      <footer className="bg-[#d4dce8] border-t-2 border-white p-2 shrink-0 chat-footer">
        <div className="flex flex-col gap-1 w-full max-w-4xl mx-auto">
          {showColorPicker && (
            <div className="relative">
               <ColorPicker selectedColor={selectedColor} onSelect={(c) => setSelectedColor(c)} />
            </div>
          )}

          <div className="flex items-center gap-2 mb-1.5 relative px-1">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
              className={`p-2 hover:bg-white rounded-lg transition-all ${showEmojiPicker ? 'bg-white shadow-inner scale-110' : ''}`} 
              title="Emoji Seç"
            >
              <Smile size={24} className="text-yellow-500 fill-yellow-100" />
            </button>
            
            <button 
              onClick={() => setShowColorPicker(!showColorPicker)} 
              className={`p-2 hover:bg-white rounded-lg transition-all ${showColorPicker ? 'bg-white shadow-inner scale-110' : ''}`} 
              title="Yazı Rengi Seç"
            >
              <Palette size={24} style={{ color: selectedColor || '#000080' }} className="fill-current/10" />
            </button>

            <div className="h-6 w-px bg-gray-400 mx-1"></div>
            
            <button 
              onClick={() => setIsBold(!isBold)} 
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg font-black border transition-all ${isBold ? 'bg-[#000080] text-white border-[#000080] scale-110 shadow-md' : 'bg-white/50 hover:bg-white text-gray-700 border-gray-300'}`}
            >B</button>
            
            <button 
              onClick={() => setIsItalic(!isItalic)} 
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg italic font-black border transition-all ${isItalic ? 'bg-[#000080] text-white border-[#000080] scale-110 shadow-md' : 'bg-white/50 hover:bg-white text-gray-700 border-gray-300'}`}
            >I</button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-[3000]">
                <EmojiPicker 
                  onSelect={(emoji) => setInputText(prev => prev + emoji)} 
                  onClose={() => setShowEmojiPicker(false)} 
                />
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <div className="flex-1 bg-white border-2 border-gray-500 px-3 flex items-center py-2 focus-within:border-[#000080] focus-within:ring-1 ring-[#000080]/20 shadow-inner">
              <span className="text-[#000080] font-black text-[11px] mr-2 shrink-0 uppercase tracking-tighter border-r pr-2 border-gray-200">{userName}:</span>
              <textarea 
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 outline-none text-sm bg-transparent resize-none h-6 pt-0.5 font-medium overflow-hidden"
                style={{ 
                  fontWeight: isBold ? 'bold' : 'normal', 
                  fontStyle: isItalic ? 'italic' : 'normal', 
                  textDecoration: isUnderline ? 'underline' : 'none',
                  color: selectedColor || 'black'
                }}
                placeholder={`${activeTab} odasına mesaj yaz...`}
                autoComplete="off"
              />
            </div>
            <button type="submit" className="bg-[#000080] text-white px-6 font-black uppercase text-[11px] shadow-[4px_4px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all">GÖNDER</button>
          </form>
        </div>
      </footer>
    </div>
  );
};

export default App;
