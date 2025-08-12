/*
  # Fix Rewards System Tables and Policies

  1. New Tables
    - `tasks` - Defines reward tasks (connect wallet, create gig, etc.)
    - `user_reward_tasks` - Tracks user progress on reward tasks (separate from workspace user_tasks)
    - `transaction_history` - Records IDA token transactions and rewards

  2. User Table Updates
    - Add IDA balance, total earned, level, and XP columns to users table

  3. Security Updates
    - Fix RLS policy for referral_stats to allow authenticated users to insert
    - Add proper RLS policies for new tables
    - Ensure service_role has full access for backend operations

  4. Sample Data
    - Insert basic reward tasks to get started
*/

-- Enable uuid-ossp extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the 'tasks' table for reward task definitions
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL,
    reward_amount numeric NOT NULL DEFAULT 0,
    xp_reward integer NOT NULL DEFAULT 0,
    task_type text NOT NULL DEFAULT 'manual',
    required_value text,
    proof_required_type text NOT NULL DEFAULT 'none',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add constraint for task_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_task_type_check' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_task_type_check 
        CHECK (task_type IN ('manual', 'wallet_connect', 'transaction', 'mining_level', 'referral', 'social_follow', 'social_post', 'social_retweet', 'social_like', 'external_link'));
    END IF;
END $$;

-- Add constraint for proof_required_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_proof_required_type_check' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_proof_required_type_check 
        CHECK (proof_required_type IN ('none', 'file', 'url', 'text'));
    END IF;
END $$;

-- Enable RLS for tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for tasks table
CREATE POLICY IF NOT EXISTS "Anyone can read active tasks" ON public.tasks
FOR SELECT TO public
USING (is_active = true);

CREATE POLICY IF NOT EXISTS "Service role full access tasks" ON public.tasks
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Create indexes for tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_active ON public.tasks (is_active);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON public.tasks (task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks (created_at DESC);

-- Create the 'user_reward_tasks' table (separate from existing user_tasks)
CREATE TABLE IF NOT EXISTS public.user_reward_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'available',
    proof_url text,
    proof_text text,
    completed_at timestamptz,
    claimed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (user_id, task_id)
);

-- Add constraint for user_reward_tasks status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_reward_tasks_status_check' 
        AND table_name = 'user_reward_tasks'
    ) THEN
        ALTER TABLE public.user_reward_tasks ADD CONSTRAINT user_reward_tasks_status_check 
        CHECK (status IN ('available', 'in_progress', 'completed', 'claimed'));
    END IF;
END $$;

-- Enable RLS for user_reward_tasks table
ALTER TABLE public.user_reward_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_reward_tasks table
CREATE POLICY IF NOT EXISTS "Users can manage own reward tasks" ON public.user_reward_tasks
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Service role full access user_reward_tasks" ON public.user_reward_tasks
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Create indexes for user_reward_tasks table
CREATE INDEX IF NOT EXISTS idx_user_reward_tasks_user_id ON public.user_reward_tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_user_reward_tasks_task_id ON public.user_reward_tasks (task_id);
CREATE INDEX IF NOT EXISTS idx_user_reward_tasks_status ON public.user_reward_tasks (status);
CREATE INDEX IF NOT EXISTS idx_user_reward_tasks_created_at ON public.user_reward_tasks (created_at DESC);

-- Create the 'transaction_history' table
CREATE TABLE IF NOT EXISTS public.transaction_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_address text NOT NULL,
    to_address text NOT NULL,
    token_identifier text NOT NULL,
    amount numeric NOT NULL DEFAULT 0,
    transaction_hash text,
    transaction_type text NOT NULL DEFAULT 'send',
    status text NOT NULL DEFAULT 'pending',
    timestamp timestamptz DEFAULT now(),
    description text
);

-- Add constraint for transaction_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transaction_history_transaction_type_check' 
        AND table_name = 'transaction_history'
    ) THEN
        ALTER TABLE public.transaction_history ADD CONSTRAINT transaction_history_transaction_type_check 
        CHECK (transaction_type IN ('send', 'receive', 'reward', 'referral'));
    END IF;
