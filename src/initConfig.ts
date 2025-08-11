import './styles/globals.css';

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