
/**
 * workigomchat.online - Üretim Ortamı Konfigürasyonu
 */
export const CHAT_MODULE_CONFIG = {
  VERSION: '1.1.2',
  DOMAIN: 'workigomchat.online',
  BASE_URL: 'https://workigomchat.online',
  // Supabase bağlantı bilgileri
  SUPABASE_URL: 'https://abunbqqxtpugsjfvvikj.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidW5icXF4dHB1Z3NqZnZ2aWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMTcyNzksImV4cCI6MjA4MTg5MzI3OX0.ld29ijoxlkkCC2uNPnvc4aiTiMEhQvu2bfilH6IOIzo',
  AUTO_REFRESH_ON_VERSION_MISMATCH: true,
  DEBUG_MODE: false,
  STORAGE_PREFIX: 'workigom_chat_prod_'
};

if (typeof window !== 'undefined' && (window as any).WORKIGOM_CONFIG) {
  Object.assign(CHAT_MODULE_CONFIG, (window as any).WORKIGOM_CONFIG);
}
