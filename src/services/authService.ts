import { supabase, Profile, GameStats } from '../lib/supabase';

export type AuthMethod = 'google' | 'wallet' | 'guest';

export class AuthService {
  private static getSupabase() {
    if (!supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }
    return supabase;
  }

  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle() {
    const sb = this.getSupabase();
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign in as guest (anonymous user)
   */
  static async signInAsGuest() {
    const sb = this.getSupabase();
    const { data, error } = await sb.auth.signInAnonymously();

    if (error) throw error;

    if (data.user) {
      await this.createProfileIfNotExists(data.user.id, {
        auth_method: 'guest',
        is_guest: true,
      });
    }

    return data;
  }

  /**
   * Sign in with MultiversX wallet
   * This creates a user session after wallet connection
   */
  static async signInWithWallet(walletAddress: string) {
    // Check if profile with this wallet exists
    const { data: existingProfile } = await this.getSupabase()
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (existingProfile) {
      // Sign in existing user with email/password or custom token
      // For now, we'll create an anonymous session and link it
      const { data, error } = await this.getSupabase().auth.signInAnonymously();

      if (error) throw error;

      // Update the profile with wallet address
      if (data.user) {
        await this.linkWalletToProfile(data.user.id, walletAddress);
      }

      return data;
    } else {
      // Create new anonymous user and link wallet
      const { data, error } = await this.getSupabase().auth.signInAnonymously();

      if (error) throw error;

      if (data.user) {
        await this.createProfileIfNotExists(data.user.id, {
          auth_method: 'wallet',
          wallet_address: walletAddress,
          is_guest: false,
        });
      }

      return data;
    }
  }

  /**
   * Link MultiversX wallet to existing profile
   */
  static async linkWalletToProfile(userId: string, walletAddress: string) {
    // Check if wallet is already linked to another account
    const { data: existingWallet } = await this.getSupabase()
      .from('profiles')
      .select('id')
      .eq('wallet_address', walletAddress)
      .neq('id', userId)
      .maybeSingle();

    if (existingWallet) {
      throw new Error('This wallet is already linked to another account');
    }

    const { error } = await this.getSupabase()
      .from('profiles')
      .update({
        wallet_address: walletAddress,
        auth_method: 'wallet',
        is_guest: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Create profile if it doesn't exist
   */
  static async createProfileIfNotExists(
    userId: string,
    options: {
      auth_method: AuthMethod;
      is_guest: boolean;
      wallet_address?: string;
      email?: string;
      full_name?: string;
    }
  ) {
    // Check if profile exists
    const { data: existingProfile } = await this.getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      return existingProfile;
    }

    // Generate unique username
    const username = await this.generateUniqueUsername(
      options.email?.split('@')[0] ||
      options.wallet_address?.substring(0, 8) ||
      `user${Date.now().toString().slice(-6)}`
    );

    // Create profile
    const { data: profile, error: profileError } = await this.getSupabase()
      .from('profiles')
      .insert({
        id: userId,
        username,
        email: options.email || '',
        full_name: options.full_name || '',
        avatar_url: options.is_guest ? '🐕' : '👤',
        wallet_address: options.wallet_address || null,
        auth_method: options.auth_method,
        is_guest: options.is_guest,
        is_admin: false,
        is_banned: false,
        is_chat_banned: false,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    // Create game stats
    await this.createGameStats(userId);

    // Create starter ship
    await this.createStarterShip(userId);

    return profile;
  }

  /**
   * Generate unique username
   */
  static async generateUniqueUsername(baseUsername: string): Promise<string> {
    let username = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
    let counter = 1;

    while (counter < 100) {
      const { data } = await this.getSupabase()
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (!data) {
        return username;
      }

      username = `${baseUsername}${counter}`;
      counter++;
    }

    return `${baseUsername}${Date.now().toString().slice(-4)}`;
  }

  /**
   * Create game stats for new user
   */
  static async createGameStats(userId: string, referredBy?: string) {
    const { error } = await this.getSupabase()
      .from('game_stats')
      .insert({
        user_id: userId,
        zen_balance: 1000,
        game_tickets: 5,
        total_mined: 0,
        mining_level: 1,
        experience: 0,
        referred_by: referredBy || null,
        total_referrals: 0,
        referral_earnings: 0,
      });

    if (error) throw error;
  }

  /**
   * Create starter ship for new user
   */
  static async createStarterShip(userId: string) {
    const { error } = await this.getSupabase()
      .from('ships')
      .insert({
        user_id: userId,
        name: 'Playful Puppy',
        level: 1,
        mining_power: 10,
        energy_capacity: 100,
        current_energy: 100,
        ship_type: 'basic',
        upgrades: {},
      });

    if (error) throw error;
  }

  /**
   * Get current user profile
   */
  static async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await this.getSupabase().auth.getUser();

    if (!user) return null;

    const { data: profile } = await this.getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return profile;
  }

  /**
   * Get user by wallet address
   */
  static async getUserByWallet(walletAddress: string): Promise<Profile | null> {
    const { data } = await this.getSupabase()
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    return data;
  }

  /**
   * Update profile
   */
  static async updateProfile(userId: string, updates: Partial<Profile>) {
    const { error } = await this.getSupabase()
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Sign out
   */
  static async signOut() {
    const { error } = await this.getSupabase().auth.signOut();
    if (error) throw error;
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await this.getSupabase().auth.getSession();
    return !!session;
  }

  /**
   * Get current session
   */
  static async getSession() {
    const { data: { session } } = await this.getSupabase().auth.getSession();
    return session;
  }

  /**
   * Subscribe to auth state changes
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.getSupabase().auth.onAuthStateChange(callback);
  }
}
