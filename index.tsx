
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
  
  return root;
};

// Global erişim sağla
(window as any).initWorkigomChat = initChat;

// Sayfa yüklendiğinde root varsa otomatik başlat
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  if (document.getElementById('root')) {
    initChat('root');
  }
} else {
  window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('root')) {
      initChat('root');
    }
  });
}
