# Database Setup Guide

## 🚨 Current Issue

Your admin dashboard is showing errors because the database tables don't exist yet:
```
column subscription_plans.sort_order does not exist
```

The database schema needs to be created in your Supabase project.

---

## ✅ Solution: Run the Database Migration

You have a complete SQL migration file at:
`supabase/migrations/20250311000000_add_admin_features.sql`

This will create all the necessary tables for:
- ✅ Service Providers (mechanics, towing, etc.)
- ✅ Subscription Plans (Free, Gold Plus, Premium)
- ✅ User Subscriptions
- ✅ Payment Transactions & Gateways
- ✅ Bank Accounts
- ✅ Messaging System (conversations, messages)
- ✅ Analytics Tracking
- ✅ Security Logs
- ✅ User Flagging (for deal detection)

---

## 🚀 Method 1: Run via Supabase Dashboard (EASIEST)

### **Step 1: Open SQL Editor**
👉 https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud/sql/new

### **Step 2: Copy the Migration SQL**

Open the file: `supabase/migrations/20250311000000_add_admin_features.sql`

Copy ALL the content (it's a big file - 582 lines)

### **Step 3: Paste and Run**

1. Paste the entire SQL into the Supabase SQL Editor
2. Click **"Run"** button at the bottom
3. Wait for completion (should take 5-10 seconds)
4. You should see: **"Success. No rows returned"**

---

## 🚀 Method 2: Run via Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref fmaxqpvwjpnzwraprrud

# Run migrations
supabase db push
```

---

## ✅ Verify Database Setup

After running the migration, verify the tables were created:

### **Check in Supabase Dashboard:**
👉 https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud/editor

You should see these tables:
- ✅ `subscription_plans`
- ✅ `user_subscriptions`
- ✅ `service_providers`
- ✅ `service_provider_reviews`
- ✅ `payment_transactions`
- ✅ `payment_gateways`
- ✅ `bank_accounts`
- ✅ `conversations`
- ✅ `messages`
- ✅ `platform_analytics`
- ✅ `section_analytics`
- ✅ `item_analytics`
- ✅ `item_views`
- ✅ `security_logs`
- ✅ `blocked_ips`
- ✅ `user_sessions`

---

## 📊 Initial Data Included

The migration automatically creates:

### **Subscription Plans:**
1. **Basic** - $0/month (5 listings, basic support)
2. **Gold Plus** - $29.99/month (unlimited listings, priority support, featured placement)
3. **Premium** - $99.99/month (everything + API access, custom branding)

### **Payment Gateways:**
1. **Bank Transfer** - Manual payment
2. **EcoCash** - Mobile money (Zimbabwe)
3. **Cash Payment** - In-person payment

---

## 🔐 Additional Setup: User Flagging Tables

The migration file doesn't include the user flagging tables yet. You need to add them separately.

### **Create User Flagging Tables:**

Run this SQL in Supabase SQL Editor:

```sql
-- User Flags Table (for evasion detection)
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

-- Enable RLS
ALTER TABLE user_flags ENABLE ROW LEVEL SECURITY;

-- Admins can view all flags
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

-- Admins can manage flags
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

-- Update security_logs to include conversation_id
ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;

-- Create index for evasion lookups
CREATE INDEX IF NOT EXISTS idx_security_logs_conversation ON security_logs(conversation_id, event_type);
CREATE INDEX IF NOT EXISTS idx_user_flags_user ON user_flags(user_id);

-- Update trigger
CREATE TRIGGER update_user_flags_updated_at
BEFORE UPDATE ON user_flags
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔧 Additional Requirements: Profiles Table

The RLS policies reference a `profiles` table that may not exist. You need to create it:

```sql
-- Profiles table (user metadata)
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

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Update trigger
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## 📋 Complete Setup Checklist

Run these SQL queries in order:

### **1. Main Migration** (REQUIRED)
```bash
File: supabase/migrations/20250311000000_add_admin_features.sql
```
Copy and paste the ENTIRE file into SQL Editor and run it.

### **2. Profiles Table** (REQUIRED)
```sql
-- Copy the Profiles SQL from above
```

### **3. User Flagging Tables** (REQUIRED)
```sql
-- Copy the User Flags SQL from above
```

### **4. Create Your Admin Profile** (REQUIRED)
After creating your admin user, give yourself admin privileges:

```sql
-- Replace 'your-user-id-here' with your actual user ID
INSERT INTO profiles (id, username, full_name, role)
VALUES (
  'your-user-id-here',
  'admin',
  'System Administrator',
  'super_admin'
)
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin';
```

To find your user ID:
1. Go to https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud/auth/users
2. Click on your admin user
3. Copy the ID shown at the top

---

## 🎯 After Database Setup

Once all tables are created:

1. **Refresh your admin dashboard**: https://mr-cars-admin.vercel.app/dashboard
2. The errors should be gone
3. You should see:
   - Subscription plans listed
   - Empty payment verification queue
   - Empty service providers list
   - Empty messages list
   - Stats showing 0s (normal for new database)

---

## 🆘 Troubleshooting

### Error: "function update_updated_at_column() does not exist"

This function needs to be created first:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Error: "relation 'profiles' does not exist"

Run the Profiles Table SQL from above.

### Error: Permission denied

Make sure you're logged into Supabase with an account that has admin access to the project.

---

## 📚 Reference

**Supabase Dashboard Links:**
- SQL Editor: https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud/sql/new
- Table Editor: https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud/editor
- Auth Users: https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud/auth/users

---

**Next Steps:**
1. ✅ Run main migration SQL
2. ✅ Create profiles table
3. ✅ Create user_flags table
4. ✅ Set yourself as super_admin
5. ✅ Refresh admin dashboard
6. ✅ Start managing your platform!

---

**Last Updated**: November 9, 2025
**Status**: Ready to Execute
