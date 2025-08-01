import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Vytvor dočasný kontajner pre logy
const logContainer = document.createElement('div');
logContainer.style.position = 'fixed';
logContainer.style.top = '0';
logContainer.style.left = '0';
logContainer.style.background = 'white';
logContainer.style.padding = '10px';
logContainer.style.maxHeight = '50%';
logContainer.style.overflow = 'auto';
logContainer.style.zIndex = '9999';
logContainer.style.fontSize = '14px';
document.body.appendChild(logContainer);

const log = (message: string) => {
  logContainer.innerHTML += `<p>${new Date().toLocaleTimeString()}: ${message}</p>`;
};

log('Starting app without initApp');
log(`UserAgent: ${navigator.userAgent}`);

const rootElement = document.getElementById('root');
if (!rootElement) {
  log('Error: Root element not found');
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found</div>';
} else {
  log('Root element found, rendering App');
  ReactDOM.createRoot(rootElement).render(<App />);
}