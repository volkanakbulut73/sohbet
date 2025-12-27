
import React, { useState, useEffect, useRef } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import LandingPage from './components/LandingPage';
import RegistrationForm from './components/RegistrationForm';
import { ChatModuleProps } from './types';
import { storageService } from './services/storageService';
import { 
  Menu, X, Lock, Clock, 
  Users as UsersIcon, Hash, Send
} from 'lucide-react';

type AppView = 'landing' | 'login' | 'register' | 'pending' | 'chat';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "", embedded = false }) => {
  const [view, setView] = useState<AppView>(externalUser ? 'chat' : 'landing');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showUserList, setShowUserList] = useState(false);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    userName, setUserName, activeTab, setActiveTab, 
    messages, sendMessage, initiatePrivateChat 
  } = useChatCore(externalUser || '');

  // Ekran boyutu takibi ve Mobil/Desktop karar mekanizması
  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (containerRef.current) {
        // Mobil klavye ve tarayıcı barı hesaplamaları için viewport height kullanımı
        const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        containerRef.current.style.height = `${h}px`;
      }
    };
    window.addEventListener('resize', checkSize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', checkSize);
    checkSize();
    return () => {
      window.removeEventListener('resize', checkSize);
      window.visualViewport?.removeEventListener('resize', checkSize);
    };
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const user = await storageService.loginUser(loginForm.email, loginForm.password);
      if (user) {
        if (user.status === 'pending') setView('pending');
        else {
          setUserName(user.nickname);
          localStorage.setItem('mirc_nick', user.nickname);
          setView('chat');
        }
      } else alert('Hata: Giriş bilgileri geçersiz.');
    } catch (err) { alert('Sistem hatası.'); }
    finally { setIsLoggingIn(false); }
  };

  if (view === 'landing' && !embedded) return <LandingPage onEnter={() => setView('login')} />;
  
  if (view === 'login' || (view === 'landing' && embedded)) {
    return (
      <div className="absolute inset-0 bg-[#d4dce8] flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-[340px] bg-[#d4dce8] border-2 border-white shadow-xl">
          <div className="bg-[#000080] text-white px-2 py-1 text-xs font-bold flex justify-between">
            <span>Workigom Chat Login</span>
            {!embedded && <X size={14} onClick={() => setView('landing')} />}
          </div>
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <input type="email" placeholder="Email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-2 border-2 border-gray-400 outline-none focus:border-[#000080]" />
            <input type="password" placeholder="Şifre" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-2 border-2 border-gray-400 outline-none focus:border-[#000080]" />
            <button disabled={isLoggingIn} className="w-full bg-[#d4dce8] border-2 border-white py-2 font-bold shadow-md">GİRİŞ YAP</button>
            <button type="button" onClick={() => setView('register')} className="w-full text-[#000080] text-[10px] font-bold uppercase underline">Yeni Kayıt Ol</button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'register') return <RegistrationForm onClose={() => setView('login')} onSuccess={() => setView('pending')} />;
  if (view === 'pending') return <div className="absolute inset-0 bg-[#d4dce8] flex items-center justify-center font-mono">Onay Bekleniyor...</div>;

  // --- MOBİL GÖRÜNÜM (TELEFONLAR) ---
  if (isMobile) {
    return (
      <div ref={containerRef} className="fixed inset-0 flex flex-col bg-white overflow-hidden font-mono text-black">
        {/* Mobile Header */}
        <div className="h-14 bg-[#000080] text-white flex items-center px-4 shrink-0 shadow-lg z-50">
          <button onClick={() => setIsLeftDrawerOpen(true)} className="p-2 -ml-2"><Menu size={24} /></button>
          <div className="flex-1 font-black text-sm ml-2 uppercase truncate">{activeTab}</div>
          <button onClick={() => setShowUserList(true)} className="p-2"><UsersIcon size={24} /></button>
        </div>

        {/* Mobile Messages Area */}
        <div className="flex-1 overflow-hidden relative">
          <MessageList messages={messages} currentUser={userName} blockedUsers={[]} onNickClick={(e, n) => initiatePrivateChat(n)} />
          
          {/* Mobil User List Overlay */}
          {showUserList && (
            <div className="absolute inset-0 z-[100] animate-in slide-in-from-right duration-200">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowUserList(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-[80%] bg-white shadow-2xl flex flex-col">
                <div className="p-4 bg-gray-100 border-b flex justify-between items-center">
                  <span className="font-bold text-xs uppercase">ODADAKİLER</span>
                  <X onClick={() => setShowUserList(false)} />
                </div>
                <UserList users={[userName, 'Admin', 'GeminiBot', 'Esra', 'Can']} currentUser={userName} onClose={() => setShowUserList(false)} />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Input Area (En Alta Kilitli) */}
        <div className="shrink-0 bg-gray-100 border-t p-2 pb-[env(safe-area-inset-bottom,12px)] z-50">
          <form onSubmit={handleSend} className="flex gap-2 h-12">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 bg-white border border-gray-300 rounded-full px-4 text-[16px] outline-none"
              placeholder="Mesaj yazın..."
            />
            <button type="submit" className="w-12 h-12 bg-[#000080] text-white rounded-full flex items-center justify-center active:scale-90 transition-transform">
              <Send size={20} />
            </button>
          </form>
        </div>

        {/* Mobile Left Menu Overlay */}
        {isLeftDrawerOpen && (
          <div className="absolute inset-0 z-[200] animate-in slide-in-from-left duration-200">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsLeftDrawerOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-[75%] bg-[#d4dce8] shadow-2xl flex flex-col">
              <div className="p-6 bg-[#000080] text-white font-bold flex justify-between items-center">
                <span>KANALLAR</span>
                <X onClick={() => setIsLeftDrawerOpen(false)} />
              </div>
              <div className="p-4 space-y-2 overflow-y-auto">
                {['#Sohbet', '#Yardim', '#Radyo'].map(c => (
                  <button key={c} onClick={() => { setActiveTab(c.toLowerCase()); setIsLeftDrawerOpen(false); }} className={`w-full text-left p-4 rounded text-sm font-bold uppercase ${activeTab === c.toLowerCase() ? 'bg-[#000080] text-white' : 'bg-white'}`}>
                    <Hash size={14} className="inline mr-2" /> {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- DESKTOP GÖRÜNÜM (BİLGİSAYARLAR - KLASİK mIRC) ---
  return (
    <div ref={containerRef} className="flex flex-col bg-[#d4dce8] overflow-hidden font-mono w-full h-full border-2 border-white shadow-inner">
      <div className="h-8 bg-[#000080] text-white flex items-center px-2 text-[11px] font-bold select-none shrink-0">
        <Menu size={14} className="mr-2 opacity-50" />
        <div className="flex-1 flex gap-1 h-full items-center">
          {['#Sohbet', '#Yardim', '#Radyo'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} className={`px-4 h-[90%] flex items-center uppercase transition-colors ${activeTab === tab.toLowerCase() ? 'bg-[#d4dce8] text-black border-t-2 border-white' : 'hover:bg-blue-800'}`}>{tab}</button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden bg-white">
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-300">
          <MessageList messages={messages} currentUser={userName} blockedUsers={[]} onNickClick={(e, n) => initiatePrivateChat(n)} />
        </div>
        <div className="w-52 flex flex-col shrink-0 bg-[#d4dce8]">
          <UserList users={[userName, 'Admin', 'GeminiBot', 'Can', 'Selin']} currentUser={userName} onClose={() => {}} />
        </div>
      </div>

      <div className="h-12 bg-[#d4dce8] border-t-2 border-white p-2 shrink-0">
        <form onSubmit={handleSend} className="flex gap-1 h-full">
          <div className="flex-1 bg-white border border-gray-400 shadow-inner px-2 flex items-center">
            <span className="text-[#000080] font-bold mr-1">{userName}:</span>
            <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} className="flex-1 outline-none text-sm" placeholder="Buraya yazın..." />
          </div>
          <button type="submit" className="px-4 bg-[#d4dce8] border-2 border-white shadow-[1px_1px_0_gray] text-xs font-bold active:shadow-none">GÖNDER</button>
        </form>
      </div>
    </div>
  );
};

export default App;
