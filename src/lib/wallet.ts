import { useGetIsLoggedIn, useGetAccount, getAccountProvider, UnlockPanelManager } from './sdkDapp';
import { RouteNamesEnum } from '../localConstants';

export function useWallet() {
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();

  const login = async () => {
    try {
      const unlockPanelManager = UnlockPanelManager.init({
        loginHandler: () => {
          console.log('Wallet connected successfully');
        },
        onClose: () => {
          console.log('Login panel closed');
        }
      });
      
      await unlockPanelManager.openUnlockPanel();
    } catch (error) {
      console.error('Error opening wallet panel:', error);
      alert('Error connecting wallet: ' + (error as Error).message);
    }
  };

  const logout = async () => {
    try {
      const provider = getAccountProvider();
      await provider.logout();
      
      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();
      
      // Refresh page to reset state
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      // Force refresh even if logout fails
      window.location.reload();
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