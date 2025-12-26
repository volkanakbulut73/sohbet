
import React, { useState, useEffect } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import LandingPage from './components/LandingPage';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/AdminDashboard';
import { ChatModuleProps } from './types';
import { storageService } from './services/storageService';
import { Menu, X, Send, Lock, Clock, Smile } from 'lucide-react';

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
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const { 
    userName, setUserName,
    activeTab, setActiveTab, 
    messages, sendMessage, 
    isAILoading,
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
        setLoginError('Hata: Bilgiler geçersiz.');
      } else if (user.status === 'pending') {
        setView('pending');
      } else {
        setUserName(user.nickname);
        localStorage.setItem('mirc_nick', user.nickname);
        setView('chat');
      }
    } catch (err) {
      setLoginError('Giriş hatası.');
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
        <div className="w-full max-w-sm bg-gray-900 border border-gray-800 p-8 shadow-2xl">
          <div className="text-center mb-8"><Lock size={40} className="text-[#00ff99] mx-auto mb-2"/><h2 className="text-white font-black uppercase italic">GİRİŞ PANELİ</h2></div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full bg-black border border-gray-800 p-3 text-white text-xs outline-none focus:border-[#00ff99]" />
            <input type="password" placeholder="Şifre" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-black border border-gray-800 p-3 text-white text-xs outline-none focus:border-[#00ff99]" />
            {loginError && <p className="text-red-500 text-[10px] font-bold text-center">{loginError}</p>}
            <button disabled={isLoggingIn} className="w-full bg-[#00ff99] text-black py-3 text-xs font-black uppercase">GİRİŞ YAP</button>
          </form>
          <button onClick={() => setView('register')} className="w-full text-[#00ff99] text-[10px] font-black uppercase mt-4 hover:underline">Kayıt Başvurusu →</button>
        </div>
      </div>
    );
  }

  if (view === 'register') return <RegistrationForm onClose={() => setView(embedded ? 'login' : 'landing')} onSuccess={() => setView('pending')} />;
  if (view === 'pending') return <div className="fixed inset-0 bg-black flex items-center justify-center p-4 text-white font-mono text-center"><div className="space-y-4"><Clock size={48} className="mx-auto text-orange-500"/><h2 className="text-xl font-bold uppercase">Onay Bekleniyor</h2><button onClick={() => setView('landing')} className="text-[#00ff99] border border-[#00ff99] px-6 py-2">Geri Dön</button></div></div>;

  return (
    <div className={`h-screen-safe w-full flex flex-col bg-white overflow-hidden font-mono ${className}`}>
      
      {/* 1. Header Area */}
      <div className="bg-[#d4dce8] border-b border-gray-400 shrink-0 p-1 flex items-center justify-between safe-top">
        <div className="flex gap-1">
          <button onClick={() => setIsLeftDrawerOpen(true)} className="bg-gradient-to-b from-gray-100 to-gray-400 border border-gray-600 px-3 py-1 text-[10px] font-bold text-blue-900 rounded-sm">Menü</button>
          <button className="text-red-700 text-[10px] font-bold px-2">Radyo</button>
        </div>
        <div className="flex-1 text-center truncate px-2"><span className="text-[10px] font-bold text-gray-600 uppercase">Workigom Network 1.1.1</span></div>
        <button className="bg-gradient-to-b from-blue-400 to-blue-600 border border-blue-900 px-3 py-1 text-[10px] font-bold text-white rounded-sm">Özel</button>
      </div>

      {/* 2. Channel Tabs */}
      <div className="bg-[#eef2f7] border-b border-gray-300 flex shrink-0 overflow-x-auto no-scrollbar py-0.5 px-1 gap-1">
        <button onClick={() => setActiveTab('Status')} className={`px-2 py-0.5 text-[10px] font-bold border ${activeTab === 'Status' ? 'bg-white border-gray-400' : 'text-blue-800 border-transparent'}`}>Status</button>
        {['#Sohbet', '#Radyo', '#Mobil', '#Yardim'].map(chan => (
          <button key={chan} onClick={() => setActiveTab(chan)} className={`px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1 ${activeTab === chan ? 'bg-white border-gray-400' : 'text-blue-800 border-transparent'}`}>{chan} <span className="text-gray-400 text-[8px]">x</span></button>
        ))}
      </div>

      {/* 3. Main Area: Chat + Fixed User List (Narrower) */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-white">
        <div className="flex-1 flex flex-col min-w-0 bg-white relative">
          {isAILoading && <div className="absolute top-0 left-0 right-0 h-[1px] bg-blue-500 animate-pulse z-10" />}
          <MessageList messages={messages} currentUser={userName} blockedUsers={[]} onNickClick={(e, n) => initiatePrivateChat(n)} />
        </div>

        {/* MIRC Style User List - Even Narrower for more chat space */}
        <div className="w-28 md:w-32 border-l border-gray-300 bg-white shrink-0 flex flex-col">
          <div className="p-0.5 border-b border-gray-200">
             <input type="text" placeholder="Nick..." className="w-full text-[9px] p-0.5 bg-gray-50 border border-gray-200 outline-none uppercase" />
          </div>
          <UserList 
            users={[userName, 'GeminiBot', 'Admin', 'SevimLi', 'Ercan', 'Esraa', 'NoNNiCK', 'Renk', 'w00t', 'aLin', 'Arazi', 'karmor', 'Asya', 'Ace', 'Bol', 'DeryureK', 'CeyLin', 'DiVeeT', 'Kaya', 'Letch']} 
            currentUser={userName} 
            onUserClick={(e, n) => initiatePrivateChat(n)}
            onClose={() => {}} 
            currentOps={['Admin', 'GeminiBot', 'SevimLi']}
          />
        </div>
      </div>

      {/* 4. Input Area - Fixed for Mobile Visibility */}
      <div className="shrink-0 bg-[#eef2f7] border-t border-gray-300 p-1 safe-bottom z-50">
        <form onSubmit={handleSend} className="flex items-center gap-1.5 w-full max-w-screen-2xl mx-auto">
          <div className="flex-1 bg-white border border-gray-400 h-8 px-2 flex items-center shadow-inner rounded-sm">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 bg-transparent text-[11px] outline-none font-medium h-full text-black"
              placeholder="Mesaj yaz..."
              autoFocus
            />
          </div>
          <button type="button" className="text-yellow-500 shrink-0"><Smile size={18} fill="currentColor" /></button>
          <button type="submit" className="bg-gradient-to-b from-blue-400 to-blue-600 border border-blue-900 text-white px-3 h-8 text-[10px] font-bold rounded-sm shadow-sm shrink-0">Gönder</button>
        </form>
      </div>

      {/* Mobile Drawer */}
      {isLeftDrawerOpen && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsLeftDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#0b0f14] p-6 space-y-4">
            <div className="flex justify-between items-center text-white border-b border-gray-800 pb-4 font-bold uppercase italic text-xs"><span>SERVER MENU</span><X size={20} className="cursor-pointer" onClick={() => setIsLeftDrawerOpen(false)} /></div>
            {['#Sohbet', '#Yardim', '#Radyo', '#Oyun'].map(c => <button key={c} onClick={() => { setActiveTab(c); setIsLeftDrawerOpen(false); }} className="w-full text-left p-2 text-gray-400 hover:text-white transition-all text-xs font-bold uppercase">{c}</button>)}
            <button onClick={() => setView('landing')} className="absolute bottom-10 left-6 right-6 p-3 bg-red-600 text-white font-bold text-[10px] rounded uppercase">Güvenli Çıkış</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
