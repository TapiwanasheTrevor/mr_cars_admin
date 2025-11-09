-- =============================================
-- FINAL WORKING DATABASE SETUP
-- =============================================
-- This version only creates tables that don't exist
-- and doesn't try to insert data into existing tables
-- =============================================

-- Helper function (safe to run multiple times)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PROFILES
-- =============================================
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

-- =============================================
-- ENHANCE EXISTING CONVERSATIONS TABLE
-- =============================================
DO $$
BEGIN
  -- Add reference_type if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='reference_type') THEN
    ALTER TABLE conversations ADD COLUMN reference_type TEXT;
  END IF;

  -- Add reference_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='reference_id') THEN
    ALTER TABLE conversations ADD COLUMN reference_id UUID;
  END IF;

  -- Add status if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='status') THEN
    ALTER TABLE conversations ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

-- =============================================
-- USER SUBSCRIPTIONS (might not exist yet)
-- =============================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID,
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

-- =============================================
-- SERVICE PROVIDERS
-- =============================================
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

CREATE TABLE IF NOT EXISTS service_provider_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  service_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- PAYMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mobile_money', 'bank_transfer', 'card', 'crypto', 'other')),
  is_enabled BOOLEAN DEFAULT true,
  configuration JSONB NOT NULL,
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

-- =============================================
-- SECURITY & USER FLAGS
-- =============================================

-- Add conversation_id to security_logs if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='security_logs' AND column_name='conversation_id') THEN
    ALTER TABLE security_logs ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;
  END IF;
END $$;

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

CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  blocked_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB,
  ip_address INET,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ANALYTICS
-- =============================================
CREATE TABLE IF NOT EXISTS platform_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_views INTEGER DEFAULT 0,
  total_unique_visitors INTEGER DEFAULT 0,
  total_listings_viewed INTEGER DEFAULT 0,
  total_searches INTEGER DEFAULT 0,
  total_inquiries INTEGER DEFAULT 0,
  total_new_users INTEGER DEFAULT 0,
  total_new_listings INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS section_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name TEXT NOT NULL,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  time_spent_avg INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5, 2),
  conversion_rate DECIMAL(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(section_name, date)
);

CREATE TABLE IF NOT EXISTS item_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(item_type, item_id, date)
);

CREATE TABLE IF NOT EXISTS item_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- CREATE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_security_logs_conversation ON security_logs(conversation_id, event_type);
CREATE INDEX IF NOT EXISTS idx_user_flags_user ON user_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_item_views_item ON item_views(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_item_views_date ON item_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_item_analytics_item ON item_analytics(item_type, item_id, date);
CREATE INDEX IF NOT EXISTS idx_section_analytics_date ON section_analytics(section_name, date);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, is_active);

-- =============================================
-- CREATE TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_providers_updated_at ON service_providers;
CREATE TRIGGER update_service_providers_updated_at BEFORE UPDATE ON service_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_gateways_updated_at ON payment_gateways;
CREATE TRIGGER update_payment_gateways_updated_at BEFORE UPDATE ON payment_gateways FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_flags_updated_at ON user_flags;
CREATE TRIGGER update_user_flags_updated_at BEFORE UPDATE ON user_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INSERT INITIAL DATA (only for new tables)
-- =============================================

-- Only insert payment gateways if table is empty
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
-- DATABASE SETUP COMPLETE!
-- =============================================
SELECT 'Database setup complete! Tables created successfully.' as status;
