
/**
 * Bağımsız yönetim konfigürasyonu.
 * Bu değerler veritabanından veya ana uygulamadan (props) ezilebilir.
 */
export const CHAT_MODULE_CONFIG = {
  VERSION: '1.0.4', // Versiyon güncellendi
  SUPABASE_URL: 'https://abunbqqxtpugsjfvvikj.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidW5icXF4dHB1Z3NqZnZ2aWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMTcyNzksImV4cCI6MjA4MTg5MzI3OX0.ld29ijoxlkkCC2uNPnvc4aiTiMEhQvu2bfilH6IOIzo',
  AUTO_REFRESH_ON_VERSION_MISMATCH: true,
  DEBUG_MODE: false,
  // Botun iş modeli ve kişiliği buradan ayarlanır
  BOT_SYSTEM_INSTRUCTION: `Sen Workigom platformu için özelleşmiş bir kurumsal asistansın. 
  İş modelimiz: [BURAYA İŞ MODELİNİZİ DETAYLI YAZIN. Örneğin: B2B hizmet sağlayan bir SaaS platformuyuz].
  Görevlerin:
  1. Kullanıcılara platform kullanımı hakkında rehberlik etmek.
  2. İş modelimize uygun profesyonel, yardımsever ve çözüm odaklı bir dil kullanmak.
  3. Yanıtlarını kısa, öz ve IRC formatına uygun tutmak.
  4. Bilmediğin konularda uydurmak yerine kullanıcıyı ilgili departmana yönlendirmek.`,
  DEFAULT_THEME: 'light',
  STORAGE_PREFIX: 'workigom_chat_'
};

// Window üzerinden dinamik override imkanı
if (typeof window !== 'undefined' && (window as any).WORKIGOM_CONFIG) {
  Object.assign(CHAT_MODULE_CONFIG, (window as any).WORKIGOM_CONFIG);
}
