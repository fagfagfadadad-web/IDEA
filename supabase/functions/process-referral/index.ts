/*
  # Process Referral Edge Function

  1. New Functions
    - `process-referral` - Handles referral creation and reward distribution
      - Accepts referral code and new user wallet address
      - Creates referral records with service role privileges
      - Distributes signup bonuses to both users
      - Records transactions in history

  2. Security
    - Uses SUPABASE_SERVICE_ROLE_KEY for elevated privileges
    - CORS enabled for frontend access
    - Input validation for required fields

  3. Features
    - Automatic reward distribution
    - Transaction history recording
    - Duplicate referral prevention
    - Error handling and logging
*/

// Define CORS headers directly to avoid import issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface ReferralRequest {
  referralCode: string;
  newUserWalletAddress: string;
}

Deno.serve(async (req: Request) => {

  // Handle CORS preflight requests first
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');


    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Service configuration error',
          details: 'Missing required environment variables'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Import Supabase client dynamically to avoid startup issues
    let createClient;
    try {
      const supabaseModule = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
      createClient = supabaseModule.createClient;
    } catch (importError) {
      return new Response(
        JSON.stringify({ 
          error: 'Service initialization error',
          details: 'Failed to load required dependencies'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Parse request body
    let requestData: ReferralRequest;
    try {
      requestData = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate required fields
    if (!requestData.referralCode || !requestData.newUserWalletAddress) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: referralCode, newUserWalletAddress' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }


    // Find referrer by code
    const { data: referrerStats, error: referrerError } = await supabaseAdmin
      .from('referral_stats')
      .select('user_id, total_referrals, active_referrals, total_referral_earnings, completed_earnings, total_rewards')
      .eq('referral_code', requestData.referralCode)
      .maybeSingle();

    if (referrerError) {
      return new Response(
        JSON.stringify({ error: 'Database error while finding referrer' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!referrerStats) {
      return new Response(
        JSON.stringify({ error: 'Invalid referral code' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }


    // Get new user
    const { data: newUser, error: newUserError } = await supabaseAdmin
      .from('users')
      .select('id, wallet_address')
      .eq('wallet_address', requestData.newUserWalletAddress)
      .maybeSingle();

    if (newUserError) {
      return new Response(
        JSON.stringify({ error: 'Database error while finding new user' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!newUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }


    // Check if referral already exists
    const { data: existingReferral, error: existingReferralError } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .eq('referred_user_id', newUser.id)
      .maybeSingle();

    if (existingReferralError) {
      return new Response(
        JSON.stringify({ error: 'Database error while checking existing referral' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (existingReferral) {
      return new Response(
        JSON.stringify({ message: 'Referral already processed' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prevent self-referral
    if (referrerStats.user_id === newUser.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot refer yourself' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create referral record
    const { data: referral, error: referralError } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_id: referrerStats.user_id,
        referred_user_id: newUser.id,
        referral_code: requestData.referralCode,
        status: 'active'
      })
      .select()
      .single();

    if (referralError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create referral record' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }


    // Reward amounts
    const SIGNUP_BONUS = 1000;

    // Get referrer wallet address for transaction history
    const { data: referrerWalletData, error: referrerWalletError } = await supabaseAdmin
      .from('users')
      .select('wallet_address')
      .eq('id', referrerStats.user_id)
      .single();

    if (referrerWalletError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch referrer wallet address' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }


    // Give signup bonus to both users
    const rewardPromises = [
      // Referrer reward
      supabaseAdmin.from('referral_rewards').insert({
        referrer_id: referrerStats.user_id,
        referred_user_id: newUser.id,
        referral_id: referral.id,
        reward_type: 'signup_bonus',
        reward_amount: SIGNUP_BONUS,
        reward_token: 'IDA',
        status: 'completed',
        processed_at: new Date().toISOString()
      }),
      // New user reward
      supabaseAdmin.from('referral_rewards').insert({
        referrer_id: newUser.id,
        referred_user_id: newUser.id,
        referral_id: referral.id,
        reward_type: 'signup_bonus',
        reward_amount: SIGNUP_BONUS,
        reward_token: 'IDA',
        status: 'completed',
        processed_at: new Date().toISOString()
      })
    ];

    const rewardResults = await Promise.allSettled(rewardPromises);
    
    // Check if any reward creation failed
    const failedRewards = rewardResults.filter(result => result.status === 'rejected');
    if (failedRewards.length > 0) {
      // Continue anyway, don't fail the whole process
    } else {
    }

    // Update user balances - get current balances first
    
    // Get current balances for both users
    const { data: referrerUser, error: referrerUserError } = await supabaseAdmin
      .from('users')
      .select('ida_balance, total_earned, level, xp')
      .eq('id', referrerStats.user_id)
      .single();

    const { data: newUserData, error: newUserDataError } = await supabaseAdmin
      .from('users')
      .select('ida_balance, total_earned, level, xp')
      .eq('id', newUser.id)
      .single();

    if (referrerUserError) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch referrer user: ${referrerUserError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (newUserDataError) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch new user: ${newUserDataError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }


    // Update referrer balance
    const referrerNewBalance = (referrerUser.ida_balance || 0) + SIGNUP_BONUS;
    const referrerNewEarned = (referrerUser.total_earned || 0) + SIGNUP_BONUS;
    
    
    const { error: referrerUpdateError } = await supabaseAdmin
      .from('users')
      .update({
        ida_balance: referrerNewBalance,
        total_earned: referrerNewEarned
      })
      .eq('id', referrerStats.user_id);

    if (referrerUpdateError) {
      return new Response(
        JSON.stringify({ error: `Failed to update referrer balance: ${referrerUpdateError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }


    // Update new user balance
    const newUserNewBalance = (newUserData.ida_balance || 0) + SIGNUP_BONUS;
    const newUserNewEarned = (newUserData.total_earned || 0) + SIGNUP_BONUS;
    
    
    const { error: newUserUpdateError } = await supabaseAdmin
      .from('users')
      .update({
        ida_balance: newUserNewBalance,
        total_earned: newUserNewEarned
      })
      .eq('id', newUser.id);

    if (newUserUpdateError) {
      return new Response(
        JSON.stringify({ error: `Failed to update new user balance: ${newUserUpdateError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }


    // Record transactions
    const transactionPromises = [
      // Referrer transaction
      supabaseAdmin.from('transaction_history').insert({
        from_address: 'system',
        to_address: referrerWalletData.wallet_address,
        token_identifier: 'IDA',
        amount: SIGNUP_BONUS,
        transaction_type: 'referral',
        status: 'success',
        description: 'Referral signup bonus'
      }),
      // New user transaction
      supabaseAdmin.from('transaction_history').insert({
        from_address: 'system',
        to_address: newUser.wallet_address,
        token_identifier: 'IDA',
        amount: SIGNUP_BONUS,
        transaction_type: 'referral',
        status: 'success',
        description: 'Welcome signup bonus'
      })
    ];

    const transactionResults = await Promise.allSettled(transactionPromises);
    
    // Check if any transaction recording failed
    const failedTransactions = transactionResults.filter(result => result.status === 'rejected');
    if (failedTransactions.length > 0) {
      // Don't fail the whole process, just log the error
    } else {
    }

    // Update referrer's total_earned to include referral bonus
    const { error: referrerEarnedError } = await supabaseAdmin
      .from('users')
      .update({
        total_earned: (referrerUser.total_earned || 0) + SIGNUP_BONUS
      })
      .eq('id', referrerStats.user_id);

    if (referrerEarnedError) {
      // Don't fail the whole process, just log the error
    } else {
    }

    // Update new user's total_earned to include signup bonus
    const { error: newUserEarnedError } = await supabaseAdmin
      .from('users')
      .update({
        total_earned: (newUserData.total_earned || 0) + SIGNUP_BONUS
      })
      .eq('id', newUser.id);

    if (newUserEarnedError) {
      // Don't fail the whole process, just log the error
    } else {
    }

    // Update referral stats
    const { error: statsError } = await supabaseAdmin
      .from('referral_stats')
      .update({
        total_referrals: (referrerStats.total_referrals || 0) + 1,
        active_referrals: (referrerStats.active_referrals || 0) + 1,
        total_referral_earnings: (referrerStats.total_referral_earnings || 0) + SIGNUP_BONUS,
        completed_earnings: (referrerStats.completed_earnings || 0) + SIGNUP_BONUS,
        total_rewards: (referrerStats.total_rewards || 0) + 1,
        last_updated: new Date().toISOString()
      })
      .eq('user_id', referrerStats.user_id);

    if (statsError) {
      // Don't fail the whole process if stats update fails
    } else {
    }


    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Referral processed successfully',
        referralId: referral.id,
        bonusAmount: SIGNUP_BONUS,
        debug: {
          referrerUpdated: !referrerUpdateError,
          newUserUpdated: !newUserUpdateError,
          statsUpdated: !statsError,
          transactionRecorded: failedTransactions.length === 0
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});