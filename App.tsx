
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
  Terminal, Menu, X, Hash, Send, LogOut, Shield, UserPlus, Key,
  Smile, Bold, Italic, Underline, Settings, Ban, UserCheck, 
  MessageCircleOff, MessageCircle, Search, ZoomIn, ZoomOut
} from 'lucide-react';

const App: React.FC<ChatModuleProps> = () => {
  const [view, setView] = useState<'landing' | 'register' | 'login' | 'chat' | 'admin' | 'pending'>('landing');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    userName, setUserName, activeTab, setActiveTab, 
    messages, sendMessage, initiatePrivateChat,
    blockedUsers, toggleBlock, allowPrivateMessages, setAllowPrivateMessages
  } = useChatCore('');

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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const addEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const emojis = ['😊', '😂', '😍', '😎', '👍', '🔥', '✨', '👋', '🌹', '💔', '☕', '⚡', '🎉', '🤔', '🙌', '🚀'];

  if (view === 'landing') return <LandingPage onEnter={() => setView('login')} onAdminClick={() => setView('login')} />;
  if (view === 'register') return <RegistrationForm onClose={() => setView('login')} onSuccess={() => setView('pending')} />;
  if (view === 'admin') return <AdminDashboard onLogout={() => setView('landing')} />;
  
  if (view === 'login') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0f14]/95 fixed inset-0 z-[2000] p-4">
        <div className="w-full max-w-[360px] bg-[#d4dce8] border-2 border-white shadow-[10px_10px_0px_0px_rgba(0,0,0,0.5)]">
          <div className="bg-[#000080] text-white px-3 py-2 text-xs font-black flex justify-between items-center">
            <span><Key size={14} className="inline mr-2" /> Güvenli Giriş</span>
            <X size={18} className="cursor-pointer" onClick={() => setView('landing')} />
          </div>
          <div className="p-8 space-y-4">
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsLoggingIn(true);
              const user = await storageService.loginUser(loginForm.email, loginForm.password);
              if (user && user.status === 'approved') {
                setUserName(user.nickname);
                setView('chat');
              } else alert('Hatalı giriş veya onaylanmamış hesap.');
              setIsLoggingIn(false);
            }} className="space-y-3">
              <input type="email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-2 border border-gray-400 text-sm" placeholder="E-posta" />
              <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-2 border border-gray-400 text-sm" placeholder="Şifre" />
              <button disabled={isLoggingIn} className="w-full bg-[#000080] text-white py-3 font-bold uppercase text-xs">{isLoggingIn ? 'Bağlanıyor...' : 'Giriş'}</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const isPrivate = !activeTab.startsWith('#');

  return (
    <div 
      ref={containerRef} 
      className="flex flex-col bg-[#d4dce8] w-full border-2 border-white shadow-2xl overflow-hidden font-mono fixed inset-0 z-[1000]"
    >
      {/* --- TEKNOLOJİK ÜST PANEL --- */}
      <header className="h-14 bg-[#000080] text-white flex items-center px-4 shrink-0 border-b border-white/30">
        <div className="flex items-center gap-5 flex-1">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-3.5 h-3.5 bg-[#00ff99] rounded-full shadow-[0_0_12px_#00ff99] animate-pulse"></div>
              <div className="absolute inset-0 bg-[#00ff99]/40 rounded-full blur-[2px]"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-widest text-[#00ff99] leading-none">STATUS: ONLINE</span>
              <span className="text-[8px] opacity-60 uppercase mt-0.5">Secure Network Active</span>
            </div>
          </div>
          
          <div className="h-7 w-px bg-white/20"></div>
          
          <div className="flex items-center gap-2">
            <div className="text-[14px] font-black italic tracking-tighter text-white">
              <span className="text-[#00ff99] pr-1">@</span>{userName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative">
          {isPrivate && (
            <button 
              onClick={() => toggleBlock(activeTab)}
              className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-black border transition-colors rounded-sm ${blockedUsers.includes(activeTab) ? 'bg-red-600 border-red-400' : 'border-white/40 hover:bg-white/10'}`}
            >
              {blockedUsers.includes(activeTab) ? <UserCheck size={14}/> : <Ban size={14}/>}
              {isMobile ? '' : (blockedUsers.includes(activeTab) ? 'ENGELİ KALDIR' : 'ENGELLE')}
            </button>
          )}
          
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-white/20 border border-transparent hover:border-white/30 rounded transition-all">
            <Settings size={20} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute top-12 right-0 w-56 bg-[#f0f2f5] border-2 border-[#000080] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] z-[2000] p-1 text-black">
              <button onClick={() => { const n = prompt('Yeni Nickname:'); if(n) setUserName(n); setIsMenuOpen(false); }} className="w-full text-left p-3 hover:bg-[#000080] hover:text-white text-[11px] font-black flex items-center gap-3 border-b border-gray-300">
                <UserPlus size={16} /> NICKNAME DEĞİŞTİR
              </button>
              <button onClick={() => { setAllowPrivateMessages(!allowPrivateMessages); setIsMenuOpen(false); }} className="w-full text-left p-3 hover:bg-[#000080] hover:text-white text-[11px] font-black flex items-center gap-3">
                {allowPrivateMessages ? <MessageCircleOff size={16}/> : <MessageCircle size={16}/>}
                ÖZEL MESAJLARI {allowPrivateMessages ? 'KAPAT' : 'AÇ'}
              </button>
              <div className="h-px bg-gray-400 my-1 mx-2"></div>
              <button onClick={() => window.location.reload()} className="w-full text-left p-3 hover:bg-red-600 hover:text-white text-[11px] font-black flex items-center gap-3">
                <LogOut size={16} /> GÜVENLİ ÇIKIŞ
              </button>
            </div>
          )}
        </div>
      </header>

      {/* KANAL SEKMELERİ - mIRC STİLİ */}
      <nav className="bg-[#000080]/95 px-2 py-0.5 flex gap-0.5 overflow-x-auto no-scrollbar border-b border-white/20">
        {['#Sohbet', '#Yardim', '#Radyo'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab.toLowerCase())} 
            className={`px-4 py-1.5 text-[10px] font-black uppercase transition-all whitespace-nowrap border-t-2 border-x-2 ${activeTab === tab.toLowerCase() ? 'bg-[#d4dce8] text-[#000080] border-white' : 'text-white/50 border-transparent hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </nav>
      
      {/* ANA SOHBET ALANI */}
      <div className="flex-1 flex overflow-hidden bg-white border-2 border-gray-400 m-1 mirc-inset relative">
        <main className="flex-1 relative min-w-0 bg-white shadow-inner">
          <MessageList messages={messages} currentUser={userName} blockedUsers={blockedUsers} onNickClick={(e, n) => initiatePrivateChat(n)} />
        </main>
        
        <aside className={`${isMobile ? 'w-[100px]' : 'w-56'} bg-[#d4dce8] border-l-2 border-white shrink-0 flex flex-col shadow-lg z-10`}>
          <UserList 
            users={[userName, 'Admin', 'GeminiBot', 'Esra', 'Can', 'Merve', 'Selin']} 
            currentUser={userName} 
            onClose={() => {}} 
            onUserClick={(e, nick) => initiatePrivateChat(nick)}
          />
        </aside>
      </div>

      {/* --- GELİŞMİŞ MESAJ GİRİŞ ALANI (GEVEZE STİLİ) --- */}
      <footer className="bg-[#d4dce8] border-t-2 border-white p-2 shrink-0">
        <div className="flex flex-col gap-1 w-full max-w-screen-2xl mx-auto">
          
          {/* TOOLBAR */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-white/40 border border-gray-400 rounded-t-sm shadow-sm">
            <div className="flex items-center gap-1 sm:gap-4">
               <div className="relative">
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                  className={`p-1.5 hover:bg-white rounded transition-all ${showEmojiPicker ? 'bg-white shadow-inner' : ''}`}
                >
                  <Smile size={22} className="text-yellow-500" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 min-w-[300px] bg-[#d4dce8] border-2 border-white shadow-[10px_10px_30px_rgba(0,0,0,0.3)] p-3 z-[3000] rounded-sm mirc-window">
                    <div className="text-[9px] font-black text-[#000080] uppercase mb-2 border-b border-gray-400 pb-1">Hızlı Emojiler</div>
                    <div className="grid grid-cols-8 gap-2">
                      {emojis.map(e => (
                        <button key={e} onClick={() => addEmoji(e)} className="text-2xl hover:bg-white p-1 rounded transition-transform hover:scale-125">{e}</button>
                      ))}
                    </div>
                  </div>
                )}
               </div>

               <div className="h-6 w-px bg-gray-400/50"></div>

               <div className="flex gap-1">
                 <button className="p-1.5 hover:bg-white rounded" title="Bold"><Bold size={16}/></button>
                 <button className="p-1.5 hover:bg-white rounded" title="Italic"><Italic size={16}/></button>
                 <button className="p-1.5 hover:bg-white rounded" title="Underline"><Underline size={16}/></button>
               </div>

               <div className="h-6 w-px bg-gray-400/50 hidden sm:block"></div>

               <div className="hidden sm:flex items-center gap-4 ml-2">
                 <span className="text-[10px] font-black text-blue-900 tracking-widest uppercase italic opacity-60">mIRC Browser Edition v1.2</span>
               </div>
            </div>

            <div className="flex items-center gap-2">
               <button className="p-1 hover:text-[#000080] transition-colors"><ZoomIn size={16}/></button>
               <button className="p-1 hover:text-[#000080] transition-colors"><ZoomOut size={16}/></button>
               <div className="h-4 w-px bg-gray-400 mx-1"></div>
               <span className="text-[9px] font-black text-gray-500 hidden md:inline">SECURE CHANNEL</span>
            </div>
          </div>

          {/* INPUT & SEND BAR */}
          <form onSubmit={handleSend} className="flex gap-1 h-14">
            <div className="flex-1 bg-white border-2 border-[#808080] shadow-inner px-4 flex items-center group focus-within:border-[#000080] transition-colors">
              <div className="flex items-center gap-1 mr-3 shrink-0">
                <span className="text-[#000080] font-black text-[12px] uppercase">{userName}</span>
                <span className="text-gray-400 text-[12px]">:</span>
              </div>
              <input 
                ref={inputRef}
                type="text" 
                value={inputText} 
                onChange={e => setInputText(e.target.value)} 
                className="flex-1 outline-none text-sm bg-transparent font-bold placeholder:italic placeholder:font-normal" 
                placeholder="Mesajınızı buraya yazın..." 
                autoComplete="off"
                onFocus={() => setShowEmojiPicker(false)}
              />
              <button type="button" className="text-gray-400 hover:text-[#000080] ml-2 p-1">
                <Search size={18} />
              </button>
            </div>
            
            <button 
              type="submit" 
              className="bg-[#000080] text-white px-8 font-black uppercase flex items-center justify-center gap-3 hover:bg-blue-800 transition-all shadow-[4px_4px_0px_gray] active:shadow-none active:translate-y-1 active:translate-x-px"
            >
              <Send size={20} />
              {!isMobile && 'GÖNDER'}
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
};

export default App;
