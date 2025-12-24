
import React, { useState, useEffect } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import { ChatModuleProps } from './types';
import { CHAT_MODULE_CONFIG } from './config';
import { Menu, X, Hash, Users, Globe, Terminal, LogOut, ChevronRight, MessageSquare } from 'lucide-react';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "" }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempNick.trim()) return;
    setUserName(tempNick);
    setIsLoggedIn(true);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-[#000080] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#d4dce8] border-2 border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
          <div className="bg-[#000080] text-white px-2 py-1 text-xs font-bold flex justify-between items-center">
            <span>mIRC Setup</span>
            <X size={14} className="cursor-pointer" />
          </div>
          <div className="p-6 space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-black italic text-[#000080]">WORKIGOM</h1>
              <p className="text-[10px] font-bold text-gray-600 uppercase">v{CHAT_MODULE_CONFIG.VERSION} Connect</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#000080]">NICKNAME:</label>
                <input 
                  type="text" 
                  value={tempNick}
                  onChange={e => setTempNick(e.target.value)}
                  className="w-full border-2 border-gray-400 p-2 text-sm bg-white outline-none focus:border-[#000080] font-mono"
                  placeholder="Guest..."
                  autoFocus
                />
              </div>
              <button type="submit" className="w-full bg-[#c0c0c0] border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] py-2 text-xs font-bold active:shadow-none translate-y-0 active:translate-y-0.5">
                ENTER CHAT
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen flex flex-col bg-white overflow-hidden select-none ${className}`}>
      {/* Mavi Başlık (Header) */}
      <div className="h-8 bg-[#000080] flex items-center justify-between px-2 text-white shrink-0 z-50">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsLeftDrawerOpen(!isLeftDrawerOpen)} className="p-1 hover:bg-white/20 rounded">
            <Menu size={16} />
          </button>
          <span className="text-[11px] font-bold truncate tracking-tight">Workigom - [{activeTab}]</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)} className="p-1 hover:bg-white/20 rounded">
            <Users size={16} />
          </button>
          <button onClick={() => window.location.reload()} className="p-1 hover:bg-white/20 rounded">
             <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Sekme Çubuğu (Tabs) */}
      <div className="h-7 bg-[#d4dce8] border-b border-gray-400 flex items-center gap-0.5 px-1 shrink-0 overflow-x-auto no-scrollbar">
        {['sohbet', ...privateChats].map(tab => (
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

      {/* Ana İçerik Alanı */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sol Menü (Drawer) */}
        <div className={`absolute inset-y-0 left-0 w-64 bg-[#d4dce8] border-r border-gray-400 z-40 transition-transform duration-300 ${isLeftDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
          <div className="p-3">
             <div className="bg-white border border-gray-400 p-2 h-full">
                <h3 className="text-[10px] font-black border-b border-gray-200 mb-2 pb-1 text-[#000080]">KANALLAR</h3>
                <div className="space-y-1">
                   {['#sohbet', '#yardim', '#teknoloji'].map(c => (
                     <button key={c} onClick={() => { setActiveTab(c); setIsLeftDrawerOpen(false); }} className={`w-full text-left px-2 py-1 text-xs hover:bg-[#000080] hover:text-white rounded ${activeTab === c ? 'bg-[#000080] text-white' : ''}`}>
                       {c}
                     </button>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Mesaj Listesi */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
           <MessageList 
             messages={messages} 
             currentUser={userName} 
             blockedUsers={[]} 
             onNickClick={(e, n) => initiatePrivateChat(n)} 
           />
        </div>

        {/* Sağ Menü (User List Drawer) */}
        <div className={`absolute inset-y-0 right-0 w-48 bg-[#d4dce8] border-l border-gray-400 z-40 transition-transform duration-300 ${isRightDrawerOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}`}>
           <UserList 
            users={[userName, 'GeminiBot', 'Admin', 'Kullanici_1']} 
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
              placeholder="Mesaj yazın veya /yardim..."
             />
          </div>
          <button type="submit" className="bg-[#c0c0c0] border-2 border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] px-4 py-1 text-[10px] font-bold active:shadow-none">
            GÖNDER
          </button>
        </form>
      </div>

      {/* Alt Durum Çubuğu (Status Bar) */}
      <div className="h-5 bg-[#d4dce8] border-t border-gray-300 flex items-center justify-between px-2 text-[9px] font-bold text-gray-600 shrink-0">
        <div className="flex gap-4">
          <span>{new Date().toLocaleDateString()}</span>
          <span>BAĞLI: {userName}</span>
          <span className="hidden sm:inline">SUNUCU: workigomchat.online</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          AKTİF
        </div>
      </div>

      {/* Mobil Karartma Overlay */}
      {(isLeftDrawerOpen || isRightDrawerOpen) && (
        <div className="fixed inset-0 bg-black/30 z-30" onClick={() => { setIsLeftDrawerOpen(false); setIsRightDrawerOpen(false); }} />
      )}
    </div>
  );
};

export default App;
