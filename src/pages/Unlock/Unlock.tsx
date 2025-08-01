import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'components';
import { UnlockPanelManager, useGetLoginInfo, useGetIsLoggedIn } from 'lib';
import { RouteNamesEnum } from 'localConstants';

export const Unlock = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useGetLoginInfo();
  const isUserLoggedIn = useGetIsLoggedIn();
  const [isLoading, setIsLoading] = useState(false);

  console.log('=== UNLOCK PAGE LOADED ===');
  console.log('isLoggedIn:', isLoggedIn);
  console.log('isUserLoggedIn:', isUserLoggedIn);
  console.log('Current URL:', window.location.href);
  console.log('Current pathname:', window.location.pathname);

  const handleOpenUnlockPanel = async () => {
    console.log('=== HANDLE OPEN UNLOCK PANEL CALLED ===');
    setIsLoading(true);
    try {
      const unlockPanelManager = UnlockPanelManager.init({
        loginHandler: () => {
          console.log('Login successful, navigating to home');
          navigate(RouteNamesEnum.home);
        },
        onClose: () => {
          console.log('Unlock panel closed, navigating to home');
          navigate(RouteNamesEnum.home);
        }
      });
      
      console.log('Opening unlock panel...');
      await unlockPanelManager.openUnlockPanel();
      console.log('Unlock panel opened successfully');
    } catch (error) {
      console.error('Error opening unlock panel:', error);
      alert('Error opening wallet panel: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== UNLOCK USEEFFECT ===');
    console.log('isLoggedIn:', isLoggedIn, 'isUserLoggedIn:', isUserLoggedIn);
    
    if (isLoggedIn || isUserLoggedIn) {
      console.log('User already logged in, redirecting to home');
      navigate(RouteNamesEnum.home);
      return;
    }

    // Automatically open the wallet panel if not logged in
    console.log('User not logged in, opening unlock panel automatically');
    const timer = setTimeout(() => {
      handleOpenUnlockPanel();
    }, 500); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, [isLoggedIn, isUserLoggedIn, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-200">
      <div className="flex flex-grow items-center justify-center p-6">
        <Card className="flex flex-1 p-6 sm:flex-row items-center justify-center">
          <div className="max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              {isLoading ? 'Opening wallet connection panel...' : 'Connect your wallet to access the application.'}
            </p>
            {isLoading && (
              <div className="flex justify-center mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  console.log('=== CONNECT WALLET BUTTON CLICKED ===');
                  handleOpenUnlockPanel();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                disabled={isLoading}
              >
                Connect Wallet
              </button>
              <button
                onClick={() => {
                  console.log('=== BACK TO HOME BUTTON CLICKED ===');
                  navigate(RouteNamesEnum.home);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium"
                disabled={isLoading}
              >
                Back to Home
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};