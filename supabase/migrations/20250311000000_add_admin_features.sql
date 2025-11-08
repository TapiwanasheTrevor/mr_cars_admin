/*
  # Admin Features Update

  This migration adds the following features for the admin panel:
  1. Service Providers (mechanics, breakdown services)
  2. Gold Plus / Premium Subscriptions
  3. Analytics and Views Tracking
  4. Messaging/Inbox System
  5. Payment Configuration
  6. Enhanced Security Features
*/

-- =============================================
-- 1. SERVICE PROVIDERS TABLE
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
  service_radius INTEGER DEFAULT 50, -- in kilometers
  operating_hours JSONB, -- e.g., {"monday": "8:00-17:00", "tuesday": "8:00-17:00"}
  services_offered TEXT[], -- array of specific services
  pricing_info JSONB, -- flexible pricing structure
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_jobs_completed INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  verification_documents TEXT[], -- URLs to uploaded documents
  license_number TEXT,
  insurance_info JSONB,
  images TEXT[], -- business photos
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service provider reviews
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
-- 2. GOLD PLUS / PREMIUM SUBSCRIPTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "Gold Plus", "Premium", "Basic"
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'quarterly', 'yearly')),
  features JSONB NOT NULL, -- list of features
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

-- =============================================
-- 3. ANALYTICS AND VIEWS TRACKING
-- =============================================
-- Total platform analytics
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
  metadata JSONB, -- additional metrics
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Section-level analytics (Car Sales, Parts, Rentals, etc.)
CREATE TABLE IF NOT EXISTS section_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name TEXT NOT NULL, -- 'car_sales', 'car_parts', 'rentals', 'services', 'forum'
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  time_spent_avg INTEGER DEFAULT 0, -- in seconds
  bounce_rate DECIMAL(5, 2),
  conversion_rate DECIMAL(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(section_name, date)
);

-- Item-level analytics (specific listings, products, etc.)
CREATE TABLE IF NOT EXISTS item_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL, -- 'car', 'rental', 'product', 'service_provider', 'forum_topic'
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

-- Real-time view tracking
CREATE TABLE IF NOT EXISTS item_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- for anonymous users
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_item_views_item ON item_views(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_item_views_date ON item_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_item_analytics_item ON item_analytics(item_type, item_id, date);
CREATE INDEX IF NOT EXISTS idx_section_analytics_date ON section_analytics(section_name, date);

-- =============================================
-- 4. MESSAGING / INBOX SYSTEM
-- =============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reference_type TEXT, -- 'car', 'rental', 'service', 'inquiry'
  reference_id UUID, -- ID of the referenced item
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
  attachments TEXT[], -- URLs to uploaded files
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_deleted_by_sender BOOLEAN DEFAULT false,
  is_deleted_by_receiver BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for messaging
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant_1_id, participant_2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;

-- =============================================
-- 5. PAYMENT CONFIGURATION
-- =============================================
CREATE TABLE IF NOT EXISTS payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "EcoCash", "Bank Transfer", "PayPal"
  type TEXT NOT NULL CHECK (type IN ('mobile_money', 'bank_transfer', 'card', 'crypto', 'other')),
  is_enabled BOOLEAN DEFAULT true,
  configuration JSONB NOT NULL, -- gateway-specific config (API keys, merchant IDs, etc.)
  fees_percentage DECIMAL(5, 2) DEFAULT 0,
  fees_fixed DECIMAL(10, 2) DEFAULT 0,
  min_amount DECIMAL(10, 2),
  max_amount DECIMAL(10, 2),
  supported_currencies TEXT[] DEFAULT ARRAY['USD', 'ZWL'],
  logo_url TEXT,
  instructions TEXT, -- for manual payment methods
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway_id UUID REFERENCES payment_gateways(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('subscription', 'listing', 'product', 'service', 'other')),
  reference_id UUID, -- ID of the item being paid for
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_method TEXT,
  transaction_ref TEXT, -- external transaction reference
  payment_details JSONB, -- additional payment information
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bank account configuration
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
-- 6. ENHANCED SECURITY FEATURES
-- =============================================
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'login', 'logout', 'password_change', 'failed_login', 'data_access', 'data_modification'
  event_description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  status TEXT, -- 'success', 'failure', 'blocked'
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  blocked_until TIMESTAMPTZ, -- NULL means permanent
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

-- Create indexes for security tables
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_event ON security_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, is_active);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_provider_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Service Providers Policies
CREATE POLICY "Service providers viewable by all authenticated users"
  ON service_providers FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage service providers"
  ON service_providers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'moderator')
    )
  );

