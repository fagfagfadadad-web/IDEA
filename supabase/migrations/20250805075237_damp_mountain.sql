/*
  # Clean all data from tables

  1. Data Cleanup
    - Clear all records from `orders` table
    - Clear all records from `gigs` table  
    - Clear all records from `notifications` table
    - Clear all records from `reviews` table
    - Clear all records from `messages` table
    - Clear all records from `disputes` table
    - Clear all records from `proposals` table
    - Clear all records from `proposal_messages` table
    - Clear all records from `client_requests` table
    - Clear all records from `referrals` table
    - Clear all records from `referral_rewards` table
    - Clear all records from `referral_stats` table

  2. Safety
    - Uses DELETE instead of TRUNCATE for safety
    - Preserves table structure and constraints
    - Maintains user accounts (users table not touched)
*/

-- Clean all data from tables (in correct order due to foreign key constraints)

-- Clear messages first (references orders)
DELETE FROM messages;

-- Clear reviews (references orders)
DELETE FROM reviews;

-- Clear disputes (references orders)
DELETE FROM disputes;

-- Clear orders (references gigs and users)
DELETE FROM orders;

-- Clear proposal messages (references proposals)
DELETE FROM proposal_messages;

-- Clear proposals (references client_requests and users)
DELETE FROM proposals;

-- Clear client requests (references users)
DELETE FROM client_requests;

-- Clear gigs (references users)
DELETE FROM gigs;

-- Clear notifications (references users)
DELETE FROM notifications;

-- Clear referral rewards (references referrals, orders, gigs, users)
DELETE FROM referral_rewards;

-- Clear referrals (references users)
DELETE FROM referrals;

-- Clear referral stats (references users)
DELETE FROM referral_stats;