END $$;

-- Add constraint for status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transaction_history_status_check' 
        AND table_name = 'transaction_history'
    ) THEN
        ALTER TABLE public.transaction_history ADD CONSTRAINT transaction_history_status_check 
        CHECK (status IN ('pending', 'success', 'failed'));
    END IF;
END $$;

-- Enable RLS for transaction_history table
ALTER TABLE public.transaction_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for transaction_history table
CREATE POLICY IF NOT EXISTS "Users can read own transaction history" ON public.transaction_history
FOR SELECT TO authenticated
USING (
    from_address = (SELECT wallet_address FROM public.users WHERE id = auth.uid()) OR 
    to_address = (SELECT wallet_address FROM public.users WHERE id = auth.uid())
);

CREATE POLICY IF NOT EXISTS "Service role full access transaction_history" ON public.transaction_history
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Create indexes for transaction_history table
CREATE INDEX IF NOT EXISTS idx_transaction_history_from_address ON public.transaction_history (from_address);
CREATE INDEX IF NOT EXISTS idx_transaction_history_to_address ON public.transaction_history (to_address);
CREATE INDEX IF NOT EXISTS idx_transaction_history_timestamp ON public.transaction_history (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_history_type ON public.transaction_history (transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_history_status ON public.transaction_history (status);

-- Add missing columns to users table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'ida_balance'
    ) THEN
        ALTER TABLE public.users ADD COLUMN ida_balance numeric DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'total_earned'
    ) THEN
        ALTER TABLE public.users ADD COLUMN total_earned numeric DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'level'
    ) THEN
        ALTER TABLE public.users ADD COLUMN level integer DEFAULT 1;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'xp'
    ) THEN
        ALTER TABLE public.users ADD COLUMN xp integer DEFAULT 0;
    END IF;
END $$;

-- Fix RLS policy for referral_stats to allow authenticated users to insert
-- First, check if the policy exists and drop it if it's too restrictive
DO $$
BEGIN
    -- Create INSERT policy for authenticated users if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'referral_stats' 
        AND policyname = 'Users can insert own referral stats'
    ) THEN
        CREATE POLICY "Users can insert own referral stats" ON public.referral_stats
        FOR INSERT TO authenticated
        WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- Ensure UPDATE policy exists for referral_stats
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'referral_stats' 
        AND policyname = 'Users can update own referral stats'
    ) THEN
        CREATE POLICY "Users can update own referral stats" ON public.referral_stats
        FOR UPDATE TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_tasks_updated_at'
    ) THEN
        CREATE TRIGGER update_tasks_updated_at 
        BEFORE UPDATE ON public.tasks 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_user_reward_tasks_updated_at'
    ) THEN
        CREATE TRIGGER update_user_reward_tasks_updated_at 
        BEFORE UPDATE ON public.user_reward_tasks 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert sample reward tasks (only if table is empty)
INSERT INTO public.tasks (title, description, reward_amount, xp_reward, task_type, proof_required_type, is_active)
SELECT * FROM (VALUES
    ('Connect Wallet', 'Connect your MultiversX wallet to the IDEA platform', 1000, 10, 'wallet_connect', 'none', true),
    ('Create First Gig', 'Create your first service gig on the platform', 500, 5, 'manual', 'none', true),
    ('Complete First Order', 'Successfully complete your first order as a provider', 2000, 20, 'transaction', 'none', true),
    ('Refer a Friend', 'Refer a friend who signs up and connects their wallet', 1000, 10, 'referral', 'none', true),
    ('Follow on X', 'Follow our official X (Twitter) account @xIdeaMarket', 50, 1, 'social_follow', 'url', true),
    ('Join Discord', 'Join our official Discord server', 50, 1, 'external_link', 'none', true),
    ('Reach Level 5', 'Reach level 5 by earning XP through various activities', 1000, 0, 'mining_level', '5', true),
    ('Reach Level 10', 'Reach level 10 by earning XP through various activities', 2500, 0, 'mining_level', '10', true)
) AS v(title, description, reward_amount, xp_reward, task_type, proof_required_type, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.tasks WHERE tasks.title = v.title);