# Mr Cars Admin Portal - Technical Specification

## 1. Architecture Overview

### 1.1 System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Web Portal                         │
│  (React/Next.js + TypeScript + Tailwind + shadcn/ui)        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ HTTPS/WebSocket
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │   Auth       │  │  Realtime    │     │
│  │   Database   │  │   Service    │  │   Channels   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Storage    │  │    Edge      │  │     RLS      │     │
│  │   (Files)    │  │  Functions   │  │   Policies   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                  │
                  │ API Calls
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              Mobile App (Flutter)                            │
│           (Shared Database Access)                           │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

**Frontend Framework:**
```json
{
  "framework": "Next.js 14+",
  "language": "TypeScript 5+",
  "ui": "React 18+",
  "styling": "Tailwind CSS 3+",
  "components": "shadcn/ui",
  "state": "Zustand",
  "data-fetching": "React Query (TanStack Query)",
  "forms": "React Hook Form + Zod",
  "charts": "Recharts",
  "tables": "TanStack Table",
  "routing": "Next.js App Router"
}
```

**Backend (Supabase):**
```json
{
  "database": "PostgreSQL 15+",
  "auth": "Supabase Auth",
  "realtime": "Supabase Realtime",
  "storage": "Supabase Storage",
  "functions": "Supabase Edge Functions (Deno)",
  "orm": "Supabase JS Client"
}
```

---

## 2. Database Design

### 2.1 Admin Schema

