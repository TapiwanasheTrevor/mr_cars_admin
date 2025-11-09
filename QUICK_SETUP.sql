-- =============================================
-- QUICK DATABASE SETUP - RUN THIS ENTIRE FILE
-- =============================================
-- This file sets up the complete database for Mr Cars Admin Dashboard
-- Copy ALL of this and paste into Supabase SQL Editor, then click RUN
-- =============================================

-- 1. Create update_updated_at function (needed for triggers)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create profiles table (required for RLS policies)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  location TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'super_admin')),
  is_verified BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 3. Now run the main migration
-- PASTE THE CONTENTS OF supabase/migrations/20250311000000_add_admin_features.sql HERE
-- (You'll need to copy it manually from the file)

-- 4. Create user_flags table for evasion detection
CREATE TABLE IF NOT EXISTS user_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  flag_level TEXT NOT NULL DEFAULT 'clean' CHECK (flag_level IN ('clean', 'watch', 'warning', 'restricted', 'banned')),
  total_evasion_attempts INTEGER DEFAULT 0,
  messaging_restricted BOOLEAN DEFAULT false,
  restricted_until TIMESTAMPTZ,
  last_evasion_attempt_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all user flags"
  ON user_flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'moderator')
    )
  );

CREATE POLICY "Admins can manage user flags"
  ON user_flags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'moderator')
    )
  );

ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_security_logs_conversation ON security_logs(conversation_id, event_type);
CREATE INDEX IF NOT EXISTS idx_user_flags_user ON user_flags(user_id);

CREATE TRIGGER update_user_flags_updated_at
BEFORE UPDATE ON user_flags
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SETUP COMPLETE!
-- =============================================
-- Next step: Create your admin profile
-- Run this after you create your admin user in Supabase Auth:
--
-- INSERT INTO profiles (id, username, full_name, role)
-- VALUES (
--   'YOUR-USER-ID-HERE',
--   'admin',
--   'System Administrator',
--   'super_admin'
-- )
-- ON CONFLICT (id) DO UPDATE
-- SET role = 'super_admin';
-- =============================================
