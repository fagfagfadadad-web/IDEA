import { 
  useGetIsLoggedIn, 
  useGetAccount,
  getAccountProvider
} from '@multiversx/sdk-dapp/lib';

export function useWallet() {
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();

  const login = async () => {
    try {
      const provider = getAccountProvider();
      await provider.login();
      console.log('Wallet connected successfully');
    } catch (error) {
      console.error('Error opening wallet panel:', error);
      alert('Error connecting wallet: ' + (error as Error).message);
    }
  };

  const logout = async () => {
    try {
      await getAccountProvider().logout();
      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    address: isLoggedIn ? address : null,
    isConnected: isLoggedIn,
    login,
    logout,
  };
}

// Helper function to format address for display
export function formatAddress(address: string | null): string {
  if (!address) return '';
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

// Helper function to validate MultiversX address
export function isValidMxAddress(address: string): boolean {
  return address.startsWith('erd1') && address.length === 62;
}