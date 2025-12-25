import React from 'react';
import { 
  ShieldCheck, 
  Users, 
  Briefcase, 
  MessageSquare, 
  ArrowRight, 
  Lock, 
  Terminal, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  Info
} from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-[#0b0f14] text-gray-300 font-mono flex flex-col selection:bg-[#00ff99] selection:text-black">
      
      {/* 1. HERO ALANI */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
        {/* Arka plan süslemesi */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00ff99] rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-4xl w-full text-center space-y-8 z-10 fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-800 bg-gray-900/50 text-[10px] font-bold text-[#00ff99] mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff99] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff99]"></span>
            </span>
            SİSTEM AKTİF: KİMLİK DOĞRULAMA GEREKLİ
          </div>

          <h1 className="text-4xl md:text-7xl font-black text-white leading-tight tracking-tighter">
            Gerçek İnsanlarla,<br/>
            <span className="text-[#00ff99]">Güvenli Sohbet</span>
          </h1>

          <p className="text-sm md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Sabıka kaydı temiz, çalışan ve kimliği doğrulanmış kişilerle 
            huzurlu, seviyeli ve gerçek bir sohbet ortamı.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <button 
              onClick={onEnter}
              className="bg-[#00ff99] text-black px-10 py-4 text-sm font-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Lock size={18} /> SOHBETE KATIL
            </button>
            <a 
              href="#security"
              className="border border-gray-700 hover:border-gray-500 text-white px-10 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              <Info size={18} /> GÜVENLİK ANALİZİ
            </a>
          </div>
        </div>

        {/* Floating Mouse Prompt */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-20">
          <div className="w-1 h-8 bg-white rounded-full"></div>
        </div>
      </section>

      {/* 2. GÜVENLİK VURGUSU */}
      <section id="security" className="py-24 px-6 bg-[#0e1218]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-16 space-y-4">
            <h2 className="text-2xl md:text-4xl font-black text-white flex items-center gap-3">
              <ShieldCheck size={32} className="text-[#00ff99]" />
              GÜVENLİK BİZİM ÖNCELİĞİMİZ
            </h2>
            <div className="h-1 w-20 bg-[#00ff99]"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Users className="text-[#00ff99]" />, 
                title: "Gerçek Kişiler", 
                points: ["Kimlik doğrulama", "Sahte hesap yok", "Bot engelleme"] 
              },
              { 
                icon: <FileText className="text-[#00ff99]" />, 
                title: "Sabıka Kaydı Kontrolü", 
                points: ["Temiz sicil zorunluluğu", "Topluluk güvenliği", "Düzenli denetim"] 
              },
              { 
                icon: <Briefcase className="text-[#00ff99]" />, 
                title: "Çalışan Olma Zorunluluğu", 
                points: ["Aktif iş hayatı", "Bilinçli topluluk", "Saygılı bireyler"] 
              }
            ].map((card, i) => (
              <div key={i} className="bg-gray-900/40 border border-gray-800 p-8 hover:bg-gray-900/60 transition-all group">
                <div className="mb-6 p-4 bg-[#0b0f14] w-fit rounded-lg border border-gray-800 group-hover:border-[#00ff99] transition-colors">
                  {card.icon}
                </div>
                <h4 className="text-lg font-bold text-white mb-4 uppercase">{card.title}</h4>
                <ul className="space-y-3">
                  {card.points.map((p, pi) => (
                    <li key={pi} className="flex items-center gap-2 text-xs text-gray-400">
                      <CheckCircle2 size={12} className="text-gray-600" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. NEDEN BU SOHBET? / mIRC RUHU */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Neden Buradayız?</h3>
            <div className="space-y-4 text-gray-400 leading-relaxed text-sm md:text-base">
              <p>
                İnternette anonimlik çoğu zaman güvensizliği beraberinde getirir. 
                Biz bu döngüyü kırmak için buradayız.
              </p>
              <p className="font-bold text-gray-300">
                Amacımız; gerçek insanların, gerçek sohbetler yaptığı, 
                seviyeli, güvenli ve saygılı bir ortam oluşturmak.
              </p>
            </div>
            
            <div className="pt-8">
               <h4 className="text-[#00ff99] text-sm font-black mb-4 uppercase flex items-center gap-2">
                 <MessageSquare size={16} /> Sohbet Kültürümüz
               </h4>
               <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-bold">
                 <li className="flex items-center gap-2"><ChevronRight size={14} /> "Naber millet?" samimiyeti</li>
                 <li className="flex items-center gap-2"><ChevronRight size={14} /> Hakaret, taciz, spam yok</li>
                 <li className="flex items-center gap-2"><ChevronRight size={14} /> Geyik serbest, saygı şart</li>
                 <li className="flex items-center gap-2"><ChevronRight size={14} /> Moderasyon her an aktif</li>
               </ul>
            </div>
          </div>

          {/* mIRC Style Terminal Visual */}
          <div className="bg-[#000080] border-2 border-white shadow-[12px_12px_0px_0px_rgba(0,255,153,0.1)] rounded p-1 hidden lg:block overflow-hidden">
            <div className="bg-[#d4dce8] h-full rounded-sm">
              <div className="bg-[#000080] text-white px-2 py-0.5 text-[10px] font-bold flex justify-between items-center">
                <span>Status: connected to Workigom (irc.workigom.online)</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#c0c0c0] border border-white"></div>
                  <div className="w-2 h-2 bg-[#c0c0c0] border border-white"></div>
                </div>
              </div>
              <div className="p-4 font-mono text-[11px] space-y-2 text-black leading-tight">
                <p className="text-blue-700">*** Local host: www.workigomchat.online (127.0.0.1)</p>
                <p className="text-blue-700">*** Checking identity...</p>
                <p className="text-green-700 font-bold">*** Identity verified: [Sabıka Kaydı Temiz]</p>
                <p className="text-green-700 font-bold">*** Working status: [Aktif Çalışan]</p>
                <p className="text-purple-700 mt-4 italic">[ Sistem ]: Sohbete hoş geldin 🙂</p>
                <p className="text-black opacity-50">Sohbet bekliyor...<span className="cursor-blink"></span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NASIL KATILIRSIN? */}
      <section className="py-24 px-6 bg-[#0b0f14] border-t border-gray-900">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-center text-2xl font-black text-white mb-16 uppercase tracking-widest">Nasıl Katılırsın?</h3>
          <div className="relative">
            {/* Connector Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-800 hidden md:block"></div>
            
            <div className="space-y-12 relative">
              {[
                { step: "1", title: "Başvuru Oluştur", desc: "Sistem üzerinden temel bilgilerinle kaydını başlat." },
                { step: "2", title: "Kimlik & Sabıka Kontrolü", desc: "Güvenli protokollerimizle doğrulama sürecini bekle." },
                { step: "3", title: "Çalışma Durumu Doğrulaması", desc: "Profesyonel topluluğumuz için aktif iş durumu kontrolü." },
                { step: "4", title: "Onay → Sohbete Giriş 🚀", desc: "Tebrikler! Artık ayrıcalıklı topluluğun bir parçasısın." }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-8 group">
                  <div className="w-16 h-16 shrink-0 rounded-full bg-gray-900 border-2 border-gray-800 flex items-center justify-center text-[#00ff99] font-black text-xl group-hover:border-[#00ff99] transition-all z-10">
                    {item.step}
                  </div>
                  <div className="pt-4">
                    <h5 className="text-white font-bold mb-2 uppercase">{item.title}</h5>
                    <p className="text-sm text-gray-500 italic">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER / FINAL CTA */}
      <footer className="py-20 px-6 border-t border-gray-900 bg-[#0e1218] text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white uppercase italic">Güvenli Sohbet Bir Ayrıcalıktır</h2>
            <p className="text-[#00ff99] text-xs font-bold tracking-[0.3em]">WWW.WORKIGOMCHAT.ONLINE</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onEnter}
              className="bg-white text-black px-12 py-4 text-sm font-black hover:bg-[#00ff99] transition-colors uppercase"
            >
              🔐 Başvur ve Katıl
            </button>
            <button className="border border-gray-700 text-gray-400 px-12 py-4 text-sm font-bold hover:text-white transition-colors">
              📄 Kurallar & Gizlilik
            </button>
          </div>

          <div className="pt-16 border-t border-gray-900/50 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-[10px] text-gray-600 font-bold uppercase">
              WORKIGOM NETWORK SYSTEM © 2024
            </div>
            <div className="flex gap-6 text-[10px] text-gray-600 font-bold uppercase">
              <a href="#" className="hover:text-[#00ff99]">Destek</a>
              <a href="#" className="hover:text-[#00ff99]">Kullanım Koşulları</a>
              <a href="#" className="hover:text-[#00ff99]">KVKK</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;