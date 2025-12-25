
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ChatModuleProps } from './types';

/**
 * Workigom Chat SDK
 * Bu fonksiyon, modülü herhangi bir DOM elementine enjekte eder.
 */
export const initWorkigomChat = (elementId: string, props: ChatModuleProps = {}) => {
  const rootElement = document.getElementById(elementId);
  if (!rootElement) {
    console.warn(`Workigom Chat Error: #${elementId} bulunamadı.`);
    return null;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App {...props} />
    </React.StrictMode>
  );
  
  return root;
};

// Tarayıcı ortamında global erişim sağla (window.initWorkigomChat)
if (typeof window !== 'undefined') {
  (window as any).initWorkigomChat = initWorkigomChat;
  
  // Eğer sayfada id'si "root" olan bir element varsa otomatik başlat (Geliştirme kolaylığı için)
  const defaultRoot = document.getElementById('root');
  if (defaultRoot && !(defaultRoot as any)._workigomStarted) {
    (defaultRoot as any)._workigomStarted = true;
    initWorkigomChat('root');
  }
}
