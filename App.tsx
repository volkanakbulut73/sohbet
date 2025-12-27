
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
  MessageCircleOff, MessageCircle, Search, ZoomIn, ZoomOut, Radio, Play, Music, Volume2, 
  UserX, UserCheck2, Trash2, BellRing, Clock, ShieldCheck
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
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    userName, setUserName, activeTab, setActiveTab, openTabs, closeTab, unreadTabs,
    messages, sendMessage, initiatePrivateChat, onlineUsers,
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

  if (view === 'landing') return (
    <LandingPage 
      onEnter={() => setView('login')} 
      onRegisterClick={() => setView('register')}
      onAdminClick={() => {
        const pass = prompt('Admin Şifresi:');
        if (pass === 'admin123') setView('admin');
      }} 
    />
  );
  
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
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-full border-2 border-[#000080] animate-pulse">
                  <Clock size={48} className="text-[#000080]" />
                </div>
              </div>
              <h2 className="text-xl font-black text-[#000080] uppercase italic">BAŞVURUNUZ ALINDI</h2>
              <p className="text-xs text-gray-700 font-bold leading-relaxed">
                Güvenlik ekibimiz belgelerinizi incelemeye başladı. <br/>
                Onay sürecimiz genellikle 24 saat sürmektedir. <br/>
                Onaylandığında e-posta ile bilgilendirileceksiniz.
              </p>
              <div className="bg-white p-3 border border-gray-400 text-[10px] text-left text-green-700 font-bold">
                {">"} LOG: Application_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}<br/>
                {">"} STATUS: Security_Check_In_Progress...<br/>
                {">"} SERVER: workigomchat.online
              </div>
              <button 
                onClick={() => setView('landing')}
                className="w-full bg-[#000080] text-white py-3 font-black text-xs uppercase hover:bg-blue-800 transition-all"
              >
                ANA SAYFAYA DÖN
              </button>
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
              } else if (user && user.status === 'pending') {
                setView('pending');
              } else {
                alert('Hatalı giriş veya onaylanmamış hesap.');
              }
              setIsLoggingIn(false);
            }} className="space-y-3">
              <input type="email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-2 border border-gray-400 text-sm outline-none focus:border-[#000080]" placeholder="E-posta" />
              <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-2 border border-gray-400 text-sm outline-none focus:border-[#000080]" placeholder="Şifre" />
              <button disabled={isLoggingIn} className="w-full bg-[#000080] text-white py-3 font-bold uppercase text-xs hover:bg-blue-800 transition-all shadow-md">{isLoggingIn ? 'Bağlanıyor...' : 'Giriş'}</button>
            </form>
            
            <div className="pt-4 border-t border-gray-400 text-center space-y-2">
               <p className="text-[10px] font-bold text-gray-600 uppercase">Hesabınız yok mu?</p>
               <button 
                onClick={() => setView('register')}
                className="text-[#000080] text-xs font-black uppercase hover:underline flex items-center justify-center gap-2 mx-auto"
               >
                 <UserPlus size={14} /> Kayıt Başvurusu Yap
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPrivate = !activeTab.startsWith('#');
  
  // ÖZEL ODADA SADECE TARAFLARI GÖSTER
  const filteredOnlineUsers = activeTab.startsWith('#')
    ? onlineUsers
    : onlineUsers.filter(u => u === activeTab || u === userName);

  return (
    <div 
      ref={containerRef} 
      className="flex flex-col bg-[#d4dce8] w-full border-2 border-white shadow-2xl overflow-hidden font-mono fixed inset-0 z-[1000]"
    >
      {/* HEADER */}
      <header className="h-14 bg-[#000080] text-white flex items-center px-4 shrink-0 border-b border-white/30">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 bg-[#00ff99] rounded-full shadow-[0_0_12px_#00ff99] animate-pulse"></div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] font-black tracking-widest text-[#00ff99] leading-none uppercase">Online</span>
            </div>
          </div>
          <div className="h-7 w-px bg-white/20 hidden sm:block"></div>
          <div className="text-[14px] font-black italic text-white flex items-center gap-1 truncate uppercase">
            {activeTab.startsWith('#') ? <Hash size={16} className="inline mr-1" /> : <div className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block mr-2 ring-1 ring-white"></div>}
            {activeTab === userName ? 'Profilim' : activeTab}
          </div>
        </div>

        <div className="flex items-center gap-3 relative ml-auto">
          {isPrivate && activeTab !== 'GeminiBot' && activeTab !== userName && (
            <div className="flex gap-2">
              <button 
                onClick={() => toggleBlock(activeTab)} 
                className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-black border transition-all rounded-sm shadow-sm ${blockedUsers.includes(activeTab) ? 'bg-green-600 border-green-400 text-white' : 'bg-red-600 border-red-400 text-white hover:bg-red-700'}`}
              >
                {blockedUsers.includes(activeTab) ? <UserCheck2 size={14}/> : <UserX size={14}/>}
                {blockedUsers.includes(activeTab) ? 'ENGELİ KALDIR' : 'ENGELLE'}
              </button>
            </div>
          )}

          {activeTab === '#radyo' && (
            <div className="flex items-center gap-2 bg-[#00ff99] text-[#000080] px-3 py-1 rounded-sm text-[10px] font-black animate-pulse border border-white">
              <Volume2 size={14} /> LIVE: RADYO D
            </div>
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

      {/* TABS */}
      <nav className="bg-[#000080]/95 px-2 py-0.5 flex gap-0.5 overflow-x-auto no-scrollbar border-b border-white/20">
        {openTabs.map(tab => {
          const isUnread = unreadTabs.includes(tab);
          return (
            <div key={tab} className="relative group flex items-center shrink-0">
              <button 
                onClick={() => setActiveTab(tab)} 
                className={`pl-4 pr-10 py-2 text-[11px] font-black uppercase transition-all whitespace-nowrap border-t-2 border-x-2 relative ${activeTab === tab ? 'bg-[#d4dce8] text-[#000080] border-white shadow-sm' : isUnread ? 'bg-red-600 text-white animate-pulse border-white' : 'text-white/60 border-transparent hover:text-white'}`}
              >
                <div className="flex items-center gap-2">
                  {isUnread && <BellRing size={12} className="animate-bounce" />}
                  {tab === '#radyo' ? <Music size={14} className={activeTab === '#radyo' ? 'animate-bounce' : ''} /> : tab.startsWith('#') ? <Hash size={14} /> : <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>}
                  {tab}
                </div>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); closeTab(tab); }}
                className={`absolute right-2 p-1 rounded-sm transition-all ${activeTab === tab ? 'text-[#000080] hover:bg-black/10' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
              >
                <X size={12} strokeWidth={3} />
              </button>
            </div>
          );
        })}
      </nav>
      
      {/* MAIN AREA */}
      <div className="flex-1 flex overflow-hidden bg-white border-2 border-gray-400 m-1 mirc-inset relative">
        <main className="flex-1 relative min-w-0 bg-[#f0f0f0] shadow-inner flex flex-col overflow-hidden">
          {/* RADIO ROOM */}
          <div className={`absolute inset-0 bg-[#0b0f14] flex flex-col items-center justify-center p-4 z-20 ${activeTab === '#radyo' ? 'flex' : 'hidden opacity-0 pointer-events-none'}`}>
             <div className="w-full max-w-lg space-y-6 flex flex-col items-center animate-in zoom-in-95 duration-500">
                <div className="w-full bg-[#000080] border-2 border-white p-4 shadow-[10px_10px_0px_rgba(0,0,0,0.5)] flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3">
                    <Music className="text-[#00ff99] animate-bounce" size={32} />
                    <h2 className="text-white text-2xl font-black italic tracking-tighter uppercase">RADYO D STÜDYOSU</h2>
                  </div>
                  <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00ff99] animate-infinite-progress"></div>
                  </div>
                </div>
                <div className="bg-[#d4dce8] p-3 border-2 border-white shadow-[10px_10px_0px_rgba(0,0,0,0.5)] mirc-window">
                  <div className="bg-white p-1 border-2 border-gray-400 shadow-inner flex items-center justify-center">
                    <iframe width="345" height="65" src="https://www.radyod.com/iframe-small" frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="max-w-full"></iframe>
                  </div>
                </div>
                <div className="grid grid-cols-10 gap-1 w-full max-w-sm h-12 items-end">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-[#00ff99] opacity-40 animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 100}ms` }}></div>
                  ))}
                </div>
             </div>
          </div>
          {/* CHAT VIEW */}
          <div className={`flex-1 relative bg-white ${activeTab === '#radyo' ? 'hidden' : 'block'}`}>
            <MessageList messages={messages} currentUser={userName} blockedUsers={blockedUsers} onNickClick={(e, n) => initiatePrivateChat(n)} />
          </div>
        </main>
        
        <aside className={`${isMobile ? 'w-[100px]' : 'w-56'} bg-[#d4dce8] border-l-2 border-white shrink-0 flex flex-col shadow-lg z-10`}>
          <UserList users={filteredOnlineUsers} currentUser={userName} onClose={() => {}} onUserClick={(nick) => initiatePrivateChat(nick)} />
        </aside>
      </div>

      {/* FOOTER */}
      <footer className="bg-[#d4dce8] border-t-2 border-white p-2 shrink-0">
        <div className="flex flex-col gap-1 w-full max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-between px-2 py-1.5 bg-white/40 border border-gray-400 rounded-t-sm shadow-sm">
            <div className="flex items-center gap-1 sm:gap-4">
               <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-1.5 hover:bg-white rounded transition-all ${showEmojiPicker ? 'bg-white shadow-inner' : ''}`}>
                 <Smile size={22} className="text-yellow-500" />
               </button>
               {showEmojiPicker && (
                 <div className="absolute bottom-16 left-4 w-[320px] bg-white border-2 border-gray-400 shadow-2xl p-2 z-[3000]">
                   <div className="grid grid-cols-8 gap-1 max-h-[160px] overflow-y-auto no-scrollbar">
                     {emojis.map(e => <button key={e} onClick={() => addEmoji(e)} className="text-xl hover:bg-gray-100 p-1.5 rounded">{e}</button>)}
                   </div>
                 </div>
               )}
               <div className="h-6 w-px bg-gray-400/50"></div>
               <div className="flex gap-1">
                 <button type="button" onClick={() => setIsBold(!isBold)} className={`p-1.5 rounded ${isBold ? 'bg-[#000080] text-white' : 'hover:bg-white'}`}><Bold size={16}/></button>
                 <button type="button" onClick={() => setIsItalic(!isItalic)} className={`p-1.5 rounded ${isItalic ? 'bg-[#000080] text-white' : 'hover:bg-white'}`}><Italic size={16}/></button>
                 <button type="button" onClick={() => setIsUnderline(!isUnderline)} className={`p-1.5 rounded ${isUnderline ? 'bg-[#000080] text-white' : 'hover:bg-white'}`}><Underline size={16}/></button>
               </div>
            </div>
            <div className="hidden sm:block text-[9px] font-black text-[#000080] uppercase tracking-widest opacity-60 italic">Geveze Edition v2.3</div>
          </div>

          <form onSubmit={handleSend} className="flex gap-1 min-h-[3.5rem] items-stretch">
            <div className="flex-1 bg-white border-2 border-[#808080] shadow-inner px-4 flex items-start py-2 group focus-within:border-[#000080] overflow-hidden">
              <span className="text-[#000080] font-black text-[12px] uppercase mt-0.5 mr-3 shrink-0">{userName}:</span>
              <textarea ref={inputRef} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown} className="flex-1 outline-none text-sm bg-transparent resize-none py-0.5 self-center max-h-32" style={{ fontWeight: isBold ? 'bold' : 'normal', fontStyle: isItalic ? 'italic' : 'normal', textDecoration: isUnderline ? 'underline' : 'none' }} placeholder={activeTab === '#radyo' ? "Radyo odasında sadece dinleyebilirsin..." : `[${activeTab}] odasına mesaj yaz...`} disabled={activeTab === '#radyo'} autoComplete="off" />
            </div>
            <button type="submit" disabled={activeTab === '#radyo'} className="bg-[#000080] text-white px-8 font-black uppercase flex items-center justify-center gap-3 hover:bg-blue-800 shadow-[4px_4px_0px_gray] active:shadow-none active:translate-y-1 disabled:opacity-50">
              <Send size={20} />
              {!isMobile && 'GÖNDER'}
            </button>
          </form>
        </div>
      </footer>

      <style>{`
        @keyframes infinite-progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-infinite-progress { animation: infinite-progress 2s linear infinite; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
      `}</style>
    </div>
  );
};

export default App;
