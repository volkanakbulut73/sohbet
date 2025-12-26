
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ChatModuleProps } from './types';

/**
 * Workigom Chat SDK
 */
export const initWorkigomChat = (elementId: string, props: ChatModuleProps = {}) => {
  const rootElement = document.getElementById(elementId);
  if (!rootElement) {
    console.warn(`Workigom Chat Error: #${elementId} bulunamadı.`);
    return null;
  }

  // Parent element'in yüksekliğini ve taşmalarını chat için zorunlu hale getiriyoruz.
  rootElement.style.height = rootElement.style.height || '600px';
  rootElement.style.minHeight = '400px';
  rootElement.style.maxHeight = '100%';
  rootElement.style.overflow = 'hidden';
  rootElement.style.position = 'relative';
  rootElement.style.display = 'flex';
  rootElement.style.flexDirection = 'column';

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App {...props} embedded={true} />
    </React.StrictMode>
  );
  
  return root;
};

if (typeof window !== 'undefined') {
  (window as any).initWorkigomChat = initWorkigomChat;
  
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
