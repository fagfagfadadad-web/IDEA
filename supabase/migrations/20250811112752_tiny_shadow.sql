/*
  # Dashboard Tables for Profile

  1. New Tables
    - `user_tasks` - Task management for users
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text, task title)
      - `description` (text, task description)
      - `due_date` (timestamp, deadline)
      - `status` (text, pending/completed/cancelled)
      - `priority` (text, low/medium/high)
      - `project_id` (uuid, optional link to orders/gigs)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `calendar_events` - Calendar events for users
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text, event title)
      - `description` (text, event description)
      - `start_time` (timestamp, event start)
      - `end_time` (timestamp, event end)
      - `location` (text, optional location)
      - `event_type` (text, meeting/deadline/reminder)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own data
    - Add indexes for performance

  3. Triggers
    - Auto-update timestamps on changes
*/

-- Create user_tasks table
CREATE TABLE IF NOT EXISTS user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  project_id uuid, -- Optional link to orders or gigs
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text,
  event_type text DEFAULT 'reminder' CHECK (event_type IN ('meeting', 'deadline', 'reminder', 'milestone')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies for user_tasks
CREATE POLICY "Users can manage own tasks"
  ON user_tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for calendar_events
CREATE POLICY "Users can manage own events"
  ON calendar_events
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_user_tasks_due_date ON user_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_user_tasks_priority ON user_tasks(priority);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_tasks_updated_at
  BEFORE UPDATE ON user_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();