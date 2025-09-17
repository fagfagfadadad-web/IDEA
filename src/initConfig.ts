import './styles/globals.css';

// Fix for TypeError: t._onTimeout is not a function
if (typeof globalThis !== 'undefined') {
  globalThis.setTimeout = globalThis.setTimeout.bind(globalThis);
  globalThis.setInterval = globalThis.setInterval.bind(globalThis);
  globalThis.clearTimeout = globalThis.clearTimeout.bind(globalThis);
  globalThis.clearInterval = globalThis.clearInterval.bind(globalThis);
}

import { environment } from './config/config.mainnet'; // Opravená cesta
import { walletConnectV2ProjectId } from './config/sharedConfig';
import { InitAppType } from './lib';

export const config: InitAppType = {
  storage: { getStorageCallback: () => localStorage },
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