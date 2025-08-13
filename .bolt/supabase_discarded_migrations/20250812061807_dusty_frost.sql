```sql
-- Enable uuid-ossp for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the 'tasks' table for reward definitions
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL UNIQUE, -- Added UNIQUE constraint for idempotency
    description text NOT NULL,
    reward_amount numeric NOT NULL,
    xp_reward integer NOT NULL DEFAULT 0,
    task_type text NOT NULL, -- e.g., 'manual', 'wallet_connect', 'transaction', 'mining_level', 'referral', 'social_follow', 'social_post', 'social_retweet', 'social_like', 'external_link'
    required_value text, -- e.g., URL for social tasks, level for mining_level
    proof_required_type text NOT NULL, -- 'none' | 'file' | 'url' | 'text'
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create the 'user_reward_tasks' table to track user progress on reward tasks
CREATE TABLE IF NOT EXISTS public.user_reward_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'available', -- 'available' | 'in_progress' | 'completed' | 'claimed'
    proof_url text,
    proof_text text,
    completed_at timestamptz,
    claimed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (user_id, task_id) -- Ensure a user can only have one entry per task
);

-- Add RLS policies for user_reward_tasks
ALTER TABLE public.user_reward_tasks ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to manage their own user_reward_tasks
CREATE POLICY "Users can manage own reward tasks" ON public.user_reward_tasks
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy for service_role to have full access (for backend operations)
CREATE POLICY "Service role full access user_reward_tasks" ON public.user_reward_tasks
FOR ALL TO service_role
USING (true) WITH CHECK (true);


-- Create the 'transaction_history' table
CREATE TABLE IF NOT EXISTS public.transaction_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_address text NOT NULL,
    to_address text NOT NULL,
    token_identifier text NOT NULL,
    amount numeric NOT NULL,
    transaction_hash text,
    transaction_type text NOT NULL, -- e.g., 'send', 'receive', 'reward', 'referral'
    status text NOT NULL DEFAULT 'pending', -- 'pending' | 'success' | 'failed'
    timestamp timestamptz DEFAULT now(),
    description text
);

-- Add RLS policies for transaction_history
ALTER TABLE public.transaction_history ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their own transaction history
CREATE POLICY "Users can read own transaction history" ON public.transaction_history
FOR SELECT TO authenticated
USING (from_address = (SELECT wallet_address FROM public.users WHERE id = auth.uid()) OR to_address = (SELECT wallet_address FROM public.users WHERE id = auth.uid()));

-- Policy for service_role to have full access
CREATE POLICY "Service role full access transaction_history" ON public.transaction_history
FOR ALL TO service_role
USING (true) WITH CHECK (true);


-- Add columns to 'users' table if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ida_balance numeric DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_earned numeric DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;

-- Update RLS policy for 'referral_stats' to allow authenticated users to insert their own stats
-- This assumes the policy name is 'Users can insert own stats' or similar.
-- We need to ensure an INSERT policy exists for 'authenticated' role.
-- The existing schema does NOT show an INSERT policy for 'authenticated' role on 'referral_stats'.
-- So, we need to add it.

-- Drop existing policy if it conflicts (e.g., if it was too restrictive for authenticated inserts)
-- Based on the schema, there is no explicit INSERT policy for 'authenticated' role,
-- so we will create one.
-- Ensure RLS is enabled for referral_stats (it is, based on schema)

CREATE POLICY IF NOT EXISTS "Users can insert own referral stats" ON public.referral_stats
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Insert sample data for 'tasks' (optional, but good for testing)
INSERT INTO public.tasks (title, description, reward_amount, xp_reward, task_type, proof_required_type, is_active)
VALUES
('Connect Wallet', 'Connect your MultiversX wallet to the platform.', 1000, 10, 'wallet_connect', 'none', true),
('Create First Gig', 'Create your first gig on the platform.', 500, 5, 'manual', 'none', true),
('Complete First Order', 'Successfully complete your first order as a provider.', 2000, 20, 'transaction', 'none', true),
('Refer a Friend', 'Refer a friend who signs up and connects their wallet.', 1000, 10, 'referral', 'none', true),
('Follow on X', 'Follow our official X (Twitter) account.', 50, 1, 'social_follow', 'url', true),
('Join Discord', 'Join our official Discord server.', 50, 1, 'external_link', 'none', true)
ON CONFLICT (title) DO NOTHING; -- Prevents re-inserting if already exists
```