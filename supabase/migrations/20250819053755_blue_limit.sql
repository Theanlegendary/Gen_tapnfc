/*
  # Create QR codes management table

  1. New Tables
    - `qr_codes`
      - `id` (uuid, primary key)
      - `type` (enum)
      - `name` (text)
      - `description` (text)
      - `qr_data` (jsonb)
      - `location_id` (uuid, foreign key, optional)
      - `group_id` (uuid, foreign key, optional)
      - `is_active` (boolean, default true)
      - `usage_count` (integer, default 0)
      - `max_usage` (integer, optional)
      - `valid_from` (timestamptz)
      - `valid_until` (timestamptz, optional)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `qr_codes` table
    - Add policies for QR code management
*/

-- Create QR code type enum
CREATE TYPE qr_code_type AS ENUM ('user_invite', 'attendance', 'event_invite', 'group_invite', 'group_attendance');

-- Create QR codes table
CREATE TABLE IF NOT EXISTS qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type qr_code_type NOT NULL,
  name text NOT NULL,
  description text,
  qr_data jsonb NOT NULL,
  location_id uuid REFERENCES locations(id),
  group_id uuid REFERENCES attendance_groups(id),
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  max_usage integer,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  created_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- QR codes policies
CREATE POLICY "Users can read active QR codes"
  ON qr_codes
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage QR codes"
  ON qr_codes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_qr_codes_type ON qr_codes(type);
CREATE INDEX IF NOT EXISTS idx_qr_codes_active ON qr_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_qr_codes_location_id ON qr_codes(location_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_group_id ON qr_codes(group_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_by ON qr_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_qr_codes_valid_from ON qr_codes(valid_from);
CREATE INDEX IF NOT EXISTS idx_qr_codes_valid_until ON qr_codes(valid_until);