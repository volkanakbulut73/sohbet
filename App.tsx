
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import { ChatModuleProps } from './types';
import { Menu, Users, Send, X, MessageCircle, Smile, Settings, UserX, UserCheck, MessageSquare, Image as ImageIcon, Shield, ShieldOff, Hammer } from 'lucide-react';

const ChatModule: React.FC<ChatModuleProps> = ({ externalUser, className = "" }) => {
  const initialUser = externalUser || `User_${Math.floor(Math.random() * 1000)}`;
  const { 
    userName,
    isAdmin,
    setIsAdmin,
    channels, 
    privateChats, 
    blockedUsers,
    toggleBlockUser,
    activeTab, 
    setActiveTab, 
    messages, 
    sendMessage, 
    initiatePrivateChat,
    handleAdminAction,
    isOp,
    isAILoading,
    error
  } = useChatCore(initialUser);

  const [inputText, setInputText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, targetNick: string } | null>(null);

  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeTab]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const currentChannel = channels.find(c => c.name === activeTab);
  const isDM = !currentChannel && activeTab !== 'Status';
  const userIsOp = isOp(activeTab);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isDM) return;
    const reader = new FileReader();
    reader.onloadend = () => sendMessage('', reader.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openUserMenu = (x: number, y: number, targetNick: string) => {
    if (targetNick === userName) return;
    setContextMenu({ x, y, targetNick });
  };

  const handleUserInteraction = (e: React.MouseEvent | React.TouchEvent, targetNick: string) => {
    // Mobil tespiti (veya pointer type)
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    
    let x = 0, y = 0;
    if ('clientX' in e) {
      x = e.clientX;
      y = e.clientY;
    } else if ('touches' in e && e.touches.length > 0) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }

    // Mobilde tıklandığında veya yetkili ise tıklandığında menü aç
    if (isMobile || isAdmin || userIsOp) {
      e.preventDefault();
      openUserMenu(x, y, targetNick);
    } else {
      // Normal kullanıcı masaüstünde tıkladığında direkt DM
      initiatePrivateChat(targetNick);
    }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, targetNick: string) => {
    e.preventDefault();
    openUserMenu(e.clientX, e.clientY, targetNick);
  }, [userName]);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);
  useEffect(() => {
    window.addEventListener('click', closeContextMenu);
    return () => window.removeEventListener('click', closeContextMenu);
  }, [closeContextMenu]);

  const activeUsers = currentChannel ? (currentChannel.users || []) : [activeTab, userName];
  const isBlocked = blockedUsers.includes(activeTab);

  return (
    <div className={`flex flex-col h-full w-full bg-[#f0f4f8] border border-gray-400 shadow-xl overflow-hidden relative ${className}`}>
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

      {/* Dinamik Yönetim Menüsü */}
      {contextMenu && (
        <div 
          className="fixed z-[100] bg-[#f0f0f0] border-2 border-gray-400 shadow-lg p-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 200), left: Math.min(contextMenu.x, window.innerWidth - 190) }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-[10px] font-bold px-2 py-1 text-gray-500 border-b border-gray-300 mb-1 uppercase tracking-tighter flex justify-between items-center">
            <span>{contextMenu.targetNick}</span>
            {currentChannel?.operators?.includes(contextMenu.targetNick) && <Shield size={10} className="text-blue-600" />}
          </div>
          
          <button onClick={() => { initiatePrivateChat(contextMenu.targetNick); closeContextMenu(); }} className="w-full text-left px-3 py-2 text-xs hover:bg-blue-600 hover:text-white flex items-center gap-2 transition-colors">
            <MessageSquare size={14} /> Özel Mesaj Başlat
          </button>
          
          {(userIsOp || isAdmin) && !isDM && activeTab !== 'Status' && (
            <>
              <div className="border-t border-gray-300 my-1"></div>
              <div className="px-2 py-0.5 text-[9px] font-bold text-red-600 flex items-center gap-1 uppercase">
                <Shield size={10} /> Yönetimsel İşlemler
              </div>
              <button onClick={() => { handleAdminAction('kick', contextMenu.targetNick); closeContextMenu(); }} className="w-full text-left px-3 py-2 text-xs hover:bg-orange-500 hover:text-white flex items-center gap-2 transition-colors">
                <Hammer size={14} /> Kanaldan At (Kick)
              </button>
              <button onClick={() => { handleAdminAction('ban', contextMenu.targetNick); closeContextMenu(); }} className="w-full text-left px-3 py-2 text-xs hover:bg-red-700 hover:text-white flex items-center gap-2 font-bold transition-colors">
                <UserX size={14} /> Odadan Yasakla (Ban)
              </button>
              {isAdmin && (
                <button onClick={() => { handleAdminAction(currentChannel?.operators?.includes(contextMenu.targetNick) ? 'deop' : 'op', contextMenu.targetNick); closeContextMenu(); }} className="w-full text-left px-3 py-2 text-xs hover:bg-blue-800 hover:text-white flex items-center gap-2 transition-colors">
                  <Shield size={14} /> {currentChannel?.operators?.includes(contextMenu.targetNick) ? 'Op Yetkisini Al' : 'Operatör Yap (Op)'}
                </button>
              )}
            </>
          )}

          <div className="border-t border-gray-300 my-1"></div>
          <button onClick={() => { toggleBlockUser(contextMenu.targetNick); closeContextMenu(); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-600 hover:text-white flex items-center gap-2 transition-colors">
            {blockedUsers.includes(contextMenu.targetNick) ? <UserCheck size={14} /> : <UserX size={14} />}
            {blockedUsers.includes(contextMenu.targetNick) ? 'Blok Listesinden Çıkar' : 'Kullanıcıyı Engelle'}
          </button>
        </div>
      )}

      {/* Settings/Admin Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-500 shadow-2xl rounded-sm p-4 w-full max-w-xs animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="font-bold text-sm flex items-center gap-2"><Settings size={14} /> Yönetici Paneli</h3>
              <X size={16} className="cursor-pointer text-gray-400 hover:text-black" onClick={() => setIsSettingsOpen(false)} />
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 border rounded shadow-inner">
                <p className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Global Admin Girişi</p>
                {isAdmin ? (
                  <button onClick={() => setIsAdmin(false)} className="w-full bg-red-600 text-white py-2 text-xs font-bold rounded shadow hover:bg-red-700 transition-colors">Admin Yetkisini Bırak</button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} placeholder="Admin Şifresi..." className="w-full border p-2 text-xs outline-none focus:border-blue-500" />
                    <button onClick={() => { if(adminPass === 'admin123') setIsAdmin(true); setAdminPass(''); setIsSettingsOpen(false); }} className="w-full bg-blue-600 text-white py-2 text-xs font-bold rounded shadow hover:bg-blue-700 transition-colors">Giriş Yap</button>
                  </div>
                )}
              </div>
              <p className="text-[9px] text-gray-400 text-center italic">Yönetici yetkileri tüm kanallarda tam denetim sağlar.</p>
            </div>
          </div>
        </div>
      )}

      {/* Üst Bar */}
      <header className="h-12 bg-gradient-to-b from-[#7fb3e6] to-[#5a9ad4] flex items-center justify-between px-2 shrink-0 border-b border-gray-500 z-20">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSettingsOpen(true)} className="bg-[#8ec5f1] border border-[#4a80b3] rounded p-1.5 shadow-inner hover:bg-[#a6d1f5] relative transition-colors">
            <Settings size={16} />
            {isAdmin && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white shadow-sm" />}
          </button>
          <div className="flex flex-col -space-y-1">
            <span className="text-white text-[10px] font-black uppercase tracking-widest italic opacity-75">mIRC Connect {isAdmin && "(ADMIN)"}</span>
            <span className="text-blue-900 font-black text-sm truncate max-w-[120px]">{isDM ? activeTab : `#${activeTab}`}</span>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-600 text-white text-[10px] px-3 py-1 rounded-full font-bold animate-pulse shadow-lg">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2">
          {isAdmin && <Shield className="text-yellow-300 drop-shadow-sm" size={20} />}
          <button className="bg-[#8ec5f1] border border-[#4a80b3] rounded px-3 py-1 text-sm font-bold shadow-inner hidden sm:block hover:bg-[#a6d1f5] transition-colors">Sohbetler</button>
        </div>
      </header>

      {/* Kanal Sekmeleri */}
      <div className="tabs-container bg-[#eef4fb] border-b border-gray-300 relative overflow-hidden shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap p-1 tabs-scrollbar scroll-smooth">
          <div onClick={() => setActiveTab('Status')} className={`flex items-center gap-1 px-3 py-1.5 cursor-pointer text-xs transition-all ${activeTab === 'Status' ? 'text-red-600 font-bold underline bg-white rounded-t border-t border-x border-gray-300 -mb-[1px]' : 'text-gray-500 hover:text-black'}`}>Status</div>
          {channels.map(chan => (
            <div key={chan.name} ref={activeTab === chan.name ? activeTabRef : null} className={`flex items-center gap-1 px-2 py-1.5 border rounded-t shadow-sm text-xs cursor-pointer transition-all ${activeTab === chan.name ? 'bg-white border-blue-400 border-b-white -mb-[1px] z-10' : 'bg-gray-100 border-gray-300 hover:bg-gray-50'}`} onClick={() => setActiveTab(chan.name)}>
              <span className={`px-1 ${activeTab === chan.name ? 'text-blue-700 font-bold' : 'text-blue-500 font-medium'}`}>{chan.operators?.includes(userName) ? '@' : ''}#{chan.name}</span>
              <X size={10} className="text-gray-400 hover:text-red-500 transition-colors" />
            </div>
          ))}
          {privateChats.map(nick => (
            <div key={nick} ref={activeTab === nick ? activeTabRef : null} className={`flex items-center gap-1 px-2 py-1.5 border rounded-t shadow-sm text-xs cursor-pointer transition-all ${activeTab === nick ? 'bg-white border-purple-400 border-b-white -mb-[1px] z-10' : 'bg-gray-100 border-gray-300 hover:bg-gray-50'}`} onClick={() => setActiveTab(nick)}>
              <span className={`px-1 ${activeTab === nick ? (nick === 'GeminiBot' ? 'text-red-700 font-bold' : 'text-purple-700 font-bold') : 'text-purple-500 font-medium'}`}>{nick === 'GeminiBot' ? '🤖 ' : ''}{nick}</span>
              <X size={10} className="text-gray-400 hover:text-red-500 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Ana Alan */}
      <div className="flex-1 flex overflow-hidden bg-white">
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-300 relative">
          <div className="bg-[#ff00ff] text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-tighter shrink-0 flex justify-between shadow-sm">
            <span>{isBlocked ? 'ENGELLENDİ' : isDM ? `${activeTab} İLE ÖZEL` : `KANAL: #${activeTab}`}</span>
            {userIsOp && <span className="text-yellow-200 animate-pulse">Kanal Denetçisi Yetkisi Aktif</span>}
          </div>
          <div className="flex-1 overflow-hidden">
            <MessageList messages={messages} currentUser={userName} blockedUsers={blockedUsers} onNickClick={handleUserInteraction} onNickContextMenu={handleContextMenu} />
          </div>
        </div>

        <aside className="w-32 sm:w-40 shrink-0 bg-[#f8fbff] flex flex-col border-l border-gray-200">
          <div className="flex-1 overflow-y-auto">
            <UserList users={activeUsers} onClose={() => {}} onUserClick={handleUserInteraction} onUserBlock={toggleBlockUser} onUserContextMenu={handleContextMenu} blockedUsers={blockedUsers} operators={currentChannel?.operators} isAdmin={isAdmin} />
          </div>
        </aside>
      </div>

      {/* Giriş */}
      <footer className="bg-[#eef4fb] border-t border-gray-400 flex flex-col px-2 py-1.5 gap-1 shadow-inner">
        <div className="flex items-center gap-2">
          <div className={`flex-1 flex items-center bg-white border border-gray-400 rounded p-1 shadow-inner transition-opacity ${isBlocked ? 'opacity-50 pointer-events-none' : ''}`}>
            <textarea rows={1} disabled={isBlocked} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFormSubmit(e); } }} placeholder={isBlocked ? "Yazamazsınız" : "Mesaj..."} className="flex-1 outline-none resize-none text-sm px-2 bg-transparent" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
             {isDM && <button onClick={() => fileInputRef.current?.click()} className="text-blue-600 hover:bg-blue-100 p-2 rounded-full transition-colors shadow-sm"><ImageIcon size={20} /></button>}
            <button onClick={handleFormSubmit} disabled={isBlocked || !inputText.trim()} className="bg-gradient-to-b from-[#8ec5f1] to-[#4a80b3] text-white font-bold text-xs px-4 py-2 rounded border border-[#3b6ea0] shadow-md active:translate-y-0.5 transition-all">Gönder</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="h-screen w-screen p-0 bg-[#d4dce8] flex items-center justify-center">
      <ChatModule className="w-full h-full max-w-5xl lg:h-[95%]" />
    </div>
  );
};

export default App;
