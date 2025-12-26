
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

  // Konteynırın stilini ayarla (relative olması içindeki absolute elemanlar için şart)
  if (rootElement.style.position !== 'fixed' && rootElement.style.position !== 'absolute') {
    rootElement.style.position = 'relative';
  }
  rootElement.style.overflow = 'hidden';

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      {/* SDK üzerinden çağrıldığında ZORUNLU olarak 'embedded' aktif edilir */}
      <App {...props} embedded={true} />
    </React.StrictMode>
  );
  
  return root;
};

// Tarayıcı ortamında global erişim sağla (window.initWorkigomChat)
if (typeof window !== 'undefined') {
  (window as any).initWorkigomChat = initWorkigomChat;
  
  /**
   * KRİTİK DÜZELTME: 
   * Otomatik başlatma sadece ana domainde (workigomchat.online) veya localhostta çalışmalı.
   * Dış sitelerde (workigom.com vb.) SDK sadece manuel çağrıldığında çalışmalı.
   */
  const isMainDomain = 
    window.location.hostname === 'workigomchat.online' || 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1';

  const defaultRoot = document.getElementById('root');
  if (isMainDomain && defaultRoot && !(defaultRoot as any)._workigomStarted) {
    (defaultRoot as any)._workigomStarted = true;
    const root = ReactDOM.createRoot(defaultRoot);
    root.render(
      <React.StrictMode>
        <App embedded={false} />
      </React.StrictMode>
    );
  }
}
