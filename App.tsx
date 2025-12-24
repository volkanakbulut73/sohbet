
import React, { useState, useEffect, useRef } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import { ChatModuleProps, MessageType } from './types';
import { CHAT_MODULE_CONFIG } from './config';
import { storageService } from './services/storageService';
import { Menu, Settings, X, Send, Shield, Smile, Lock, Unlock, Trash2, Hash, MessageSquare, UserX, UserCheck, ToggleLeft, ToggleRight, Sparkles, Save, Key, User } from 'lucide-react';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "" }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tempNick, setTempNick] = useState('');
  const [tempPass, setTempPass] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
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
    botInstruction, setBotInstruction, saveBotInstruction,
    initiatePrivateChat, closeTab, clearScreen
  } = useChatCore(externalUser || '');

  const [inputText, setInputText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [adminInstructionText, setAdminInstructionText] = useState(botInstruction);
  
  // Admin Credentials State
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [storedAdminCreds, setStoredAdminCreds] = useState({ user: 'admin', pass: 'admin123' });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    storageService.getAdminCredentials().then(creds => {
      setStoredAdminCreds(creds);
      setNewAdminUser(creds.user);
    });
  }, []);

  useEffect(() => {
    setAdminInstructionText(botInstruction);
  }, [botInstruction]);

  // Admin login logic
  useEffect(() => {
    if (tempNick.toLowerCase() === storedAdminCreds.user.toLowerCase()) {
      setShowPasswordField(true);
    } else {
      setShowPasswordField(false);
      setTempPass('');
    }
  }, [tempNick, storedAdminCreds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (!tempNick.trim()) {
      setLoginError('Lütfen bir takma ad girin.');
      return;
    }

    if (showPasswordField) {
      if (tempPass === storedAdminCreds.pass) {
        setIsAdmin(true);
        localStorage.setItem('mirc_is_admin', 'true');
        setUserName(tempNick);
        setIsLoggedIn(true);
      } else {
        setLoginError('Hatalı admin şifresi!');
      }
    } else {
      setIsAdmin(false);
      localStorage.setItem('mirc_is_admin', 'false');
      setUserName(tempNick);
      setIsLoggedIn(true);
    }
  };

  const handleUpdateAdminCreds = async () => {
    if (!newAdminUser.trim() || !newAdminPass.trim()) {
      alert("Kullanıcı adı ve şifre boş olamaz!");
      return;
    }
    try {
      await storageService.updateAdminCredentials(newAdminUser, newAdminPass);
      setStoredAdminCreds({ user: newAdminUser, pass: newAdminPass });
      alert("Admin bilgileri başarıyla güncellendi!");
    } catch (e) {
      alert("Güncelleme hatası!");
    }
  };

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
        <div className="w-full max-sm space-y-6 bg-white p-8 rounded-xl shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-300">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-[#1a1c2c]">mIRC Connect</h1>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">GÜVENLİ ERİŞİM PANELİ v{CHAT_MODULE_CONFIG.VERSION}</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nickname</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  autoFocus
                  value={tempNick}
                  onChange={e => setTempNick(e.target.value)}
                  className="w-full border-2 border-gray-100 p-3 pl-10 rounded-lg text-sm focus:border-blue-500 outline-none transition-all bg-gray-50/50"
                  placeholder="Kullanıcı adınız..."
                />
              </div>
            </div>

            {showPasswordField && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                <label className="text-[10px] font-bold text-blue-600 uppercase ml-1">Admin Şifresi</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                  <input 
                    type="password" 
                    value={tempPass}
                    onChange={e => setTempPass(e.target.value)}
                    className="w-full border-2 border-blue-100 p-3 pl-10 rounded-lg text-sm focus:border-blue-500 outline-none transition-all bg-blue-50/30"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {loginError && <p className="text-red-500 text-[11px] font-bold text-center bg-red-50 py-2 rounded-md border border-red-100">{loginError}</p>}

            <button type="submit" className="w-full bg-[#000080] hover:bg-blue-900 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
              {showPasswordField ? 'ADMİN GİRİŞİ' : 'BAĞLAN'}
            </button>
          </form>
          <p className="text-[9px] text-center text-gray-400 italic">"Admin girişi için kullanıcı adınızı 'admin' olarak girin."</p>
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
          {isPrivateTab && activeTab !== 'GeminiBot' && (
            <div className="flex items-center gap-1 mr-2 bg-black/10 p-0.5 rounded">
              {isTargetBlocked ? (
                <button onClick={() => unblockUser(activeTab)} className="bg-green-600 hover:bg-green-700 text-white text-[9px] px-2 py-0.5 rounded flex items-center gap-1 font-bold shadow-inner">
                  <UserCheck size={10} /> Engel Kaldır
                </button>
              ) : (
                <button onClick={() => blockUser(activeTab)} className="bg-red-600 hover:bg-red-700 text-white text-[9px] px-2 py-0.5 rounded flex items-center gap-1 font-bold shadow-inner">
                  <UserX size={10} /> Engelle
                </button>
              )}
            </div>
          )}

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
              <button onClick={() => closeTab(activeTab)} className="hover:text-red-400 p-0.5 transition-colors" title="Kapat">
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Updated to support 3 rows wrap */}
      <nav className="min-h-[32px] max-h-[100px] overflow-y-auto bg-[#f0f4f8] border-b border-gray-300 flex flex-wrap items-center gap-1 px-2 py-1 shrink-0 scrollbar-hide">
        {channels.map(chan => (
          <div key={chan.name} className={`px-3 py-1 text-[10px] cursor-pointer rounded border flex items-center gap-1.5 shrink-0 transition-all ${activeTab === chan.name ? 'bg-[#000080] text-white border-[#000080]' : 'bg-white text-blue-800 border-gray-200 hover:bg-blue-50'}`}>
            <div className="flex items-center gap-1" onClick={() => setActiveTab(chan.name)}>
              <Hash size={10} /> {chan.name}
            </div>
            {chan.name !== 'sohbet' && <X size={10} className="hover:text-red-500 cursor-pointer ml-1" onClick={(e) => { e.stopPropagation(); closeTab(chan.name); }} />}
          </div>
        ))}
        {privateChats.map(nick => (
          <div key={nick} className={`px-3 py-1 text-[10px] cursor-pointer rounded border flex items-center gap-1.5 shrink-0 transition-all ${activeTab === nick ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-purple-700 border-gray-200 hover:bg-purple-50'}`}>
            <div className="flex items-center gap-1" onClick={() => setActiveTab(nick)}>
              <MessageSquare size={10} /> {nick}
            </div>
            <X size={10} className="hover:text-red-500 cursor-pointer ml-1" onClick={(e) => { e.stopPropagation(); closeTab(nick); }} />
          </div>
        ))}
      </nav>

      {/* Main Area */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col relative border-r border-gray-200">
          {coreError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-2xl z-50 animate-bounce max-w-[90%] text-center">
              {typeof coreError === 'string' ? coreError : JSON.stringify(coreError)}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <MessageList messages={messages} currentUser={userName} blockedUsers={blockedUsers} onNickClick={(e, nick) => initiatePrivateChat(nick)} />
          </div>
        </div>
        <aside className="w-32 sm:w-40 bg-[#f0f4f8] shrink-0 border-l border-gray-200">
          <UserList users={currentChannel?.users || [userName, 'GeminiBot']} currentUser={userName} onUserClick={(e, nick) => initiatePrivateChat(nick)} blockedUsers={blockedUsers} currentOps={currentChannel?.ops || []} isAdmin={isAdmin} onClose={() => {}} />
        </aside>
      </main>

      {/* Footer */}
      <footer className="p-2 bg-[#f0f4f8] border-t border-gray-300 shrink-0">
        <form onSubmit={handleSend} className="flex gap-1.5">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTargetBlocked || (currentChannel?.islocked && !isOp) || isAILoading}
            placeholder={isAILoading ? "Gemini düşünüyor..." : (isTargetBlocked ? "Bu kullanıcıyı engellediniz." : "Mesaj yazın...")}
            className="flex-1 bg-white border border-gray-300 rounded px-3 py-1.5 text-[11.5px] outline-none focus:border-blue-500 disabled:bg-gray-100 transition-colors"
          />
          <button type="submit" className="bg-[#000080] text-white px-4 py-1.5 rounded font-bold text-[11px] hover:bg-blue-900 transition-colors active:scale-95 disabled:opacity-50" disabled={isAILoading}>Gönder</button>
        </form>
      </footer>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden border border-gray-300 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-[#000080] p-3 text-white flex justify-between items-center shrink-0">
              <h3 className="text-xs font-bold flex items-center gap-2"><Settings size={14} /> Ayarlar</h3>
              <X className="cursor-pointer" size={16} onClick={() => setIsSettingsOpen(false)} />
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-gray-700">Özel Mesajları Kabul Et</span>
                  <span className="text-[9px] text-gray-400">Diğer kullanıcılar size yazabilsin mi?</span>
                </div>
                <button onClick={() => toggleAllowPrivate(!allowPrivate)} className={`transition-colors duration-200 ${allowPrivate ? 'text-blue-600' : 'text-gray-400'}`}>
                  {allowPrivate ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>

              {isAdmin && (
                <>
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-blue-800 flex items-center gap-1.5"><Sparkles size={12} /> Bot İş Modeli Eğitimi</span>
                      <span className="text-[8px] bg-blue-600 text-white px-1 rounded font-bold">YALNIZCA ADMİN</span>
                    </div>
                    <textarea 
                      value={adminInstructionText}
                      onChange={(e) => setAdminInstructionText(e.target.value)}
                      className="w-full h-24 text-[10px] p-2 border border-blue-200 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      placeholder="Botun iş modelini buraya yazın..."
                    />
                    <button 
                      onClick={() => saveBotInstruction(adminInstructionText)}
                      className="w-full bg-blue-700 text-white py-1.5 rounded text-[10px] font-bold hover:bg-blue-800 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Save size={12} /> TALİMATLARI KAYDET
                    </button>
                  </div>

                  <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-indigo-800 flex items-center gap-1.5"><Shield size={12} /> Admin Erişimi Düzenle</span>
                    </div>
                    <div className="space-y-2">
                      <div className="relative">
                        <User size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Yeni Admin Adı"
                          value={newAdminUser}
                          onChange={(e) => setNewAdminUser(e.target.value)}
                          className="w-full text-[10px] p-2 pl-7 border border-indigo-100 rounded bg-white outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="relative">
                        <Key size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="password" 
                          placeholder="Yeni Admin Şifresi"
                          value={newAdminPass}
                          onChange={(e) => setNewAdminPass(e.target.value)}
                          className="w-full text-[10px] p-2 pl-7 border border-indigo-100 rounded bg-white outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleUpdateAdminCreds}
                      className="w-full bg-indigo-700 text-white py-1.5 rounded text-[10px] font-bold hover:bg-indigo-800 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Save size={12} /> KİMLİK BİLGİLERİNİ GÜNCELLE
                    </button>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex flex-col text-gray-700">
                  <span className="text-[11px] font-bold">Bildirim Sesleri</span>
                </div>
                <button onClick={() => setIsMuted(!isMuted)} className={`px-3 py-1 rounded text-[9px] font-bold ${!isMuted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isMuted ? 'KAPALI' : 'AÇIK'}
                </button>
              </div>

              <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-[#000080] text-white py-2 rounded font-bold text-xs mt-2">KAPAT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
