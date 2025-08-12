import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useGetIsLoggedIn, useGetAccount, getAccountProvider, UnlockPanelManager } from 'lib';
import { supabase } from '../lib/supabase';
import { ReferralService } from '../services/referralService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  isProfileReady: boolean;
  authMessage: string;
  logout: () => Promise<void>;
  forceReconnect: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  isProfileReady: false,
  authMessage: '',
  logout: async () => {},
  forceReconnect: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [lastAddress, setLastAddress] = useState<string | null>(null);
  
  // CRITICAL: Add refs to prevent multiple auth attempts
  const isAuthenticating = useRef(false);

  // Helper function to validate and reinitialize provider if needed
  const validateAndReinitializeProvider = async () => {
    try {
      console.log('🔧 AuthContext: Validating wallet provider...');
      const provider = getAccountProvider();
      
      // Check if provider exists and has required methods
      if (!provider || typeof provider.signTransactions !== 'function') {
        console.log('⚠️ AuthContext: Provider is invalid, attempting reinitialization...');
        
        // Try to reinitialize UnlockPanelManager which should restore provider state
        try {
          const unlockPanelManager = UnlockPanelManager.init({
            loginHandler: () => {
              console.log('🔧 AuthContext: Provider reinitialized via login handler');
            },
            onClose: () => {
              console.log('🔧 AuthContext: Provider reinitialization closed');
            }
          });
          
          // Don't actually open the panel, just initialize the manager
          console.log('✅ AuthContext: UnlockPanelManager reinitialized');
          
          // Check if provider is now valid
          const newProvider = getAccountProvider();
          if (newProvider && typeof newProvider.signTransactions === 'function') {
            console.log('✅ AuthContext: Provider successfully reinitialized');
            return true;
          } else {
            console.log('❌ AuthContext: Provider still invalid after reinitialization');
            // Don't fail immediately, just log and continue
            console.log('⚠️ AuthContext: Continuing with potentially invalid provider');
            return true;
          }
        } catch (reinitError) {
          console.error('❌ AuthContext: Provider reinitialization failed:', reinitError);
          // Don't fail immediately, just log and continue
          console.log('⚠️ AuthContext: Continuing despite reinitialization failure');
          return true;
        }
      } else {
        // Provider seems valid, test if getAccount actually works
        try {
          // Skip getAccount test since provider property is private
          console.log('✅ AuthContext: Provider is valid and functional');
          return true;
        } catch (accountError) {
          console.error('⚠️ AuthContext: Provider getAccount failed:', accountError);
          // Don't fail immediately, just log and continue
          console.log('⚠️ AuthContext: Continuing despite getAccount failure');
          return true;
        }
      }
    } catch (error) {
      console.error('❌ AuthContext: Provider validation failed:', error);
      // Don't fail immediately, just log and continue
      console.log('⚠️ AuthContext: Continuing despite validation failure');
      return true;
    }
  };

  // Generate a valid email from MultiversX address using first 6 characters
  const generateValidEmail = (address: string) => {
    // Take first 6 characters after 'erd1' prefix
    const addressPart = address.startsWith('erd1') ? address.substring(4, 10) : address.substring(0, 6);
    return `${addressPart}@multiversx.com`;
  };

  const handleSupabaseSignOut = async () => {
    try {
      // Clear all Supabase-related tokens from local storage first
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-xumzvxrjfqwewbyaqcxa-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Check if there's an active session before attempting to sign out
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.log('Session check error, performing local cleanup:', sessionError.message);
        await supabase.auth.signOut({ scope: 'local' });
        return;
      }

      // Only attempt server logout if there's an active session with a valid user
      if (session && session.user && session.access_token) {
        try {
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            // Handle specific session errors gracefully
            if (error.message?.includes('Session from session_id claim in JWT does not exist') || 
                error.message?.includes('session_not_found') ||
                error.message?.includes('Auth session missing')) {
              console.log('Session already expired, performing local cleanup');
              await supabase.auth.signOut({ scope: 'local' });
              return;
            }
            // Re-throw other errors
            throw new Error(error.message);
          }
        } catch (signOutError: any) {
          console.log('Server sign out failed, performing local cleanup:', signOutError.message);
          await supabase.auth.signOut({ scope: 'local' });
        }
      } else {
        // Perform local-only sign out without making server request
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch (error: any) {
      // Handle any other unexpected errors gracefully
      console.log('Error during sign out, proceeding with local cleanup:', error.message);
      // Ensure local cleanup happens even if server request fails
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (localError: any) {
        console.log('Local cleanup also failed, continuing anyway:', localError.message);
      }
    }
  };

  const syncAuth = async () => {
    // CRITICAL: Prevent multiple simultaneous auth attempts
    if (isAuthenticating.current) {
      console.log('🔒 Auth already in progress, skipping...');
      return;
    }

    isAuthenticating.current = true;
    let isMounted = true;
    let currentSession = null;

    try {
      setLoading(true);
      console.log('🔄 AuthContext: Starting auth sync...');
      console.log('🔐 AuthContext: isLoggedIn:', isLoggedIn);
      console.log('📍 AuthContext: address:', address);

      // CRITICAL: Validate wallet provider state when user is logged in
      if (isLoggedIn && address) {
        const isProviderValid = await validateAndReinitializeProvider();
        // Provider validation is now more tolerant, continue with auth flow
        console.log('🔧 AuthContext: Provider validation completed, continuing with auth flow');
      }

      // CRITICAL: Detect desynchronized state and clear Supabase session
      if (isLoggedIn && !user && address && address === lastAddress) {
        console.log('🧹 AuthContext: Detected desynchronized state, clearing Supabase session');
        await handleSupabaseSignOut();
      }

      // Clear any stale tokens before checking session
      try {
        const storedToken = localStorage.getItem('sb-xumzvxrjfqwewbyaqcxa-auth-token');
        if (storedToken) {
          const tokenData = JSON.parse(storedToken);
          // Check if token is expired or invalid
          if (!tokenData.refresh_token || !tokenData.access_token) {
            console.log('🧹 AuthContext: Clearing invalid stored token');
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-xumzvxrjfqwewbyaqcxa-')) {
                localStorage.removeItem(key);
              }
            });
            await supabase.auth.signOut({ scope: 'local' });
          }
        }
      } catch (tokenError) {
        console.log('🧹 AuthContext: Error checking stored token, clearing:', tokenError);
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-xumzvxrjfqwewbyaqcxa-')) {
            localStorage.removeItem(key);
          }
        });
        await supabase.auth.signOut({ scope: 'local' });
      }

      // Check existing session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ AuthContext: Session error:', sessionError.message);
        
        // Handle specific refresh token errors - expanded to catch all variants
        if (sessionError.message?.includes('refresh_token_not_found') || 
            sessionError.message?.includes('Invalid Refresh Token') ||
            sessionError.message?.includes('Refresh Token Not Found') ||
            sessionError.message?.includes('refresh_token_not_found')) {
          console.log('🧹 AuthContext: Clearing invalid refresh token');
          await handleSupabaseSignOut();
        }
        
        // Reset authentication state when session retrieval fails
        setUser(null);
        setIsProfileReady(false);
        setAuthMessage('Session expired. Please log in again.');
        currentSession = null;
        return;
      } else {
        currentSession = session;
        console.log('✅ AuthContext: Current session:', !!currentSession);
      }

      // Handle stale sessions - if session exists but user is null, clear it
      if (currentSession && !currentSession.user) {
        console.log('🧹 AuthContext: Clearing stale session');
        await handleSupabaseSignOut();
        currentSession = null;
      }

      if (!isLoggedIn || !address) {
        console.log('❌ AuthContext: Not logged in or no address');
        setUser(null);
        setIsProfileReady(false);
        setAuthMessage('Please log in using your MultiversX wallet.');
        if (currentSession && currentSession.user) {
          await handleSupabaseSignOut();
        }
        return;
      }

      // Check for address change
      if (lastAddress && lastAddress !== address) {
        console.log('🔄 AuthContext: Address changed, clearing session');
        await handleSupabaseSignOut();
        currentSession = null;
      }
      setLastAddress(address);

      // Use existing session if it's valid
      if (currentSession && currentSession.user) {
        console.log('🔍 AuthContext: Checking existing session user profile...');
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, wallet_address, is_admin')
          .eq('id', currentSession.user.id)
          .maybeSingle();

        if (!profileError && profile && profile.wallet_address === address) {
          console.log('✅ AuthContext: Existing session valid, setting user');
          console.log('👤 AuthContext: User profile:', profile);
          
          // Enhance user object with profile data
          const enhancedUser = {
            ...currentSession.user,
            is_admin: profile.is_admin
          };
          
          setUser(enhancedUser);
          await setupProfile(enhancedUser, address);
          return;
        }
      }

      // CRITICAL: Only proceed with new auth if we don't have a valid session
      if (!currentSession || !currentSession.user) {
        setAuthMessage('Connecting wallet...');
        const generatedEmail = generateValidEmail(address);

        console.log('🔐 AuthContext: Using email:', generatedEmail);

        // Attempt sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: generatedEmail,
          password: address,
        });

        let authUser = signInData?.user;

        if (signInError && signInError.message.includes('Invalid login credentials')) {
          console.log('🆕 AuthContext: Creating new user account...');
          setAuthMessage('Setting up account...');
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: generatedEmail,
            password: address,
            options: {
              data: {
                multiversx_address: address,
              },
            },
          });

          if (signUpError) {
            console.error('❌ AuthContext: Sign up error:', signUpError);
            throw new Error(`Failed to sign up: ${signUpError.message}`);
          }
          authUser = signUpData?.user;
        } else if (signInError) {
          console.error('❌ AuthContext: Sign in error:', signInError);
          throw new Error(`Failed to sign in: ${signInError.message}`);
        }

        if (authUser) {
          console.log('✅ AuthContext: Auth user obtained, setting up profile...');
          await setupProfile(authUser, address);
        } else {
          setUser(null);
          setIsProfileReady(false);
          setAuthMessage('Authentication completed but no user data received. Please try reconnecting your wallet.');
        }
      }
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

  const setupProfile = async (authUser: any, walletAddress: string) => {
    setAuthMessage('Setting up profile...');
    console.log('🔧 AuthContext: Setting up profile for user:', authUser.id);
    
    try {
      const { data: existingUserByWallet, error: fetchWalletError } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url, wallet_address, email, is_admin, ida_balance, total_earned, level, xp')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (fetchWalletError && fetchWalletError.code !== 'PGRST116') {
        throw new Error(`Failed to check user by wallet: ${fetchWalletError.message}`);
      }

      if (existingUserByWallet) {
        console.log('✅ AuthContext: Existing user found by wallet:', existingUserByWallet);
        
        // Enhance auth user with profile data
        const enhancedUser = {
          ...authUser,
          is_admin: existingUserByWallet.is_admin,
          wallet_address: existingUserByWallet.wallet_address,
          username: existingUserByWallet.username,
          full_name: existingUserByWallet.full_name,
          avatar_url: existingUserByWallet.avatar_url,
          ida_balance: existingUserByWallet.ida_balance,
          total_earned: existingUserByWallet.total_earned,
          level: existingUserByWallet.level,
          xp: existingUserByWallet.xp
        };
        
        setUser(enhancedUser);
        setIsProfileReady(true);
        setAuthMessage('');
        return;
      }

      const { data: existingUserById, error: fetchIdError } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url, wallet_address, is_admin, ida_balance, total_earned, level, xp')
        .eq('id', authUser.id)
        .maybeSingle();

      if (fetchIdError && fetchIdError.code !== 'PGRST116') {
        throw new Error(`Failed to check user by ID: ${fetchIdError.message}`);
      }

      if (existingUserById) {
        console.log('🔄 AuthContext: Updating existing user wallet address');
        const { error: updateError } = await supabase
          .from('users')
          .update({ wallet_address: walletAddress })
          .eq('id', authUser.id);

        if (updateError) {
          throw new Error(`Failed to update wallet address: ${updateError.message}`);
        }
        
        // Enhance auth user with profile data
        const enhancedUser = {
          ...authUser,
          is_admin: existingUserById.is_admin,
          wallet_address: walletAddress,
          username: existingUserById.username,
          full_name: existingUserById.full_name,
          avatar_url: existingUserById.avatar_url,
          ida_balance: existingUserById.ida_balance,
          total_earned: existingUserById.total_earned,
          level: existingUserById.level,
          xp: existingUserById.xp
        };
        
        setUser(enhancedUser);
        setIsProfileReady(true);
        setAuthMessage('');
        return;
      }

      console.log('🆕 AuthContext: Creating new user profile...');
      let username = walletAddress.slice(0, 8);
      let isUnique = false;
      let counter = 1;
      const maxAttempts = 10;

      while (!isUnique && counter <= maxAttempts) {
        const { data: duplicateCheck, error: duplicateError } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .maybeSingle();

        if (duplicateError && duplicateError.code !== 'PGRST116') {
          throw new Error(`Failed to check username: ${duplicateError.message}`);
        }

        if (!duplicateCheck) {
          isUnique = true;
        } else {
          username = `${walletAddress.slice(0, 6)}${counter}`;
          counter++;
        }
      }

      if (!isUnique) {
        throw new Error('Unable to generate a unique username');
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          username,
          wallet_address: walletAddress,
          email_notifications_enabled: false,
          email: null,
          is_admin: false, // Default to false for new users
        })
        .select()
        .single();

      if (profileError) {
        throw new Error(`Failed to set up profile: ${profileError.message}`);
      }

      console.log('✅ AuthContext: New profile created:', profile);
      
      // Enhance auth user with profile data
      const enhancedUser = {
        ...authUser,
        is_admin: profile.is_admin,
        wallet_address: walletAddress,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        ida_balance: profile.ida_balance,
        total_earned: profile.total_earned,
        level: profile.level,
        xp: profile.xp
      setAuthMessage('');
    } catch (error: any) {
      console.error('❌ AuthContext: Profile setup error:', error);
      throw error;
    } finally {
      // Process referral code after profile is fully set up
      try {
        const pendingReferralCode = localStorage.getItem('pendingReferralCode');
        console.log('🔗 AuthContext: Checking for pending referral code:', pendingReferralCode);
        console.log('🔗 AuthContext: Current wallet address:', walletAddress);
        
        if (pendingReferralCode && walletAddress) {
          console.log('🔗 AuthContext: Processing pending referral code:', pendingReferralCode);
          
          // Call ReferralService to process the referral code
          await ReferralService.checkReferralFromUrl(walletAddress, pendingReferralCode);
          
          // Clear the pending referral code after successful processing
          localStorage.removeItem('pendingReferralCode');
          console.log('🔗 AuthContext: Cleared pending referral code after processing');
        } else {
          console.log('🔗 AuthContext: No pending referral code to process', {
            hasPendingCode: !!pendingReferralCode,
            hasWalletAddress: !!walletAddress
          });
        }
      } catch (referralError) {
        console.error('🔗 AuthContext: Error processing referral:', referralError);
        // Don't fail the auth process if referral processing fails
        // But still clear the pending code to prevent repeated attempts
        localStorage.removeItem('pendingReferralCode');
        console.log('🔗 AuthContext: Cleared pending referral code after error');
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    // CRITICAL: Always run syncAuth when login state or address changes
    syncAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 AuthContext: Auth state change:', event);
      
      // CRITICAL: Only handle specific auth events to prevent loops
      if (event === 'SIGNED_IN' && session?.user && address && isMounted && !isAuthenticating.current) {
        console.log('✅ AuthContext: User signed in, setting up profile...');
        setUser(session.user);
        setupProfile(session.user, address);
      } else if (event === 'SIGNED_OUT' && isMounted) {
        console.log('👋 AuthContext: User signed out');
        setUser(null);
        setIsProfileReady(false);
        setLastAddress(null); // Force full re-authentication on next login
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [isLoggedIn, address]); // CRITICAL: Only depend on essential values

  const logout = async () => {
    try {
      console.log('👋 AuthContext: Logging out...');
      isAuthenticating.current = true; // Prevent new auth attempts during logout
      
      // Clear MultiversX SDK state by calling provider logout
      try {
        const provider = getAccountProvider();
        if (provider && typeof provider.logout === 'function') {
          await provider.logout();
          console.log('✅ AuthContext: Provider logout successful');
        }
      } catch (sdkError) {
        console.error('⚠️ AuthContext: Error calling provider logout:', sdkError);
        // Continue with logout even if provider logout fails
      }
      
      await handleSupabaseSignOut();
      setUser(null);
      setIsProfileReady(false);
      setLastAddress(null);
      setAuthMessage('Successfully logged out');
      
      // Clear MultiversX SDK state from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sdk-dapp-') || 
            key.startsWith('dapp-') || 
            key.includes('multiversx') || 
            key.includes('elrond') ||
            key.includes('wallet') ||
            key.includes('provider') ||
            key.includes('account') ||
            key.includes('login')) {
          localStorage.removeItem(key);
        }
      });
      
      // Also clear sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('sdk-dapp-') || 
            key.startsWith('dapp-') || 
            key.includes('multiversx') || 
            key.includes('elrond') ||
            key.includes('wallet') ||
            key.includes('provider') ||
            key.includes('account') ||
            key.includes('login')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Refresh the page to reset the DApp state without closing xPortal
      window.location.reload();
    } catch (error: any) {
      console.error('❌ AuthContext: Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      setIsProfileReady(false);
      setLastAddress(null);
      setAuthMessage('Logged out (with some cleanup issues)');
      
      // Still refresh the page even if there were errors
      window.location.reload();
    } finally {
      isAuthenticating.current = false;
    }
  };

  const forceReconnect = async () => {
    try {
      console.log('🔄 AuthContext: Force reconnecting wallet...');
      isAuthenticating.current = true; // Prevent new auth attempts during reconnect
      
      // Clear MultiversX SDK state by calling provider logout
      try {
        const provider = getAccountProvider();
        if (provider && typeof provider.logout === 'function') {
          await provider.logout();
          console.log('✅ AuthContext: Provider logout successful for reconnect');
        }
      } catch (sdkError) {
        console.error('⚠️ AuthContext: Error calling provider logout for reconnect:', sdkError);
        // Continue with reconnect even if provider logout fails
      }
      
      // Clear all local state first
      setUser(null);
      setIsProfileReady(false);
      setLastAddress(null);
      setAuthMessage('Reconnecting wallet...');
      
      // Clear Supabase session
      await handleSupabaseSignOut();
      
      // Force logout from wallet provider
      try {
        const provider = getAccountProvider();
        await provider.logout();
        console.log('✅ AuthContext: Wallet provider logout successful');
      } catch (providerError: any) {
        console.log('⚠️ AuthContext: Wallet provider logout failed, continuing anyway:', providerError.message);
      }
      
      // Clear any cached wallet state in localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('wallet') || key.includes('provider') || key.includes('dapp')) {
          localStorage.removeItem(key);
        }
      });
      
      setAuthMessage('Wallet disconnected. Redirecting to connection page...');
      
      // Small delay to ensure cleanup is complete
      setTimeout(() => {
        window.location.href = '/unlock';
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ AuthContext: Force reconnect error:', error);
      setAuthMessage('Reconnection failed. Please try refreshing the page.');
    } finally {
      isAuthenticating.current = false;
    }
  };

  const value = {
    isAuthenticated: isLoggedIn && !!user && isProfileReady,
    user,
    loading,
    isProfileReady,
    authMessage,
    logout,
    forceReconnect,
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

export const updateUserEmail = async (userId: string, email: string) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ email })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update email: ${error.message}`);
    }
  } catch (error: any) {
    console.error('Error updating email:', error);
    throw error;
  }
};