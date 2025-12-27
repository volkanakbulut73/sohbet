
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  ShieldCheck, 
  Clock, 
  FileText, 
  LogOut,
  RefreshCw,
  Search,
  User,
  Loader2,
  Megaphone,
  Mail,
  Send,
  MessageSquare,
  History,
  Terminal,
  AlertTriangle,
  WifiOff
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { UserRegistration, Channel } from '../types';

interface AdminDashboardProps {
  onLogout: () => void;
}

type AdminTab = 'registrations' | 'notifications';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('registrations');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Notification states
  const [chatNotif, setChatNotif] = useState({ channel: 'all', message: '' });
  const [emailNotif, setEmailNotif] = useState({ target: 'all', subject: '', message: '' });
  const [notifSending, setNotifSending] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [regs, chns, history] = await Promise.all([
        storageService.getAllRegistrations(),
        storageService.getChannels(),
        storageService.getNotificationLogs()
      ]);
      setRegistrations(regs);
      setChannels(chns);
      setLogs(history);
    } catch (err: any) {
      console.error("Admin Load Error:", err);
      setError(err.message || "Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    const actionText = status === 'approved' ? 'ONAYLAMAK' : 'REDDETMEK';
    if (!confirm(`Bu başvuruyu ${actionText} istediğinize emin misiniz?`)) return;
    
    setProcessingId(id);
    try {
      await storageService.updateRegistrationStatus(id, status);
      await loadData();
      if (status === 'approved') setFilter('approved');
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleChatNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatNotif.message.trim()) return;
    
    setNotifSending(true);
    try {
      await storageService.sendChatNotification(chatNotif.channel, chatNotif.message);
      setChatNotif({ ...chatNotif, message: '' });
      await loadData();
      alert("Sohbet duyurusu başarıyla yayınlandı.");
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setNotifSending(false);
    }
  };

  const handleEmailNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailNotif.message.trim() || !emailNotif.subject.trim()) return;
    
    setNotifSending(true);
    try {
      let targets: string[] = [];
      if (emailNotif.target === 'all') {
        targets = registrations.filter(r => r.status === 'approved').map(r => r.email);
      } else {
        targets = [emailNotif.target];
      }

      if (targets.length === 0) {
        alert("Gönderilecek onaylı kullanıcı bulunamadı.");
        return;
      }

      await storageService.sendEmailNotification(targets, emailNotif.subject, emailNotif.message);
      setEmailNotif({ ...emailNotif, message: '', subject: '' });
      await loadData();
      alert(`${targets.length} kullanıcıya bildirim kuyruğa alındı.`);
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setNotifSending(false);
    }
  };

  const filtered = registrations.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = 
      r.nickname.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (r.fullName && r.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0b0f14] text-gray-300 font-mono flex flex-col">
      {/* Top Header */}
      <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#00ff99] p-2 rounded-sm text-black">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-white font-black text-sm tracking-tighter uppercase">Workigom Control Center</h1>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Global Administration Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {!navigator.onLine && (
            <div className="flex items-center gap-2 text-orange-500 bg-orange-900/20 px-3 py-1.5 rounded-sm border border-orange-500/30">
              <WifiOff size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-tighter">OFFLINE MODE</span>
            </div>
          )}
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-white transition-colors uppercase"
          >
            <LogOut size={16} /> Güvenli Çıkış
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900/50 border-r border-gray-800 p-4 space-y-6 hidden md:block">
          <div>
            <p className="text-[10px] font-black text-gray-600 mb-4 px-2 tracking-widest uppercase">MENÜ</p>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('registrations')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-sm transition-all ${activeTab === 'registrations' ? 'bg-[#00ff99] text-black shadow-[0_0_15px_rgba(0,255,153,0.3)]' : 'hover:bg-gray-800'}`}
              >
                <Users size={16} /> Kullanıcı Yönetimi
              </button>
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-sm transition-all ${activeTab === 'notifications' ? 'bg-[#00ff99] text-black shadow-[0_0_15px_rgba(0,255,153,0.3)]' : 'hover:bg-gray-800'}`}
              >
                <Megaphone size={16} /> Bildirim Merkezi
              </button>
            </div>
          </div>

          {activeTab === 'registrations' && (
            <div>
              <p className="text-[10px] font-black text-gray-600 mb-4 px-2 tracking-widest uppercase">HIZLI FİLTRE</p>
              <div className="space-y-1">
                <button onClick={() => setFilter('all')} className={`w-full text-left px-4 py-2 text-[10px] font-bold rounded-sm ${filter === 'all' ? 'text-white bg-gray-800' : 'text-gray-500 hover:bg-gray-800/50'}`}>Tüm Kayıtlar</button>
                <button onClick={() => setFilter('pending')} className={`w-full text-left px-4 py-2 text-[10px] font-bold rounded-sm ${filter === 'pending' ? 'text-orange-400 bg-orange-900/20' : 'text-gray-500 hover:bg-gray-800/50'}`}>Onay Bekleyenler</button>
                <button onClick={() => setFilter('approved')} className={`w-full text-left px-4 py-2 text-[10px] font-bold rounded-sm ${filter === 'approved' ? 'text-blue-400 bg-blue-900/20' : 'text-gray-500 hover:bg-gray-800/50'}`}>Onaylananlar</button>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col p-6 overflow-hidden">
          {error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center animate-in zoom-in-95">
              <div className="bg-red-900/20 p-6 rounded-full border border-red-500/30">
                <AlertTriangle size={48} className="text-red-500" />
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-white font-black text-xl uppercase italic">VERİ BAĞLANTISI KESİLDİ</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                  {error}
                </p>
              </div>
              <button 
                onClick={loadData}
                className="bg-[#00ff99] text-black px-12 py-4 text-xs font-black uppercase shadow-lg hover:bg-white transition-all flex items-center gap-3"
              >
                <RefreshCw size={16} /> TEKRAR DENE
              </button>
            </div>
          ) : activeTab === 'registrations' ? (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                  {filter === 'approved' ? <CheckCircle className="text-blue-500" /> : filter === 'pending' ? <Clock className="text-orange-500" /> : <Users />}
                  {filter === 'approved' ? 'Onaylı Üyeler' : filter === 'pending' ? 'Bekleyen Başvurular' : 'Tüm Başvurular'}
                  <span className="text-gray-600 text-sm font-normal">[{filtered.length}]</span>
                </h2>
                
                <div className="flex gap-2">
                  <button onClick={loadData} className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-sm transition-all"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Ara..." 
                      className="bg-gray-900 border border-gray-700 text-xs py-2 pl-9 pr-4 rounded-sm outline-none focus:border-[#00ff99] w-48 lg:w-64"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-gray-900/30 border border-gray-800 rounded-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-900 text-gray-500 sticky top-0 z-10">
                    <tr>
                      <th className="p-4 border-b border-gray-800 font-black uppercase">Üye Bilgisi</th>
                      <th className="p-4 border-b border-gray-800 font-black uppercase">Nickname</th>
                      <th className="p-4 border-b border-gray-800 font-black uppercase">Durum</th>
                      <th className="p-4 border-b border-gray-800 font-black uppercase">Belgeler</th>
                      <th className="p-4 border-b border-gray-800 font-black uppercase text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {loading && filtered.length === 0 ? (
                      <tr><td colSpan={5} className="p-20 text-center text-gray-500 italic">Veritabanı taranıyor...</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={5} className="p-20 text-center text-gray-500 italic">Kayıt bulunamadı.</td></tr>
                    ) : filtered.map(reg => (
                      <tr key={reg.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-black text-white text-sm tracking-tight">{reg.fullName}</span>
                            <span className="text-[10px] text-gray-500">{reg.email}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-400 font-mono">@{reg.nickname}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase ${
                            reg.status === 'approved' ? 'bg-green-900/30 text-green-400 border border-green-500/20' :
                            reg.status === 'pending' ? 'bg-orange-900/30 text-orange-400 border border-orange-500/20' :
                            'bg-red-900/30 text-red-400 border border-red-500/20'
                          }`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button onClick={() => setSelectedDoc(reg.criminal_record_file || null)} className="p-1.5 bg-gray-800 hover:bg-[#00ff99] hover:text-black rounded-sm transition-all" title="Sicil Kaydı"><FileText size={14} /></button>
                            <button onClick={() => setSelectedDoc(reg.insurance_file || null)} className="p-1.5 bg-gray-800 hover:bg-[#00ff99] hover:text-black rounded-sm transition-all" title="SGK Belgesi"><FileText size={14} /></button>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {reg.status !== 'approved' && (
                              <button onClick={() => handleStatusUpdate(reg.id!, 'approved')} className="p-1.5 bg-green-600 text-white rounded-sm" disabled={processingId === reg.id}><CheckCircle size={14} /></button>
                            )}
                            {reg.status !== 'rejected' && (
                              <button onClick={() => handleStatusUpdate(reg.id!, 'rejected')} className="p-1.5 bg-orange-600 text-white rounded-sm" disabled={processingId === reg.id}><XCircle size={14} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-12">
              <div className="flex flex-col mb-4">
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                  <Megaphone className="text-[#00ff99]" /> BİLDİRİM MERKEZİ
                </h2>
                <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest border-l border-[#00ff99] pl-3">Duyuruları ve kurumsal iletişim kanalını buradan yönetin.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sohbet Odası Bildirimi */}
                <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-sm space-y-6">
                  <h3 className="text-xs font-black text-[#00ff99] uppercase flex items-center gap-2 border-b border-gray-800 pb-3">
                    <MessageSquare size={14} /> SOHBET ODASI ANONU (REAL-TIME)
                  </h3>
                  <form onSubmit={handleChatNotify} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-500 uppercase">HEDEF KANAL:</label>
                      <select 
                        value={chatNotif.channel}
                        onChange={e => setChatNotif({...chatNotif, channel: e.target.value})}
                        className="w-full bg-black border border-gray-700 p-3 text-white text-xs outline-none focus:border-[#00ff99] appearance-none cursor-pointer"
                      >
                        <option value="all">TÜM KANALLAR (GLOBAL BROADCAST)</option>
                        {channels.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-500 uppercase">ANONS İÇERİĞİ:</label>
                      <textarea 
                        value={chatNotif.message}
                        onChange={e => setChatNotif({...chatNotif, message: e.target.value})}
                        className="w-full bg-black border border-gray-700 p-3 text-white text-xs outline-none focus:border-[#00ff99] h-32 resize-none font-mono"
                        placeholder="Anonsunuzu buraya yazın..."
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={notifSending || !navigator.onLine}
                      className="w-full bg-[#00ff99] text-black py-4 text-xs font-black uppercase hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {notifSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      ANONSU YAYINLA
                    </button>
                  </form>
                </div>

                {/* E-Posta Bildirimi */}
                <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-sm space-y-6">
                  <h3 className="text-xs font-black text-blue-400 uppercase flex items-center gap-2 border-b border-gray-800 pb-3">
                    <Mail size={14} /> KURUMSAL E-POSTA DUYURUSU
                  </h3>
                  <form onSubmit={handleEmailNotify} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-500 uppercase">ALICILAR:</label>
                      <select 
                        value={emailNotif.target}
                        onChange={e => setEmailNotif({...emailNotif, target: e.target.value})}
                        className="w-full bg-black border border-gray-700 p-3 text-white text-xs outline-none focus:border-blue-500 appearance-none cursor-pointer"
                      >
                        <option value="all">TÜM ONAYLI ÜYELER ({registrations.filter(r => r.status === 'approved').length})</option>
                        {registrations.filter(r => r.status === 'approved').map(r => (
                          <option key={r.id} value={r.email}>{r.fullName} (@{r.nickname})</option>
                        ))}
                      </select>
                    </div>
                    <input 
                      type="text"
                      value={emailNotif.subject}
                      onChange={e => setEmailNotif({...emailNotif, subject: e.target.value})}
                      className="w-full bg-black border border-gray-700 p-3 text-white text-xs outline-none focus:border-blue-500"
                      placeholder="Konu başlığı..."
                      required
                    />
                    <textarea 
                      value={emailNotif.message}
                      onChange={e => setEmailNotif({...emailNotif, message: e.target.value})}
                      className="w-full bg-black border border-gray-700 p-3 text-white text-xs outline-none focus:border-blue-500 h-24 resize-none font-mono"
                      placeholder="E-posta içeriği..."
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={notifSending || !navigator.onLine}
                      className="w-full bg-blue-600 text-white py-4 text-xs font-black uppercase hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {notifSending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                      E-POSTA GÖNDER
                    </button>
                  </form>
                </div>
              </div>

              {/* Bildirim Geçmişi Logları */}
              <div className="mt-12 bg-black/40 border border-gray-800 p-6 rounded-sm">
                <h3 className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2 mb-4">
                  <History size={14} /> SON İŞLEMLER (ADMIN LOG)
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-[10px]">
                  {logs.length === 0 ? (
                    <p className="text-gray-600 italic">Henüz bir bildirim kaydı bulunmuyor.</p>
                  ) : logs.map(log => (
                    <div key={log.id} className="flex gap-3 border-b border-gray-800/50 py-2 hover:bg-white/5 px-2">
                      <span className="text-gray-600 shrink-0">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                      <span className={log.type === 'chat' ? 'text-green-500' : 'text-blue-400'}>[{log.type.toUpperCase()}]</span>
                      <span className="text-gray-400 shrink-0">TO: {log.target}</span>
                      <span className="text-white truncate">"{log.body}"</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/95 z-[500] flex flex-col items-center justify-center p-10 animate-in fade-in">
          <button onClick={() => setSelectedDoc(null)} className="absolute top-10 right-10 text-white hover:text-[#00ff99] transition-colors flex items-center gap-2 font-black uppercase border border-white/20 px-4 py-2">KAPAT [ESC]</button>
          <div className="max-w-4xl w-full h-[80vh] bg-white rounded-sm overflow-hidden flex items-center justify-center">
            <img src={selectedDoc} alt="Belge Önizleme" className="max-h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
