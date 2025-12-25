
import React, { useState } from 'react';
import { X, Upload, FileCheck, ShieldAlert, ChevronRight, User, Mail, Lock, UserRound } from 'lucide-react';
import { storageService } from '../services/storageService';

interface RegistrationFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nickname: '',
    fullName: '',
    email: '',
    password: '',
  });
  const [files, setFiles] = useState<{ criminal: string | null; insurance: string | null }>({
    criminal: null,
    insurance: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'criminal' | 'insurance') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.criminal || !files.insurance) {
      setError('Lütfen tüm belgeleri (Sabıka Kaydı & Sigorta) yükleyiniz.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await storageService.registerUser({
        nickname: formData.nickname,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        criminal_record_file: files.criminal,
        insurance_file: files.insurance,
        status: 'pending'
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200] font-mono">
      <div className="w-full max-w-2xl bg-[#d4dce8] border-2 border-white shadow-[10px_10px_0px_0px_rgba(0,0,0,0.5)] flex flex-col max-h-[95vh]">
        {/* Title Bar */}
        <div className="bg-[#000080] text-white px-3 py-1.5 text-[11px] font-black flex justify-between items-center select-none shrink-0">
          <span className="flex items-center gap-2">
            <User size={12} /> Workigom - Yeni Kayıt Başvurusu (v1.0.8)
          </span>
          <X size={16} className="cursor-pointer hover:bg-red-600 transition-colors" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto space-y-6">
          <div className="bg-white/50 border border-blue-200 p-4 text-[10px] text-blue-900 font-bold leading-relaxed italic">
            [ Bilgi ]: Başvurunuzun onaylanması için belgelerin eksiksiz ve okunur olması gerekmektedir. 
            Güvenli bir topluluk için tüm bilgiler kriptografik olarak saklanır.
          </div>

          {error && (
            <div className="bg-red-100 border-2 border-red-500 p-3 text-red-700 text-[10px] font-bold flex items-center gap-2 animate-pulse">
              <ShieldAlert size={14} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sol: Temel Bilgiler */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#000080] uppercase border-b border-gray-400 pb-1">1. Hesap Bilgileri</h3>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-600 flex items-center gap-1 uppercase">
                  <UserRound size={10} /> Ad Soyad:
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full border-2 border-gray-400 p-2 text-xs bg-white focus:border-[#000080] outline-none"
                  placeholder="Örn: Ahmet Yılmaz"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-600 flex items-center gap-1 uppercase">
                  <ChevronRight size={10} /> Nickname:
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.nickname}
                  onChange={e => setFormData({...formData, nickname: e.target.value})}
                  className="w-full border-2 border-gray-400 p-2 text-xs bg-white focus:border-[#000080] outline-none"
                  placeholder="Örn: Ahmet73"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-600 flex items-center gap-1 uppercase">
                  <Mail size={10} /> Email Adresi:
                </label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full border-2 border-gray-400 p-2 text-xs bg-white focus:border-[#000080] outline-none"
                  placeholder="isim@sirket.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-600 flex items-center gap-1 uppercase">
                  <Lock size={10} /> Şifre Belirle:
                </label>
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full border-2 border-gray-400 p-2 text-xs bg-white focus:border-[#000080] outline-none"
                  placeholder="********"
                />
              </div>
            </div>

            {/* Sağ: Belge Yükleme */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#000080] uppercase border-b border-gray-400 pb-1">2. Güvenlik Belgeleri</h3>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-600 uppercase">Adli Sicil Kaydı (E-Devlet):</label>
                <div className={`relative border-2 border-dashed ${files.criminal ? 'border-green-500 bg-green-50' : 'border-gray-400 bg-gray-100'} p-4 text-center cursor-pointer hover:bg-white transition-colors`}>
                  <input 
                    type="file" 
                    accept="image/*,application/pdf"
                    onChange={e => handleFileChange(e, 'criminal')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {files.criminal ? (
                    <div className="flex flex-col items-center text-green-700">
                      <FileCheck size={24} />
                      <span className="text-[9px] font-black mt-1 uppercase">Döküman Eklendi</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <Upload size={24} />
                      <span className="text-[9px] font-bold mt-1 uppercase">PDF veya Görsel Yükle</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-600 uppercase">SGK Tescil / Çalışan Belgesi:</label>
                <div className={`relative border-2 border-dashed ${files.insurance ? 'border-green-500 bg-green-50' : 'border-gray-400 bg-gray-100'} p-4 text-center cursor-pointer hover:bg-white transition-colors`}>
                  <input 
                    type="file" 
                    accept="image/*,application/pdf"
                    onChange={e => handleFileChange(e, 'insurance')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {files.insurance ? (
                    <div className="flex flex-col items-center text-green-700">
                      <FileCheck size={24} />
                      <span className="text-[9px] font-black mt-1 uppercase">Döküman Eklendi</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <Upload size={24} />
                      <span className="text-[9px] font-bold mt-1 uppercase">PDF veya Görsel Yükle</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-[#00ff99] text-black py-4 text-xs font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1 transition-all uppercase disabled:opacity-50"
            >
              {loading ? 'SİSTEME GÖNDERİLİYOR...' : '✅ BAŞVURUYU TAMAMLA'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="px-8 bg-gray-400 text-white text-xs font-black uppercase hover:bg-gray-500 transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;
