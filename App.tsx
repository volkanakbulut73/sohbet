
import React, { useState, useEffect, useRef } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import { ChatModuleProps, MessageType } from './types';
import { CHAT_MODULE_CONFIG } from './config';
import { storageService } from './services/storageService';
import { Menu, Settings, X, Send, Shield, Smile, Lock, Unlock, Trash2, Hash, MessageSquare, UserX, UserCheck, ToggleLeft, ToggleRight, Sparkles, Save, Key, User, Share2, Check, ExternalLink } from 'lucide-react';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "" }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tempNick, setTempNick] = useState('');
  const [tempPass, setTempPass] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showShareToast, setShowShareToast] = useState(false);
  
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
    botInstruction, setBotInstruction, saveBotInstruction,
    initiatePrivateChat, closeTab, clearScreen
  } = useChatCore(externalUser || '');

  const [inputText, setInputText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [adminInstructionText, setAdminInstructionText] = useState(botInstruction);
  const [storedAdminCreds, setStoredAdminCreds] = useState({ user: 'admin', pass: 'admin123' });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    storageService.getAdminCredentials().then(setStoredAdminCreds);
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setActiveTab(roomParam);
    }
  }, []);

  useEffect(() => {
    setAdminInstructionText(botInstruction);
  }, [botInstruction]);

  useEffect(() => {
    if (tempNick.toLowerCase() === storedAdminCreds.user.toLowerCase()) {
      setShowPasswordField(true);
    } else {
      setShowPasswordField(false);
      setTempPass('');
    }
  }, [tempNick, storedAdminCreds]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempNick.trim()) return setLoginError('Lütfen bir isim girin.');
    if (showPasswordField && tempPass !== storedAdminCreds.pass) return setLoginError('Hatalı admin şifresi!');
    
    setIsAdmin(showPasswordField);
    setUserName(tempNick);
    setIsLoggedIn(true);
  };

  const handleShareRoom = () => {
    const url = `${CHAT_MODULE_CONFIG.BASE_URL}/?room=${encodeURIComponent(activeTab)}`;
    navigator.clipboard.writeText(url).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-[#000080] flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-sm bg-[#d4dce8] p-1 border-2 border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] transform scale-100 sm:scale-110">
          <div className="bg-[#000080] text-white px-3 py-1.5 text-xs font-bold flex justify-between items-center mb-4 select-none">
            <span className="tracking-widest">WORKIGOM LOGIN SYSTEM</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-[#d4dce8] border border-black"></div>
              <div className="w-3 h-3 bg-[#d4dce8] border border-black"></div>
            </div>
          </div>
          
          <div className="px-6 py-6 space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-black text-[#000080] italic tracking-tighter leading-none">WORKIGOM</h1>
              <div className="h-0.5 bg-[#000080] mt-1 w-2/3 mx-auto opacity-20"></div>
              <p className="text-[10px] uppercase font-bold text-gray-600 mt-2 tracking-[0.25em]">www.workigomchat.online</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#000080] uppercase tracking-wide">Takma Adınız:</label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="örn: Ahmet"
                  value={tempNick}
                  onChange={e => setTempNick(e.target.value)}
                  className="w-full border-2 border-gray-400 p-3 text-sm bg-white outline-none focus:border-[#000080] shadow-inner font-bold"
                />
              </div>

              {showPasswordField && (
                <div className="space-y-1 animate-in zoom-in-95">
                  <label className="text-[10px] font-black text-red-700 uppercase tracking-wide">Yönetici Şifresi:</label>
                  <input 
                    type="password" 
                    value={tempPass}
                    onChange={e => setTempPass(e.target.value)}
                    className="w-full border-2 border-red-500 p-3 text-sm bg-white outline-none focus:border-red-700 shadow-inner"
                  />
                </div>
              )}

              {loginError && <p className="text-red-600 text-[10px] font-black bg-red-50 p-2 border-l-4 border-red-600 uppercase animate-bounce">{loginError}</p>}

              <button type="submit" className="w-full bg-[#d4dce8] hover:bg-white border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[#000080] font-black py-3 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all uppercase tracking-widest text-xs">
                SUNUCUYA BAĞLAN
              </button>
            </form>
          </div>
          
          <div className="mt-4 p-2 text-center text-[9px] text-gray-500 font-bold opacity-50 select-none">
            v{CHAT_MODULE_CONFIG.VERSION} | Secured by SSL
          </div>
        </div>
      </div>
    );
  }

  const currentChannel = channels.find(c => c.name === activeTab);

  return (
    <div className={`h-screen w-screen bg-white flex flex-col font-mono overflow-hidden ${className}`}>
      {/* Header */}
      <header className="h-10 bg-[#000080] flex items-center justify-between px-3 shrink-0 text-white z-40">
        <div className="relative" ref={menuRef}>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-[11px] font-black border border-white/20 flex items-center gap-2 transition-colors">
            <Menu size={14} /> MENU
          </button>
          {isMenuOpen && (
            <div className="absolute top-9 left-0 w-56 bg-[#d4dce8] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] border border-white py-1 z-50 text-black animate-in slide-in-from-top-1">
              <button onClick={() => { setIsSettingsOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[12px] font-bold hover:bg-[#000080] hover:text-white flex items-center gap-3">
                <Settings size={16} /> Sistem Ayarları
              </button>
              <button onClick={() => { handleShareRoom(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[12px] font-bold hover:bg-[#000080] hover:text-white flex items-center gap-3">
                <Share2 size={16} /> Davet Linki Kopyala
              </button>
              <div className="border-t border-gray-400 my-1 mx-2"></div>
              <button onClick={() => window.location.reload()} className="w-full text-left px-4 py-3 text-[12px] font-black hover:bg-red-700 hover:text-white text-red-700 flex items-center gap-3">
                <X size={16} /> Bağlantıyı Kes
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showShareToast && (
            <div className="bg-green-600 text-white text-[10px] px-3 py-1 border border-white flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
              <Check size={12} /> Link Panoya Kopyalandı!
            </div>
          )}
          <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded border border-white/20">
            <span className="text-[11px] font-black tracking-wider truncate max-w-[100px]">{activeTab}</span>
            <button onClick={handleShareRoom} className="hover:text-sky-300 transition-colors">
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="h-10 bg-[#d4dce8] border-b border-gray-400 flex items-center gap-1 px-2 shrink-0 overflow-x-auto scrollbar-hide">
        {channels.map(chan => (
          <button 
            key={chan.name}
            onClick={() => setActiveTab(chan.name)}
            className={`px-4 py-1.5 text-[11px] font-black border-t border-l border-r border-gray-400 transition-all truncate min-w-[80px] max-w-[140px] uppercase tracking-tighter ${activeTab === chan.name ? 'bg-white -mb-[1px] border-b-white z-10 shadow-sm' : 'bg-gray-300 mt-1 opacity-70 hover:opacity-100'}`}
          >
            {chan.name}
          </button>
        ))}
        {privateChats.map(nick => (
          <button 
            key={nick}
            onClick={() => setActiveTab(nick)}
            className={`px-4 py-1.5 text-[11px] font-black border-t border-l border-r border-gray-400 transition-all truncate min-w-[80px] max-w-[140px] uppercase tracking-tighter ${activeTab === nick ? 'bg-purple-50 -mb-[1px] border-b-purple-50 text-purple-900 z-10 shadow-sm' : 'bg-purple-200/50 mt-1 opacity-70 hover:opacity-100'}`}
          >
            @{nick}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col relative border-r border-gray-300">
          <div className="flex-1 overflow-hidden">
            <MessageList messages={messages} currentUser={userName} blockedUsers={blockedUsers} onNickClick={(e, n) => initiatePrivateChat(n)} />
          </div>
          {coreError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[11px] font-black px-4 py-2 rounded shadow-2xl z-50 animate-in bounce-in">
              HATA: {String(coreError)}
            </div>
          )}
        </div>
        <aside className="w-32 sm:w-44 bg-[#f0f0f0] shrink-0 border-l border-gray-200">
          <UserList users={currentChannel?.users || [userName, 'GeminiBot']} currentUser={userName} onUserClick={(e, n) => initiatePrivateChat(n)} blockedUsers={blockedUsers} currentOps={currentChannel?.ops || []} isAdmin={isAdmin} onClose={() => {}} />
        </aside>
      </main>

      {/* Footer */}
      <footer className="p-3 bg-[#d4dce8] border-t border-gray-400 shrink-0 safe-pb">
        <form onSubmit={handleSend} className="flex gap-2">
          <div className="flex-1 bg-white border-2 border-gray-400 p-2 flex items-center shadow-inner">
            <span className="text-[11px] font-black text-[#000080] mr-3 shrink-0 select-none uppercase tracking-tighter">[{userName}]:</span>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isAILoading}
              placeholder={isAILoading ? "Yapay zeka analiz ediyor..." : "Buraya yazın..."}
              className="flex-1 text-[12px] font-bold outline-none disabled:bg-gray-100"
            />
          </div>
          <button type="submit" disabled={isAILoading} className="bg-[#d4dce8] border-2 border-white px-6 py-2 text-[11px] font-black text-[#000080] hover:bg-white active:bg-gray-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all uppercase tracking-widest">
            {isAILoading ? '...' : 'GÖNDER'}
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;
