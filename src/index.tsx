import React from 'react';
import ReactDOM from 'react-dom/client';

// Fix for Object.defineProperty called on non-object error
// This must be executed BEFORE any other imports that might use global
if (typeof window !== 'undefined' && typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

import { initApp } from 'lib';
import { App } from './App';
import { config } from './initConfig';

initApp(config).then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
