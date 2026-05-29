/*
  # Create attendance tracking tables

  1. New Tables
    - `locations`
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text, optional)
      - `office_id` (text)
      - `coordinates` (point, optional)
      - `qr_code_data` (jsonb)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)

    - `attendance_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `location_id` (uuid, foreign key)
      - `employee_id` (text)
      - `employee_name` (text)
      - `date` (date)
      - `check_in_time` (time)
      - `check_out_time` (time, optional)
      - `status` (enum)
      - `qr_code_data` (text)
      - `location_coordinates` (point, optional)
      - `working_hours` (decimal)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add appropriate policies for users and admins
*/

-- Create attendance status enum
CREATE TYPE attendance_status AS ENUM ('Present', 'Late', 'Absent', 'WeekOff', 'Holiday');

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  office_id text NOT NULL,
  coordinates point,
  qr_code_data jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create attendance records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  location_id uuid REFERENCES locations(id),
  employee_id text NOT NULL,
  employee_name text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  check_in_time time,
  check_out_time time,
  status attendance_status NOT NULL,
  qr_code_data text,
  location_coordinates point,
  working_hours decimal(4,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Location policies
CREATE POLICY "Users can read active locations"
  ON locations
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage locations"
  ON locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Attendance record policies
CREATE POLICY "Users can read own attendance"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own attendance"
  ON attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all attendance"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all attendance"
  ON attendance_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_office_id ON locations(office_id);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance_records(user_id, date);