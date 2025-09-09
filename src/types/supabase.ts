export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          email_notifications_enabled: boolean | null
          wallet_address: string | null
          is_admin: boolean | null
          referred_by: string | null
          referral_code: string | null
          twitter_url: string | null
          github_url: string | null
          linkedin_url: string | null
          website_url: string | null
          discord_username: string | null
          telegram_username: string | null
          is_banned: boolean | null
        }
        Insert: {
          id?: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          wallet_address?: string | null
          is_admin?: boolean | null
          referred_by?: string | null
          referral_code?: string | null
          twitter_url?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          website_url?: string | null
          is_banned?: boolean | null
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          wallet_address?: string | null
          is_admin?: boolean | null
          referred_by?: string | null
          referral_code?: string | null
          twitter_url?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          website_url?: string | null
          is_banned?: boolean | null
        }
      }
      game_stats: {
        Row: {
          id: string
          user_id: string
          zen_balance: number
          total_mined: number
          mining_level: number
          experience: number
          referral_code: string
          referred_by: string | null
          total_referrals: number
          referral_earnings: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          zen_balance?: number
          total_mined?: number
          mining_level?: number
          experience?: number
          referral_code: string
          referred_by?: string | null
          total_referrals?: number
          referral_earnings?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          zen_balance?: number
          total_mined?: number
          mining_level?: number
          experience?: number
          referral_code?: string
          referred_by?: string | null
          total_referrals?: number
          referral_earnings?: number
          created_at?: string
          updated_at?: string
        }
      }
      ships: {
        Row: {
          id: string
          user_id: string
          name: string
          level: number
          mining_power: number
          energy_capacity: number
          current_energy: number
          ship_type: string
          upgrades: Json
          last_mining: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          level?: number
          mining_power: number
          energy_capacity: number
          current_energy: number
          ship_type?: string
          upgrades?: Json
          last_mining?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          level?: number
          mining_power?: number
          energy_capacity?: number
          current_energy?: number
          ship_type?: string
          upgrades?: Json
          last_mining?: string
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string
          reward_amount: number
          task_type: string
          requirements: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          reward_amount: number
          task_type?: string
          requirements?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          reward_amount?: number
          task_type?: string
          requirements?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_tasks: {
        Row: {
          id: string
          task_id: string
          user_id: string
          status: string
          progress: number
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          status?: string
          progress?: number
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          status?: string
          progress?: number
          completed_at?: string | null
          created_at?: string
        }
      }
      referral_earnings: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          amount: number
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          amount: number
          source: string
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          amount?: number
          source?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      regenerate_ship_energy: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];