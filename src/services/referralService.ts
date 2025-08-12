import { supabase } from '../lib/supabase';
import { Referral, ReferralReward, UserReferralStats, RewardAmounts } from '../types/rewards.types';

export class ReferralService {
  private static readonly REWARD_AMOUNTS: RewardAmounts = {
    signup: 1000,
    first_transaction: 25,
    milestone_100: 50,
    milestone_1000: 100,
    milestone_10000: 1000
  };

  // Get reward amounts
  static getRewardAmounts(): RewardAmounts {
    return this.REWARD_AMOUNTS;
  }

  // Initialize user referral stats
  static async initializeUserReferralStats(userId: string): Promise<boolean> {
    try {
      // Check if stats already exist
      const { data: existing } = await supabase
        .from('referral_stats')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) return true;

      // Generate unique referral code
      const referralCode = await this.generateUniqueReferralCode();

      const { error } = await supabase
        .from('referral_stats')
        .insert({
          user_id: userId,
          referral_code: referralCode,
          total_referrals: 0,
          active_referrals: 0,
          total_referral_earnings: 0,
          pending_earnings: 0,
          completed_earnings: 0,
          total_rewards: 0
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error initializing referral stats:', error);
      return false;
    }
  }

  // Generate unique referral code
  private static async generateUniqueReferralCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data } = await supabase
        .from('referral_stats')
        .select('referral_code')
        .eq('referral_code', code)
        .maybeSingle();

      if (!data) return code;
      attempts++;
    }

    throw new Error('Failed to generate unique referral code');
  }

  // Get user referral stats
  static async getUserReferralStats(address: string): Promise<UserReferralStats | null> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .single();

      if (!user) return null;

      const { data, error } = await supabase
        .from('referral_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      return null;
    }
  }

  // Get user referrals
  static async getUserReferrals(address: string): Promise<Referral[]> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .single();

      if (!user) return [];

      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referred_user:users!referrals_referred_user_id_fkey(
            id,
            username,
            wallet_address,
            avatar_url
          )
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user referrals:', error);
      return [];
    }
  }

  // Get referral rewards
  static async getReferralRewards(address: string): Promise<ReferralReward[]> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .single();

      if (!user) return [];

      const { data, error } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('referrer_id', user.id)
        .eq('status', 'completed')
        .order('processed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching referral rewards:', error);
      return [];
    }
  }

  // Get referral leaderboard
  static async getReferralLeaderboard(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('referral_stats')
        .select(`
          *,
          user:users!referral_stats_user_id_fkey(
            username,
            wallet_address,
            avatar_url
          )
        `)
        .order('total_referral_earnings', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching referral leaderboard:', error);
      return [];
    }
  }

  // Generate referral link
  static generateReferralLink(referralCode: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}?ref=${String(referralCode)}`;
  }

  // Check referral from URL and process signup bonus
  static async checkReferralFromUrl(newUserAddress: string, referralCodeOverride?: string): Promise<void> {
    try {
      let referralCode = referralCodeOverride || null;
      
      // If no override provided, try to get from URL
      if (!referralCode) {
        // First check localStorage for pending referral code
        referralCode = localStorage.getItem('pendingReferralCode');
        
        // If not in localStorage, try URL
        if (!referralCode) {
          const urlParams = new URLSearchParams(window.location.search);
          referralCode = urlParams.get('ref');
        }
      }
      
      console.log('🔗 ReferralService: Processing referral code:', referralCode);

      if (!referralCode) return;

      // Find referrer by code
      const { data: referrerStats } = await supabase
        .from('referral_stats')
        .select('user_id')
        .eq('referral_code', referralCode)
        .maybeSingle();

      if (!referrerStats) {
        console.log('🔗 ReferralService: Referrer not found for code:', referralCode);
        return;
      }
      
      console.log('🔗 ReferralService: Found referrer:', referrerStats.user_id);

      // Get new user
      const { data: newUser } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', newUserAddress)
        .maybeSingle();

      if (!newUser) {
        console.log('🔗 ReferralService: New user not found for address:', newUserAddress);
        return;
      }
      
      console.log('🔗 ReferralService: Found new user:', newUser.id);

      // Check if referral already exists
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_user_id', newUser.id)
        .maybeSingle();

      if (existingReferral) {
        console.log('🔗 ReferralService: Referral already exists for user:', newUser.id);
        return;
      }

      // Create referral record
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerStats.user_id,
          referred_user_id: newUser.id,
          referral_code: referralCode,
          status: 'active'
        })
        .select()
        .single();

      if (referralError) throw referralError;
      
      console.log('🔗 ReferralService: Created referral record:', referral.id);

      // Give signup bonus to both users
      await Promise.all([
        this.giveReferralReward(referrerStats.user_id, 'signup_bonus', this.REWARD_AMOUNTS.signup, referral.id),
        this.giveReferralReward(newUser.id, 'signup_bonus', this.REWARD_AMOUNTS.signup, referral.id)
      ]);

      console.log('🔗 ReferralService: Signup bonuses awarded to both users');
      
      // Clear any pending referral code from localStorage
      localStorage.removeItem('pendingReferralCode');
      console.log('🔗 ReferralService: Cleared pending referral code from localStorage');
    } catch (error) {
      console.error('Error processing referral:', error);
    }
  }

  // Give referral reward
  private static async giveReferralReward(
    userId: string,
    rewardType: string,
    amount: number,
    referralId?: string
  ): Promise<void> {
    try {
      // Create reward record
      const { error: rewardError } = await supabase
        .from('referral_rewards')
        .insert({
          referrer_id: userId,
          referral_id: referralId,
          reward_type: rewardType,
          reward_amount: amount,
          reward_token: 'IDA',
          status: 'completed',
          processed_at: new Date().toISOString()
        });

      if (rewardError) throw rewardError;

      // Update user balance
      const { data: user } = await supabase
        .from('users')
        .select('ida_balance, total_earned')
        .eq('id', userId)
        .single();

      if (user) {
        const newBalance = (user.ida_balance || 0) + amount;
        const newTotalEarned = (user.total_earned || 0) + amount;

        await supabase
          .from('users')
          .update({
            ida_balance: newBalance,
            total_earned: newTotalEarned
          })
          .eq('id', userId);

        // Record transaction
        const { data: userWallet } = await supabase
          .from('users')
          .select('wallet_address')
          .eq('id', userId)
          .single();

        if (userWallet) {
          await supabase
            .from('transaction_history')
            .insert({
              from_address: 'system',
              to_address: userWallet.wallet_address,
              token_identifier: 'IDA',
              amount: amount,
              transaction_type: 'referral',
              status: 'success',
              description: `Referral reward: ${this.getRewardTypeDescription(rewardType)}`
            });
        }
      }
    } catch (error) {
      console.error('Error giving referral reward:', error);
    }
  }

  // Get reward type description
  static getRewardTypeDescription(rewardType: string): string {
    switch (rewardType) {
      case 'signup_bonus':
        return 'Welcome bonus';
      case 'gig_creation':
        return 'Gig creation bonus';
      case 'order_completion':
        return 'Order completion bonus';
      case 'monthly_bonus':
        return 'Monthly activity bonus';
      default:
        return 'Referral bonus';
    }
  }
}