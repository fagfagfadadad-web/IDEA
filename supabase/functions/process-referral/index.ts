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

import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.52.0';

interface ReferralRequest {
  referralCode: string;
  newUserWalletAddress: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
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
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Parse request body
    const requestData: ReferralRequest = await req.json();

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

    console.log('🔗 Processing referral:', {
      referralCode: requestData.referralCode,
      newUserAddress: requestData.newUserWalletAddress
    });

    // Find referrer by code
    const { data: referrerStats, error: referrerError } = await supabaseAdmin
      .from('referral_stats')
      .select('user_id, total_referrals, active_referrals, total_referral_earnings, completed_earnings, total_rewards')
      .eq('referral_code', requestData.referralCode)
      .maybeSingle();

    if (referrerError) {
      console.error('Error finding referrer:', referrerError);
      return new Response(
        JSON.stringify({ error: 'Database error while finding referrer' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!referrerStats) {
      console.log('🔗 Referrer not found for code:', requestData.referralCode);
      return new Response(
        JSON.stringify({ error: 'Invalid referral code' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🔗 Found referrer:', referrerStats.user_id);

    // Get new user
    const { data: newUser, error: newUserError } = await supabaseAdmin
      .from('users')
      .select('id, wallet_address')
      .eq('wallet_address', requestData.newUserWalletAddress)
      .maybeSingle();

    if (newUserError) {
      console.error('Error finding new user:', newUserError);
      return new Response(
        JSON.stringify({ error: 'Database error while finding new user' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!newUser) {
      console.log('🔗 New user not found for address:', requestData.newUserWalletAddress);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🔗 Found new user:', newUser.id);

    // Check if referral already exists
    const { data: existingReferral, error: existingReferralError } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .eq('referred_user_id', newUser.id)
      .maybeSingle();

    if (existingReferralError) {
      console.error('Error checking existing referral:', existingReferralError);
      return new Response(
        JSON.stringify({ error: 'Database error while checking existing referral' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (existingReferral) {
      console.log('🔗 Referral already exists for user:', newUser.id);
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
      console.log('🔗 Self-referral attempt detected');
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
      console.error('Error creating referral:', referralError);
      return new Response(
        JSON.stringify({ error: 'Failed to create referral record' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🔗 Created referral record:', referral.id);

    // Reward amounts
    const SIGNUP_BONUS = 1000;

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
      console.error('Some rewards failed to create:', failedRewards);
      // Continue anyway, don't fail the whole process
    }

    console.log('🔗 Created reward records');

    // Update user balances
    const balancePromises = [
      // Update referrer balance
      supabaseAdmin.rpc('increment_user_balance', {
        user_id: referrerStats.user_id,
        ida_amount: SIGNUP_BONUS,
        earned_amount: SIGNUP_BONUS
      }),
      // Update new user balance
      supabaseAdmin.rpc('increment_user_balance', {
        user_id: newUser.id,
        ida_amount: SIGNUP_BONUS,
        earned_amount: SIGNUP_BONUS
      })
    ];

    const balanceResults = await Promise.allSettled(balancePromises);
    
    // If RPC function doesn't exist, fall back to direct updates
    const failedBalances = balanceResults.filter(result => result.status === 'rejected');
    if (failedBalances.length > 0) {
      console.log('🔗 RPC function not available, using direct balance updates');
      
      // Get current balances and update directly
      const { data: referrerUser } = await supabaseAdmin
        .from('users')
        .select('ida_balance, total_earned')
        .eq('id', referrerStats.user_id)
        .single();

      const { data: newUserData } = await supabaseAdmin
        .from('users')
        .select('ida_balance, total_earned')
        .eq('id', newUser.id)
        .single();

      if (referrerUser) {
        await supabaseAdmin
          .from('users')
          .update({
            ida_balance: (referrerUser.ida_balance || 0) + SIGNUP_BONUS,
            total_earned: (referrerUser.total_earned || 0) + SIGNUP_BONUS
          })
          .eq('id', referrerStats.user_id);
      }

      if (newUserData) {
        await supabaseAdmin
          .from('users')
          .update({
            ida_balance: (newUserData.ida_balance || 0) + SIGNUP_BONUS,
            total_earned: (newUserData.total_earned || 0) + SIGNUP_BONUS
          })
          .eq('id', newUser.id);
      }
    }

    console.log('🔗 Updated user balances');

    // Record transactions
    const transactionPromises = [
      // Referrer transaction
      supabaseAdmin.from('transaction_history').insert({
        from_address: 'system',
        to_address: requestData.newUserWalletAddress, // We'll use the referrer's address from users table
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

    // Get referrer wallet address for transaction record
    const { data: referrerUser } = await supabaseAdmin
      .from('users')
      .select('wallet_address')
      .eq('id', referrerStats.user_id)
      .single();

    if (referrerUser) {
      // Update the referrer transaction with correct address
      transactionPromises[0] = supabaseAdmin.from('transaction_history').insert({
        from_address: 'system',
        to_address: referrerUser.wallet_address,
        token_identifier: 'IDA',
        amount: SIGNUP_BONUS,
        transaction_type: 'referral',
        status: 'success',
        description: 'Referral signup bonus'
      });
    }

    const transactionResults = await Promise.allSettled(transactionPromises);
    
    // Check if any transaction recording failed
    const failedTransactions = transactionResults.filter(result => result.status === 'rejected');
    if (failedTransactions.length > 0) {
      console.error('Some transaction records failed to create:', failedTransactions);
      // Continue anyway, don't fail the whole process
    }

    console.log('🔗 Recorded transaction history');

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
      console.error('Error updating referral stats:', statsError);
      // Don't fail the whole process if stats update fails
    }

    console.log('🔗 Updated referral stats');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Referral processed successfully',
        referralId: referral.id,
        bonusAmount: SIGNUP_BONUS
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in process-referral function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});