```sql
-- ==============================================
-- ADMIN PORTAL DATABASE SCHEMA
-- ==============================================

-- Drop existing objects if needed (development only)
-- DROP SCHEMA IF EXISTS admin CASCADE;

-- Create admin schema
CREATE SCHEMA IF NOT EXISTS admin;

-- ==============================================
-- 1. ADMIN USERS & AUTHENTICATION
-- ==============================================

CREATE TABLE admin.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN (
        'super_admin',
        'moderator',
        'support',
        'finance',
        'analytics'
    )),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    two_factor_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES admin.users(id)
);

-- Admin activity log
CREATE TABLE admin.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin sessions
CREATE TABLE admin.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. USER MODERATION
-- ==============================================

CREATE TABLE admin.user_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN (
        'suspend',
        'unsuspend',
        'delete',
        'warn',
        'restrict_messaging',
        'restrict_listing'
    )),
    reason TEXT NOT NULL,
    duration_days INTEGER, -- NULL for permanent
    admin_id UUID REFERENCES admin.users(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE admin.user_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admin.users(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    is_important BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. CONTENT MODERATION
-- ==============================================

CREATE TABLE admin.flagged_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN (
        'car_listing',
        'rental_listing',
        'tire_listing',
        'forum_post',
        'forum_comment',
        'message',
        'user_profile'
    )),
    content_id UUID NOT NULL,
    reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'spam',
        'inappropriate',
        'scam',
        'harassment',
        'fake',
        'other'
    )),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',
        'in_review',
        'actioned',
        'dismissed'
    )),
    priority TEXT DEFAULT 'medium' CHECK (priority IN (
        'low',
        'medium',
        'high',
        'urgent'
    )),
    reviewed_by UUID REFERENCES admin.users(id) ON DELETE SET NULL,
    review_notes TEXT,
    action_taken TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE admin.listing_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL,
    listing_type TEXT NOT NULL CHECK (listing_type IN (
        'car_sale',
        'car_rental',
        'tire_battery',
        'part_accessory'
    )),
    action TEXT NOT NULL CHECK (action IN (
        'approve',
        'reject',
        'remove',
        'feature',
        'unfeature',
        'flag'
    )),
    reason TEXT,
    admin_id UUID REFERENCES admin.users(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 4. SUPPORT SYSTEM
-- ==============================================

CREATE TABLE admin.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'technical',
        'billing',
        'account',
        'listing',
        'service_provider',
        'payment',
        'other'
    )),
    status TEXT DEFAULT 'open' CHECK (status IN (
        'open',
        'in_progress',
        'waiting_user',
        'waiting_admin',
        'resolved',
        'closed'
    )),
    priority TEXT DEFAULT 'medium' CHECK (priority IN (
        'low',
        'medium',
        'high',
        'urgent'
    )),
    assigned_to UUID REFERENCES admin.users(id) ON DELETE SET NULL,
    first_response_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE admin.support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES admin.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
    message TEXT NOT NULL,
    attachments JSONB,
    is_internal BOOLEAN DEFAULT false, -- Internal admin notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 5. NOTIFICATIONS & BROADCASTS
-- ==============================================

CREATE TABLE admin.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN (
        'all',
        'premium_users',
        'free_users',
        'sellers',
        'buyers',
        'service_providers',
        'segment',
        'individual'
    )),
    target_criteria JSONB, -- For segment targeting
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES admin.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft',
        'scheduled',
        'sending',
        'sent',
        'cancelled',
        'failed'
    )),
    total_recipients INTEGER,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE admin.notification_delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES admin.notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    opened_at TIMESTAMP WITH TIME ZONE,
    device_token TEXT,
    status TEXT DEFAULT 'delivered' CHECK (status IN (
        'pending',
        'delivered',
        'failed',
        'opened'
    ))
);

-- ==============================================
-- 6. PROVIDER VERIFICATION
-- ==============================================

CREATE TABLE admin.provider_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN (
        'business_license',
        'insurance',
        'background_check',
        'certifications',
        'identity'
    )),
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',
        'under_review',
        'verified',
        'rejected',
        'expired'
    )),
    documents JSONB, -- Array of document URLs
    verified_by UUID REFERENCES admin.users(id) ON DELETE SET NULL,
    notes TEXT,
    rejection_reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);

-- ==============================================
-- 7. APP CONFIGURATION
-- ==============================================

CREATE TABLE admin.app_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    data_type TEXT NOT NULL CHECK (data_type IN (
        'string',
        'number',
        'boolean',
        'object',
        'array'
    )),
    category TEXT NOT NULL, -- 'subscription', 'listing', 'general', etc.
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- Can mobile app access?
    updated_by UUID REFERENCES admin.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature flags
CREATE TABLE admin.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT false,
    description TEXT,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_users JSONB, -- Specific user IDs or segments
    updated_by UUID REFERENCES admin.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 8. ANALYTICS & REPORTS
-- ==============================================

CREATE TABLE admin.saved_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    report_type TEXT NOT NULL,
    filters JSONB,
    columns JSONB,
    created_by UUID REFERENCES admin.users(id) ON DELETE CASCADE,
    is_scheduled BOOLEAN DEFAULT false,
    schedule_cron TEXT, -- Cron expression for scheduled reports
    recipients TEXT[], -- Email addresses
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_run_at TIMESTAMP WITH TIME ZONE
);

-- ==============================================
-- 9. INDEXES
-- ==============================================

-- Admin users
CREATE INDEX idx_admin_users_email ON admin.users(email);
CREATE INDEX idx_admin_users_role ON admin.users(role);
CREATE INDEX idx_admin_users_active ON admin.users(is_active);

-- Activity log
CREATE INDEX idx_admin_activity_log_admin ON admin.activity_log(admin_id);
CREATE INDEX idx_admin_activity_log_resource ON admin.activity_log(resource_type, resource_id);
CREATE INDEX idx_admin_activity_log_created ON admin.activity_log(created_at DESC);

-- User moderation
CREATE INDEX idx_user_moderation_user ON admin.user_moderation(user_id);
CREATE INDEX idx_user_moderation_admin ON admin.user_moderation(admin_id);
CREATE INDEX idx_user_moderation_created ON admin.user_moderation(created_at DESC);

-- Flagged content
CREATE INDEX idx_flagged_content_type_id ON admin.flagged_content(content_type, content_id);
CREATE INDEX idx_flagged_content_status ON admin.flagged_content(status);
CREATE INDEX idx_flagged_content_priority ON admin.flagged_content(priority);
CREATE INDEX idx_flagged_content_created ON admin.flagged_content(created_at DESC);

-- Support tickets
CREATE INDEX idx_support_tickets_number ON admin.support_tickets(ticket_number);
CREATE INDEX idx_support_tickets_user ON admin.support_tickets(user_id);
CREATE INDEX idx_support_tickets_assigned ON admin.support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_status ON admin.support_tickets(status);
CREATE INDEX idx_support_tickets_created ON admin.support_tickets(created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_status ON admin.notifications(status);
CREATE INDEX idx_notifications_scheduled ON admin.notifications(scheduled_at);
CREATE INDEX idx_notifications_created ON admin.notifications(created_at DESC);

-- ==============================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all admin tables
ALTER TABLE admin.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.user_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.flagged_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.listing_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.notification_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.provider_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.saved_reports ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION admin.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM admin.users
        WHERE user_id = auth.uid()
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get admin role
CREATE OR REPLACE FUNCTION admin.get_admin_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role
        FROM admin.users
        WHERE user_id = auth.uid()
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
-- Admin users table - only admins can access
CREATE POLICY "Admins can view admin users" ON admin.users
    FOR SELECT USING (admin.is_admin());

CREATE POLICY "Super admins can manage admin users" ON admin.users
    FOR ALL USING (admin.get_admin_role() = 'super_admin');

-- Activity log - all admins can view, system can insert
CREATE POLICY "Admins can view activity log" ON admin.activity_log
    FOR SELECT USING (admin.is_admin());

CREATE POLICY "System can insert activity log" ON admin.activity_log
    FOR INSERT WITH CHECK (true);

-- Other tables - admins can manage based on role
CREATE POLICY "Admins can manage user moderation" ON admin.user_moderation
    FOR ALL USING (admin.is_admin());

CREATE POLICY "Admins can manage user notes" ON admin.user_notes
    FOR ALL USING (admin.is_admin());

CREATE POLICY "Admins can manage flagged content" ON admin.flagged_content
    FOR ALL USING (admin.is_admin());

CREATE POLICY "Admins can manage listing moderation" ON admin.listing_moderation
    FOR ALL USING (admin.is_admin());

CREATE POLICY "Admins can manage support tickets" ON admin.support_tickets
    FOR ALL USING (admin.is_admin());

CREATE POLICY "Admins can manage support messages" ON admin.support_ticket_messages
    FOR ALL USING (admin.is_admin());

CREATE POLICY "Admins can manage notifications" ON admin.notifications
    FOR ALL USING (admin.is_admin());

CREATE POLICY "Admins can view notification delivery" ON admin.notification_delivery
    FOR SELECT USING (admin.is_admin());

CREATE POLICY "Admins can manage provider verification" ON admin.provider_verification
    FOR ALL USING (admin.is_admin());

CREATE POLICY "Admins can manage app config" ON admin.app_config
    FOR ALL USING (admin.is_admin());

CREATE POLICY "Admins can manage feature flags" ON admin.feature_flags
    FOR ALL USING (admin.is_admin());

CREATE POLICY "Admins can manage saved reports" ON admin.saved_reports
    FOR ALL USING (admin.is_admin());

-- ==============================================
-- 11. TRIGGERS
-- ==============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION admin.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin.users
    FOR EACH ROW
    EXECUTE FUNCTION admin.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON admin.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION admin.update_updated_at_column();

CREATE TRIGGER update_app_config_updated_at
    BEFORE UPDATE ON admin.app_config
    FOR EACH ROW
    EXECUTE FUNCTION admin.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON admin.feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION admin.update_updated_at_column();

-- Generate ticket number
CREATE OR REPLACE FUNCTION admin.generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number = 'TICKET-' || LPAD(nextval('admin.support_ticket_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE admin.support_ticket_number_seq;

CREATE TRIGGER generate_support_ticket_number
    BEFORE INSERT ON admin.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION admin.generate_ticket_number();

-- ==============================================
-- 12. VIEWS FOR ANALYTICS
-- ==============================================

-- Platform statistics
CREATE VIEW admin.platform_stats AS
SELECT
    (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
    (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d,
    (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30d,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM cars WHERE status = 'active') as active_car_listings,
    (SELECT COUNT(*) FROM rental_cars WHERE status = 'active') as active_rental_listings,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND plan_id = 'starter') as starter_subs,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND plan_id = 'growth') as growth_subs,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND plan_id = 'enterprise') as enterprise_subs,
    (SELECT COALESCE(SUM(amount), 0) FROM payment_transactions WHERE created_at > NOW() - INTERVAL '24 hours' AND status = 'success') as revenue_24h,
    (SELECT COALESCE(SUM(amount), 0) FROM payment_transactions WHERE created_at > NOW() - INTERVAL '7 days' AND status = 'success') as revenue_7d,
    (SELECT COALESCE(SUM(amount), 0) FROM payment_transactions WHERE created_at > NOW() - INTERVAL '30 days' AND status = 'success') as revenue_30d,
    (SELECT COUNT(*) FROM emergency_requests WHERE status = 'pending') as pending_emergency_requests,
    (SELECT COUNT(*) FROM conversations WHERE last_message_at > NOW() - INTERVAL '24 hours') as active_conversations_24h,
    (SELECT COUNT(*) FROM admin.flagged_content WHERE status = 'pending') as pending_flags,
    (SELECT COUNT(*) FROM admin.support_tickets WHERE status IN ('open', 'in_progress')) as open_tickets;

-- User growth trend (last 30 days)
CREATE VIEW admin.user_growth_30d AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as new_users
FROM auth.users
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Revenue trend (last 30 days)
CREATE VIEW admin.revenue_trend_30d AS
SELECT
    DATE(created_at) as date,
    COALESCE(SUM(amount), 0) as revenue,
    COUNT(*) as transaction_count
FROM payment_transactions
WHERE created_at > NOW() - INTERVAL '30 days'
AND status = 'success'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ==============================================
-- 13. INITIAL DATA
-- ==============================================

-- Insert default app configurations
INSERT INTO admin.app_config (config_key, config_value, data_type, category, description, is_public) VALUES
('subscription.starter.price', '14.99', 'number', 'subscription', 'Starter plan monthly price', true),
('subscription.growth.price', '29.99', 'number', 'subscription', 'Growth plan monthly price', true),
('subscription.enterprise.price', '79.99', 'number', 'subscription', 'Enterprise plan monthly price', true),
('listing.free_user_limit', '5', 'number', 'listing', 'Max listings for free users', true),
('listing.premium_user_limit', '-1', 'number', 'listing', 'Max listings for premium users (-1 = unlimited)', true),
('emergency.default_radius_km', '50', 'number', 'emergency', 'Default service provider search radius', true),
('emergency.max_radius_km', '200', 'number', 'emergency', 'Maximum service provider search radius', true),
('messaging.max_message_length', '1000', 'number', 'messaging', 'Maximum message length', true);

-- Insert default feature flags
INSERT INTO admin.feature_flags (flag_key, is_enabled, description) VALUES
('messaging_enabled', true, 'Enable/disable messaging system'),
('forum_enabled', true, 'Enable/disable forum'),
('emergency_services_enabled', true, 'Enable/disable emergency services'),
('new_user_registration', true, 'Allow new user registrations'),
('maintenance_mode', false, 'Put app in maintenance mode');

-- Grant permissions
GRANT USAGE ON SCHEMA admin TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA admin TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA admin TO authenticated;
```

