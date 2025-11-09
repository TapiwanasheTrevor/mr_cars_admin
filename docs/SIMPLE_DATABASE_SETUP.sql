-- =============================================
-- SIMPLE DATABASE SETUP FOR MR CARS ADMIN
-- =============================================
-- This version creates tables first, then adds RLS
-- Copy this ENTIRE file and paste into Supabase SQL Editor
-- Then click RUN
-- =============================================

-- Helper function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CREATE ALL TABLES FIRST (NO RLS YET)
-- =============================================

-- Profiles
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

-- Service Providers
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

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'quarterly', 'yearly')),
  features JSONB NOT NULL,
  max_listings INTEGER DEFAULT 10,
  priority_support BOOLEAN DEFAULT false,
  featured_listings BOOLEAN DEFAULT false,
  analytics_access BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- Analytics
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

-- Messaging
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reference_type TEXT,
  reference_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(participant_1_id, participant_2_id, reference_type, reference_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  attachments TEXT[],
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_deleted_by_sender BOOLEAN DEFAULT false,
  is_deleted_by_receiver BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments
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

-- Security
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id UUID,
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  status TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

-- =============================================
-- CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_item_views_item ON item_views(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_item_views_date ON item_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_item_analytics_item ON item_analytics(item_type, item_id, date);
CREATE INDEX IF NOT EXISTS idx_section_analytics_date ON section_analytics(section_name, date);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant_1_id, participant_2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_event ON security_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_conversation ON security_logs(conversation_id, event_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_flags_user ON user_flags(user_id);

-- =============================================
-- NOW ENABLE RLS (DISABLED FOR NOW - ADMINS ONLY ACCESS)
-- =============================================
-- For simplicity, we're disabling RLS for admin dashboard
-- All access will be controlled by application-level permissions

-- =============================================
-- CREATE TRIGGERS
-- =============================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_providers_updated_at BEFORE UPDATE ON service_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_gateways_updated_at BEFORE UPDATE ON payment_gateways FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_flags_updated_at BEFORE UPDATE ON user_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- =============================================
-- INSERT INITIAL DATA
-- =============================================

INSERT INTO subscription_plans (name, description, price, billing_period, features, max_listings, priority_support, featured_listings, analytics_access, sort_order)
VALUES
  ('Basic', 'Perfect for casual sellers', 0.00, 'monthly',
   '{"features": ["5 listings", "Basic support", "Standard visibility"]}'::jsonb,
   5, false, false, false, 1),
  ('Gold Plus', 'Enhanced features for serious sellers', 29.99, 'monthly',
   '{"features": ["Unlimited listings", "Priority support", "Featured placement", "Advanced analytics", "Gold badge"]}'::jsonb,
   999, true, true, true, 2),
  ('Premium', 'Complete business solution', 99.99, 'monthly',
   '{"features": ["Unlimited listings", "24/7 support", "Top placement", "Full analytics", "Premium badge", "API access", "Custom branding"]}'::jsonb,
   9999, true, true, true, 3)
ON CONFLICT DO NOTHING;

INSERT INTO payment_gateways (name, type, is_enabled, configuration, fees_percentage, supported_currencies, sort_order)
VALUES
  ('Bank Transfer', 'bank_transfer', true, '{"instructions": "Please transfer to the provided bank account details"}'::jsonb, 0, ARRAY['USD', 'ZWL'], 1),
  ('EcoCash', 'mobile_money', true, '{"merchant_number": "TBD"}'::jsonb, 2.5, ARRAY['ZWL'], 2),
  ('Cash Payment', 'other', true, '{"instructions": "Pay in cash upon meeting"}'::jsonb, 0, ARRAY['USD', 'ZWL'], 3)
ON CONFLICT DO NOTHING;

-- =============================================
-- DATABASE SETUP COMPLETE!
-- =============================================
-- Next: Create your admin user and add to profiles table with super_admin role
