import React, { useState, useEffect } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import LandingPage from './components/LandingPage';
import { ChatModuleProps } from './types';
import { CHAT_MODULE_CONFIG } from './config';
import { Menu, X, Hash, Users, Globe, LogOut, MessageSquare, Send, Lock, ChevronRight } from 'lucide-react';

type AppView = 'landing' | 'login' | 'chat';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "" }) => {
  const [view, setView] = useState<AppView>('landing');
  const [tempNick, setTempNick] = useState('');
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  
  const { 
    userName, setUserName,
    channels, privateChats, 
    activeTab, setActiveTab, 
    messages, sendMessage, 
    isAILoading, error: coreError,
    initiatePrivateChat
  } = useChatCore(externalUser || '');

  const [inputText, setInputText] = useState('');

  useEffect(() => {
    const savedNick = localStorage.getItem('mirc_nick');
    if (savedNick && !externalUser) {
      setTempNick(savedNick);
    }
    if (externalUser) {
      setView('chat');
    }
  }, [externalUser]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempNick.trim()) return;
    setUserName(tempNick);
    localStorage.setItem('mirc_nick', tempNick);
    setView('chat');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  // 1. ANASAYFA GÖRÜNÜMÜ
  if (view === 'landing') {
    return <LandingPage onEnter={() => setView('login')} />;
  }

  // 2. GİRİŞ (LOGIN) GÖRÜNÜMÜ - Landing ile uyumlu
  if (view === 'login') {
    return (
      <div className="fixed inset-0 bg-[#0b0f14] flex items-center justify-center p-4 z-[100] font-mono">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00ff99] rounded-full blur-[150px]"></div>
        </div>

        <div className="w-full max-w-md bg-[#0b0f14] border border-gray-800 shadow-[20px_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden fade-in">
          {/* Top Bar */}
          <div className="bg-gray-900 text-gray-400 px-4 py-2 text-[10px] font-bold flex justify-between items-center border-b border-gray-800">
            <span className="flex items-center gap-2">
               <Lock size={12} className="text-[#00ff99]" />
               SYSTEM_ACCESS_PROTOCOL v1.0
            </span>
            <X size={14} className="cursor-pointer hover:text-white" onClick={() => setView('landing')} />
          </div>

          <div className="p-10 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black italic text-white tracking-tighter">
                WORKIGOM<span className="text-[#00ff99]">_CHAT</span>
              </h1>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.3em]">Identity Verification Portal</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#00ff99] uppercase flex items-center gap-1">
                  <ChevronRight size={12} /> ENTER NICKNAME / IDENTITY:
                </label>
                <input 
                  type="text" 
                  value={tempNick}
                  onChange={e => setTempNick(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 p-4 text-white text-sm outline-none focus:border-[#00ff99] transition-colors font-mono"
                  placeholder="..."
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-4">
                <button type="submit" className="w-full bg-[#00ff99] text-black py-4 text-xs font-black hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-tighter">
                  Doğrula ve Bağlan
                </button>
                <button 
                  type="button"
                  onClick={() => setView('landing')}
                  className="w-full text-[9px] text-gray-600 font-bold hover:text-gray-400 uppercase tracking-widest transition-colors"
                >
                  İşlemi İptal Et
                </button>
              </div>
            </form>

            <div className="text-[8px] text-center text-gray-700 leading-relaxed italic">
              * Bu sisteme giriş yaparak tüm topluluk kurallarını ve güvenlik protokollerini kabul etmiş sayılırsınız.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. SOHBET MODÜLÜ GÖRÜNÜMÜ (Klasik mIRC Ruhu Korundu)
  return (
    <div className={`h-screen w-screen flex flex-col bg-white overflow-hidden select-none ${className}`}>
      {/* Üst Bar (mIRC Title Bar) */}
      <div className="h-8 bg-[#000080] flex items-center justify-between px-2 text-white shrink-0 z-50">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsLeftDrawerOpen(!isLeftDrawerOpen)} className="p-1 hover:bg-white/20 rounded-sm">
            <Menu size={16} />
          </button>
          <span className="text-[11px] font-bold truncate tracking-tight">Workigom Online - [{activeTab}]</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)} className="p-1 hover:bg-white/20 rounded-sm lg:hidden">
            <Users size={16} />
          </button>
          <button onClick={() => setView('landing')} title="Çıkış Yap" className="p-1 hover:bg-red-600/50 rounded-sm transition-colors">
             <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Sekmeler (mIRC Switcher) */}
      <div className="h-7 bg-[#d4dce8] border-b border-gray-400 flex items-center gap-0.5 px-1 shrink-0 overflow-x-auto no-scrollbar">
        {['#sohbet', ...privateChats].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 h-full text-[10px] font-bold border-t border-l border-r border-gray-500 transition-colors flex items-center gap-1 shrink-0 ${activeTab === tab ? 'bg-white border-b-white z-10' : 'bg-gray-300 opacity-80'}`}
          >
            {tab.startsWith('#') ? <Hash size={10} /> : <MessageSquare size={10} />}
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sol Panel - Kanallar */}
        <div className={`absolute lg:relative inset-y-0 left-0 w-64 bg-[#d4dce8] border-r border-gray-400 z-40 transition-transform duration-300 ${isLeftDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:w-48'}`}>
          <div className="p-2 h-full flex flex-col">
             <div className="bg-white border border-gray-500 flex-1 overflow-y-auto">
                <div className="bg-[#000080] text-white p-1 text-[9px] font-bold flex justify-between items-center">
                  <span>KANALLAR</span>
                  <Globe size={10} />
                </div>
                <div className="p-1 space-y-0.5">
                   {['#sohbet', '#yardim', '#teknoloji', '#oyun'].map(c => (
                     <button 
                      key={c} 
                      onClick={() => { setActiveTab(c); setIsLeftDrawerOpen(false); }} 
                      className={`w-full text-left px-2 py-1 text-[11px] font-mono hover:bg-blue-600 hover:text-white ${activeTab === c ? 'bg-blue-800 text-white' : 'text-black'}`}
                     >
                       {c}
                     </button>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Ana Sohbet Ekranı */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
           {isAILoading && (
             <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 animate-pulse z-10" />
           )}
           <MessageList 
             messages={messages} 
             currentUser={userName} 
             blockedUsers={[]} 
             onNickClick={(e, n) => initiatePrivateChat(n)} 
           />
        </div>

        {/* Sağ Panel - Kullanıcılar */}
        <div className={`absolute lg:relative inset-y-0 right-0 w-48 bg-[#d4dce8] border-l border-gray-400 z-40 transition-transform duration-300 ${isRightDrawerOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'}`}>
           <UserList 
            users={[userName, 'GeminiBot', 'Admin', 'User_1']} 
            currentUser={userName} 
            onUserClick={(e, n) => { initiatePrivateChat(n); setIsRightDrawerOpen(false); }}
            onClose={() => setIsRightDrawerOpen(false)} 
            currentOps={['Admin', 'GeminiBot']}
           />
        </div>
      </div>

      {/* Mesaj Giriş Alanı */}
      <div className="p-1 bg-[#d4dce8] border-t border-gray-400 shrink-0">
        <form onSubmit={handleSend} className="flex gap-1">
          <div className="flex-1 bg-white border border-gray-600 px-2 py-1 flex items-center shadow-inner">
             <span className="text-[11px] font-bold text-blue-900 mr-2 shrink-0">[{userName}]</span>
             <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 text-xs outline-none bg-transparent font-mono"
              placeholder="Mesaj yazın..."
             />
          </div>
          <button type="submit" className="bg-[#c0c0c0] border-2 border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] px-4 py-1 flex items-center justify-center active:shadow-none active:translate-y-[1px]">
            <Send size={14} className="text-gray-800" />
          </button>
        </form>
      </div>

      {/* Durum Çubuğu */}
      <div className="h-5 bg-[#d4dce8] border-t border-gray-300 flex items-center justify-between px-2 text-[9px] font-bold text-gray-600 shrink-0">
        <div className="flex gap-4 items-center">
          <span className="uppercase">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          <span className="hidden sm:inline">SERVER: {CHAT_MODULE_CONFIG.DOMAIN}</span>
          <span>NICK: {userName}</span>
        </div>
        <div className="flex items-center gap-1 text-green-700">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          CONNECTED
        </div>
      </div>

      {(isLeftDrawerOpen || isRightDrawerOpen) && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => { setIsLeftDrawerOpen(false); setIsRightDrawerOpen(false); }} />
      )}
    </div>
  );
};

export default App;