import './styles/globals.css';

// Fix for TypeError: t._onTimeout is not a function
// Explicitly bind setTimeout and setInterval to globalThis
if (typeof globalThis !== 'undefined') {
  globalThis.setTimeout = globalThis.setTimeout.bind(globalThis);
  globalThis.setInterval = globalThis.setInterval.bind(globalThis);
  globalThis.clearTimeout = globalThis.clearTimeout.bind(globalThis);
  globalThis.clearInterval = globalThis.clearInterval.bind(globalThis);
}

import { walletConnectV2ProjectId, environment } from './config'; // Should work if config.ts is in src
import { InitAppType } from './lib';

export const config: InitAppType = {
  storage: { getStorageCallback: () => sessionStorage },
  dAppConfig: {
    nativeAuth: true,
    environment: environment,
    providers: {
      walletConnect: {
        walletConnectV2ProjectId
      }
    }
  }
};