### 2.2 Migration Strategy

**For Production Deployment:**
1. Create admin schema
2. Create all tables
3. Set up indexes
4. Enable RLS and create policies
5. Create triggers
6. Create views
7. Insert default data
8. Create first super admin user
9. Test admin authentication
10. Verify RLS policies

---

## 3. API Design

### 3.1 Supabase Client Configuration

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Admin-specific client with service role (server-side only)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

### 3.2 Type Generation

```bash
# Generate TypeScript types from database
npx supabase gen types typescript --project-id <project-id> > types/database.types.ts
```

### 3.3 API Hooks Examples

```typescript
// hooks/useAdminStats.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin.platform_stats')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// hooks/useUsers.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

interface UserFilters {
  search?: string;
  subscriptionTier?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useUsers(filters: UserFilters, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['admin', 'users', filters, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('*, subscriptions(*)', { count: 'exact' })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,username.ilike.%${filters.search}%`);
      }

      if (filters.subscriptionTier) {
        query = query.eq('subscriptions.plan_id', filters.subscriptionTier);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return { users: data, total: count };
    },
  });
}

// hooks/useFlaggedContent.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useFlaggedContent(status = 'pending') {
  return useQuery({
    queryKey: ['admin', 'flagged-content', status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin.flagged_content')
        .select('*, reported_by:users(*)')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useReviewFlaggedContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      flagId,
      action,
      notes,
    }: {
      flagId: string;
      action: 'actioned' | 'dismissed';
      notes: string;
    }) => {
      const { data: adminUser } = await supabase
        .from('admin.users')
        .select('id')
        .single();

      const { error } = await supabase
        .from('admin.flagged_content')
        .update({
          status: action,
          review_notes: notes,
          reviewed_by: adminUser?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', flagId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flagged-content'] });
    },
  });
}
```

---

## 4. Frontend Architecture

### 4.1 Project Structure

```
admin-portal/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── listings/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── subscriptions/
│   │   │   └── page.tsx
│   │   ├── providers/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/                      # API routes
│   │   └── admin/
│   │       └── [...routes]/
│   │           └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── dashboard/
│   │   ├── stats-card.tsx
│   │   ├── recent-activity.tsx
│   │   └── charts/
│   ├── users/
│   │   ├── user-table.tsx
│   │   ├── user-details.tsx
│   │   └── user-actions.tsx
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── breadcrumbs.tsx
│   └── shared/
│       ├── data-table.tsx
│       └── search-filter.tsx
├── hooks/                        # Custom hooks
│   ├── useAdminAuth.ts
│   ├── useAdminStats.ts
│   └── useUsers.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── utils.ts
├── stores/                       # Zustand stores
│   ├── authStore.ts
│   └── uiStore.ts
├── types/
│   ├── database.types.ts
│   └── index.ts
├── middleware.ts                 # Auth middleware
└── package.json
```

### 4.2 Key Components

**Dashboard Layout:**
```typescript
// components/layout/dashboard-layout.tsx
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Breadcrumbs } from './breadcrumbs';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Data Table Component:**
```typescript
// components/shared/data-table.tsx
import { useReactTable, ColumnDef } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    // ... table config
  });

  return (
    <div>
      <Table>
        {/* Table implementation */}
      </Table>
      {pagination && <Pagination {...pagination} />}
    </div>
  );
}
```

