import React from 'react';
import ReactDOM from 'react-dom/client';
import { initApp } from 'lib';
import { App } from './App';
import { config } from './initConfig';

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

log('Starting app initialization');
log(`UserAgent: ${navigator.userAgent}`);

const rootElement = document.getElementById('root');
if (!rootElement) {
  log('Error: Root element not found');
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found</div>';
} else {
  log('Root element found, initializing app...');
  
  // Funkcia na pridanie timeoutu
  const timeoutPromise = (promise: Promise<void>, timeoutMs: number) => {
    return Promise.race([
      promise,
      new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('initApp timed out after ' + timeoutMs + 'ms')), timeoutMs);
      }),
    ]);
  };

  try {
    timeoutPromise(initApp(config), 10000) // 10 sekúnd timeout
      .then(() => {
        log('initApp succeeded, rendering App');
        ReactDOM.createRoot(rootElement).render(<App />);
      })
      .catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log(`initApp failed: ${errorMessage}`);
        rootElement.innerHTML = `<div style="color: red; padding: 20px;">Error initializing app: ${errorMessage}</div>`;
      });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`initApp threw synchronous error: ${errorMessage}`);
    rootElement.innerHTML = `<div style="color: red; padding: 20px;">Error initializing app: ${errorMessage}</div>`;
  }
}