import React from 'react';
import ReactDOM from 'react-dom/client';
import { initApp } from 'lib';
import { App } from './App';
import { config } from './initConfig';

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found</div>';
} else {
  initApp(config)
    .then(() => {
      ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    })
    .catch((error) => {
      rootElement.innerHTML = `<div style="color: red; padding: 20px;">Error initializing app: ${error.message}</div>`;
    });
}