---

## 5. Authentication & Authorization

### 5.1 Admin Authentication Flow

```typescript
// hooks/useAdminAuth.ts
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export function useAdminAuth() {
  const router = useRouter();
  const { user, role, setUser, setRole, clearAuth } = useAuthStore();

  useEffect(() => {
    // Check session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        clearAuth();
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('admin.users')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      clearAuth();
      router.push('/login');
      return;
    }

    setUser(data);
    setRole(data.role);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearAuth();
    router.push('/login');
  };

  return { user, role, signIn, signOut };
}
```

### 5.2 Route Protection

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if no session
  if (!session && !req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Check if user is admin
  if (session) {
    const { data: adminUser } = await supabase
      .from('admin.users')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser && !req.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 6. Real-time Features

### 6.1 Real-time Dashboard Updates

```typescript
// hooks/useRealtimeStats.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useRealtimeStats() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to new users
    const usersChannel = supabase
      .channel('admin-users')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'auth',
          table: 'users',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        }
      )
      .subscribe();

    // Subscribe to new subscriptions
    const subsChannel = supabase
      .channel('admin-subscriptions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        }
      )
      .subscribe();

    return () => {
      usersChannel.unsubscribe();
      subsChannel.unsubscribe();
    };
  }, [queryClient]);
}
```

---

## 7. Testing Strategy

### 7.1 Unit Tests (Jest + React Testing Library)

```typescript
// __tests__/components/UserTable.test.tsx
import { render, screen } from '@testing-library/react';
import { UserTable } from '@/components/users/user-table';

describe('UserTable', () => {
  it('renders user data correctly', () => {
    const users = [
      { id: '1', email: 'user@test.com', created_at: '2025-01-01' },
    ];

    render(<UserTable users={users} />);

    expect(screen.getByText('user@test.com')).toBeInTheDocument();
  });
});
```

### 7.2 Integration Tests

```typescript
// __tests__/integration/auth.test.ts
import { supabase } from '@/lib/supabase/client';

describe('Admin Authentication', () => {
  it('should authenticate admin user', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@mrcars.com',
      password: 'test-password',
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
  });
});
```

---

## 8. Deployment

### 8.1 Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://admin.mrcars.com
```

### 8.2 Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 8.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy Admin Portal

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 9. Performance Optimization

### 9.1 Caching Strategy

```typescript
// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### 9.2 Code Splitting

```typescript
// Dynamic imports for heavy components
const UserDetails = dynamic(() => import('@/components/users/user-details'), {
  loading: () => <Spinner />,
});

const Analytics = dynamic(() => import('@/components/analytics/dashboard'), {
  ssr: false,
});
```

---

## 10. Monitoring & Logging

### 10.1 Error Tracking (Sentry)

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 10.2 Analytics (PostHog)

```typescript
// lib/posthog.ts
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: 'https://app.posthog.com',
  });
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-08
**Status:** Technical Specification
