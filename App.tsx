
import React, { useState, useEffect } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import LandingPage from './components/LandingPage';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/AdminDashboard';
import { ChatModuleProps } from './types';
import { CHAT_MODULE_CONFIG } from './config';
import { storageService } from './services/storageService';
import { Menu, X, Hash, Users, Globe, LogOut, MessageSquare, Send, Lock, ChevronRight, Mail, ShieldCheck, Clock, Settings, User } from 'lucide-react';

type AppView = 'landing' | 'login' | 'register' | 'pending' | 'chat' | 'admin_login' | 'admin_panel';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "" }) => {
  const [view, setView] = useState<AppView>('landing');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
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

  // Entegrasyon Kontrolü: Eğer dışarıdan kullanıcı ismi geliyorsa direkt chat'e aktar
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
      } else if (user.status === 'rejected') {
        setLoginError('Başvurunuz maalesef reddedildi.');
      } else {
        setUserName(user.nickname);
        localStorage.setItem('mirc_nick', user.nickname);
        setView('chat');
      }
    } catch (err) {
      setLoginError('Sistem hatası. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const success = await storageService.adminLogin(adminForm.username, adminForm.password);
      if (success) {
        setView('admin_panel');
      } else {
        setLoginError('Yönetici bilgileri hatalı.');
      }
    } catch (err) {
      setLoginError('Giriş yapılamadı.');
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

  if (view === 'landing') {
    return <LandingPage onEnter={() => setView('login')} onAdminClick={() => setView('admin_login')} />;
  }

  if (view === 'register') {
    return <RegistrationForm onClose={() => setView('login')} onSuccess={() => setView('pending')} />;
  }

  if (view === 'admin_panel') {
    return <AdminDashboard onLogout={() => setView('landing')} />;
  }

  if (view === 'admin_login') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4 z-[100] font-mono">
        <div className="w-full max-w-sm bg-gray-900 border border-gray-800 p-8 space-y-8 shadow-2xl">
          <div className="text-center space-y-2">
            <Settings size={48} className="text-[#00ff99] mx-auto mb-4" />
            <h2 className="text-xl font-black text-white uppercase italic">Yönetici Girişi</h2>
            <p className="text-[10px] text-gray-500 font-bold">CONTROL CENTER ACCESS</p>
          </div>
          {loginError && <div className="p-3 bg-red-900/50 border border-red-500 text-[10px] text-red-200 font-bold">{loginError}</div>}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase">Username:</label>
              <input 
                type="text" 
                value={adminForm.username}
                onChange={e => setAdminForm({...adminForm, username: e.target.value})}
                className="w-full bg-black border border-gray-800 p-3 text-white text-xs outline-none focus:border-[#00ff99]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase">Password:</label>
              <input 
                type="password" 
                value={adminForm.password}
                onChange={e => setAdminForm({...adminForm, password: e.target.value})}
                className="w-full bg-black border border-gray-800 p-3 text-white text-xs outline-none focus:border-[#00ff99]"
                required
              />
            </div>
            <button disabled={isLoggingIn} className="w-full bg-[#00ff99] text-black py-4 text-xs font-black uppercase hover:bg-white transition-all">
              {isLoggingIn ? 'DOĞRULANIYOR...' : 'Sistem Girişi'}
            </button>
            <button type="button" onClick={() => setView('landing')} className="w-full text-[10px] text-gray-500 hover:text-white uppercase font-bold">Geri Dön</button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'pending') {
    return (
      <div className="fixed inset-0 bg-[#0b0f14] flex items-center justify-center p-4 z-[100] font-mono">
        <div className="w-full max-w-md bg-[#0b0f14] border border-[#00ff99] p-10 text-center space-y-6 shadow-[0_0_50px_rgba(0,255,153,0.1)] fade-in">
           <div className="flex justify-center">
             <Clock size={64} className="text-[#00ff99] animate-pulse" />
           </div>
           <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">BAŞVURU ALINDI</h2>
           <p className="text-xs text-gray-400 leading-relaxed italic">
             Belgeleriniz sistem yöneticilerimiz tarafından incelenmektedir. 
             Onaylandığında bu sayfadan giriş yapabileceksiniz.
           </p>
           <button 
             onClick={() => setView('landing')}
             className="w-full border border-gray-700 text-gray-400 py-3 text-[10px] font-black hover:text-white uppercase transition-colors"
           >
             Anasayfaya Dön
           </button>
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="fixed inset-0 bg-[#0b0f14] flex items-center justify-center p-4 z-[100] font-mono">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00ff99] rounded-full blur-[150px]"></div>
        </div>

        <div className="w-full max-w-md bg-[#0b0f14] border border-gray-800 shadow-[20px_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden fade-in">
          <div className="bg-gray-900 text-gray-400 px-4 py-2 text-[10px] font-bold flex justify-between items-center border-b border-gray-800">
            <span className="flex items-center gap-2">
               <Lock size={12} className="text-[#00ff99]" />
               SECURE_LOGIN_v2.0
            </span>
            <X size={14} className="cursor-pointer hover:text-white" onClick={() => setView('landing')} />
          </div>

          <div className="p-10 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black italic text-white tracking-tighter">
                WORKIGOM<span className="text-[#00ff99]">_CHAT</span>
              </h1>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.3em]">Kurumsal Kimlik Doğrulama</p>
            </div>

            {loginError && (
              <div className="bg-red-900/50 border border-red-500 p-3 text-[10px] text-red-200 font-bold italic animate-in fade-in zoom-in-95">
                [ Hata ]: {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#00ff99] uppercase flex items-center gap-1">
                    <Mail size={12} /> Email:
                  </label>
                  <input 
                    type="email" 
                    value={loginForm.email}
                    onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 p-3 text-white text-xs outline-none focus:border-[#00ff99] transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#00ff99] uppercase flex items-center gap-1">
                    <Lock size={12} /> Şifre:
                  </label>
                  <input 
                    type="password" 
                    value={loginForm.password}
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 p-3 text-white text-xs outline-none focus:border-[#00ff99] transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <button type="submit" disabled={isLoggingIn} className="w-full bg-[#00ff99] text-black py-4 text-xs font-black hover:scale-[1.02] active:scale-[0.98] transition-all uppercase disabled:opacity-50">
                  {isLoggingIn ? 'DOĞRULANIYOR...' : 'Sisteme Giriş Yap'}
                </button>
                <button 
                  type="button"
                  onClick={() => setView('register')}
                  className="w-full text-[10px] text-white font-bold border-2 border-[#00ff99] py-3 hover:bg-[#00ff99] hover:text-black transition-all uppercase tracking-widest"
                >
                  Yeni Kayıt / Başvuru
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen flex flex-col bg-white overflow-hidden select-none ${className}`}>
      {/* Üst Bar */}
      <div className="h-8 bg-[#000080] flex items-center justify-between px-2 text-white shrink-0 z-50">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsLeftDrawerOpen(!isLeftDrawerOpen)} className="p-1 hover:bg-white/20 rounded-sm">
            <Menu size={16} />
          </button>
          <span className="text-[11px] font-bold truncate tracking-tight">Workigom Online - [{activeTab}]</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-[9px] font-bold bg-green-600 px-2 py-0.5 rounded-sm">
             <ShieldCheck size={10} /> ONAYLI KİMLİK
          </div>
          <button 
            onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)} 
            className={`p-1 rounded-sm transition-colors ${isRightDrawerOpen ? 'bg-white text-[#000080]' : 'hover:bg-white/20 text-white'}`}
          >
            <Users size={16} />
          </button>
          <button onClick={() => setView('landing')} title="Çıkış Yap" className="p-1 hover:bg-red-600/50 rounded-sm transition-colors">
             <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Sekmeler */}
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
        {/* Sol Panel (Kanallar) */}
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

        {/* Ana Sohbet Alanı */}
        <div className={`flex-1 flex flex-col bg-white overflow-hidden relative transition-all duration-300 ${isRightDrawerOpen ? 'mr-32 md:mr-0' : 'mr-0'}`}>
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

        {/* Sağ Panel (Kullanıcı Listesi) */}
        <div className={`absolute right-0 top-0 bottom-0 w-32 md:w-48 bg-[#d4dce8] border-l border-gray-400 z-40 transition-transform duration-300 shadow-[-10px_0_15px_rgba(0,0,0,0.1)] lg:relative lg:translate-x-0 lg:shadow-none ${isRightDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
           <UserList 
            users={[userName, 'GeminiBot', 'Admin', 'User_1']} 
            currentUser={userName} 
            onUserClick={(e, n) => { initiatePrivateChat(n); }}
            onClose={() => setIsRightDrawerOpen(false)} 
            currentOps={['Admin', 'GeminiBot']}
           />
        </div>
      </div>

      {/* Mesaj Giriş Alanı */}
      <div className="p-1 bg-[#d4dce8] border-t border-gray-400 shrink-0">
        <form onSubmit={handleSend} className="flex gap-1">
          <div className="flex-1 bg-white border border-gray-600 px-2 py-1 flex items-center shadow-inner">
             <span className="text-[11px] font-bold text-blue-900 mr-1.5 shrink-0 truncate max-w-[80px]">[{userName}]</span>
             <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 text-[12px] md:text-xs outline-none bg-transparent font-mono"
              placeholder="Mesaj yazın..."
             />
          </div>
          <button type="submit" className="bg-[#c0c0c0] border-2 border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] px-4 py-1 flex items-center justify-center active:shadow-none active:translate-y-[1px]">
            <Send size={14} className="text-gray-800" />
          </button>
        </form>
      </div>

      <div className="h-5 bg-[#d4dce8] border-t border-gray-300 flex items-center justify-between px-2 text-[9px] font-bold text-gray-600 shrink-0">
        <div className="flex gap-4 items-center">
          <span className="uppercase">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          <span className="hidden sm:inline">SERVER: {CHAT_MODULE_CONFIG.DOMAIN}</span>
          <span className="truncate max-w-[100px]">AUTH: {userName}</span>
        </div>
        <div className="flex items-center gap-1 text-green-700">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          SECURE
        </div>
      </div>

      {isLeftDrawerOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setIsLeftDrawerOpen(false)} />
      )}
    </div>
  );
};

export default App;