-- Subscription Plans Policies
CREATE POLICY "Subscription plans viewable by all authenticated users"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- User Subscriptions Policies
CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Analytics Policies (Admin only)
CREATE POLICY "Admins can view platform analytics"
  ON platform_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'moderator')
    )
  );

CREATE POLICY "Admins can view section analytics"
  ON section_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'moderator')
    )
  );

CREATE POLICY "Admins can view item analytics"
  ON item_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'moderator')
    )
  );

-- Messaging Policies
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (participant_1_id = auth.uid() OR participant_2_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (participant_1_id = auth.uid() OR participant_2_id = auth.uid());

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
    )
  );

-- Payment Policies
CREATE POLICY "Payment gateways viewable by authenticated users"
  ON payment_gateways FOR SELECT
  TO authenticated
  USING (is_enabled = true);

CREATE POLICY "Admins can manage payment gateways"
  ON payment_gateways FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Users can view their own transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Bank Accounts (Admin only)
CREATE POLICY "Admins can manage bank accounts"
  ON bank_accounts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Security Logs (Admin only)
CREATE POLICY "Admins can view security logs"
  ON security_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- =============================================
-- TRIGGERS
-- =============================================

-- Update updated_at timestamp triggers
CREATE TRIGGER update_service_providers_updated_at
BEFORE UPDATE ON service_providers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON subscription_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_gateways_updated_at
BEFORE UPDATE ON payment_gateways
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON bank_accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Function to aggregate analytics
CREATE OR REPLACE FUNCTION aggregate_daily_analytics()
RETURNS void AS $$
BEGIN
  -- Aggregate item views into item_analytics
  INSERT INTO item_analytics (item_type, item_id, date, views, unique_visitors)
  SELECT
    item_type,
    item_id,
    DATE(viewed_at) as date,
    COUNT(*) as views,
    COUNT(DISTINCT COALESCE(user_id::text, session_id)) as unique_visitors
  FROM item_views
  WHERE DATE(viewed_at) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY item_type, item_id, DATE(viewed_at)
  ON CONFLICT (item_type, item_id, date) DO UPDATE
  SET
    views = EXCLUDED.views,
    unique_visitors = EXCLUDED.unique_visitors;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, billing_period, features, max_listings, priority_support, featured_listings, analytics_access)
VALUES
  ('Basic', 'Perfect for casual sellers', 0.00, 'monthly',
   '{"features": ["5 listings", "Basic support", "Standard visibility"]}'::jsonb,
   5, false, false, false),
  ('Gold Plus', 'Enhanced features for serious sellers', 29.99, 'monthly',
   '{"features": ["Unlimited listings", "Priority support", "Featured placement", "Advanced analytics", "Gold badge"]}'::jsonb,
   999, true, true, true),
  ('Premium', 'Complete business solution', 99.99, 'monthly',
   '{"features": ["Unlimited listings", "24/7 support", "Top placement", "Full analytics", "Premium badge", "API access", "Custom branding"]}'::jsonb,
   9999, true, true, true)
ON CONFLICT DO NOTHING;

-- Insert default payment gateways
INSERT INTO payment_gateways (name, type, is_enabled, configuration, fees_percentage, supported_currencies, sort_order)
VALUES
  ('Bank Transfer', 'bank_transfer', true,
   '{"instructions": "Please transfer to the provided bank account details"}'::jsonb,
   0, ARRAY['USD', 'ZWL'], 1),
  ('EcoCash', 'mobile_money', true,
   '{"merchant_number": "TBD"}'::jsonb,
   2.5, ARRAY['ZWL'], 2),
  ('Cash Payment', 'other', true,
   '{"instructions": "Pay in cash upon meeting"}'::jsonb,
   0, ARRAY['USD', 'ZWL'], 3)
ON CONFLICT DO NOTHING;
