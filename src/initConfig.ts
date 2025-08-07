import './styles/globals.css';

// Fix for TypeError: t._onTimeout is not a function
if (typeof window !== 'undefined') {
  // Browser environment
  globalThis.setTimeout = window.setTimeout.bind(window);
  globalThis.setInterval = window.setInterval.bind(window);
  globalThis.clearTimeout = window.clearTimeout.bind(window);
  globalThis.clearInterval = window.clearInterval.bind(window);
} else if (typeof global !== 'undefined') {
  // Node.js environment
  globalThis.setTimeout = global.setTimeout.bind(global);
  globalThis.setInterval = global.setInterval.bind(global);
  globalThis.clearTimeout = global.clearTimeout.bind(global);
  globalThis.clearInterval = global.clearInterval.bind(global);
} else if (typeof globalThis !== 'undefined') {
  // Fallback to globalThis
  globalThis.setTimeout = globalThis.setTimeout.bind(globalThis);
  globalThis.setInterval = globalThis.setInterval.bind(globalThis);
  globalThis.clearTimeout = globalThis.clearTimeout.bind(globalThis);
  globalThis.clearInterval = globalThis.clearInterval.bind(globalThis);
}

import { environment } from './config/config.mainnet'; // Opravená cesta
import { walletConnectV2ProjectId } from './config/sharedConfig';
import { InitAppType, TransactionManager } from './lib';

export const config: InitAppType = {
  storage: { getStorageCallback: () => localStorage },
  dAppConfig: {
    nativeAuth: true,
    environment: environment,
    walletConnectDeepLink: 'https://xportal.com/',
    providers: {
      walletConnect: {
        walletConnectV2ProjectId
      }
    },
    onSuccess: (sessionId: string, tx: any) => {
      console.log('✅ Transaction successful:', { sessionId, tx });
    },
    onFail: (sessionId: string, error: any) => {
      console.error('❌ Transaction failed:', { sessionId, error });
    }
  }
};