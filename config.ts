
/**
 * Bağımsız yönetim konfigürasyonu.
 * Bu değerler veritabanından veya ana uygulamadan (props) ezilebilir.
 */
export const CHAT_MODULE_CONFIG = {
  VERSION: '1.0.3', // Versiyon takibi
  SUPABASE_URL: 'https://abunbqqxtpugsjfvvikj.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidW5icXF4dHB1Z3NqZnZ2aWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMTcyNzksImV4cCI6MjA4MTg5MzI3OX0.ld29ijoxlkkCC2uNPnvc4aiTiMEhQvu2bfilH6IOIzo',
  AUTO_REFRESH_ON_VERSION_MISMATCH: true,
  DEBUG_MODE: false,
  // Ana uygulama üzerinden gönderilebilecek varsayılanlar
  DEFAULT_THEME: 'light',
  STORAGE_PREFIX: 'workigom_chat_'
};

// Window üzerinden dinamik override imkanı (Opsiyonel)
if (typeof window !== 'undefined' && (window as any).WORKIGOM_CONFIG) {
  Object.assign(CHAT_MODULE_CONFIG, (window as any).WORKIGOM_CONFIG);
}
