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
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  firebaseUser: null,
  loading: true,
  isProfileReady: false,
  authMessage: '',
  logout: async () => {},
  refreshUser: async () => {},
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
      console.log('🔥 AuthContext: firebaseUser:', firebaseUser?.uid);

      // Check if user is logged in via Firebase (Google/Guest)
      if (firebaseUser && !isLoggedIn) {
        console.log('✅ AuthContext: Firebase user detected, loading profile...');

        // Load user profile from Firebase
        const userProfile = await UserService.getUser(firebaseUser.uid);

        if (userProfile) {
          console.log('✅ AuthContext: Firebase profile loaded:', userProfile);
          setUser({ ...userProfile, isProfileReady: true });
          setIsProfileReady(true);
          setAuthMessage('');
          return;
        } else {
          console.log('❌ AuthContext: Firebase user exists but no profile found');
          setUser(null);
          setIsProfileReady(false);
          setAuthMessage('Profile not found. Please try signing in again.');
          await handleFirebaseSignOut();
          return;
        }
      }

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
      
      console.log('🔍 AuthContext: Looking for user with address:', address);
      let userProfile = await UserService.getUserByWalletAddress(address);
      
      if (!userProfile) {
        console.log('🆕 AuthContext: Creating new user profile...');

        // Check for referral code in localStorage (stored by App.tsx)
        const referralCode = localStorage.getItem('pendingReferralCode');
        console.log('🔗 AuthContext: Referral code from localStorage:', referralCode);

        // Clear the referral code after reading it
        if (referralCode) {
          localStorage.removeItem('pendingReferralCode');
        }

        // Generate unique username
        const baseUsername = address.substring(0, 8);
        const uniqueUsername = await UserService.generateUniqueUsername(baseUsername);

        console.log('👤 AuthContext: Generated username:', uniqueUsername);

        // Create user profile
        userProfile = await UserService.createUser(address, {
          username: uniqueUsername,
          walletAddress: address,
          avatarUrl: '🐕', // Set default avatar
          emailNotificationsEnabled: false,
          isAdmin: false,
          isBanned: false
        });

        console.log('✅ AuthContext: User profile created:', userProfile);

        // Create game stats with referral code
        console.log('🎮 AuthContext: Creating game stats...');
        await GameService.createGameStats(userProfile.id!, referralCode || undefined);

        // If referral code was used, increment referrer's count
        if (referralCode) {
          console.log('🔗 AuthContext: Processing referral for code:', referralCode);
          try {
            await GameService.processReferral(referralCode, userProfile.id!);
            console.log('✅ AuthContext: Referral processed successfully');
          } catch (refError: any) {
            console.error('❌ AuthContext: Failed to process referral:', refError.message);
          }
        }

        // Create starter dog
        console.log('🐕 AuthContext: Creating starter dog...');
        await GameService.createStarterShip(userProfile.id!);
        console.log('✅ AuthContext: Starter dog created');
      } else {
        console.log('👤 AuthContext: Found existing user profile:', userProfile);
      }

      // Sign in to Firebase with custom token (simulate with wallet address)
      try {
        // For demo purposes, we'll use the wallet address as user ID
        // In production, you'd generate a proper custom token
        console.log('🔐 AuthContext: Setting Firebase user...');
        setFirebaseUser({ uid: userProfile.id } as FirebaseUser);
      } catch (firebaseError: any) {
        console.log('⚠️ AuthContext: Firebase auth error:', firebaseError.message);
      }

      console.log('✅ AuthContext: Profile setup complete');
      setUser(userProfile);
      setAuthMessage('');
      
      // Mark profile as ready
      const userWithProfileReady = { ...userProfile, isProfileReady: true };
      setUser(userWithProfileReady);
      setIsProfileReady(true);
      
      console.log('🎮 AuthContext: Profile ready, user data:', {
        id: userWithProfileReady.id,
        username: userWithProfileReady.username,
        isAdmin: userWithProfileReady.isAdmin,
        isProfileReady: userWithProfileReady.isProfileReady
      });

    } catch (error: any) {
      console.error('❌ AuthContext: Auth sync error:', error);
      console.error('❌ AuthContext: Error details:', error.code, error.message);
      if (isMounted) {
        setUser(null);
        setIsProfileReady(false);
        setAuthMessage(`Failed to authenticate: ${error.message}. Please try reconnecting your wallet.`);
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
    
    // Force GameContext to refetch data for new users
    console.log('🔄 AuthContext: Triggering GameContext data fetch...');

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

  const refreshUser = async () => {
    if (!user?.id) return;
    
    try {
      const updatedUser = await UserService.getUser(user.id);
      if (updatedUser) {
        setUser({ ...updatedUser, isProfileReady: true });
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };
  const value = {
    isAuthenticated: (isLoggedIn || !!firebaseUser) && !!user && isProfileReady,
    user,
    firebaseUser,
    loading,
    isProfileReady,
    authMessage,
    logout,
    refreshUser,
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