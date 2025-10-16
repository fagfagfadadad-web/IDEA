import { BrowserProvider, JsonRpcSigner, ethers } from 'ethers';

export interface BscWalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
}

export const BSC_CHAIN_IDS = {
  MAINNET: 56,
  TESTNET: 97,
};

export const BSC_NETWORKS = {
  [BSC_CHAIN_IDS.MAINNET]: {
    chainId: `0x${BSC_CHAIN_IDS.MAINNET.toString(16)}`,
    chainName: 'Binance Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed1.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
  },
  [BSC_CHAIN_IDS.TESTNET]: {
    chainId: `0x${BSC_CHAIN_IDS.TESTNET.toString(16)}`,
    chainName: 'BSC Testnet',
    nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
  },
};

export class BscWalletService {
  private static walletState: BscWalletState = {
    address: null,
    chainId: null,
    isConnected: false,
    provider: null,
    signer: null,
  };

  private static listeners: Set<(state: BscWalletState) => void> = new Set();
  private static manuallyDisconnected: boolean = false;

  static async checkMetaMaskInstalled(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return !!(window as any).ethereum;
  }

  static async connectWallet(): Promise<string> {
    if (!await this.checkMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      const ethereum = (window as any).ethereum;
      const provider = new BrowserProvider(ethereum);

      const accounts = await provider.send('eth_requestAccounts', []);

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      const address = accounts[0];
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const signer = await provider.getSigner();

      this.walletState = {
        address,
        chainId,
        isConnected: true,
        provider,
        signer,
      };

      this.notifyListeners();
      this.setupEventListeners();

      this.manuallyDisconnected = false;

      console.log('BSC Wallet connected:', address, 'Chain:', chainId);

      return address;
    } catch (error: any) {
      console.error('Failed to connect BSC wallet:', error);

      if (error.code === 4001) {
        throw new Error('Connection request rejected. Please approve the connection in MetaMask.');
      }

      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }

  static async disconnectWallet(): Promise<void> {
    this.manuallyDisconnected = true;

    this.walletState = {
      address: null,
      chainId: null,
      isConnected: false,
      provider: null,
      signer: null,
    };

    this.notifyListeners();
    console.log('BSC Wallet disconnected manually');
  }

  static async switchToBscNetwork(chainId: number = BSC_CHAIN_IDS.MAINNET): Promise<void> {
    if (!await this.checkMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    const ethereum = (window as any).ethereum;
    const networkConfig = BSC_NETWORKS[chainId];

    if (!networkConfig) {
      throw new Error('Invalid chain ID');
    }

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          });
        } catch (addError: any) {
          throw new Error(`Failed to add BSC network: ${addError.message}`);
        }
      } else {
        throw new Error(`Failed to switch network: ${switchError.message}`);
      }
    }
  }

  static async signMessage(message: string): Promise<string> {
    if (!this.walletState.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await this.walletState.signer.signMessage(message);
      return signature;
    } catch (error: any) {
      console.error('Failed to sign message:', error);
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }

  static verifySignature(message: string, signature: string, address: string): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Failed to verify signature:', error);
      return false;
    }
  }

  static isValidBscAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  static formatBscAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  static getWalletState(): BscWalletState {
    return { ...this.walletState };
  }

  static subscribe(callback: (state: BscWalletState) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getWalletState()));
  }

  private static setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    ethereum.removeAllListeners?.('accountsChanged');
    ethereum.removeAllListeners?.('chainChanged');

    ethereum.on('accountsChanged', async (accounts: string[]) => {
      console.log('BSC accounts changed:', accounts);

      if (accounts.length === 0) {
        await this.disconnectWallet();
      } else {
        const address = accounts[0];
        const provider = new BrowserProvider(ethereum);
        const network = await provider.getNetwork();
        const signer = await provider.getSigner();

        this.walletState = {
          ...this.walletState,
          address,
          chainId: Number(network.chainId),
          provider,
          signer,
        };

        this.notifyListeners();
      }
    });

    ethereum.on('chainChanged', async (chainIdHex: string) => {
      console.log('BSC chain changed:', chainIdHex);

      const chainId = parseInt(chainIdHex, 16);
      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();

      this.walletState = {
        ...this.walletState,
        chainId,
        provider,
        signer,
      };

      this.notifyListeners();
    });
  }

  static async checkConnection(): Promise<void> {
    if (this.manuallyDisconnected) {
      console.log('BSC Wallet was manually disconnected, skipping auto-connect');
      return;
    }

    if (!await this.checkMetaMaskInstalled()) {
      return;
    }

    try {
      const ethereum = (window as any).ethereum;
      const provider = new BrowserProvider(ethereum);
      const accounts = await provider.send('eth_accounts', []);

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);
        const signer = await provider.getSigner();

        this.walletState = {
          address,
          chainId,
          isConnected: true,
          provider,
          signer,
        };

        this.notifyListeners();
        this.setupEventListeners();

        console.log('BSC Wallet auto-connected:', address);
      }
    } catch (error) {
      console.error('Failed to check BSC wallet connection:', error);
    }
  }
}
