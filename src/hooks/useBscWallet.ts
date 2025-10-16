import { useState, useEffect } from 'react';
import { BscWalletService, BscWalletState } from '../services/bscWalletService';

export const useBscWallet = () => {
  const [walletState, setWalletState] = useState<BscWalletState>(
    BscWalletService.getWalletState()
  );

  useEffect(() => {
    BscWalletService.checkConnection();

    const unsubscribe = BscWalletService.subscribe((state) => {
      setWalletState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const connectWallet = async () => {
    try {
      const address = await BscWalletService.connectWallet();
      return address;
    } catch (error: any) {
      console.error('Failed to connect BSC wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    await BscWalletService.disconnectWallet();
  };

  const switchNetwork = async (chainId: number) => {
    await BscWalletService.switchToBscNetwork(chainId);
  };

  const signMessage = async (message: string) => {
    return await BscWalletService.signMessage(message);
  };

  return {
    address: walletState.address,
    chainId: walletState.chainId,
    isConnected: walletState.isConnected,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    signMessage,
  };
};

export const useGetBscAccount = () => {
  const { address } = useBscWallet();
  return { address };
};

export const useGetBscLoginInfo = () => {
  const { isConnected } = useBscWallet();
  return { isLoggedIn: isConnected };
};
