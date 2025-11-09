# Database Fix Instructions

## Problem
The admin dashboard is trying to query tables that don't exist yet:
- `user_subscriptions`
- `payment_transactions`
- `payment_gateways`
- `service_providers`
- `bank_accounts`
- `user_flags`
- `profiles`

## Solution
Run the `FINAL_FIX.sql` file which safely creates all missing tables and columns.

## Steps to Fix

### 1. Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"

### 2. Run FINAL_FIX.sql
1. Open the `FINAL_FIX.sql` file from this project
2. Copy ALL the contents
3. Paste into the SQL Editor
4. Click "Run" button

### 3. Verify Success
You should see a success message showing:
```
Tables fixed! All missing columns and tables created successfully.
```

Plus counts of:
- payment_gateways_count: 3 (or more)
- subscription_plans_count: (your existing count)

### 4. Create Your Admin Profile

After the tables are created, you need to create an admin profile for yourself.

**First, get your user ID:**
1. In Supabase, go to "Authentication" > "Users"
2. Find your user account
3. Copy your User ID (UUID format)

**Then, create your admin profile:**
1. Go back to SQL Editor
2. Run this query (replace `YOUR_USER_ID` with your actual ID):

```sql
-- Create admin profile (replace YOUR_USER_ID with your actual user ID)
INSERT INTO profiles (id, username, full_name, role, is_verified)
VALUES (
  'YOUR_USER_ID',
  'admin',
  'System Administrator',
  'super_admin',
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  is_verified = true;
```

### 5. Test the Dashboard

Now refresh your admin dashboard and all features should work:
- ✅ Subscriptions page (shows user subscriptions)
- ✅ Payment verification page (shows payment transactions)
- ✅ Service providers page (shows service provider applications)
- ✅ Security page (shows user flags and security logs)
- ✅ Messages page (shows conversations with context)

## What This Fix Does

### Tables Created (if missing):
1. **profiles** - User profile information with roles
2. **payment_gateways** - Payment methods (EcoCash, Bank Transfer, Cash)
3. **payment_transactions** - All payment records
4. **user_subscriptions** - User subscription records
5. **service_providers** - Service provider applications
6. **bank_accounts** - Bank account details for payments
7. **user_flags** - User security flags and restrictions

### Columns Added (if missing):
- `subscription_plans.sort_order` - For ordering plans
- `conversations.reference_type` - For linking conversations to items
- `conversations.reference_id` - For linking conversations to items
- `conversations.status` - For conversation status (active/archived/blocked)
- `security_logs.conversation_id` - For tracking conversation security events

### Indexes Created:
- Performance indexes on all foreign keys and frequently queried columns

### Initial Data:
- 3 payment gateways (Bank Transfer, EcoCash, Cash Payment)

## Troubleshooting

### If you get "relation already exists" errors:
This is normal and safe - the script uses `CREATE TABLE IF NOT EXISTS` so it won't break existing tables.

### If you get "column already exists" errors:
This is also safe - the script checks if columns exist before adding them.

### If payment_gateways is empty:
The script automatically inserts 3 default payment gateways. You can verify by running:
```sql
SELECT * FROM payment_gateways;
```

## Next Steps After Fix

Once the database is fixed and working:
1. Test all admin dashboard features
2. We'll do a final git commit with all changes
3. Deploy to Vercel
4. Configure CORS in Supabase for your Vercel domain
