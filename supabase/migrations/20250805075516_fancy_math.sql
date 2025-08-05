/*
  # Clean All Database Data

  1. Data Cleanup
    - Remove all data from orders table
    - Remove all data from gigs table  
    - Remove all data from notifications table
    - Remove all data from users table
    - Remove all data from reviews table
    - Remove all data from messages table
    - Remove all data from disputes table
    - Remove all data from proposals table
    - Remove all data from proposal_messages table
    - Remove all data from client_requests table
    - Remove all data from referrals table
    - Remove all data from referral_rewards table
    - Remove all data from referral_stats table

  2. Order of Operations
    - Delete in correct order to respect foreign key constraints
    - Start with dependent tables first
    - End with parent tables (users last)

  3. Complete Reset
    - This will remove ALL data from the database
    - Tables structure and constraints remain intact
    - Fresh start for development
*/

-- Delete all data from dependent tables first (respecting foreign key constraints)
DELETE FROM referral_rewards;
DELETE FROM referral_stats;
DELETE FROM referrals;
DELETE FROM proposal_messages;
DELETE FROM proposals;
DELETE FROM disputes;
DELETE FROM reviews;
DELETE FROM messages;
DELETE FROM orders;
DELETE FROM client_requests;
DELETE FROM gigs;
DELETE FROM notifications;

-- Delete all users last (since other tables reference users)
DELETE FROM users;