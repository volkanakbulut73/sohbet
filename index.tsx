
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ChatModuleProps } from './types';

/**
 * Bu modülü herhangi bir web sayfasında veya mobil webview'da 
 * bağımsız olarak başlatmak için kullanılır.
 */
const initChat = (elementId: string, props: ChatModuleProps = {}) => {
  const rootElement = document.getElementById(elementId);
  if (!rootElement) {
    console.error(`Workigom Chat: #${elementId} elementi bulunamadı.`);
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App {...props} />
    </React.StrictMode>
  );
  
  return root; // Gerektiğinde unmount etmek için
};

// Global erişim sağla (Bağımsız entegrasyon için kritik)
(window as any).initWorkigomChat = initChat;

// Eğer bir root elementi varsa otomatik başlat (Standalone mod)
if (document.getElementById('root')) {
  initChat('root');
}
