import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'components';
import { UnlockPanelManager, useGetLoginInfo, useGetIsLoggedIn } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { FirebaseAuthService } from '../../services/firebaseAuthService';

export const Unlock = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useGetLoginInfo();
  const isUserLoggedIn = useGetIsLoggedIn();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isLoggedIn || isUserLoggedIn) {
      navigate(RouteNamesEnum.home);
    }
  }, [isLoggedIn, isUserLoggedIn, navigate]);

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
      await FirebaseAuthService.signInWithGoogle();
      navigate(RouteNamesEnum.home);
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

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex flex-grow items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🐕</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to PupFi</h1>
            <p className="text-gray-600">Choose how you want to get started</p>
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
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-semibold text-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
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
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or sign in to save progress</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 px-6 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 shadow-md transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
              {loadingType === 'google' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800"></div>
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
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-xl font-semibold text-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
              {loadingType === 'wallet' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">🔐</span>
                  <span>Connect MultiversX Wallet</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p className="mb-2">🎁 Start with 1000 PupFi tokens and 5 game tickets!</p>
            <p>You can link your wallet later to access blockchain features</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
