
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
  Smile, Bold, Italic, Underline, Settings, Ban, UserCheck, MessageCircleOff, MessageCircle
} from 'lucide-react';

const App: React.FC<ChatModuleProps> = () => {
  const [view, setView] = useState<'landing' | 'register' | 'login' | 'chat' | 'admin' | 'pending'>('landing');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isChannelsOpen, setIsChannelsOpen] = useState(false);
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
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const emojis = ['😊', '😂', '😍', '😎', '👍', '🔥', '✨', '👋', '🌹', '💔', '☕', '⚡'];

  if (view === 'landing') return <LandingPage onEnter={() => setView('login')} onAdminClick={() => setView('login')} />;
  if (view === 'register') return <RegistrationForm onClose={() => setView('login')} onSuccess={() => setView('pending')} />;
  if (view === 'admin') return <AdminDashboard onLogout={() => setView('landing')} />;
  
  if (view === 'login') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0f14]/95 backdrop-blur-sm fixed inset-0 z-[2000] p-4">
        <div className="w-full max-w-[360px] bg-[#d4dce8] border-2 border-white shadow-[15px_15px_0px_0px_rgba(0,0,0,0.5)] mirc-window">
          <div className="bg-[#000080] text-white px-3 py-2 text-xs font-black flex justify-between items-center">
            <span><Key size={14} className="inline mr-2" /> Giriş Paneli</span>
            <X size={18} className="cursor-pointer" onClick={() => setView('landing')} />
          </div>
          <div className="p-8 space-y-6">
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsLoggingIn(true);
              const user = await storageService.loginUser(loginForm.email, loginForm.password);
              if (user) {
                if (user.status === 'approved') {
                  setUserName(user.nickname);
                  setView('chat');
                } else setView('pending');
              } else alert('Hatalı giriş');
              setIsLoggingIn(false);
            }} className="space-y-4">
              <input type="email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-3 border-2 border-gray-400 text-sm" placeholder="E-posta" />
              <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-3 border-2 border-gray-400 text-sm" placeholder="Şifre" />
              <button disabled={isLoggingIn} className="w-full bg-[#000080] text-white py-4 font-black uppercase">{isLoggingIn ? 'Bağlanıyor...' : 'Giriş Yap'}</button>
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
      className={`flex flex-col bg-[#d4dce8] w-full border-2 border-white shadow-2xl overflow-hidden text-black font-mono fixed inset-0 z-[1000]`}
    >
      {/* ÜST PANEL - TEKNOLOJİK GÖRÜNÜM */}
      <header className="h-12 bg-[#000080] text-white flex items-center px-3 font-bold shrink-0 border-b border-white/20">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#00ff99] rounded-full shadow-[0_0_8px_#00ff99] animate-pulse"></div>
            <span className="text-[11px] uppercase tracking-tighter">Status: Online</span>
          </div>
          <div className="h-4 w-px bg-white/20"></div>
          <div className="flex items-center gap-2">
            <span className="text-[#00ff99] text-[12px] font-black">{userName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          {isPrivate && (
            <button 
              onClick={() => toggleBlock(activeTab)}
              className={`flex items-center gap-1 px-3 py-1 text-[10px] font-black border border-white/30 rounded-sm hover:bg-white/10 ${blockedUsers.includes(activeTab) ? 'bg-red-600 text-white' : 'text-white'}`}
            >
              {blockedUsers.includes(activeTab) ? <><UserCheck size={12}/> Engeli Aç</> : <><Ban size={12}/> Engelle</>}
            </button>
          )}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-white/10 rounded-sm transition-colors">
            <Settings size={18} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute top-10 right-0 w-48 bg-[#d4dce8] border-2 border-white shadow-xl z-[2000] p-1 text-black">
              <button onClick={() => { const n = prompt('Yeni Nick:'); if(n) setUserName(n); setIsMenuOpen(false); }} className="w-full text-left p-2 hover:bg-[#000080] hover:text-white text-[11px] font-bold flex items-center gap-2 border-b border-white/50">
                <UserPlus size={14} /> Nick Değiştir
              </button>
              <button onClick={() => { setAllowPrivateMessages(!allowPrivateMessages); setIsMenuOpen(false); }} className="w-full text-left p-2 hover:bg-[#000080] hover:text-white text-[11px] font-bold flex items-center gap-2">
                {allowPrivateMessages ? <><MessageCircleOff size={14}/> Özelleri Kapat</> : <><MessageCircle size={14}/> Özelleri Aç</>}
              </button>
              <button onClick={() => window.location.reload()} className="w-full text-left p-2 hover:bg-red-600 hover:text-white text-[11px] font-bold flex items-center gap-2 border-t border-white/50">
                <LogOut size={14} /> Güvenli Çıkış
              </button>
            </div>
          )}
        </div>
      </header>

      {/* KANAL SEKMELERİ */}
      <div className="bg-[#000080]/90 px-2 py-1 flex gap-1 overflow-x-auto no-scrollbar border-b border-white/10">
        {['#Sohbet', '#Yardim', '#Radyo'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} className={`px-4 py-1 text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === tab.toLowerCase() ? 'bg-white text-[#000080] rounded-t-sm' : 'text-white/60 hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>
      
      <div className="flex-1 flex overflow-hidden bg-white border-2 border-gray-400 m-1 mirc-inset relative">
        <main className="flex-1 relative min-w-0">
          <MessageList messages={messages} currentUser={userName} blockedUsers={blockedUsers} onNickClick={(e, n) => initiatePrivateChat(n)} />
        </main>
        
        <aside className={`${isMobile ? 'w-[100px]' : 'w-52'} bg-[#d4dce8] border-l-2 border-white shrink-0 flex flex-col`}>
          <UserList 
            users={[userName, 'Admin', 'GeminiBot', 'Esra', 'Can', 'Merve']} 
            currentUser={userName} 
            onClose={() => {}} 
            onUserClick={(e, nick) => initiatePrivateChat(nick)}
          />
        </aside>
      </div>

      {/* GELİŞMİŞ MESAJ GİRİŞ ALANI - RESİMDEKİ GİBİ */}
      <footer className="bg-[#d4dce8] border-t-2 border-white p-2 shrink-0">
        <div className="flex flex-col gap-1">
          {/* Format Bar */}
          <div className="flex items-center gap-3 px-2 py-1 bg-white/30 border border-gray-400 rounded-t-sm">
            <div className="flex gap-1 border-r border-gray-400 pr-3">
               <button className="p-1 hover:bg-white rounded transition-colors" title="Bold"><Bold size={14}/></button>
               <button className="p-1 hover:bg-white rounded transition-colors" title="Italic"><Italic size={14}/></button>
               <button className="p-1 hover:bg-white rounded transition-colors" title="Underline"><Underline size={14}/></button>
            </div>
            <div className="relative">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1 hover:bg-white rounded transition-colors text-yellow-600" title="Emoji">
                <Smile size={18}/>
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-10 left-0 bg-white border-2 border-gray-400 shadow-2xl p-3 grid grid-cols-4 gap-2 z-[3000]">
                  {emojis.map(e => (
                    <button key={e} onClick={() => addEmoji(e)} className="text-xl hover:scale-125 transition-transform">{e}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="h-4 w-px bg-gray-400 mx-1"></div>
            <span className="text-[10px] font-black text-[#000080] uppercase tracking-widest hidden sm:block">Workigom Safe Chat v1.1</span>
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="flex gap-1 h-12">
            <div className="flex-1 bg-white border-2 border-gray-600 shadow-inner px-3 flex items-center">
              <span className="text-[#000080] font-black mr-2 text-[11px] shrink-0">{userName}:</span>
              <input 
                ref={inputRef}
                type="text" 
                value={inputText} 
                onChange={e => setInputText(e.target.value)} 
                className="flex-1 outline-none text-sm bg-transparent font-bold" 
                placeholder="Mesajınızı buraya yazın..." 
                autoComplete="off"
              />
            </div>
            <button type="submit" className="bg-[#000080] text-white px-6 font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-800 transition-colors shadow-[2px_2px_0_gray] active:shadow-none active:translate-y-px">
              <Send size={18} /> {isMobile ? '' : 'GÖNDER'}
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
};

export default App;
