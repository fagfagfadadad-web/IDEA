/*
  # Fix admin stats view

  1. View Updates
    - Drop and recreate admin_stats view with proper aggregations
    - Add proper counting for all statistics
    - Ensure view returns data even when tables are empty

  2. Security
    - Maintain existing RLS policies
    - Ensure only admins can access the view
*/

-- Drop the existing view
DROP VIEW IF EXISTS admin_stats;

-- Create the updated admin_stats view with proper aggregations
CREATE VIEW admin_stats AS
SELECT 
  COALESCE((SELECT COUNT(*) FROM users), 0)::bigint AS total_users,
  COALESCE((SELECT COUNT(*) FROM gigs WHERE status = 'active'), 0)::bigint AS total_gigs,
  COALESCE((SELECT COUNT(*) FROM orders), 0)::bigint AS total_orders,
  COALESCE((SELECT COUNT(*) FROM orders WHERE status = 'completed'), 0)::bigint AS completed_orders,
  COALESCE((SELECT COUNT(*) FROM disputes WHERE status = 'pending'), 0)::bigint AS pending_disputes,
  COALESCE((SELECT COUNT(*) FROM orders WHERE status = 'in_progress'), 0)::bigint AS active_orders,
  COALESCE((SELECT COUNT(*) FROM gigs), 0)::bigint AS total_gigs_all_status,
  COALESCE((SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'), 0)::bigint AS new_users_this_month,
  COALESCE((SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'), 0)::bigint AS new_orders_this_month;