import {
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserService } from './userService';
import { GameService } from './gameService';

export type AuthMethod = 'google' | 'wallet' | 'guest';

export class FirebaseAuthService {
  /**
   * Sign in with Google OAuth using Firebase
   * Uses popup flow for development, redirect for production
   */
  static async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      console.log('🔐 Starting Google sign-in with popup...');
      const result = await signInWithPopup(auth, provider);

      if (result && result.user) {
        console.log('✅ Popup sign-in successful:', result.user.email);
        await this.createProfileIfNotExists(result.user, 'google');
      }

      return result;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  /**
   * Handle redirect result after Google sign-in
   * Call this on app initialization
   */
  static async handleRedirectResult() {
    try {
      const result = await getRedirectResult(auth);

      if (result && result.user) {
        console.log('✅ Redirect sign-in successful:', result.user.email);
        await this.createProfileIfNotExists(result.user, 'google');
        return result;
      }

      return null;
    } catch (error: any) {
      console.error('Redirect result error:', error);
      throw error;
    }
  }

  /**
   * Sign in as guest (anonymous user) using Firebase
   */
  static async signInAsGuest() {
    try {
      const result = await signInAnonymously(auth);
      const user = result.user;

      // Create or get user profile
      await this.createProfileIfNotExists(user, 'guest');

      return { user };
    } catch (error: any) {
      console.error('Guest sign-in error:', error);
      throw error;
    }
  }

  /**
   * Create profile if it doesn't exist
   */
  private static async createProfileIfNotExists(
    firebaseUser: FirebaseUser,
    authMethod: AuthMethod
  ) {
    // Check if user profile already exists
    let userProfile = await UserService.getUser(firebaseUser.uid);

    if (!userProfile) {
      console.log('🆕 Creating new user profile for:', authMethod, 'user');

      // Generate unique username
      const baseUsername =
        firebaseUser.email?.split('@')[0] ||
        firebaseUser.uid.substring(0, 8);

      const uniqueUsername = await UserService.generateUniqueUsername(baseUsername);

      // Create user profile
      userProfile = await UserService.createUser(firebaseUser.uid, {
        username: uniqueUsername,
        email: firebaseUser.email || '',
        fullName: firebaseUser.displayName || '',
        avatarUrl: authMethod === 'guest' ? '🐕' : (firebaseUser.photoURL || '👤'),
        isAdmin: false,
        isBanned: false,
      });

      console.log('✅ User profile created:', userProfile);

      // Create game stats
      console.log('🎮 Creating game stats...');
      await GameService.createGameStats(firebaseUser.uid);

      // Create starter dog
      console.log('🐕 Creating starter dog...');
      await GameService.createStarterShip(firebaseUser.uid);
      console.log('✅ Starter dog created');
    }

    return userProfile;
  }

  /**
   * Link email/Google to existing anonymous account
   */
  static async upgradeAnonymousAccount(email: string, password?: string) {
    const currentUser = auth.currentUser;

    if (!currentUser || !currentUser.isAnonymous) {
      throw new Error('No anonymous user to upgrade');
    }

    // If upgrading to Google
    if (!password) {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      try {
        const result = await signInWithPopup(auth, provider);

        // Update user profile to reflect new auth method
        await UserService.updateUser(currentUser.uid, {
          email: result.user.email || '',
          fullName: result.user.displayName || '',
          avatarUrl: result.user.photoURL || '👤',
        });

        return result;
      } catch (error: any) {
        console.error('Failed to upgrade anonymous account:', error);
        throw error;
      }
    }

    throw new Error('Email/password upgrade not yet implemented');
  }

  /**
   * Get current Firebase user
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  /**
   * Subscribe to auth state changes
   */
  static onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return firebaseOnAuthStateChanged(auth, callback);
  }

  /**
   * Sign out
   */
  static async signOut() {
    try {
      await auth.signOut();
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }
}
