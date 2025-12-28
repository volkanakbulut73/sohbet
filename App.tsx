
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
  Palette
} from 'lucide-react';

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
  
  // Radyo oynatıcı durumu
  const [radioActive, setRadioActive] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    userName, setUserName, activeTab, setActiveTab, openTabs,
    messages, sendMessage, initiatePrivateChat, onlineUsers,
    blockedUsers, isOnline
  } = useChatCore('');

  // Radyo kanalına girildiğinde oynatıcıyı aktive et (kesintisiz çalma için DOM'da tutar)
  useEffect(() => {
    if (activeTab === '#radyo') {
      setRadioActive(true);
    }
  }, [activeTab]);

  // Mobil Klavye Uyumluluğu
  useEffect(() => {
    const handleViewportChange = () => {
      if (containerRef.current && window.visualViewport) {
        containerRef.current.style.height = `${window.visualViewport.height}px`;
      }
      setIsMobile(window.innerWidth < 1024);
    };

    window.visualViewport?.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('scroll', handleViewportChange);
    handleViewportChange();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
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
      <div className="fixed inset-0 bg-[#0b0f14] z-[5000] flex flex-col items-center justify-center font-mono">
        <Loader2 size={40} className="text-[#00ff99] animate-spin mb-4" />
        <p className="text-[#00ff99] text-[10px] font-black uppercase tracking-widest">TEMİZLENİYOR...</p>
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
            <span className="flex items-center gap-2 uppercase tracking-tighter"><Key size={12} /> Workigom Login</span>
            <X size={16} className="cursor-pointer" onClick={() => setView('landing')} />
          </div>
          <div className="p-6 space-y-4">
            <form onSubmit={async (e) => { e.preventDefault(); setIsLoggingIn(true); try { const user = await storageService.loginUser(loginForm.email, loginForm.password); if (user && user.status === 'approved') { setUserName(user.nickname); setView('chat'); } else if (user?.status === 'pending') { setView('pending'); } else { alert('Hatalı giriş veya onay bekleyen hesap.'); } } catch(e:any) { alert(e.message); } finally { setIsLoggingIn(false); } }} className="space-y-3">
              <input type="email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-2 border border-gray-400 text-xs outline-none focus:border-[#000080]" placeholder="E-posta" />
              <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-2 border border-gray-400 text-xs outline-none focus:border-[#000080]" placeholder="Şifre" />
              <button disabled={isLoggingIn} className="w-full bg-[#000080] text-white py-2.5 font-bold uppercase text-[10px] shadow-md">{isLoggingIn ? 'Bağlanıyor...' : 'Giriş Yap'}</button>
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
          {!isOnline && <WifiOff size={16} className="text-red-400 animate-pulse" />}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 hover:bg-white/20 rounded transition-colors"><Settings size={16} /></button>
          {isMenuOpen && (
            <div className="absolute top-8 right-2 w-48 bg-[#f0f2f5] border-2 border-[#000080] shadow-2xl z-[2000] text-black p-0.5 mirc-window">
              <button onClick={handleLogout} className="w-full text-left p-2 hover:bg-red-600 hover:text-white text-[9px] font-black flex items-center gap-2 uppercase"><LogOut size={14} /> Oturumu Kapat</button>
            </div>
          )}
        </div>
      </header>

      <nav className="bg-[#000080]/90 px-1 py-0.5 flex gap-0.5 overflow-x-auto no-scrollbar border-b border-white/20">
        {openTabs.map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-3 py-1.5 text-[9px] font-black uppercase whitespace-nowrap border-t-2 border-x-2 transition-all ${activeTab === tab ? 'bg-[#d4dce8] text-[#000080] border-white' : 'text-white/40 border-transparent hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </nav>
      
      <div className="flex-1 flex overflow-hidden bg-white border-2 border-gray-400 m-1 mirc-inset relative">
        <main className="flex-1 relative flex flex-col overflow-hidden bg-[#f0f0f0]">
          {/* Standart Mesaj Alanı - Radyo kanalı hariç tüm kanallarda gösterilir */}
          <div className={`flex-1 flex flex-col relative ${activeTab === '#radyo' ? 'hidden' : ''}`}>
            <MessageList messages={messages} currentUser={userName} blockedUsers={blockedUsers} onNickClick={(e, n) => initiatePrivateChat(n)} />
          </div>

          {/* Radyo Oynatıcı Alanı - Kesintisiz çalma için bir kez mount edildikten sonra DOM'da saklanır */}
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

              {activeTab === '#radyo' && (
                <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-200 text-[10px] text-blue-900 font-bold italic leading-relaxed text-center max-w-sm shadow-inner">
                  [ Bilgi ]: Radyo oynatıcısı bir kez başlatıldıktan sonra odalar arası geçiş yapsanız dahi 
                  kesintisiz olarak arka planda çalmaya devam eder. Diğer odalara dönmek için yukarıdaki sekmeleri kullanın.
                </div>
              )}
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
          
          {/* Renk Paleti (Açık olduğunda gösterilir) */}
          {showColorPicker && (
            <div className="relative">
               <ColorPicker selectedColor={selectedColor} onSelect={(c) => setSelectedColor(c)} />
            </div>
          )}

          <div className="flex items-center gap-1 mb-0.5 relative">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1 hover:bg-white rounded" title="Emoji Seç"><Smile size={18} className="text-yellow-600" /></button>
            <button onClick={() => setShowColorPicker(!showColorPicker)} className={`p-1 hover:bg-white rounded ${showColorPicker ? 'bg-white shadow-inner' : ''}`} title="Yazı Rengi Seç">
              <Palette size={18} style={{ color: selectedColor || '#555' }} />
            </button>
            <div className="h-4 w-px bg-gray-400 mx-0.5"></div>
            <button onClick={() => setIsBold(!isBold)} className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${isBold ? 'bg-[#000080] text-white border-[#000080]' : 'hover:bg-white text-gray-600 border-transparent'}`}>B</button>
            <button onClick={() => setIsItalic(!isItalic)} className={`px-1.5 py-0.5 rounded text-[10px] italic font-black border ${isItalic ? 'bg-[#000080] text-white border-[#000080]' : 'hover:bg-white text-gray-600 border-transparent'}`}>I</button>
            
            {/* Emoji Seçici Panel */}
            {showEmojiPicker && (
              <div className="absolute bottom-10 left-0 z-[3000]">
                <EmojiPicker 
                  onSelect={(emoji) => setInputText(prev => prev + emoji)} 
                  onClose={() => setShowEmojiPicker(false)} 
                />
              </div>
            )}
          </div>
          <form onSubmit={handleSend} className="flex gap-1">
            <div className="flex-1 bg-white border-2 border-gray-500 px-2 flex items-center py-1 focus-within:border-[#000080] shadow-inner">
              <span className="text-[#000080] font-black text-[10px] mr-2 shrink-0 uppercase">{userName}:</span>
              <textarea 
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 outline-none text-xs bg-transparent resize-none h-5 pt-0.5 font-medium overflow-hidden"
                style={{ 
                  fontWeight: isBold ? 'bold' : 'normal', 
                  fontStyle: isItalic ? 'italic' : 'normal', 
                  textDecoration: isUnderline ? 'underline' : 'none',
                  color: selectedColor || 'black'
                }}
                placeholder={`${activeTab} odaya yaz...`}
                autoComplete="off"
              />
            </div>
            <button type="submit" className="bg-[#000080] text-white px-5 font-black uppercase text-[10px] shadow-[3px_3px_0px_gray] active:shadow-none active:translate-y-0.5 transition-all">GÖNDER</button>
          </form>
        </div>
      </footer>
    </div>
  );
};

export default App;
