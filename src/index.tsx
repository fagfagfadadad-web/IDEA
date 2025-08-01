import React from 'react';
import ReactDOM from 'react-dom/client';
import { initApp } from 'lib';
import { App } from './App';
import { config } from './initConfig';

console.log('Starting app initialization');

initApp(config)
  .then(() => {
    console.log('initApp succeeded, rendering App');
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('Root element not found');
      return;
    }
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error('initApp failed:', error);
    // Zobraz chybu v DOM ako fallback
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `<div style="color: red; padding: 20px;">Error initializing app: ${error.message}</div>`;
    }
  });