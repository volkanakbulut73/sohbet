
import React, { useState, useEffect, useRef } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import { ChatModuleProps } from './types';
import { storageService } from './services/storageService';
import { 
  Menu, X, Lock, Users as UsersIcon, Hash, Send, ChevronRight
} from 'lucide-react';

const App: React.FC<ChatModuleProps> = ({ externalUser, embedded = false }) => {
  const [view, setView] = useState<'login' | 'chat' | 'pending'>(externalUser ? 'chat' : 'login');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isChannelsOpen, setIsChannelsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    userName, setUserName, activeTab, setActiveTab, 
    messages, sendMessage, initiatePrivateChat 
  } = useChatCore(externalUser || '');

  // MOBİL KLAVYE VE VIEWPORT TAKİBİ
  useEffect(() => {
    const updateLayout = () => {
      setIsMobile(window.innerWidth < 1024);
      if (containerRef.current && window.visualViewport) {
        // VisualViewport: Klavye açıldığında gerçek görünen alanı verir.
        const vv = window.visualViewport;
        containerRef.current.style.height = `${vv.height}px`;
        // Sayfanın yukarı kaymasını engelle
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('resize', updateLayout);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateLayout);
      window.visualViewport.addEventListener('scroll', updateLayout);
    }
    updateLayout();
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.visualViewport?.removeEventListener('resize', updateLayout);
      window.visualViewport?.removeEventListener('scroll', updateLayout);
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
      } else alert('Giriş başarısız.');
    } catch (err) { alert('Hata oluştu.'); }
    finally { setIsLoggingIn(false); }
  };

  if (view === 'login') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#d4dce8] p-4">
        <div className="w-full max-w-[320px] border-2 border-white bg-[#d4dce8] shadow-2xl">
          <div className="bg-[#000080] text-white px-2 py-1 text-[11px] font-bold">Workigom Chat Login</div>
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <input type="email" placeholder="E-posta" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-2 border-2 border-gray-400 outline-none text-sm" />
            <input type="password" placeholder="Şifre" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-2 border-2 border-gray-400 outline-none text-sm" />
            <button disabled={isLoggingIn} className="w-full bg-[#d4dce8] border-2 border-white py-2 font-black shadow-[2px_2px_0_gray] active:shadow-none uppercase text-xs">Bağlan</button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'pending') return <div className="flex-1 flex items-center justify-center font-bold italic">ONAY BEKLENİYOR...</div>;

  // --- MOBİL GÖRÜNÜM (TELEGRAM / WHATSAPP TARZI) ---
  if (isMobile) {
    return (
      <div ref={containerRef} className="flex flex-col bg-white overflow-hidden w-full h-full relative font-mono">
        {/* Header */}
        <header className="h-14 bg-[#000080] text-white flex items-center px-4 shrink-0 z-50">
          <button onClick={() => setIsChannelsOpen(true)} className="p-1"><Menu size={24} /></button>
          <div className="flex-1 text-center font-black text-sm uppercase tracking-tighter italic">{activeTab}</div>
          <button onClick={() => setIsUserListOpen(true)} className="p-1"><UsersIcon size={24} /></button>
        </header>

        {/* Mesaj Alanı (Flex-1) */}
        <main className="flex-1 relative overflow-hidden bg-white">
          <MessageList messages={messages} currentUser={userName} blockedUsers={[]} onNickClick={(e, n) => initiatePrivateChat(n)} />
          
          {/* Mobil User List Drawer */}
          {isUserListOpen && (
            <div className="absolute inset-0 z-[100] flex justify-end">
              <div className="absolute inset-0 bg-black/50" onClick={() => setIsUserListOpen(false)} />
              <div className="relative w-[80%] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                <div className="p-4 bg-gray-100 border-b flex justify-between items-center shrink-0">
                  <span className="font-black text-xs uppercase">Online</span>
                  <X onClick={() => setIsUserListOpen(false)} />
                </div>
                <UserList users={[userName, 'Admin', 'GeminiBot', 'Esra', 'Can']} currentUser={userName} onClose={() => setIsUserListOpen(false)} />
              </div>
            </div>
          )}
        </main>

        {/* MESAJ YAZMA KUTUSU (HER ZAMAN GÖRÜNÜR) */}
        <footer className="shrink-0 bg-gray-50 border-t p-2 z-[60]">
          <form onSubmit={handleSend} className="flex gap-2 items-end">
            <div className="flex-1 bg-white border border-gray-300 rounded-2xl px-4 py-2 min-h-[44px] flex items-center">
              <input 
                type="text" 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="w-full bg-transparent outline-none text-[16px] py-1"
                placeholder="Mesaj yaz..."
                autoComplete="off"
              />
            </div>
            <button type="submit" className="w-11 h-11 bg-[#000080] text-white rounded-full flex items-center justify-center shrink-0 shadow-lg active:scale-90 transition-transform">
              <Send size={20} />
            </button>
          </form>
          {/* Ana sitenin barı için opsiyonel boşluk (sadece ana sitedeyse) */}
          <div className="h-2 w-full"></div>
        </footer>

        {/* Mobil Sol Kanal Drawer */}
        {isChannelsOpen && (
          <div className="absolute inset-0 z-[200] flex">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsChannelsOpen(false)} />
            <div className="relative w-[80%] bg-[#d4dce8] h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
              <div className="p-4 bg-[#000080] text-white font-black flex justify-between items-center shrink-0">
                <span className="text-xs uppercase">ODALAR</span>
                <X onClick={() => setIsChannelsOpen(false)} />
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {['#Sohbet', '#Yardim', '#Radyo', '#Oyun'].map(c => (
                  <button key={c} onClick={() => { setActiveTab(c.toLowerCase()); setIsChannelsOpen(false); }} className={`w-full text-left p-4 rounded-lg font-bold flex items-center gap-3 ${activeTab === c.toLowerCase() ? 'bg-[#000080] text-white shadow-lg' : 'bg-white border'}`}>
                    <Hash size={18} /> {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- MASAÜSTÜ GÖRÜNÜM (mIRC STİLİ) ---
  return (
    <div ref={containerRef} className="flex flex-col bg-[#d4dce8] w-full h-full border-2 border-white shadow-inner font-mono overflow-hidden">
      <header className="h-8 bg-[#000080] text-white flex items-center px-2 text-[11px] font-bold shrink-0">
        <div className="flex-1 flex gap-1 h-full items-center">
          {['#Sohbet', '#Yardim'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} className={`px-4 h-[85%] uppercase transition-colors ${activeTab === tab.toLowerCase() ? 'bg-[#d4dce8] text-black border-t-2 border-white' : 'hover:bg-blue-800'}`}>{tab}</button>
          ))}
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden bg-white">
        <main className="flex-1 relative min-w-0 border-r border-gray-300">
          <MessageList messages={messages} currentUser={userName} blockedUsers={[]} onNickClick={(e, n) => initiatePrivateChat(n)} />
        </main>
        <aside className="w-52 bg-[#d4dce8] shrink-0 flex flex-col">
          <UserList users={[userName, 'Admin', 'GeminiBot', 'Selin', 'Eray']} currentUser={userName} onClose={() => {}} />
        </aside>
      </div>

      <footer className="h-14 bg-[#d4dce8] border-t-2 border-white p-2 shrink-0">
        <form onSubmit={handleSend} className="flex gap-1 h-full">
          <div className="flex-1 bg-white border border-gray-400 shadow-inner px-3 flex items-center">
            <span className="text-[#000080] font-black mr-2 text-xs truncate max-w-[100px]">{userName}:</span>
            <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} className="flex-1 outline-none text-sm" placeholder="Buraya yazın..." />
          </div>
          <button type="submit" className="px-6 bg-[#d4dce8] border-2 border-white shadow-[2px_2px_0_gray] text-xs font-black uppercase active:shadow-none active:translate-y-[1px]">GÖNDER</button>
        </form>
      </footer>
    </div>
  );
};

export default App;
