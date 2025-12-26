
import React, { useState, useEffect } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import LandingPage from './components/LandingPage';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/AdminDashboard';
import { ChatModuleProps } from './types';
import { storageService } from './services/storageService';
import { Menu, X, Send, Lock, Clock, Settings, Users, LogIn, MessageSquare, Smile } from 'lucide-react';

type AppView = 'landing' | 'login' | 'register' | 'pending' | 'chat' | 'admin_login' | 'admin_panel';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "", embedded = false }) => {
  const getInitialView = (): AppView => {
    if (externalUser && externalUser.trim() !== "") return 'chat';
    if (embedded) return 'login';
    return 'landing';
  };

  const [view, setView] = useState<AppView>(getInitialView());
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isUserListVisible, setIsUserListVisible] = useState(true); // Mobilde kontrol edilebilir
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
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
    if (externalUser && externalUser.trim() !== "") {
      setUserName(externalUser);
      setView('chat');
    }
  }, [externalUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const user = await storageService.loginUser(loginForm.email, loginForm.password);
      if (!user) {
        setLoginError('Email veya şifre hatalı.');
      } else if (user.status === 'pending') {
        setView('pending');
      } else {
        setUserName(user.nickname);
        localStorage.setItem('mirc_nick', user.nickname);
        setView('chat');
      }
    } catch (err) {
      setLoginError('Giriş başarısız.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  if (view === 'landing' && !embedded) return <LandingPage onEnter={() => setView('login')} onAdminClick={() => setView('admin_login')} />;
  
  if (view === 'login' || (view === 'landing' && embedded)) {
    return (
      <div className="fixed inset-0 bg-[#0b0f14] flex items-center justify-center p-4 z-[100] font-mono">
        <div className="w-full max-w-sm bg-gray-900 border border-gray-800 p-8 space-y-8 shadow-2xl">
          <div className="text-center space-y-2">
            <Lock size={40} className="text-[#00ff99] mx-auto mb-2" />
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Sohbete Giriş Yap</h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full bg-black border border-gray-800 p-4 text-white text-xs outline-none focus:border-[#00ff99]" />
            <input type="password" placeholder="Şifre" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-black border border-gray-800 p-4 text-white text-xs outline-none focus:border-[#00ff99]" />
            {loginError && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{loginError}</p>}
            <button disabled={isLoggingIn} className="w-full bg-[#00ff99] text-black py-4 text-xs font-black uppercase shadow-lg active:scale-95 transition-all">
              {isLoggingIn ? 'DOĞRULANIYOR...' : 'GİRİŞ YAP'}
            </button>
          </form>
          <button onClick={() => setView('register')} className="w-full text-[#00ff99] text-[10px] font-black uppercase hover:underline">Üye Başvurusu Yap →</button>
        </div>
      </div>
    );
  }

  if (view === 'register') return <RegistrationForm onClose={() => setView(embedded ? 'login' : 'landing')} onSuccess={() => setView('pending')} />;
  if (view === 'pending') return <div className="fixed inset-0 bg-[#0b0f14] flex items-center justify-center p-4 z-[100] font-mono text-center text-white"><div className="space-y-4"><Clock size={48} className="mx-auto text-orange-500"/><h2 className="text-xl font-bold italic uppercase">Başvurunuz Onay Bekliyor</h2><button onClick={() => setView('landing')} className="text-[#00ff99] border border-[#00ff99]/30 px-6 py-2">Geri Dön</button></div></div>;

  return (
    <div className={`h-screen-safe w-full flex flex-col bg-white overflow-hidden font-mono ${className}`}>
      
      {/* 1. Üst Header - Resimdeki Menü ve Mesajlar Butonları */}
      <div className="bg-[#d4dce8] border-b border-gray-300 shrink-0 p-1 flex items-center justify-between">
        <div className="flex gap-1">
          <button onClick={() => setIsLeftDrawerOpen(true)} className="bg-gradient-to-b from-gray-100 to-gray-400 border border-gray-600 px-3 py-1 text-[11px] font-bold text-blue-900 rounded-sm shadow-sm">Menü</button>
          <button className="text-red-700 text-[11px] font-bold px-2">Radyoyu Aç</button>
        </div>
        <div className="flex gap-1">
           <button className="bg-gradient-to-b from-blue-400 to-blue-600 border border-blue-900 px-3 py-1 text-[11px] font-bold text-white rounded-sm shadow-sm">Mesajlarınız</button>
        </div>
      </div>

      {/* 2. Kanal Sekmeleri - Resimdeki Status, #Sohbet X yapısı */}
      <div className="bg-[#eef2f7] border-b border-gray-300 flex shrink-0 overflow-x-auto no-scrollbar py-0.5 px-1 gap-1">
        <button 
          onClick={() => setActiveTab('Status')}
          className={`flex items-center gap-2 px-2 py-0.5 text-[11px] font-bold border ${activeTab === 'Status' ? 'bg-white border-gray-400' : 'bg-transparent border-transparent text-blue-800'}`}
        >
          Status
        </button>
        {['#TRsohbet', '#Sohbet', '#Radyo', '#Mobil', '#hossosohbet', '#yarismma', '#kelime'].map(chan => (
          <button 
            key={chan}
            onClick={() => setActiveTab(chan)}
            className={`flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold border transition-all ${activeTab === chan ? 'bg-white border-gray-400 shadow-sm' : 'bg-transparent border-transparent text-blue-800'}`}
          >
            {chan} <span className="text-gray-400 text-[9px]">X</span>
          </button>
        ))}
      </div>

      {/* 3. Ana İçerik: Mesajlar + Sabit Kullanıcı Listesi */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Mesaj Listesi Alanı */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <MessageList 
            messages={messages} 
            currentUser={userName} 
            blockedUsers={[]} 
            onNickClick={(e, n) => initiatePrivateChat(n)} 
          />
        </div>

        {/* MIRC Tarzı Sabit Sağ Panel (Kullanıcı Listesi) */}
        <div className={`w-40 md:w-48 border-l border-gray-300 bg-white shrink-0 flex flex-col ${isUserListVisible ? 'block' : 'hidden md:block'}`}>
          <div className="p-1 border-b border-gray-200">
             <input type="text" placeholder="Nick Ara..." className="w-full text-[10px] p-1 bg-gray-50 border border-gray-200 outline-none" />
          </div>
          <UserList 
            users={[userName, 'GeminiBot', 'Admin', 'SevimLi', 'Ercan', 'Esraa', 'NoNNiCK', 'Renk', 'w00t', 'aLin', 'Arazi', 'karmor', 'AstronBnX', 'Asya', 'ayolA', 'Ace', 'Bol', 'bebekSy', 'DeryureK', 'CeyLin', 'DiLay', 'DiVeeT', 'HummeL', 'Hükümdar', 'Boell', 'Kaya', 'kumsal', 'Letch']} 
            currentUser={userName} 
            onUserClick={(e, n) => initiatePrivateChat(n)}
            onClose={() => setIsUserListVisible(false)} 
            currentOps={['Admin', 'GeminiBot', 'SevimLi', 'Ercan', 'Esraa']}
          />
        </div>
      </div>

      {/* 4. Alt Mesaj Giriş Alanı - Resimdeki Emoji ve Gönder Butonu ile */}
      <div className="shrink-0 bg-[#eef2f7] border-t border-gray-300 p-2 safe-bottom">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-screen-2xl mx-auto">
          <div className="flex-1 bg-white border border-gray-400 h-10 px-3 flex items-center shadow-inner rounded-sm">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 bg-transparent text-[13px] outline-none font-medium h-full text-black"
              placeholder="Mesajınızı buraya yazın..."
              autoFocus
            />
          </div>
          <button type="button" className="text-orange-400 hover:scale-110 transition-transform">
             <Smile size={24} fill="currentColor" className="text-yellow-500" />
          </button>
          <button 
            type="submit" 
            className="bg-gradient-to-b from-blue-400 to-blue-600 border border-blue-900 text-white px-4 h-10 text-[12px] font-bold rounded-sm shadow-md active:translate-y-0.5 transition-all"
          >
            Gönder
          </button>
        </form>
      </div>

      {/* Mobilde Menü Çekmecesi */}
      {isLeftDrawerOpen && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsLeftDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#0b0f14] p-6 space-y-4">
            <div className="flex justify-between items-center text-white border-b border-gray-800 pb-4">
              <span className="font-bold uppercase tracking-tighter">Sunucu Menüsü</span>
              <X className="cursor-pointer" onClick={() => setIsLeftDrawerOpen(false)} />
            </div>
            {['#Sohbet', '#Oyun', '#Kelime', '#Radyo'].map(c => (
              <button key={c} onClick={() => { setActiveTab(c); setIsLeftDrawerOpen(false); }} className="w-full text-left p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-all">{c}</button>
            ))}
            <button onClick={() => setView('landing')} className="absolute bottom-6 left-6 right-6 p-4 bg-red-600 text-white font-bold text-xs rounded">GÜVENLİ ÇIKIŞ</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
