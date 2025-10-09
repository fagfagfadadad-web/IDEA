import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

type SupabaseClientType = SupabaseClient<any, 'public', any>;

let supabaseClient: SupabaseClientType | null = null;

function getSupabaseClient(): SupabaseClientType | null {
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️ Supabase not configured. Multi-auth features disabled. Using Firebase only.');
      return null;
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }

  return supabaseClient;
}

export const supabase = getSupabaseClient() as SupabaseClientType;

// Database types
export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  email?: string;
  wallet_address?: string;
  auth_method: 'google' | 'wallet' | 'guest';
  is_guest: boolean;
  is_admin: boolean;
  is_banned: boolean;
  is_chat_banned: boolean;
  chat_ban_until?: string;
  created_at: string;
  updated_at: string;
}

export interface GameStats {
  id: string;
  user_id: string;
  zen_balance: number;
  game_tickets: number;
  last_daily_ticket_claim?: string;
  total_mined: number;
  mining_level: number;
  experience: number;
  referral_code: string;
  referred_by?: string;
  total_referrals: number;
  referral_earnings: number;
  active_boosts: any[];
  permanent_upgrades: {
    autoFeeder: boolean;
    happinessBooster: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Ship {
  id: string;
  user_id: string;
  name: string;
  level: number;
  mining_power: number;
  energy_capacity: number;
  current_energy: number;
  ship_type: string;
  upgrades: Record<string, number>;
  last_mining: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward_amount: number;
  ticket_reward: number;
  task_type: string;
  requirements: Record<string, any>;
  reference_link?: string;
  banner_image?: string;
  requires_proof: boolean;
  proof_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTask {
  id: string;
  task_id: string;
  user_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'pending_claim';
  progress: number;
  proof_url?: string;
  completed_at?: string;
  created_at: string;
}

export interface GamePlay {
  id: string;
  user_id: string;
  game_id: 'racing' | 'memory-match' | 'puzzle' | 'pupfi-catcher';
  last_played: string;
  total_plays: number;
  created_at: string;
}
