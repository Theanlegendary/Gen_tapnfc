/*
  # Create group-based attendance tables

  1. New Tables
    - `attendance_groups`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `secret_key` (text, unique)
      - `admin_id` (uuid, foreign key)
      - `admin_name` (text)
      - `rules` (jsonb)
      - `is_active` (boolean, default true)
      - `member_count` (integer, default 0)
      - `max_members` (integer, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `group_members`
      - `id` (uuid, primary key)
      - `group_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `status` (enum)
      - `role` (enum)
      - `joined_at` (timestamptz)
      - `approved_by` (uuid, foreign key, optional)
      - `approved_at` (timestamptz, optional)

    - `group_join_requests`
      - `id` (uuid, primary key)
      - `group_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `secret_key` (text)
      - `status` (enum)
      - `requested_at` (timestamptz)
      - `processed_at` (timestamptz, optional)
      - `processed_by` (uuid, foreign key, optional)
      - `admin_message` (text, optional)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for group management
*/

-- Create enums
CREATE TYPE group_member_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE group_member_role AS ENUM ('member', 'moderator');
CREATE TYPE join_request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create attendance groups table
CREATE TABLE IF NOT EXISTS attendance_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  secret_key text UNIQUE NOT NULL,
  admin_id uuid REFERENCES users(id) NOT NULL,
  admin_name text NOT NULL,
  rules jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  member_count integer DEFAULT 0,
  max_members integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create group members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES attendance_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status group_member_status DEFAULT 'pending',
  role group_member_role DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  UNIQUE(group_id, user_id)
);

-- Create group join requests table
CREATE TABLE IF NOT EXISTS group_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES attendance_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  secret_key text NOT NULL,
  status join_request_status DEFAULT 'pending',
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES users(id),
  admin_message text,
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE attendance_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;

-- Attendance groups policies
CREATE POLICY "Users can read active groups they belong to"
  ON attendance_groups
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND (
      admin_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_id = id AND user_id = auth.uid() AND status = 'approved'
      )
    )
  );

CREATE POLICY "Admins can manage their groups"
  ON attendance_groups
  FOR ALL
  TO authenticated
  USING (admin_id = auth.uid());

-- Group members policies
CREATE POLICY "Users can read group memberships"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM attendance_groups 
      WHERE id = group_id AND admin_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can manage members"
  ON group_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM attendance_groups 
      WHERE id = group_id AND admin_id = auth.uid()
    )
  );

-- Join requests policies
CREATE POLICY "Users can read own join requests"
  ON group_join_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create join requests"
  ON group_join_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Group admins can manage join requests"
  ON group_join_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM attendance_groups 
      WHERE id = group_id AND admin_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_groups_admin_id ON attendance_groups(admin_id);
CREATE INDEX IF NOT EXISTS idx_groups_active ON attendance_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON group_members(status);
CREATE INDEX IF NOT EXISTS idx_join_requests_group_id ON group_join_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON group_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON group_join_requests(status);