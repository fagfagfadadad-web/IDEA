import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  signInWithCustomToken, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { auth } from '../lib/firebase';
import { UserService, User } from '../services/userService';
import { GameService } from '../services/gameService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isProfileReady: boolean;
  authMessage: string;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  firebaseUser: null,
  loading: true,
  isProfileReady: false,
  authMessage: '',
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [lastAddress, setLastAddress] = useState<string | null>(null);
  
  const isAuthenticating = useRef(false);

  const handleFirebaseSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.log('Firebase sign out error:', error.message);
    }
  };

  const syncAuth = async () => {
    if (isAuthenticating.current) {
      console.log('🔒 Auth already in progress, skipping...');
      return;
    }

    isAuthenticating.current = true;
    let isMounted = true;

    try {
      setLoading(true);
      console.log('🔄 AuthContext: Starting auth sync...');
      console.log('🔐 AuthContext: isLoggedIn:', isLoggedIn);
      console.log('📍 AuthContext: address:', address);

      // Clear Firebase session if MultiversX is logged out
      if (!isLoggedIn || !address) {
        console.log('❌ AuthContext: Not logged in or no address');
        setUser(null);
        setIsProfileReady(false);
        setAuthMessage('Please log in using your MultiversX wallet.');
        if (firebaseUser) {
          await handleFirebaseSignOut();
        }
        return;
      }

      // Check for address change
      if (lastAddress && lastAddress !== address) {
        console.log('🔄 AuthContext: Address changed, clearing session');
        await handleFirebaseSignOut();
      }
      setLastAddress(address);

      // Create or get user profile
      setAuthMessage('Setting up profile...');
      
      let userProfile = await UserService.getUserByWalletAddress(address);
      
      if (!userProfile) {
        console.log('🆕 AuthContext: Creating new user profile...');
        
        // Generate unique username
        const baseUsername = address.substring(0, 8);
        const uniqueUsername = await UserService.generateUniqueUsername(baseUsername);
        
        // Create user profile
        userProfile = await UserService.createUser(address, {
          username: uniqueUsername,
          walletAddress: address,
          emailNotificationsEnabled: false,
          isAdmin: false,
          isBanned: false
        });

        // Create game stats and starter ship
        await GameService.createGameStats(userProfile.id!);
        
        // Create starter ship
        console.log('🚀 AuthContext: Creating starter ship...');
        await GameService.createStarterShip(userProfile.id!);
        console.log('✅ AuthContext: Starter ship created');
      }

      // Sign in to Firebase with custom token (simulate with wallet address)
      try {
        // For demo purposes, we'll use the wallet address as user ID
        // In production, you'd generate a proper custom token
        setFirebaseUser({ uid: userProfile.id } as FirebaseUser);
      } catch (firebaseError: any) {
        console.log('Firebase auth error:', firebaseError.message);
      }

      console.log('✅ AuthContext: Profile setup complete');
      setUser(userProfile);
      setIsProfileReady(true);
      setAuthMessage('');

    } catch (error: any) {
      console.error('❌ AuthContext: Auth sync error:', error);
      if (isMounted) {
        setUser(null);
        setIsProfileReady(false);
        setAuthMessage('Failed to authenticate. Please try reconnecting your wallet.');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
      isAuthenticating.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    syncAuth();

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (isMounted) {
        setFirebaseUser(firebaseUser);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isLoggedIn, address]);

  const logout = async () => {
    try {
      console.log('👋 AuthContext: Logging out...');
      isAuthenticating.current = true;
      
      await handleFirebaseSignOut();
      
      // Also logout from MultiversX
      const { getAccountProvider } = await import('lib');
      const provider = getAccountProvider();
      await provider.logout();
      
      setUser(null);
      setFirebaseUser(null);
      setIsProfileReady(false);
      setLastAddress(null);
      setAuthMessage('Successfully logged out');
    } catch (error: any) {
      console.error('❌ AuthContext: Logout error:', error);
      setUser(null);
      setFirebaseUser(null);
      setIsProfileReady(false);
      setLastAddress(null);
      setAuthMessage('Logged out (with some cleanup issues)');
    } finally {
      isAuthenticating.current = false;
    }
  };

  const value = {
    isAuthenticated: isLoggedIn && !!user && isProfileReady,
    user,
    firebaseUser,
    loading,
    isProfileReady,
    authMessage,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};