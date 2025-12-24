
import React, { useState, useEffect, useRef } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import { ChatModuleProps, MessageType } from './types';
import { CHAT_MODULE_CONFIG } from './config';
import { Menu, Settings, X, Send, Shield, Smile, Lock, Unlock, Trash2, Hash, MessageSquare, UserX, UserCheck, ToggleLeft, ToggleRight } from 'lucide-react';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "" }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tempNick, setTempNick] = useState('');
  const [loginError, setLoginError] = useState('');

  const { 
    userName, setUserName,
    isAdmin, setIsAdmin,
    channels, privateChats, 
    blockedUsers, blockUser, unblockUser,
    allowPrivate, toggleAllowPrivate,
    activeTab, setActiveTab, 
    messages, sendMessage, 
    isAILoading, isOp, error: coreError,
    isMuted, setIsMuted,
    initiatePrivateChat, closeTab, clearScreen
  } = useChatCore(externalUser || '');

  const [inputText, setInputText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isPrivateTab = !activeTab.startsWith('#') && activeTab !== 'sohbet';
  const isTargetBlocked = blockedUsers.includes(activeTab);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  if (!isLoggedIn) {
    return (
      <div className="h-screen w-screen bg-[#f4f7ff] flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm space-y-6 bg-white p-8 rounded-xl shadow-2xl border border-gray-200">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-[#1a1c2c]">mIRC Connect</h1>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">v{CHAT_MODULE_CONFIG.VERSION}</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if(tempNick) setIsLoggedIn(true); setUserName(tempNick); }} className="space-y-4">
            <input 
              type="text" 
              autoFocus
              value={tempNick}
              onChange={e => setTempNick(e.target.value)}
              className="w-full border-2 border-gray-200 p-3 rounded-lg text-sm focus:border-blue-500 outline-none transition-all"
              placeholder="Nickname girin..."
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-all">BAĞLAN</button>
          </form>
        </div>
      </div>
    );
  }

  const currentChannel = channels.find(c => c.name === activeTab);

  return (
    <div className={`h-screen w-screen bg-white flex flex-col font-sans overflow-hidden ${className}`}>
      {/* Header */}
      <header className="h-10 bg-[#000080] flex items-center justify-between px-2 shrink-0 text-white z-40 border-b border-black/20">
        <div className="relative" ref={menuRef}>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded flex items-center gap-1.5 text-[11px] font-bold border border-white/20">
            <Menu size={14} /> mIRC
          </button>
          {isMenuOpen && (
            <div className="absolute top-9 left-0 w-48 bg-white shadow-2xl rounded border border-gray-200 py-1 z-50 text-black">
              <button onClick={() => { setIsSettingsOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-[11px] hover:bg-blue-50 flex items-center gap-2">
                <Settings size={14} /> Ayarlar & Tercihler
              </button>
              <button onClick={() => window.location.reload()} className="w-full text-left px-4 py-2 text-[11px] hover:bg-red-50 text-red-600 font-bold border-t">
                Çıkış Yap
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Block actions: ONLY on Private Tabs */}
          {isPrivateTab && activeTab !== 'GeminiBot' && (
            <div className="flex items-center gap-1 mr-2 bg-black/10 p-0.5 rounded">
              {isTargetBlocked ? (
                <button 
                  onClick={() => unblockUser(activeTab)}
                  className="bg-green-600 hover:bg-green-700 text-white text-[9px] px-2 py-0.5 rounded flex items-center gap-1 font-bold shadow-inner"
                >
                  <UserCheck size={10} /> Engel Kaldır
                </button>
              ) : (
                <button 
                  onClick={() => blockUser(activeTab)}
                  className="bg-red-600 hover:bg-red-700 text-white text-[9px] px-2 py-0.5 rounded flex items-center gap-1 font-bold shadow-inner"
                >
                  <UserX size={10} /> Engelle
                </button>
              )}
            </div>
          )}

          {/* Admin tools: ONLY on Channels */}
          {!isPrivateTab && isOp && (
            <div className="flex items-center gap-1 mr-2 bg-black/20 p-0.5 rounded">
              <button onClick={clearScreen} className="p-1 hover:bg-white/10 rounded" title="Temizle">
                <Trash2 size={12} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-black/10 px-2 py-1 rounded border border-white/5">
            <span className="text-[10px] font-bold opacity-90">#{activeTab}</span>
            {activeTab !== 'sohbet' && (
              <button 
                onClick={() => closeTab(activeTab)}
                className="hover:text-red-400 p-0.5 transition-colors"
                title="Kapat"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="h-8 bg-[#f0f4f8] border-b border-gray-300 flex items-center gap-1 px-2 overflow-x-auto no-scrollbar">
        {channels.map(chan => (
          <div 
            key={chan.name} 
            className={`px-3 py-0.5 text-[10px] cursor-pointer rounded-t-sm border flex items-center gap-1.5 shrink-0 transition-all ${activeTab === chan.name ? 'bg-[#000080] text-white border-[#000080]' : 'bg-white text-blue-800 border-gray-200 hover:bg-blue-50'}`}
          >
            <div className="flex items-center gap-1" onClick={() => setActiveTab(chan.name)}>
              <Hash size={10} /> {chan.name}
            </div>
            {chan.name !== 'sohbet' && (
              <X 
                size={10} 
                className="hover:text-red-500 cursor-pointer ml-1" 
                onClick={(e) => { e.stopPropagation(); closeTab(chan.name); }} 
              />
            )}
          </div>
        ))}
        {privateChats.map(nick => (
          <div 
            key={nick} 
            className={`px-3 py-0.5 text-[10px] cursor-pointer rounded-t-sm border flex items-center gap-1.5 shrink-0 transition-all ${activeTab === nick ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-purple-700 border-gray-200 hover:bg-purple-50'}`}
          >
            <div className="flex items-center gap-1" onClick={() => setActiveTab(nick)}>
              <MessageSquare size={10} /> {nick}
            </div>
            <X 
              size={10} 
              className="hover:text-red-500 cursor-pointer ml-1" 
              onClick={(e) => { e.stopPropagation(); closeTab(nick); }} 
            />
          </div>
        ))}
      </nav>

      {/* Main Area */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col relative border-r border-gray-200">
          {coreError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-2xl z-50 animate-bounce max-w-[90%] text-center">
              {typeof coreError === 'string' ? coreError : JSON.stringify(coreError)}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <MessageList 
              messages={messages} 
              currentUser={userName} 
              blockedUsers={blockedUsers} 
              onNickClick={(e, nick) => initiatePrivateChat(nick)} 
            />
          </div>
        </div>
        <aside className="w-32 sm:w-40 bg-[#f0f4f8] shrink-0 border-l border-gray-200">
          <UserList 
            users={currentChannel?.users || [userName, 'GeminiBot']} 
            currentUser={userName} 
            onClose={() => {}} 
            onUserClick={(e, nick) => initiatePrivateChat(nick)} 
            blockedUsers={blockedUsers}
            currentOps={currentChannel?.ops || []}
            isAdmin={isAdmin}
          />
        </aside>
      </main>

      {/* Footer */}
      <footer className="p-2 bg-[#f0f4f8] border-t border-gray-300">
        <form onSubmit={handleSend} className="flex gap-1.5">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTargetBlocked || (currentChannel?.islocked && !isOp)}
            placeholder={isTargetBlocked ? "Bu kullanıcıyı engellediniz." : (currentChannel?.islocked && !isOp ? "Kilitli oda..." : "Mesaj yazın...")}
            className="flex-1 bg-white border border-gray-300 rounded px-3 py-1.5 text-[11.5px] outline-none focus:border-blue-500 disabled:bg-gray-100 transition-colors"
          />
          <button type="submit" className="bg-[#000080] text-white px-4 py-1.5 rounded font-bold text-[11px] hover:bg-blue-900 transition-colors active:scale-95">Gönder</button>
        </form>
      </footer>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-xs overflow-hidden border border-gray-300 animate-in zoom-in-95 duration-200">
            <div className="bg-[#000080] p-3 text-white flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center gap-2"><Settings size={14} /> Ayarlar</h3>
              <X className="cursor-pointer" size={16} onClick={() => setIsSettingsOpen(false)} />
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-gray-700">Özel Mesajları Kabul Et</span>
                  <span className="text-[9px] text-gray-400">Diğer kullanıcılar size yazabilsin mi?</span>
                </div>
                <button 
                  onClick={() => toggleAllowPrivate(!allowPrivate)}
                  className={`transition-colors duration-200 ${allowPrivate ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  {allowPrivate ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-gray-700">Bildirim Sesleri</span>
                </div>
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`px-3 py-1 rounded text-[9px] font-bold ${!isMuted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                  {isMuted ? 'KAPALI' : 'AÇIK'}
                </button>
              </div>

              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full bg-[#000080] text-white py-2 rounded font-bold text-xs mt-2"
              >
                KAPAT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
