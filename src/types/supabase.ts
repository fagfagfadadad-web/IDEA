export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type GigMediaUrls = {
  images?: string[];
  video?: string;
}

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
          discord_username?: string | null
          telegram_username?: string | null
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
          discord_username?: string | null
          telegram_username?: string | null
        }
      }
      gigs: {
        Row: {
          id: string
          title: string
          description: string
          price: number
          duration: number
          category: string
          provider_id: string
          created_at: string
          media_urls: GigMediaUrls | null
          payment_token: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          price: number
          duration: number
          category: string
          provider_id: string
          created_at?: string
          media_urls?: GigMediaUrls | null
          payment_token?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          price?: number
          duration?: number
          category?: string
          provider_id?: string
          created_at?: string
          media_urls?: GigMediaUrls | null
          payment_token?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          gig_id: string | null
          client_id: string
          status: string
          amount: number
          created_at: string
          requirements: Json | null
          deadline: string | null
          status_updated_at: string | null
          transaction_hash: string | null
          payment_status: string | null
          release_at: string | null
          work_status: string | null
          client_address: string
          provider_address: string
          payment_token: string
        }
        Insert: {
          id?: string
          gig_id?: string | null
          client_id: string
          status: string
          amount: number
          created_at?: string
          requirements?: Json | null
          deadline?: string | null
          status_updated_at?: string | null
          transaction_hash?: string | null
          payment_status?: string | null
          release_at?: string | null
          work_status?: string | null
          client_address: string
          provider_address: string
          payment_token?: string
        }
        Update: {
          id?: string
          gig_id?: string | null
          client_id?: string
          status?: string
          amount?: number
          created_at?: string
          requirements?: Json | null
          deadline?: string | null
          status_updated_at?: string | null
          transaction_hash?: string | null
          payment_status?: string | null
          release_at?: string | null
          work_status?: string | null
          client_address?: string
          provider_address?: string
          payment_token?: string
        }
      }
      reviews: {
        Row: {
          id: string
          order_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          order_id: string
          sender_id: string
          content: string
          created_at: string | null
          attachments: Json | null
          seller_id: string | null
          gig_id: string | null
        }
        Insert: {
          id?: string
          order_id: string
          sender_id: string
          content: string
          created_at?: string | null
          attachments?: Json | null
          seller_id?: string | null
          gig_id?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          sender_id?: string
          content?: string
          created_at?: string | null
          attachments?: Json | null
          seller_id?: string | null
          gig_id?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          content: string
          read: boolean | null
          data: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          content: string
          read?: boolean | null
          data?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          content?: string
          read?: boolean | null
          data?: Json | null
          created_at?: string | null
        }
      }
      disputes: {
        Row: {
          id: string
          order_id: string | null
          created_by: string | null
          reason: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          created_by?: string | null
          reason?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          created_by?: string | null
          reason?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      client_requests: {
        Row: {
          id: string
          client_id: string
          title: string
          description: string
          budget_min: number | null
          budget_max: number | null
          deadline: string | null
          category: string
          requirements: Json | null
          skills_needed: string[] | null
          status: string | null
          selected_proposal_id: string | null
          created_at: string | null
          updated_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          title: string
          description: string
          budget_min?: number | null
          budget_max?: number | null
          deadline?: string | null
          category: string
          requirements?: Json | null
          skills_needed?: string[] | null
          status?: string | null
          selected_proposal_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          title?: string
          description?: string
          budget_min?: number | null
          budget_max?: number | null
          deadline?: string | null
          category?: string
          requirements?: Json | null
          skills_needed?: string[] | null
          status?: string | null
          selected_proposal_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          expires_at?: string | null
        }
      }
      proposals: {
        Row: {
          id: string
          request_id: string
          provider_id: string
          title: string
          description: string
          proposed_amount: number
          proposed_duration: number
          payment_token: string | null
          deliverables: Json | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          request_id: string
          provider_id: string
          title: string
          description: string
          proposed_amount: number
          proposed_duration: number
          payment_token?: string | null
          deliverables?: Json | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          request_id?: string
          provider_id?: string
          title?: string
          description?: string
          proposed_amount?: number
          proposed_duration?: number
          payment_token?: string | null
          deliverables?: Json | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      proposal_messages: {
        Row: {
          id: string
          proposal_id: string
          sender_id: string
          content: string
          attachments: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          proposal_id: string
          sender_id: string
          content: string
          attachments?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          proposal_id?: string
          sender_id?: string
          content?: string
          attachments?: Json | null
          created_at?: string | null
        }
      }
    }
    Views: {
      admin_stats: {
        Row: {
          total_users: number | null
          total_gigs: number | null
          total_orders: number | null
          completed_orders: number | null
          pending_disputes: number | null
        }
      }
    }
    Functions: {
      create_order_from_proposal: {
        Args: {
          proposal_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];