import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'components';
import { UnlockPanelManager, useGetLoginInfo, useGetIsLoggedIn } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { FirebaseAuthService } from '../../services/firebaseAuthService';
import { useAuth } from '../../context/AuthContext';
import { useBscWallet } from '../../hooks/useBscWallet';

export const Unlock = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useGetLoginInfo();
  const isUserLoggedIn = useGetIsLoggedIn();
  const { isAuthenticated } = useAuth();
  const { connectWallet: connectBscWallet } = useBscWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isLoggedIn || isUserLoggedIn || isAuthenticated) {
      navigate(RouteNamesEnum.home);
    }
  }, [isLoggedIn, isUserLoggedIn, isAuthenticated, navigate]);

  const handleConnectWallet = async () => {
    setIsLoading(true);
    setLoadingType('wallet');
    setError('');

    try {
      const unlockPanelManager = UnlockPanelManager.init({
        loginHandler: () => {
          navigate(RouteNamesEnum.home);
        },
        onClose: () => {
          setIsLoading(false);
        }
      });

      await unlockPanelManager.openUnlockPanel();
    } catch (error) {
      console.error('Error opening wallet panel:', error);
      setError('Failed to open wallet connection');
    } finally {
      setIsLoading(false);
      setLoadingType('');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setLoadingType('google');
    setError('');

    try {
      const result = await FirebaseAuthService.signInWithGoogle();

      // If popup flow (local dev), navigate immediately
      if (result) {
        navigate(RouteNamesEnum.home);
      }
      // If redirect flow (production), navigation will happen after redirect completes
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setError(error.message || 'Failed to sign in with Google');
      setIsLoading(false);
      setLoadingType('');
    }
  };

  const handleGuestPlay = async () => {
    setIsLoading(true);
    setLoadingType('guest');
    setError('');

    try {
      await FirebaseAuthService.signInAsGuest();
      navigate(RouteNamesEnum.home);
    } catch (error: any) {
      console.error('Error signing in as guest:', error);
      setError(error.message || 'Failed to start as guest');
      setIsLoading(false);
      setLoadingType('');
    }
  };

  const handleBscWalletConnect = async () => {
    setIsLoading(true);
    setLoadingType('bsc');
    setError('');

    try {
      await connectBscWallet();
      navigate(RouteNamesEnum.home);
    } catch (error: any) {
      console.error('Error connecting BSC wallet:', error);
      setError(error.message || 'Failed to connect BSC wallet');
      setIsLoading(false);
      setLoadingType('');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl">
        <div className="bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-400 p-1 rounded-3xl shadow-2xl">
          <div className="rounded-3xl p-6 sm:p-8 md:p-10" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}>
            <div className="text-center mb-8">
              <div className="mb-6 relative">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-orange-200 to-amber-200 rounded-full flex items-center justify-center shadow-lg">
                  <img src='/pupfi new .png' alt='PupFi' className='w-24 h-24 object-contain' />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-3">Welcome to PupFi</h1>
              <p className="text-gray-600 text-lg">Choose how you want to get started</p>
            </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGuestPlay}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-xl transform transition-all duration-200 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
              {loadingType === 'guest' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">🎮</span>
                  <span>Play as Guest</span>
                </>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-orange-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 text-white font-semibold" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}>Or sign in to save progress</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full text-white px-6 py-4 rounded-2xl font-bold text-lg border-2 border-purple-300 shadow-xl transform transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}
            >
              {loadingType === 'google' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <button
              onClick={handleConnectWallet}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-xl transform transition-all duration-200 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
              {loadingType === 'wallet' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <img src="/6892.png" alt="MultiversX" className="w-6 h-6" />
                  <span>Connect MultiversX Wallet</span>
                </>
              )}
            </button>

            <button
              onClick={handleBscWalletConnect}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-xl transform transition-all duration-200 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
              {loadingType === 'bsc' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">🦊</span>
                  <span>Connect BSC Wallet</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-8 text-center">
            <div className="border-2 border-purple-300 rounded-2xl p-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}>
              <p className="text-white font-bold mb-2 flex items-center justify-center gap-2">
                <span className="text-2xl">🎁</span>
                <span>Welcome Bonus!</span>
              </p>
              <p className="text-white font-semibold">Start with 1000 PupFi tokens and 5 game tickets!</p>
              <p className="text-white/90 text-sm mt-2">You can link your wallet later to access blockchain features</p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
