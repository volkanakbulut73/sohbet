
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  FileText, 
  LogOut,
  RefreshCw,
  Search,
  User,
  Loader2
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { UserRegistration } from '../types';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await storageService.getAllRegistrations();
      setRegistrations(data);
    } catch (err: any) {
      console.error("Admin Load Error:", err);
      alert("Veriler yüklenemedi: " + (err.message || "Bilinmeyen hata"));
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
      
      // Başarıyla güncellendiğinde yerel state'i anında güncelle (Hızlı UI tepkisi)
      setRegistrations(prev => prev.map(reg => 
        reg.id === id ? { ...reg, status } : reg
      ));

      // Veritabanından taze veriyi çek
      const freshData = await storageService.getAllRegistrations();
      setRegistrations(freshData);
      
      // Eğer kullanıcı bekleyenler sayfasındaysa ve onaylandıysa, 'Onaylananlar' sekmesine taşı
      if (filter === 'pending') {
        setFilter(status);
      }
      
      console.log(`User ${id} updated to ${status}`);
    } catch (err: any) {
      console.error("Update Error:", err);
      alert("Hata: Başvuru güncellenemedi. Lütfen Supabase RLS (Update) politikalarını kontrol edin.\n\nDetay: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kaydı kalıcı olarak silmek istediğinize emin misiniz?")) return;
    setProcessingId(id);
    try {
      await storageService.deleteRegistration(id);
      await loadData();
    } catch (err: any) {
      alert("Silme işlemi başarısız: " + err.message);
    } finally {
      setProcessingId(null);
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
            <p className="text-[9px] text-gray-500 font-bold">YÖNETİCİ PANELİ v1.0.8</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-white transition-colors uppercase"
        >
          <LogOut size={16} /> Güvenli Çıkış
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900/50 border-r border-gray-800 p-4 space-y-2 hidden md:block">
          <p className="text-[10px] font-black text-gray-600 mb-4 px-2 tracking-widest uppercase">NAVİGASYON</p>
          <button 
            onClick={() => setFilter('all')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-sm transition-all ${filter === 'all' ? 'bg-[#00ff99] text-black' : 'hover:bg-gray-800'}`}
          >
            <Users size={16} /> Tüm Başvurular
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-sm transition-all ${filter === 'pending' ? 'bg-orange-500 text-black' : 'hover:bg-gray-800'}`}
          >
            <Clock size={16} /> Bekleyenler
          </button>
          <button 
            onClick={() => setFilter('approved')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-sm transition-all ${filter === 'approved' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}
          >
            <CheckCircle size={16} /> Onaylananlar
          </button>
          <button 
            onClick={() => setFilter('rejected')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-sm transition-all ${filter === 'rejected' ? 'bg-red-900 text-red-400' : 'hover:bg-gray-800'}`}
          >
            <XCircle size={16} /> Reddedilenler
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="flex flex-col">
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                {filter === 'approved' ? <CheckCircle className="text-blue-500" /> : filter === 'pending' ? <Clock className="text-orange-500" /> : <Users />}
                {filter === 'approved' ? 'Onaylananlar' : filter === 'pending' ? 'Bekleyenler' : 'Tüm Kayıtlar'}
                <span className="text-gray-600 text-sm font-normal">({filtered.length})</span>
                </h2>
                <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wider">
                    Sistem veri akışı gerçek zamanlı olarak senkronize edilmektedir.
                </p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={loadData}
                disabled={loading}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-sm transition-all disabled:opacity-50"
                title="Yenile"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ara (Nick, Email, Ad Soyad)..." 
                  className="bg-gray-900 border border-gray-700 text-xs py-2 pl-9 pr-4 rounded-sm outline-none focus:border-[#00ff99] w-64"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-900/30 border border-gray-800 rounded-sm scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-900 text-gray-500 sticky top-0 z-10">
                <tr>
                  <th className="p-4 border-b border-gray-800 font-black uppercase">Ad Soyad</th>
                  <th className="p-4 border-b border-gray-800 font-black uppercase">Nickname</th>
                  <th className="p-4 border-b border-gray-800 font-black uppercase">Email</th>
                  <th className="p-4 border-b border-gray-800 font-black uppercase">Durum</th>
                  <th className="p-4 border-b border-gray-800 font-black uppercase">Belgeler</th>
                  <th className="p-4 border-b border-gray-800 font-black uppercase text-right">Eylemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {loading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-20 text-center text-gray-500 italic">Veriler yükleniyor...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-20 text-center text-gray-500 italic">Kayıt bulunamadı.</td>
                  </tr>
                ) : filtered.map(reg => (
                  <tr key={reg.id} className={`hover:bg-white/5 transition-colors group ${processingId === reg.id ? 'opacity-50 bg-white/5 pointer-events-none' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#00ff99]/10 rounded-sm flex items-center justify-center font-black text-[#00ff99] border border-[#00ff99]/20">
                          {processingId === reg.id ? <Loader2 size={14} className="animate-spin" /> : <User size={14} />}
                        </div>
                        <span className="font-black text-white text-sm tracking-tight">{reg.fullName || 'Belirtilmedi'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                       <span className="text-gray-400 font-mono">@{reg.nickname}</span>
                    </td>
                    <td className="p-4 text-gray-500 font-bold">{reg.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase flex items-center gap-1.5 w-fit ${
                        reg.status === 'approved' ? 'bg-green-900/40 text-green-400 border border-green-500/30' :
                        reg.status === 'pending' ? 'bg-orange-900/40 text-orange-400 border border-orange-500/30' :
                        'bg-red-900/40 text-red-400 border border-red-500/30'
                      }`}>
                        {reg.status === 'approved' ? 'Onaylı' : reg.status === 'pending' ? 'Bekliyor' : 'Reddedildi'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedDoc(reg.criminal_record_file || null)}
                          className="flex items-center gap-1.5 px-2 py-1 bg-gray-800 hover:bg-[#00ff99] hover:text-black rounded-sm transition-all text-[10px] font-bold"
                        >
                          <FileText size={12} /> Sicil
                        </button>
                        <button 
                          onClick={() => setSelectedDoc(reg.insurance_file || null)}
                          className="flex items-center gap-1.5 px-2 py-1 bg-gray-800 hover:bg-[#00ff99] hover:text-black rounded-sm transition-all text-[10px] font-bold"
                        >
                          <FileText size={12} /> SGK
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className={`flex justify-end gap-2 transition-opacity ${processingId ? 'opacity-20' : 'opacity-0 group-hover:opacity-100'}`}>
                        {reg.status !== 'approved' && (
                          <button 
                            onClick={() => handleStatusUpdate(reg.id!, 'approved')}
                            className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-sm"
                            title="Onayla"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {reg.status !== 'rejected' && (
                          <button 
                            onClick={() => handleStatusUpdate(reg.id!, 'rejected')}
                            className="p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-sm"
                            title="Reddet"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(reg.id!)}
                          className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-sm"
                          title="Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Document Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/95 z-[300] flex flex-col items-center justify-center p-10 animate-in fade-in zoom-in-95">
          <button 
            onClick={() => setSelectedDoc(null)}
            className="absolute top-10 right-10 text-white hover:text-[#00ff99] transition-colors flex items-center gap-2 font-black uppercase"
          >
            <XCircle size={32} /> Kapat
          </button>
          <div className="max-w-4xl max-h-[80vh] bg-white p-2 rounded-sm overflow-auto shadow-[0_0_50px_rgba(0,255,153,0.2)]">
            <img src={selectedDoc} alt="Belge" className="max-w-full" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
