-- =============================================
-- FIX EXISTING TABLES - CORRECT ORDER
-- =============================================
-- This adds missing columns and creates tables in the right order
-- Run this to make your dashboard work
-- =============================================

-- 1. Add sort_order to subscription_plans if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='sort_order') THEN
    ALTER TABLE subscription_plans ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- 2. Create profiles table if not exists
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

-- 3. Create payment_gateways FIRST (before payment_transactions)
CREATE TABLE IF NOT EXISTS payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mobile_money', 'bank_transfer', 'card', 'crypto', 'other')),
  is_enabled BOOLEAN DEFAULT true,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  fees_percentage DECIMAL(5, 2) DEFAULT 0,
  fees_fixed DECIMAL(10, 2) DEFAULT 0,
  min_amount DECIMAL(10, 2),
  max_amount DECIMAL(10, 2),
  supported_currencies TEXT[] DEFAULT ARRAY['USD', 'ZWL'],
  logo_url TEXT,
  instructions TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create payment_transactions AFTER payment_gateways
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway_id UUID REFERENCES payment_gateways(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('subscription', 'listing', 'product', 'service', 'other')),
  reference_id UUID,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_method TEXT,
  transaction_ref TEXT,
  payment_details JSONB,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create user_subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending', 'paused')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  payment_method TEXT,
  transaction_id TEXT,
  amount_paid DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create service_providers
CREATE TABLE IF NOT EXISTS service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('mechanic', 'breakdown', 'towing', 'detailing', 'inspection', 'other')),
  description TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  service_radius INTEGER DEFAULT 50,
  operating_hours JSONB,
  services_offered TEXT[],
  pricing_info JSONB,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_jobs_completed INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  verification_documents JSONB,
  license_number TEXT,
  insurance_info JSONB,
  images TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create bank_accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  branch_name TEXT,
  swift_code TEXT,
  currency TEXT DEFAULT 'USD',
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create user_flags
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

-- 9. Add conversation_id to security_logs if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='security_logs' AND column_name='conversation_id') THEN
    ALTER TABLE security_logs ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 10. Add missing columns to conversations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='reference_type') THEN
    ALTER TABLE conversations ADD COLUMN reference_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='reference_id') THEN
    ALTER TABLE conversations ADD COLUMN reference_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='status') THEN
    ALTER TABLE conversations ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

-- 11. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway ON payment_transactions(gateway_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_user_flags_user ON user_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_conversation ON security_logs(conversation_id, event_type);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 12. Insert default payment gateways if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM payment_gateways LIMIT 1) THEN
    INSERT INTO payment_gateways (name, type, is_enabled, configuration, fees_percentage, supported_currencies, sort_order)
    VALUES
      ('Bank Transfer', 'bank_transfer', true, '{"instructions": "Please transfer to the provided bank account details"}'::jsonb, 0, ARRAY['USD', 'ZWL'], 1),
      ('EcoCash', 'mobile_money', true, '{"merchant_number": "TBD"}'::jsonb, 2.5, ARRAY['ZWL'], 2),
      ('Cash Payment', 'other', true, '{"instructions": "Pay in cash upon meeting"}'::jsonb, 0, ARRAY['USD', 'ZWL'], 3);
  END IF;
END $$;

-- =============================================
-- SUCCESS!
-- =============================================
SELECT
  'Tables fixed! All missing columns and tables created successfully.' as status,
  (SELECT COUNT(*) FROM payment_gateways) as payment_gateways_count,
  (SELECT COUNT(*) FROM subscription_plans) as subscription_plans_count;
