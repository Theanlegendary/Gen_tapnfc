/*
  # Create users table with authentication

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `name` (text)
      - `employee_id` (text, unique)
      - `role` (enum: user, admin)
      - `contact` (text, optional)
      - `designation` (text, optional)
      - `address` (text, optional)
      - `profile_image_url` (text, optional)
      - `work_start_time` (time, default 09:00)
      - `work_end_time` (time, default 17:00)
      - `is_active` (boolean, default true)
      - `email_verified` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `users` table
    - Add policies for authenticated users to read/update their own data
    - Add admin policies for user management
*/

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  employee_id text UNIQUE NOT NULL,
  role user_role DEFAULT 'user',
  contact text,
  designation text,
  address text,
  profile_image_url text,
  work_start_time time DEFAULT '09:00',
  work_end_time time DEFAULT '17:00',
  is_active boolean DEFAULT true,
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage all users
CREATE POLICY "Admins can manage users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);