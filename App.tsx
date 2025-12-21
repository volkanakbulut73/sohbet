
import React, { useState, useEffect, useRef } from 'react';
import { useChatCore } from './hooks/useChatCore';
import MessageList from './components/MessageList';
import UserList from './components/UserList';
import { ChatModuleProps, MessageType, PlaylistItem } from './types';
import { Menu, Settings, X, Send, Volume2, VolumeX, Music, Shield, Hammer, UserX, Crown, Radio, Smile, Plus, Trash2, ShieldAlert, ShieldCheck, Loader2, Check } from 'lucide-react';

const App: React.FC<ChatModuleProps> = ({ externalUser, className = "" }) => {
  const initialUser = externalUser || `Mobil_${Math.floor(Math.random() * 9999)}`;
  const { 
    userName, setUserName,
    isAdmin, setIsAdmin,
    channels, privateChats, 
    blockedUsers, toggleBlockUser,
    activeTab, setActiveTab, 
    messages, sendMessage, 
    isAILoading, isOp, error: coreError,
    isMuted, setIsMuted,
    radioState, toggleRadio, updateRadioConfig,
    initiatePrivateChat
  } = useChatCore(initialUser);

  const [inputText, setInputText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newNick, setNewNick] = useState(userName);
  const [radioUrlInput, setRadioUrlInput] = useState(radioState.currentUrl);
  const [isSavingRadio, setIsSavingRadio] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isRadioLoading, setIsRadioLoading] = useState(false);
  
  // Playlist add states
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongUrl, setNewSongUrl] = useState('');
  
  const radioAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sync inputs with global state when modal opens or global state changes
  useEffect(() => {
    if (isSettingsOpen) {
      setRadioUrlInput(radioState.currentUrl);
      setNewNick(userName);
    }
  }, [isSettingsOpen, radioState.currentUrl, userName]);

  // Radyo Oynatıcı Kontrolü ve Detaylı Hata Yönetimi
  useEffect(() => {
    const audio = radioAudioRef.current;
    if (!audio) return;

    const handleError = (e: Event) => {
      const audioTarget = e.target as HTMLAudioElement;
      const error = audioTarget.error;
      
      if (!radioState.isPlaying || !audioTarget.src || audioTarget.src === window.location.href) {
        return;
      }

      setIsRadioLoading(false);
      let displayMsg = "Yayın yüklenemedi.";
      
      if (error) {
        console.error(`Radyo Hatası [Kod: ${error.code}]: ${error.message}`);
        switch (error.code) {
          case 1: displayMsg = "Yükleme durduruldu."; break;
          case 2: displayMsg = "Ağ hatası: Bağlantı kesildi."; break;
          case 3: displayMsg = "Ses formatı desteklenmiyor."; break;
          case 4: 
            displayMsg = "Yayın kaynağına ulaşılamıyor."; 
            if (window.location.protocol === 'https:' && (audioTarget.src || '').startsWith('http:')) {
              displayMsg = "Güvenlik Engeli: HTTPS üzerinden HTTP yayını çalınamaz. Lütfen 'https://' kullanın.";
            }
            break;
        }
      }
      setPlaybackError(displayMsg);
    };

    const handleCanPlay = () => {
      setIsRadioLoading(false);
      setPlaybackError(null);
    };

    const handleWaiting = () => setIsRadioLoading(true);

    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);

    const handlePlay = async () => {
      if (radioState.isPlaying) {
        if (!radioState.currentUrl || radioState.currentUrl.trim() === "") {
          setPlaybackError("Lütfen bir radyo URL'si girin.");
          setIsRadioLoading(false);
          return;
        }

        if (window.location.protocol === 'https:' && radioState.currentUrl.startsWith('http://')) {
          setPlaybackError("Güvenlik Engeli: HTTPS üzerinden HTTP yayını dinlenemez.");
          setIsRadioLoading(false);
          audio.pause();
          return;
        }

        try {
          setIsRadioLoading(true);
          setPlaybackError(null);
          
          audio.pause();
          audio.src = radioState.currentUrl;
          audio.load();

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (e: any) {
          setIsRadioLoading(false);
          if (e.name === 'NotAllowedError') {
            setPlaybackError("Tarayıcı engelledi. Lütfen tıklayıp tekrar açın.");
          } else if (e.name !== 'AbortError') {
            setPlaybackError(`Oynatma hatası: ${e.message || 'Desteklenmeyen kaynak'}`);
          }
        }
      } else {
        setIsRadioLoading(false);
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
    };

    handlePlay();

    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
    };
  }, [radioState.isPlaying, radioState.currentUrl]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleSaveRadioUrl = async () => {
    if (!isAdmin) return;
    setIsSavingRadio(true);
    await updateRadioConfig({ currentUrl: radioUrlInput });
    setIsSavingRadio(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const addPlaylistItem = () => {
    if (!newSongTitle || !newSongUrl) return;
    const newItem: PlaylistItem = {
      id: Date.now().toString(),
      title: newSongTitle,
      url: newSongUrl,
      addedBy: userName
    };
    updateRadioConfig({ playlist: [...(radioState.playlist || []), newItem] });
    setNewSongTitle('');
    setNewSongUrl('');
  };

  const removePlaylistItem = (id: string) => {
    updateRadioConfig({ playlist: radioState.playlist.filter(item => item.id !== id) });
  };

  const currentChannel = channels.find(c => c.name === activeTab);
  const activeUsers = currentChannel ? currentChannel.users : [userName, 'GeminiBot'];

  return (
    <div className="h-screen w-screen bg-[#eef4fb] flex flex-col font-sans overflow-hidden">
      {/* Audio Element */}
      <audio ref={radioAudioRef} style={{ display: 'none' }} preload="none" />

      {/* Üst Bar */}
      <header className="h-14 bg-gradient-to-b from-[#8ec5f1] to-[#4a80b3] flex items-center justify-between px-3 shrink-0 border-b border-[#3b6ea0] shadow-md z-30">
        <button onClick={() => setIsSettingsOpen(true)} className="bg-[#f0f4f8] text-[#4a80b3] font-bold px-4 py-1.5 rounded-md shadow-inner flex items-center gap-2 text-sm hover:bg-white transition-all">
          <Menu size={16} /> Menü
        </button>
        
        <div className="flex flex-col items-center">
          <button 
            onClick={toggleRadio}
            className={`text-sm font-bold flex items-center gap-1 transition-all ${radioState.isPlaying ? (isRadioLoading ? 'text-blue-200' : 'text-green-200 animate-pulse') : 'text-red-600'}`}
          >
             {isRadioLoading ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />} 
             {radioState.isPlaying ? (isRadioLoading ? 'Bağlanıyor...' : 'Radyoyu Kapat') : 'Radyoyu Aç'}
          </button>
          <span className="text-[10px] text-white/80 font-medium italic truncate max-w-[150px]">
            {radioState.playlist?.[0] ? `Çalıyor: ${radioState.playlist[0].title}` : 'Yayın: Gemini FM 99.0'}
          </span>
          {playbackError && radioState.isPlaying && (
            <div className="absolute top-14 left-0 w-full bg-red-600 text-white text-[10px] py-1.5 px-3 text-center font-bold z-50 shadow-lg border-b border-red-800 flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
              <span className="shrink-0">⚠️</span> 
              <span className="truncate">{playbackError}</span>
              <button onClick={() => setPlaybackError(null)} className="ml-1 opacity-60 hover:opacity-100">×</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
           <button className="bg-gradient-to-b from-[#7fb3e6] to-[#5a9ad4] text-white font-bold px-4 py-1.5 rounded-md border border-white/20 shadow-lg text-sm hidden sm:flex items-center gap-2">
              Mesajlarınız
           </button>
        </div>
      </header>

      {/* Kanal Sekmeleri */}
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
            #{chan.name} <X size={10} className="opacity-50" />
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

      {/* Ana Sohbet Alanı */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 relative">
           <div className="bg-[#ff00ff] text-white text-[11px] font-bold px-3 py-0.5 uppercase tracking-wider flex justify-between">
              <span>#{activeTab} - Hoşgeldiniz</span>
              {isAdmin && <span className="text-yellow-200">ADMIN MODU AKTİF</span>}
           </div>
           <div className="flex-1 overflow-hidden">
              <MessageList messages={messages} currentUser={userName} blockedUsers={blockedUsers} />
           </div>
        </div>

        {/* Sağ Liste */}
        <aside className="w-36 sm:w-48 bg-white border-l border-gray-200 flex flex-col shrink-0">
          <div className="p-2 border-b bg-gray-50 flex items-center justify-between">
             <span className="text-[10px] font-bold text-gray-400 uppercase">Kullanıcılar</span>
             <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded">{activeUsers.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <UserList 
              users={activeUsers} 
              onClose={() => {}} 
              isAdmin={isAdmin}
              blockedUsers={blockedUsers}
              onUserClick={(e, nick) => initiatePrivateChat(nick)}
            />
          </div>
        </aside>
      </main>

      {/* Giriş Alanı */}
      <footer className="p-2 bg-[#f0f4f8] border-t border-gray-300 flex items-center gap-2 shrink-0">
        <button className="p-2 text-yellow-500 hover:bg-yellow-100 rounded-full transition-colors">
          <Smile size={24} />
        </button>
        <form onSubmit={handleSend} className="flex-1 flex gap-2">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Mesajınızı buraya yazın..."
            className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button type="submit" className="bg-[#4a80b3] text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-[#3b6ea0] active:scale-95 transition-all">
            Gönder
          </button>
        </form>
      </footer>

      {/* Ayarlar Modalı */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-[#4a80b3] to-[#7fb3e6] p-4 text-white flex justify-between items-center shrink-0">
               <h3 className="font-bold flex items-center gap-2"><Settings size={18} /> Ayarlar & Profil</h3>
               <X className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => setIsSettingsOpen(false)} />
            </div>
            
            <div className="p-5 space-y-6 overflow-y-auto flex-1">
              {/* Nickname */}
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

              {/* Ses Ayarları */}
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

              {/* Admin Paneli */}
              {isAdmin && (
                <div className="border-t pt-4 space-y-4">
                  <p className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1 mb-2">
                    <Shield size={12} /> Yönetici Kontrol Paneli
                  </p>
                  
                  {/* Radyo URL */}
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <label className="text-[10px] text-red-800 font-bold block mb-1">ANA RADYO YAYIN URL</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={radioUrlInput}
                        onChange={(e) => setRadioUrlInput(e.target.value)}
                        className="flex-1 border p-2 text-xs rounded bg-white text-black font-medium"
                        placeholder="https://yayin.url/listen.mp3"
                      />
                      <button 
                        onClick={handleSaveRadioUrl}
                        disabled={isSavingRadio}
                        className="bg-red-600 text-white px-3 py-1 text-xs font-bold rounded hover:bg-red-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        {isSavingRadio ? <Loader2 size={12} className="animate-spin" /> : (saveSuccess ? <Check size={12} /> : 'Kaydet')}
                        {saveSuccess && 'Kaydedildi!'}
                      </button>
                    </div>
                    <p className="text-[9px] text-red-500 mt-1 italic font-bold">
                      * Önemli: Tarayıcılar HTTPS sitelerde HTTP (http://) radyoları engeller. Daima HTTPS (https://) kullanın.
                    </p>
                  </div>

                  {/* Müzik Listesi Yönetimi */}
                  <div className="space-y-3">
                    <label className="text-[10px] text-gray-500 font-bold block uppercase">Yayın Akışı / Çalma Listesi</label>
                    <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border">
                      <input 
                        type="text" 
                        placeholder="Şarkı Adı" 
                        value={newSongTitle} 
                        onChange={(e) => setNewSongTitle(e.target.value)}
                        className="text-xs p-2 border rounded text-black"
                      />
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Ses Dosyası URL (.mp3, .m4a)" 
                          value={newSongUrl} 
                          onChange={(e) => setNewSongUrl(e.target.value)}
                          className="flex-1 text-xs p-2 border rounded text-black"
                        />
                        <button 
                          onClick={addPlaylistItem}
                          className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {radioState.playlist?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-white p-2 border rounded text-[11px] group">
                           <span className="font-medium truncate flex-1 pr-2 text-black">{item.title}</span>
                           <button onClick={() => removePlaylistItem(item.id)} className="text-red-400 hover:text-red-600 group-hover:scale-110 transition-transform">
                              <Trash2 size={14} />
                           </button>
                        </div>
                      ))}
                      {(!radioState.playlist || radioState.playlist.length === 0) && (
                        <p className="text-[10px] text-gray-400 italic text-center py-2">Liste boş</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <button 
                  onClick={() => { setIsAdmin(!isAdmin); setIsSettingsOpen(false); }}
                  className="w-full border-2 border-gray-100 py-3 text-xs font-bold text-gray-400 rounded-lg hover:border-blue-100 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                >
                  {isAdmin ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                  {isAdmin ? 'Yönetici Yetkisini Bırak' : 'Yönetici Girişi Yap'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
