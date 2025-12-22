
import React, { useState, useEffect, useRef } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import { ChatModuleProps, MessageType } from './types';
import { Menu, Settings, X, Send, Volume2, VolumeX, Shield, ShieldAlert, ShieldCheck, Smile, Check, LogIn, Lock, Unlock, Trash2, Key, User, Crown, Wallet } from 'lucide-react';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "" }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tempNick, setTempNick] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [loginError, setLoginError] = useState('');
  
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminNick, setAdminNick] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const { 
    userName, setUserName,
    isAdmin, setIsAdmin,
    channels, privateChats, 
    blockedUsers, toggleBlockUser,
    activeTab, setActiveTab, 
    messages, sendMessage, 
    isAILoading, isOp, error: coreError,
    isMuted, setIsMuted,
    manageUser, toggleLock, clearScreen,
    initiatePrivateChat
  } = useChatCore('');

  const [inputText, setInputText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newNick, setNewNick] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNormalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempNick.trim()) {
      setLoginError('Lütfen bir nickname giriniz.');
      return;
    }
    if (!termsAccepted) {
      setLoginError('Kullanım şartlarını onaylamalısınız.');
      return;
    }

    setIsLoggingIn(true);
    setTimeout(() => {
      setUserName(tempNick.trim());
      setIsAdmin(false);
      setIsLoggedIn(true);
      setLoginError('');
      setIsLoggingIn(false);
    }, 500);
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNick = adminNick.trim() || tempNick.trim();
    
    if (!finalNick) {
      alert('Lütfen bir nickname giriniz.');
      return;
    }

    if (adminPassword === 'password123') {
      setIsLoggingIn(true);
      // Şifre doğru, admin yetkilerini ayarla
      const fullAdminNick = finalNick.startsWith('Admin_') ? finalNick : `Admin_${finalNick}`;
      
      // State'leri güncelle
      setUserName(fullAdminNick);
      setIsAdmin(true);
      
      // Modal'ı kapat ve arayüzü aç
      setTimeout(() => {
        setIsLoggedIn(true);
        setIsAdminModalOpen(false);
        setLoginError('');
        setAdminPassword('');
        setIsLoggingIn(false);
      }, 500);
    } else {
      alert('Hatalı Yönetici Şifresi! (Lütfen tekrar deneyin)');
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const currentChannel = channels.find(c => c.name === activeTab);
  const activeUsers = currentChannel ? currentChannel.users : [userName, 'GeminiBot'];
  const currentOps = currentChannel?.ops || [];

  if (!isLoggedIn) {
    return (
      <div className="h-screen w-screen bg-[#f4f7ff] flex flex-col items-center justify-between p-6 font-sans overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm space-y-8 my-auto">
          
          <div className="bg-[#1a1c2c] p-6 rounded-lg flex items-center gap-4 shadow-xl border border-gray-700 w-full justify-center">
            <div className="bg-green-600 p-2 rounded-xl">
              <Wallet size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Workig<span className="text-green-500">om</span></h1>
          </div>

          <form onSubmit={handleNormalLogin} className="w-full space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-gray-600 w-12 shrink-0">Nick:</label>
              <input 
                type="text" 
                autoFocus
                value={tempNick}
                onChange={e => setTempNick(e.target.value)}
                className="flex-1 border border-gray-300 p-2 rounded bg-white shadow-sm focus:ring-1 ring-blue-500 outline-none"
                placeholder="İsim yazınız..."
              />
            </div>
            <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
              <label className="text-sm font-bold text-gray-600 w-12 shrink-0">Şifre:</label>
              <input 
                type="password" 
                disabled
                placeholder="Admin girişi için aşağıya basın"
                className="flex-1 border border-gray-300 p-2 rounded bg-gray-50 shadow-sm outline-none text-xs"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#c24b3a] hover:bg-[#a33d2f] text-white font-bold py-3 rounded shadow-md border-b-4 border-[#8b3427] active:border-b-0 active:translate-y-1 transition-all text-lg disabled:opacity-50"
            >
              {isLoggingIn ? 'Bağlanıyor...' : 'Baglan'}
            </button>

            <div className="flex items-center justify-center gap-2 py-2">
              <input 
                type="checkbox" 
                id="terms"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <label htmlFor="terms" className="text-[12px] text-gray-700 font-medium cursor-pointer">Kullanım şartlarını okudum onaylıyorum.</label>
            </div>

            {loginError && <p className="text-red-600 text-xs font-bold text-center animate-pulse">{loginError}</p>}
          </form>

          <button 
            type="button"
            onClick={() => {
              setAdminNick(tempNick);
              setIsAdminModalOpen(true);
            }}
            className="w-full bg-white border-2 border-black text-black font-bold py-4 rounded-xl shadow-lg hover:bg-gray-50 transition-all text-2xl mt-4 active:scale-95"
          >
            Admin Giriş
          </button>
        </div>

        <div className="w-full max-w-sm flex justify-between items-center text-[13px] font-medium text-blue-800 pb-4">
          <a href="#" className="hover:underline">Gizlilik Sözleşmesi</a>
          <a href="#" className="hover:underline">Kullanıcı Sözleşmesi</a>
        </div>

        {isAdminModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-[#1a1c2c] p-4 text-white flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><Shield size={18} className="text-green-500" /> Yönetici Doğrulama</h3>
                <button onClick={() => setIsAdminModalOpen(false)} className="hover:text-red-500 transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleAdminAuth} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Yönetici Nickname</label>
                  <input 
                    type="text" 
                    value={adminNick}
                    onChange={e => setAdminNick(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded outline-none focus:border-blue-500"
                    placeholder="Admin nick..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Yönetici Şifresi</label>
                  <input 
                    type="password" 
                    autoFocus
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded outline-none focus:border-blue-500 text-center text-xl tracking-widest font-mono"
                    placeholder="••••••"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoggingIn}
                  className="w-full bg-[#1a1c2c] text-white py-3 rounded-lg font-bold hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isLoggingIn ? 'Giriş Yapılıyor...' : 'Sohbete Yönetici Olarak Gir'}
                </button>
                <p className="text-[10px] text-center text-gray-400 italic">Yönetici şifrenizle tüm odaları kontrol edebilirsiniz.</p>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#eef4fb] flex flex-col font-sans overflow-hidden animate-in fade-in duration-500">
      <header className="h-14 bg-gradient-to-b from-[#8ec5f1] to-[#4a80b3] flex items-center justify-between px-3 shrink-0 border-b border-[#3b6ea0] shadow-md z-30">
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="bg-[#f0f4f8] text-[#4a80b3] font-bold px-4 py-1.5 rounded-md shadow-inner flex items-center gap-2 text-sm hover:bg-white transition-all active:scale-95"
          >
            <Menu size={16} /> Menü
          </button>

          {isMenuOpen && (
            <div className="absolute top-12 left-0 w-48 bg-white shadow-2xl rounded-lg border border-gray-200 py-2 animate-in slide-in-from-top-2 duration-200 z-50">
              <div className="px-4 py-2 border-b mb-1">
                 <p className="text-[10px] font-bold text-blue-600 uppercase">{isAdmin ? 'Yönetici Modu' : 'Kullanıcı Modu'}</p>
                 <p className="text-xs truncate font-bold text-gray-700">{userName}</p>
              </div>
              <button onClick={() => { setIsSettingsOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex items-center gap-3 text-gray-700">
                <Settings size={16} className="text-gray-500" /> Ayarlar
              </button>
              <button onClick={() => { setIsLoggedIn(false); setIsMenuOpen(false); setIsAdmin(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 flex items-center gap-3 text-red-600 font-bold">
                <LogIn size={16} className="rotate-180" /> Çıkış Yap
              </button>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-white font-bold tracking-wider text-sm flex items-center gap-2">
            Workigom Sohbet {isAdmin && <Crown size={14} className="text-yellow-300" />}
          </span>
          <span className="text-[10px] text-white/80 font-medium italic">Bağlı: {userName}</span>
        </div>

        <div className="flex items-center gap-2">
           {isOp && currentChannel && (
             <div className="flex gap-1">
                <button 
                  onClick={toggleLock} 
                  title={currentChannel.isLocked ? "Kilidi Aç" : "Odayı Kilitle"}
                  className={`p-2 rounded-md border border-white/20 transition-all ${currentChannel.isLocked ? 'bg-red-500 text-white' : 'bg-white/20 text-white'}`}
                >
                  {currentChannel.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                </button>
                <button 
                  onClick={clearScreen} 
                  title="Ekranı Temizle"
                  className="p-2 bg-white/20 text-white rounded-md border border-white/20 hover:bg-red-400"
                >
                  <Trash2 size={16} />
                </button>
             </div>
           )}
        </div>
      </header>

      <nav className="bg-[#f8fbff] border-b border-gray-300 flex items-center gap-1 px-2 py-1.5 overflow-x-auto tabs-scrollbar shrink-0">
        <div 
          onClick={() => setActiveTab('Status')}
          className={`px-3 py-1 text-xs cursor-pointer rounded-full transition-all ${activeTab === 'Status' ? 'bg-red-500 text-white font-bold' : 'text-red-500 hover:bg-red-50'}`}
        >
          Status
        </div>
        {channels.map(chan => (
          <div 
            key={chan.name}
            onClick={() => setActiveTab(chan.name)}
            className={`px-3 py-1 text-xs cursor-pointer rounded-full flex items-center gap-2 border transition-all ${activeTab === chan.name ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-sm' : 'bg-white text-blue-600 border-gray-200 hover:border-blue-300'}`}
          >
            {chan.isLocked && <Lock size={10} />} #{chan.name} <X size={10} className="opacity-50" />
          </div>
        ))}
        {privateChats.filter(n => n !== 'GeminiBot').map(nick => (
          <div 
            key={nick}
            onClick={() => setActiveTab(nick)}
            className={`px-3 py-1 text-xs cursor-pointer rounded-full flex items-center gap-2 border transition-all ${activeTab === nick ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-gray-200'}`}
          >
            {nick} <X size={10} className="opacity-50" />
          </div>
        ))}
      </nav>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 relative">
           <div className={`text-white text-[11px] font-bold px-3 py-0.5 uppercase tracking-wider flex justify-between ${currentChannel?.isLocked ? 'bg-red-600' : 'bg-[#ff00ff]'}`}>
              <span>#{activeTab} {currentChannel?.isLocked && "(KİLİTLİ)"}</span>
              {isAdmin && <span className="text-yellow-200">YÖNETİCİ ERİŞİMİ</span>}
           </div>
           {coreError && (
             <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-4 py-2 rounded-full shadow-lg z-50 animate-bounce max-w-[80%] text-center">
                {String(coreError)}
             </div>
           )}
           <div className="flex-1 overflow-hidden">
              <MessageList messages={messages} currentUser={userName} blockedUsers={blockedUsers} />
           </div>
        </div>

        <aside className="w-36 sm:w-48 bg-white border-l border-gray-200 flex flex-col shrink-0">
          <div className="p-2 border-b bg-gray-50 flex items-center justify-between">
             <span className="text-[10px] font-bold text-gray-400 uppercase">Kullanıcılar</span>
             <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded">{activeUsers.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <UserList 
              users={activeUsers} 
              currentUser={userName}
              onClose={() => {}} 
              isAdmin={isAdmin}
              currentOps={currentOps}
              blockedUsers={blockedUsers}
              onAction={manageUser}
              onUserClick={(e, nick) => initiatePrivateChat(nick)}
            />
          </div>
        </aside>
      </main>

      <footer className="p-2 bg-[#f0f4f8] border-t border-gray-300 flex items-center gap-2 shrink-0">
        <button className="p-2 text-yellow-500 hover:bg-yellow-100 rounded-full transition-colors">
          <Smile size={24} />
        </button>
        <form onSubmit={handleSend} className="flex-1 flex gap-2">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={currentChannel?.isLocked && !isOp}
            placeholder={currentChannel?.isLocked && !isOp ? "Oda kilitli, sadece operatörler yazabilir..." : "Mesajınızı buraya yazın..."}
            className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button type="submit" className="bg-[#4a80b3] text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-[#3b6ea0] active:scale-95 transition-all">
            Gönder
          </button>
        </form>
      </footer>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-[#4a80b3] to-[#7fb3e6] p-4 text-white flex justify-between items-center shrink-0">
               <h3 className="font-bold flex items-center gap-2"><Settings size={18} /> Ayarlar & Profil</h3>
               <X className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => setIsSettingsOpen(false)} />
            </div>
            
            <div className="p-5 space-y-6 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Nickname Değiştir</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newNick} 
                    onChange={(e) => setNewNick(e.target.value)}
                    className="flex-1 bg-[#4a80b3] text-white font-bold border-none rounded-lg p-3 text-sm placeholder-blue-100 focus:ring-2 focus:ring-white outline-none" 
                    placeholder="Yeni nick yazın..."
                  />
                  <button onClick={() => { setUserName(newNick); setIsSettingsOpen(false); }} className="bg-blue-600 text-white px-4 py-2 text-xs font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors">Güncelle</button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-sm font-medium flex items-center gap-2">
                  {isMuted ? <VolumeX className="text-red-500" /> : <Volume2 className="text-green-500" />}
                  Bildirim Sesleri
                </span>
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isMuted ? 'bg-gray-300' : 'bg-green-500'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isMuted ? 'left-1' : 'left-7'}`} />
                </button>
              </div>

              <div className="pt-4 border-t">
                 <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">Workigom NextGen Build 2025</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
