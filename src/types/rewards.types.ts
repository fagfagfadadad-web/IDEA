export interface Task {
  id: string;
  title: string;
  description: string;
  reward_amount: number;
  xp_reward: number;
  task_type: 'manual' | 'wallet_connect' | 'transaction' | 'mining_level' | 'referral' | 'social_follow' | 'social_post' | 'social_retweet' | 'social_like' | 'external_link';
  required_value?: string;
  proof_required_type: 'none' | 'file' | 'url' | 'text';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTask {
  id: string;
  user_id: string;
  task_id: string;
  status: 'available' | 'in_progress' | 'completed' | 'claimed';
  proof_url?: string;
  proof_text?: string;
  completed_at?: string;
  claimed_at?: string;
  created_at: string;
  updated_at: string;
  task?: Task;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  status: 'active' | 'inactive' | 'completed';
  rewards_earned: number;
  created_at: string;
  updated_at: string;
  referred_user?: {
    id: string;
    username?: string;
    wallet_address: string;
    avatar_url?: string;
  };
}

export interface ReferralReward {
  id: string;
  referrer_id: string;
  referred_user_id?: string;
  referral_id?: string;
  reward_type: 'signup_bonus' | 'gig_creation' | 'order_completion' | 'monthly_bonus';
  reward_amount: number;
  reward_token: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  order_id?: string;
  gig_id?: string;
  created_at: string;
  processed_at?: string;
  transaction_hash?: string;
  notes?: string;
}

export interface UserReferralStats {
  user_id: string;
  referral_code: string;
  total_referrals: number;
  active_referrals: number;
  total_referral_earnings: number;
  pending_earnings: number;
  completed_earnings: number;
  total_rewards: number;
  last_updated: string;
}

export interface TaskStatistics {
  totalTasks: number;
  activeTasks: number;
  totalCompletions: number;
  totalRewardsDistributed: number;
}

export interface UserProfile {
  id: string;
  username: string;
  wallet_address: string;
  ida_balance: number;
  total_earned: number;
  level: number;
  xp: number;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export interface TransactionHistory {
  id: string;
  from_address: string;
  to_address: string;
  token_identifier: string;
  amount: number;
  transaction_type: 'send' | 'receive' | 'reward' | 'referral';
  status: 'pending' | 'success' | 'failed';
  transaction_hash?: string;
  timestamp: string;
  description?: string;
}

export interface RewardAmounts {
  signup: number;
  first_transaction: number;
  milestone_100: number;
  milestone_1000: number;
  milestone_10000: number;
}