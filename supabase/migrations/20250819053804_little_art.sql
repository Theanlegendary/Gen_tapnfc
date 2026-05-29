/*
  # Create notifications system table

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `type` (enum)
      - `target_audience` (enum)
      - `user_id` (uuid, foreign key, optional)
      - `admin_id` (uuid, foreign key, optional)
      - `title` (text)
      - `message` (text)
      - `is_read` (boolean, default false)
      - `priority` (enum)
      - `metadata` (jsonb, optional)
      - `action_url` (text, optional)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `notifications` table
    - Add policies for notification access
*/

-- Create enums
CREATE TYPE notification_type AS ENUM ('user_invite', 'attendance', 'event', 'qr_management', 'general', 'join_request');
CREATE TYPE notification_audience AS ENUM ('admin', 'user');
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high');

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  target_audience notification_audience NOT NULL,
  user_id uuid REFERENCES users(id),
  admin_id uuid REFERENCES users(id),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  priority notification_priority DEFAULT 'medium',
  metadata jsonb,
  action_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notification policies
CREATE POLICY "Users can read their notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    (target_audience = 'user' AND user_id = auth.uid()) OR
    (target_audience = 'admin' AND admin_id = auth.uid())
  );

CREATE POLICY "Users can update their notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    (target_audience = 'user' AND user_id = auth.uid()) OR
    (target_audience = 'admin' AND admin_id = auth.uid())
  );

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_admin_id ON notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_audience ON notifications(target_audience);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);