import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/rewards.types';

export class ProfileService {
  // Get user profile with IDA balance and stats
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, wallet_address, ida_balance, total_earned, level, xp, avatar_url, bio, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Update user profile
  static async updateUserProfile(
    userId: string, 
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select(`
          id,
          username,
          wallet_address,
          ida_balance,
          total_earned,
          level,
          xp,
          avatar_url,
          bio,
          created_at
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  // Initialize user profile for rewards system
  static async initializeUserForRewards(address: string): Promise<UserProfile | null> {
    try {
      // Check if user exists
      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, wallet_address, ida_balance, total_earned, level, xp, avatar_url, bio, created_at')
        .eq('wallet_address', address)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }

      if (!user) {
        // User doesn't exist, this shouldn't happen in our system
        console.warn('User not found for address:', address);
        return null;
      }

      // Initialize IDA balance and stats if they don't exist
      if (user.ida_balance === null || user.ida_balance === undefined) {
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            ida_balance: 0,
            total_earned: 0,
            level: 1,
            xp: 0
          })
          .eq('id', user.id)
          .select('id, username, wallet_address, ida_balance, total_earned, level, xp, avatar_url, bio, created_at')
          .maybeSingle();

        if (updateError) throw updateError;
        return updatedUser || user;
      }

      return user;
    } catch (error) {
      console.error('Error initializing user for rewards:', error);
      return null;
    }
  }

  // Get user's IDA balance
  static async getUserIdaBalance(address: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('ida_balance')
        .eq('wallet_address', address)
        .single();

      if (error) throw error;
      return data?.ida_balance || 0;
    } catch (error) {
      console.error('Error fetching IDA balance:', error);
      return 0;
    }
  }
}