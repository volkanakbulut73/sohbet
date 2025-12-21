
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import { ChatModuleProps } from './types';
import { Menu, Users, Send, X, MessageCircle, Smile, Settings, UserX, UserCheck, MessageSquare, Image as ImageIcon, Camera } from 'lucide-react';

const ChatModule: React.FC<ChatModuleProps> = ({ externalUser, className = "" }) => {
  const initialUser = externalUser || `User_${Math.floor(Math.random() * 1000)}`;
  const { 
    userName,
    setUserName,
    channels, 
    privateChats, 
    blockedUsers,
    toggleBlockUser,
    activeTab, 
    setActiveTab, 
    messages, 
    sendMessage, 
    initiatePrivateChat,
    isAILoading,
    error
  } = useChatCore(initialUser);

  const [inputText, setInputText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempNick, setTempNick] = useState(userName);
  
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Güvenlik: Kanallarda resim gönderimini kod tarafında da engelle
    if (!isDM) {
      alert("Güvenlik nedeniyle genel kanallarda resim paylaşımı devre dışıdır. Lütfen özel sohbet kullanın.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Resim boyutu 2MB'den küçük olmalıdır.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      sendMessage('', base64String);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNickChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempNick.trim() && tempNick !== userName) {
      setUserName(tempNick);
      setIsSettingsOpen(false);
    }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, targetNick: string) => {
    e.preventDefault();
    if (targetNick === userName) return;
    setContextMenu({ x: e.clientX, y: e.clientY, targetNick });
  }, [userName]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    window.addEventListener('click', closeContextMenu);
    return () => window.removeEventListener('click', closeContextMenu);
  }, [closeContextMenu]);

  const activeUsers = currentChannel ? (currentChannel.users || []) : [activeTab, userName];
  const isBlocked = blockedUsers.includes(activeTab);

  return (
    <div className={`flex flex-col h-full w-full bg-[#f0f4f8] border border-gray-400 shadow-xl overflow-hidden relative ${className}`}>
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[100] bg-[#f0f0f0] border-2 border-gray-400 shadow-lg p-1 min-w-[150px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-[10px] font-bold px-2 py-1 text-gray-500 border-b border-gray-300 mb-1 uppercase tracking-tighter">
            {contextMenu.targetNick}
          </div>
          <button 
            onClick={() => { initiatePrivateChat(contextMenu.targetNick); closeContextMenu(); }}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-600 hover:text-white flex items-center gap-2"
          >
            <MessageSquare size={12} /> Özel Mesaj Gönder
          </button>
          <button 
            onClick={() => { toggleBlockUser(contextMenu.targetNick); closeContextMenu(); }}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-600 hover:text-white flex items-center gap-2"
          >
            {blockedUsers.includes(contextMenu.targetNick) ? <UserCheck size={12} /> : <UserX size={12} />}
            {blockedUsers.includes(contextMenu.targetNick) ? 'Engeli Kaldır' : 'Engelle'}
          </button>
          <div className="border-t border-gray-300 my-1"></div>
          <button 
            onClick={closeContextMenu}
            className="w-full text-left px-3 py-1 text-[10px] text-gray-400 hover:text-gray-600"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-500 shadow-2xl rounded-sm p-4 w-full max-w-xs animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="font-bold text-sm flex items-center gap-2"><Settings size={14} /> Ayarlar</h3>
              <X size={16} className="cursor-pointer text-gray-400 hover:text-black" onClick={() => setIsSettingsOpen(false)} />
            </div>
            <form onSubmit={handleNickChange} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 uppercase">Nickname Değiştir</label>
                <input 
                  type="text" 
                  value={tempNick}
                  onChange={(e) => setTempNick(e.target.value)}
                  className="w-full border border-gray-400 p-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Yeni nick yaz..."
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-2 text-sm rounded shadow-sm hover:bg-blue-700 transition-colors"
              >
                Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Üst Bar */}
      <header className="h-12 bg-gradient-to-b from-[#7fb3e6] to-[#5a9ad4] flex items-center justify-between px-2 shrink-0 border-b border-gray-500">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="bg-[#8ec5f1] border border-[#4a80b3] rounded p-1.5 shadow-inner hover:bg-[#a6d1f5]"
          >
            <Settings size={16} />
          </button>
          <div className="flex flex-col -space-y-1">
            <span className="text-white text-[10px] font-black uppercase tracking-widest italic opacity-75">mIRC Connect</span>
            <span className="text-blue-900 font-black text-sm">{isDM ? activeTab : `#${activeTab}`}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isDM && activeTab !== 'GeminiBot' && (
            <button 
              onClick={() => toggleBlockUser(activeTab)}
              className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-black border shadow-sm transition-colors ${
                isBlocked 
                ? 'bg-green-500 text-white border-green-700' 
                : 'bg-red-500 text-white border-red-700'
              }`}
            >
              {isBlocked ? <><UserCheck size={14} /> Engeli Kaldır</> : <><UserX size={14} /> Engelle</>}
            </button>
          )}
          <button className="bg-[#8ec5f1] border border-[#4a80b3] rounded px-3 py-1 text-sm font-bold shadow-inner hidden sm:block">
            Sohbetler
          </button>
        </div>
      </header>

      {/* Kanal Sekmeleri */}
      <div className="tabs-container bg-[#eef4fb] border-b border-gray-300 relative overflow-hidden shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap p-1 tabs-scrollbar scroll-smooth">
          <div 
            ref={activeTab === 'Status' ? activeTabRef : null}
            onClick={() => setActiveTab('Status')}
            className={`flex items-center gap-1 px-3 py-1.5 cursor-pointer text-xs transition-all ${activeTab === 'Status' ? 'text-red-600 font-bold underline bg-white rounded-t border-t border-x border-gray-300 -mb-[1px]' : 'text-gray-500 hover:text-black'}`}
          >
            Status
          </div>
          
          {channels.map(chan => (
            <div 
              key={chan.name} 
              ref={activeTab === chan.name ? activeTabRef : null}
              className={`flex items-center gap-1 px-2 py-1.5 border rounded-t shadow-sm text-xs cursor-pointer transition-all ${activeTab === chan.name ? 'bg-white border-blue-400 border-b-white -mb-[1px] z-10' : 'bg-gray-100 border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setActiveTab(chan.name)}
            >
              <span className={`px-1 ${activeTab === chan.name ? 'text-blue-700 font-bold' : 'text-blue-500 font-medium'}`}>
                #{chan.name}
              </span>
              <X size={10} className="text-gray-400 hover:text-red-500 transition-colors" />
            </div>
          ))}

          {privateChats.filter(p => p !== 'GeminiBot').map(nick => (
            <div 
              key={nick} 
              ref={activeTab === nick ? activeTabRef : null}
              className={`flex items-center gap-1 px-2 py-1.5 border rounded-t shadow-sm text-xs cursor-pointer transition-all ${activeTab === nick ? 'bg-white border-purple-400 border-b-white -mb-[1px] z-10' : 'bg-gray-100 border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setActiveTab(nick)}
            >
              <span className={`px-1 ${activeTab === nick ? 'text-purple-700 font-bold' : 'text-purple-500 font-medium'}`}>
                {nick}
              </span>
              <X size={10} className="text-gray-400 hover:text-red-500 transition-colors" />
            </div>
          ))}
          
          <div 
            ref={activeTab === 'GeminiBot' ? activeTabRef : null}
            className={`flex items-center gap-1 px-2 py-1.5 border rounded-t shadow-sm text-xs cursor-pointer transition-all ${activeTab === 'GeminiBot' ? 'bg-white border-red-400 border-b-white -mb-[1px] z-10' : 'bg-gray-100 border-gray-300 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('GeminiBot')}
          >
            <span className={`px-1 flex items-center gap-1 ${activeTab === 'GeminiBot' ? 'text-red-700 font-bold' : 'text-red-400'}`}>
              🤖 Gemini
            </span>
          </div>
        </div>
      </div>

      {/* Ana Sohbet Alanı */}
      <div className="flex-1 flex overflow-hidden bg-white">
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-300 relative">
          <div className="bg-[#ff00ff] text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-tighter shrink-0">
            {isBlocked ? 'DİKKAT: BU KULLANICI ENGELLENDİ' : isDM ? `${activeTab} İLE ÖZEL SOHBET` : 'KANAL MOTTO: Hoşgeldiniz'}
          </div>
          <div className="flex-1 overflow-hidden">
            <MessageList 
              messages={messages} 
              currentUser={userName} 
              blockedUsers={blockedUsers} 
              onNickClick={initiatePrivateChat}
              onNickContextMenu={handleContextMenu}
            />
          </div>
          {isBlocked && (
            <div className="absolute inset-0 top-5 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 p-4 text-center">
              <div className="bg-red-50 border border-red-200 p-4 rounded shadow-lg max-w-xs">
                <p className="text-red-700 text-xs font-bold uppercase mb-2">Engellenen Kullanıcı</p>
                <p className="text-gray-600 text-[11px]">Bu kullanıcıyı engellediniz. Mesajları göremezsiniz ve ona mesaj gönderemezsiniz.</p>
                <button onClick={() => toggleBlockUser(activeTab)} className="mt-3 text-blue-600 text-[10px] font-bold underline">Engeli Kaldır</button>
              </div>
            </div>
          )}
        </div>

        <aside className="w-32 sm:w-40 shrink-0 bg-[#f8fbff] flex flex-col">
          <div className="p-1 border-b border-gray-200">
            <input 
              type="text" 
              placeholder="Nick Ara..." 
              className="w-full text-[11px] px-1 border border-gray-300 rounded outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <UserList 
              users={activeUsers} 
              onClose={() => {}} 
              onUserClick={initiatePrivateChat}
              onUserBlock={toggleBlockUser}
              onUserContextMenu={handleContextMenu}
              blockedUsers={blockedUsers}
            />
          </div>
        </aside>
      </div>

      {/* Giriş Alanı */}
      <footer className="bg-[#eef4fb] border-t border-gray-400 flex flex-col px-2 py-1.5 gap-1">
        <div className="flex items-center gap-2">
          <div className={`flex-1 flex items-center bg-white border border-gray-400 rounded p-1 shadow-inner ${isBlocked ? 'opacity-50 pointer-events-none' : ''}`}>
            <textarea
              rows={1}
              disabled={isBlocked}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFormSubmit(e);
                }
              }}
              placeholder={isBlocked ? "Engellenen kullanıcıya yazamazsınız" : "Mesajınızı yazın..."}
              className="flex-1 outline-none resize-none text-sm px-2 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
             {/* Resim gönderme butonu SADECE DM ise gösterilir */}
             {isDM && (
               <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isBlocked}
                className="text-blue-600 hover:bg-blue-100 p-2 rounded-full transition-colors disabled:opacity-50"
                title="Resim Gönder (Sadece Özel Sohbet)"
               >
                 <ImageIcon size={20} />
               </button>
             )}
            <button 
              onClick={handleFormSubmit}
              disabled={isBlocked || !inputText.trim()}
              className="bg-gradient-to-b from-[#8ec5f1] to-[#4a80b3] text-white font-bold text-xs px-4 py-2 rounded shadow-md border border-[#3b6ea0] disabled:opacity-50 active:translate-y-0.5"
            >
              Gönder
            </button>
          </div>
        </div>
        {!isDM && (
          <div className="text-[9px] text-gray-500 italic px-1">
            * Resim paylaşımı güvenlik nedeniyle sadece özel sohbetlerde aktiftir.
          </div>
        )}
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
