# Admin Dashboard Complete Setup Guide

## What's Fixed

The notifications page is **already using real data** from the database - it was never using mock data! It queries the `notifications` table in Supabase.

However, the table didn't exist or had the wrong schema. This guide will set everything up properly.

## Step-by-Step Setup

### Step 1: Run Database Setup

1. **Open Supabase SQL Editor:**
   - Go to https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

2. **Run COMPLETE_ADMIN_SETUP.sql:**
   - Open `COMPLETE_ADMIN_SETUP.sql` from your project
   - Copy ALL contents
   - Paste into SQL Editor
   - Click "Run"

3. **Verify Success:**
   You should see:
   ```
   Admin dashboard setup complete! All tables created successfully.
   payment_gateways_count: 3
   notifications_count: 0
   profiles_exists: true
   subscriptions_exists: true
   service_providers_exists: true
   ```

### Step 2: Create Your Admin Profile

1. **Get Your User ID:**
   - In Supabase, go to "Authentication" > "Users"
   - Find your account
   - Copy the User ID (UUID format like: `a1b2c3d4-...`)

2. **Create Admin Profile:**
   Run this SQL (replace `YOUR_USER_ID`):

```sql
INSERT INTO profiles (id, username, full_name, role, is_verified, subscription_tier)
VALUES (
  'YOUR_USER_ID',  -- Replace with your actual user ID
  'admin',
  'System Administrator',
  'super_admin',
  true,
  'premium'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  is_verified = true;
```

### Step 3: Add Sample Notifications (Optional)

To see the notifications page working with real data:

1. Open `INSERT_SAMPLE_NOTIFICATIONS.sql`
2. Find and replace ALL instances of `'YOUR_ADMIN_USER_ID'` with your actual user ID
3. Copy the entire file contents
4. Paste into SQL Editor
5. Click "Run"

This will create 10 sample notifications showing:
- Different types (inquiry, order, appointment, user, system)
- Different priorities (high, medium, low)
- Mix of read and unread notifications
- Various timestamps (just now, minutes ago, hours ago, days ago)

### Step 4: Test the Dashboard

Refresh your admin dashboard and check:

1. **Notifications Page** ✨
   - Should show all sample notifications (if you added them)
   - Real-time updates when new notifications arrive
   - Filter by: All / Unread / Read
   - Mark as read/unread functionality
   - Delete notifications
   - Priority badges (high/medium/low)
   - Time ago formatting

2. **Subscriptions Page**
   - Should load without errors (might be empty)
   - Ready for real subscription data

3. **Payments Page**
   - Should load without errors (might be empty)
   - Shows 3 payment gateways (Bank Transfer, EcoCash, Cash)

4. **Service Providers Page**
   - Should load without errors (might be empty)
   - Ready for service provider applications

5. **Security Page**
   - Should show security logs
   - Ready for user flags

## What Tables Were Created

### Core Admin Tables
1. **profiles** - Extended user data with admin roles
2. **notifications** - Real-time admin notifications ✨
3. **payment_gateways** - Payment methods configuration
4. **payment_transactions** - All payment records
5. **user_subscriptions** - Subscription tracking
6. **service_providers** - Service provider applications
7. **bank_accounts** - Bank account details
8. **user_flags** - User security flags

### Enhanced Existing Tables
- `subscription_plans` - Added `sort_order` column
- `conversations` - Added `reference_type`, `reference_id`, `status` columns
- `security_logs` - Added `conversation_id` column

## Notifications Schema

The notifications table structure:

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID,                    -- Admin who receives the notification
  title TEXT,                       -- Notification title
  message TEXT,                     -- Notification message
  type TEXT,                        -- 'inquiry' | 'order' | 'appointment' | 'user' | 'system'
  read BOOLEAN DEFAULT false,       -- Read status
  data JSONB,                       -- Extra data: { priority: 'high/medium/low', related_id: UUID }
  created_at TIMESTAMPTZ            -- When notification was created
);
```

## How to Create Real Notifications

When events happen in your system, insert notifications like this:

### Example: New User Registration

```sql
INSERT INTO notifications (user_id, title, message, type, read, data)
VALUES (
  'ADMIN_USER_ID',
  'New User Registration',
  'A new user has registered: user@email.com',
  'user',
  false,
  '{"priority": "low"}'::jsonb
);
```

### Example: Payment Needs Verification

```sql
INSERT INTO notifications (user_id, title, message, type, read, data)
VALUES (
  'ADMIN_USER_ID',
  'Payment Verification Required',
  'New payment transaction requires admin verification',
  'order',
  false,
  '{"priority": "high", "related_id": "TRANSACTION_ID"}'::jsonb
);
```

### Example: Service Provider Application

```sql
INSERT INTO notifications (user_id, title, message, type, read, data)
VALUES (
  'ADMIN_USER_ID',
  'Service Provider Verification Pending',
  'New service provider application: ABC Auto Repairs',
  'user',
  false,
  '{"priority": "high", "related_id": "PROVIDER_ID"}'::jsonb
);
```

## Real-time Updates

The notifications page has real-time subscriptions enabled! When a new notification is inserted into the database, the page will automatically update without refreshing.

```typescript
// This is already implemented in the notifications page
const subscription = supabase
  .channel('admin_notifications')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'notifications',
  }, () => {
    loadNotifications(); // Reload when changes occur
  })
  .subscribe();
```

## Integration Points

To integrate notifications with your app events:

### 1. Backend Triggers (Recommended)

Create database triggers that automatically insert notifications:

```sql
-- Example: Trigger on new payment transaction
CREATE OR REPLACE FUNCTION notify_admin_new_payment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT
    id,
    'New Payment Transaction',
    'Payment of $' || NEW.amount || ' requires verification',
    'order',
    jsonb_build_object('priority', 'high', 'related_id', NEW.id)
  FROM profiles
  WHERE role = 'super_admin';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_payment
AFTER INSERT ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION notify_admin_new_payment();
```

### 2. Application Code

Or insert from your application when events occur:

```typescript
// In your Next.js API routes or server actions
await supabase
  .from('notifications')
  .insert({
    user_id: adminUserId,
    title: 'New Service Provider',
    message: `${providerName} has submitted an application`,
    type: 'user',
    data: { priority: 'high', related_id: providerId }
  });
```

## Troubleshooting

### Notifications page shows "No notifications"
- Check that you ran the `INSERT_SAMPLE_NOTIFICATIONS.sql` with your user ID
- Verify notifications exist: `SELECT * FROM notifications;`
- Check the user_id matches your profile ID

### "relation notifications does not exist"
- Run `COMPLETE_ADMIN_SETUP.sql` first
- Check table exists: `SELECT * FROM information_schema.tables WHERE table_name = 'notifications';`

### Real-time updates not working
- Check your Supabase project has Realtime enabled
- Verify the subscription channel is connected (check browser console)

## Next Steps

1. ✅ Run `COMPLETE_ADMIN_SETUP.sql`
2. ✅ Create your admin profile
3. ✅ Add sample notifications (optional)
4. ✅ Test the notifications page
5. 🔄 Integrate notification creation into your app events
6. 🔄 Set up database triggers for automatic notifications
7. 🔄 Customize notification messages and types for your needs

---

**Remember:** The notifications feature is already fully functional - it just needed the database table to exist with the correct schema!
