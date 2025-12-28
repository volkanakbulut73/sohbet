
import React from 'react';
import { 
  Users, 
  Briefcase, 
  MessageSquare, 
  Lock, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  Shield,
  LogIn,
  UserPlus,
  Settings
} from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
  onRegisterClick: () => void;
  onAdminClick?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onRegisterClick, onAdminClick }) => {
  return (
    <div className="min-h-screen bg-[#0b0f14] text-gray-300 font-mono flex flex-col selection:bg-[#00ff99] selection:text-black">
      
      {/* 1. HERO ALANI */}
      <section className="relative min-h-[95vh] flex flex-col items-center justify-center px-6 py-12 overflow-hidden border-b border-gray-900">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#00ff99 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="max-w-5xl w-full text-center space-y-10 z-10 fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm border border-[#00ff99]/30 bg-gray-900/80 text-[10px] font-bold text-[#00ff99] mb-4 shadow-[0_0_15px_rgba(0,255,153,0.1)]">
            <Shield size={12} className="animate-pulse" />
            SİSTEM DURUMU: GÜVENLİ ERİŞİM AKTİF
          </div>

          <h1 className="text-4xl md:text-8xl font-black text-white leading-tight tracking-tighter uppercase italic">
            Gerçek İnsanlarla,<br/>
            <span className="text-[#00ff99] drop-shadow-[0_0_10px_rgba(0,255,153,0.3)]">Güvenli Sohbet</span>
          </h1>

          <p className="text-sm md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed border-l-2 border-[#00ff99] pl-6 py-2 bg-gray-900/20">
            Sabıka kaydı temiz, çalışan ve kimliği doğrulanmış kişilerle 
            huzurlu, seviyeli ve <span className="text-white">gerçek sohbet ortamı.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <button 
              onClick={onEnter}
              className="group bg-[#00ff99] text-black px-12 py-5 text-sm font-black shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              <LogIn size={20} /> GİRİŞ YAP
            </button>
            <button 
              onClick={onRegisterClick}
              className="border-2 border-[#00ff99] text-[#00ff99] hover:bg-[#00ff99] hover:text-black px-12 py-5 text-sm font-black transition-all flex items-center justify-center gap-3 bg-gray-900/50 shadow-[6px_6px_0px_0px_rgba(0,255,153,0.1)]"
            >
              <UserPlus size={20} /> BAŞVUR VE KATIL
            </button>
          </div>
        </div>
      </section>

      {/* 2. GÜVENLİK VURGUSU */}
      <section id="security" className="py-32 px-6 bg-[#0e1218] relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-20 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-white flex items-center gap-4 italic tracking-tighter">
              🛡️ GÜVENLİK BİZİM ÖNCELİĞİMİZ
            </h2>
            <div className="h-1.5 w-32 bg-[#00ff99]"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { 
                icon: <Users size={32} className="text-[#00ff99]" />, 
                title: "Gerçek Kişiler", 
                points: ["Kimlik doğrulama zorunlu", "Sahte hesaplara geçit yok", "7/24 Aktif Moderasyon"] 
              },
              { 
                icon: <FileText size={32} className="text-[#00ff99]" />, 
                title: "Sabıka Kaydı Kontrolü", 
                points: ["Temiz sicil olmayan kabul edilmez", "Topluluk güvenliği esastır", "Düzenli periyodik denetimler"] 
              },
              { 
                icon: <Briefcase size={32} className="text-[#00ff99]" />, 
                title: "Çalışan Olma Zorunluluğu", 
                points: ["Aktif çalışan bireyler", "Daha saygılı ve bilinçli topluluk", "Profesyonel sosyal ağ"] 
              }
            ].map((card, i) => (
              <div key={i} className="bg-[#0b0f14] border-2 border-gray-800 p-10 hover:border-[#00ff99] transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                   {card.icon}
                </div>
                <div className="mb-8 p-5 bg-gray-900/80 w-fit rounded-sm border border-gray-800 group-hover:shadow-[0_0_20px_rgba(0,255,153,0.1)] transition-all">
                  {card.icon}
                </div>
                <h4 className="text-xl font-black text-white mb-6 uppercase tracking-tight">{card.title}</h4>
                <ul className="space-y-4">
                  {card.points.map((p, pi) => (
                    <li key={pi} className="flex items-center gap-3 text-xs md:text-sm text-gray-400 font-bold italic">
                      <CheckCircle2 size={16} className="text-[#00ff99] shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. NEDEN BU SOHBET? / mIRC RUHU */}
      <section className="py-32 px-6 border-t border-gray-900 bg-[#0b0f14]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase underline decoration-[#00ff99] decoration-4 underline-offset-8">Neden Buradayız?</h3>
            <div className="space-y-6 text-gray-300 leading-relaxed text-base md:text-lg italic">
              <p>
                İnternette anonimlik çoğu zaman güvensizliği beraberinde getirir. 
                <span className="text-[#00ff99] font-black"> Biz bu döngüyü kırmak için buradayız.</span>
              </p>
              <p className="bg-gray-900/40 p-6 border-l-4 border-[#00ff99] text-gray-200">
                Amacımız; gerçek insanların, gerçek sohbetler yaptığı, 
                seviyeli, güvenli ve saygılı bir ortam oluşturmak.
              </p>
            </div>
            
            <div className="pt-10 space-y-6">
               <h4 className="text-[#00ff99] text-lg font-black uppercase flex items-center gap-3">
                 <MessageSquare size={24} /> 💬 SOHBET KÜLTÜRÜMÜZ
               </h4>
               <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm font-black">
                 <li className="flex items-center gap-3 text-gray-400"><ChevronRight size={18} className="text-[#00ff99]" /> “Naber millet?” samimiyeti</li>
                 <li className="flex items-center gap-3 text-gray-400"><ChevronRight size={18} className="text-[#00ff99]" /> Hakaret, taciz, spam yok</li>
                 <li className="flex items-center gap-3 text-gray-400"><ChevronRight size={18} className="text-[#00ff99]" /> Geyik serbest, saygı şart</li>
                 <li className="flex items-center gap-3 text-gray-400"><ChevronRight size={18} className="text-[#00ff99]" /> Moderasyon her an aktif</li>
               </ul>
            </div>
          </div>

          <div className="bg-[#000080] border-4 border-white shadow-[20px_20px_0px_0px_rgba(0,255,153,0.05)] rounded-lg p-1 hidden lg:block overflow-hidden transition-transform hover:scale-[1.02]">
            <div className="bg-[#d4dce8] h-full rounded-sm">
              <div className="bg-gradient-to-r from-[#000080] to-blue-800 text-white px-3 py-1.5 text-[11px] font-black flex justify-between items-center shadow-md">
                <span className="flex items-center gap-2">
                   <Shield size={12} /> Status: connected to Workigom (irc.workigomchat.online)
                </span>
                <div className="flex gap-1.5">
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-white shadow-inner"></div>
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-white shadow-inner"></div>
                  <div className="w-4 h-4 bg-red-800 border border-white shadow-inner"></div>
                </div>
              </div>
              <div className="p-6 font-mono text-[13px] space-y-3 text-black leading-tight bg-white/90">
                <p className="text-blue-800 font-bold">*** Local host: workigomchat.online (127.0.0.1)</p>
                <p className="text-blue-800">*** Checking identity protocol...</p>
                <div className="pl-4 space-y-1">
                  <p className="text-green-700 font-bold flex items-center gap-2">
                    <CheckCircle2 size={12} /> Identity verified: [Kimlik Onaylandı]
                  </p>
                  <p className="text-green-700 font-bold flex items-center gap-2">
                    <CheckCircle2 size={12} /> Criminal record: [Sicil Temiz]
                  </p>
                  <p className="text-green-700 font-bold flex items-center gap-2">
                    <CheckCircle2 size={12} /> Professional status: [Aktif Çalışan]
                  </p>
                </div>
                <p className="text-purple-700 mt-6 font-black animate-pulse italic">[ Sistem ]: Sohbete katılmaya yetkiniz var. İyi sohbetler 🙂</p>
                <p className="text-gray-400 mt-4">Kanal girişi bekleniyor...<span className="cursor-blink"></span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER / FINAL CTA */}
      <footer className="py-24 px-6 border-t border-gray-900 bg-[#0b0f14] text-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] select-none">
          <span className="text-[20vw] font-black uppercase italic whitespace-nowrap">WORKIGOM</span>
        </div>

        <div className="max-w-4xl mx-auto space-y-12 z-10 relative">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">Güvenli Sohbet Bir Ayrıcalıktır</h2>
            <p className="text-[#00ff99] text-sm font-black tracking-[0.5em] uppercase">WORKIGOMCHAT.ONLINE</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
            <button 
              onClick={onRegisterClick}
              className="bg-[#00ff99] text-black px-16 py-6 text-sm font-black hover:bg-white hover:scale-105 transition-all uppercase shadow-xl"
            >
              🔐 Başvur ve Katıl
            </button>
            <button className="border-2 border-gray-700 text-gray-400 px-16 py-6 text-sm font-bold hover:text-white hover:border-gray-500 transition-all uppercase">
              📄 Kurallar & Gizlilik
            </button>
          </div>

          <div className="pt-24 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-8 opacity-50">
            <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">
              WORKIGOM NETWORK SYSTEM © 2024
            </div>
            <div className="flex gap-8 text-[10px] text-gray-500 font-black uppercase tracking-widest">
              <button 
                onClick={onAdminClick}
                className="flex items-center gap-1 hover:text-[#00ff99] transition-colors uppercase"
              >
                <Settings size={12} /> Yönetici Girişi
              </button>
              <a href="#" className="hover:text-[#00ff99] transition-colors">DESTEK</a>
              <a href="#" className="hover:text-[#00ff99] transition-colors">KVKK</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
