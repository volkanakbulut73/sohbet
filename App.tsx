
import React, { useState, useEffect } from 'react';
import { useChatCore } from './hooks/useChatCore';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import { ChatModuleProps } from './types';
import { Hash, Menu, Users, Bot, Send, User as UserIcon, X, AlertTriangle } from 'lucide-react';

const ChatModule: React.FC<ChatModuleProps> = ({ externalUser, className = "" }) => {
  const [currentUser] = useState<string>(externalUser || `User_${Math.floor(Math.random() * 1000)}`);
  const { 
    channels, 
    privateChats, 
    activeTab, 
    setActiveTab, 
    messages, 
    sendMessage, 
    initiatePrivateChat,
    isAILoading,
    error
  } = useChatCore(currentUser);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(true);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsUserListOpen(false);
    }
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const isChannel = channels.some(c => c.name === activeTab);

  return (
    <div className={`flex h-full w-full bg-slate-950 text-slate-200 overflow-hidden font-sans antialiased rounded-lg shadow-2xl border border-slate-800/50 relative ${className}`}>
      
      {/* 0. HATA PANELİ (Config hatası varsa) */}
      {error && (
        <div className="absolute inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-amber-500/20 rounded-3xl flex items-center justify-center mx-auto ring-1 ring-amber-500/50">
              <AlertTriangle size={40} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Yapılandırma Gerekli</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                {error}
                <br /><br />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-900 px-2 py-1 rounded">
                  SQL Editor: RLS Politikalarını eklemeyi unutmayın!
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. SOL PANEL */}
      <aside className={`
        fixed lg:relative z-50 h-full transition-all duration-300 ease-in-out border-r border-slate-800/40
        ${isSidebarOpen ? 'translate-x-0 w-64 sm:w-72' : '-translate-x-full lg:translate-x-0 w-64 lg:w-72'}
      `}>
        <Sidebar 
          channels={channels} 
          privateChats={privateChats}
          activeTab={activeTab} 
          onSelect={(name) => {
            setActiveTab(name);
            setIsSidebarOpen(false);
          }}
        />
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-4 -right-12 p-2 bg-slate-800 rounded-full text-white shadow-xl"
        >
          <X size={20} />
        </button>
      </aside>

      {/* 2. ANA MERKEZ */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-900 relative">
        <header className="h-16 border-b border-slate-800/60 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-slate-900/50 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isChannel ? 'bg-sky-500/10' : 'bg-indigo-500/10'}`}>
                {isChannel ? <Hash size={18} className="text-sky-500" /> : <UserIcon size={18} className="text-indigo-500" />}
              </div>
              <h1 className="font-bold text-base sm:text-lg tracking-tight truncate max-w-[120px] sm:max-w-none uppercase">
                {activeTab}
              </h1>
            </div>
          </div>

          <button 
            onClick={() => setIsUserListOpen(!isUserListOpen)}
            className={`p-2.5 rounded-xl transition-all ${isUserListOpen ? 'bg-sky-500/20 text-sky-400' : 'hover:bg-slate-800 text-slate-500'}`}
          >
            <Users size={22} />
          </button>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 overflow-hidden relative flex flex-col bg-gradient-to-b from-slate-900 to-slate-950">
            <MessageList messages={messages} currentUser={currentUser} />
            
            {isAILoading && (
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-max">
                  <div className="flex items-center gap-3 px-4 py-2 bg-sky-600/20 border border-sky-500/30 backdrop-blur-xl rounded-2xl text-xs font-bold text-sky-400 shadow-2xl animate-pulse">
                     <Bot size={16} />
                     <span>Gemini yanıt üretiyor...</span>
                  </div>
               </div>
            )}
          </div>

          <aside className={`
            absolute lg:relative right-0 top-0 bottom-0 z-30 border-l border-slate-800/40 bg-slate-950/95 lg:bg-slate-950/30 transition-all duration-300 ease-in-out
            ${isUserListOpen ? 'w-64 xl:w-72 translate-x-0' : 'w-0 translate-x-full overflow-hidden'}
          `}>
            <UserList 
              users={isChannel ? (channels.find(c => c.name === activeTab)?.users || []) : [activeTab, currentUser]} 
              onClose={() => setIsUserListOpen(false)}
              onUserClick={(u) => {
                initiatePrivateChat(u);
                if (window.innerWidth < 1024) setIsUserListOpen(false);
              }}
            />
          </aside>
        </div>

        <footer className="p-3 sm:p-5 border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
          <form onSubmit={handleFormSubmit} className="max-w-5xl mx-auto flex gap-2 items-end">
            <div className="flex-1 relative group">
              <textarea
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleFormSubmit(e);
                  }
                }}
                placeholder={isChannel ? `#${activeTab} kanalına yaz...` : `${activeTab} ile sohbete başla...`}
                className="w-full bg-slate-900/50 border border-slate-800 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-2xl px-4 py-3 sm:py-4 resize-none transition-all text-sm sm:text-base outline-none scrollbar-hide shadow-inner"
              />
            </div>
            <button 
              type="submit"
              disabled={!inputText.trim() || !!error}
              className="p-3.5 sm:p-4 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl transition-all shadow-lg shadow-sky-600/20 active:scale-95 flex-shrink-0"
            >
              <Send size={22} />
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="h-screen w-screen p-0 sm:p-4 md:p-8 bg-slate-900 overflow-hidden">
      <ChatModule className="shadow-2xl ring-1 ring-white/5" />
    </div>
  );
};

export default App;
