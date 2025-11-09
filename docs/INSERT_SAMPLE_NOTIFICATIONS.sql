-- =============================================
-- INSERT SAMPLE NOTIFICATIONS
-- =============================================
-- Run this AFTER creating your admin profile
-- Replace 'YOUR_ADMIN_USER_ID' with your actual user ID
-- =============================================

-- Sample notifications for different types and priorities
INSERT INTO notifications (user_id, title, message, type, read, data, created_at)
VALUES
  -- Unread high priority inquiry
  (
    'YOUR_ADMIN_USER_ID',
    'New Car Inquiry Received',
    'A customer is interested in the 2022 Toyota Camry listing. They have questions about financing options.',
    'inquiry',
    false,
    '{"priority": "high", "related_id": null}'::jsonb,
    now() - interval '5 minutes'
  ),

  -- Unread medium priority order
  (
    'YOUR_ADMIN_USER_ID',
    'New Order Placed',
    'Order #12345 has been placed. Payment pending verification.',
    'order',
    false,
    '{"priority": "medium", "related_id": null}'::jsonb,
    now() - interval '1 hour'
  ),

  -- Unread appointment
  (
    'YOUR_ADMIN_USER_ID',
    'Service Appointment Scheduled',
    'New service appointment scheduled for 2:00 PM today. Customer: John Doe.',
    'appointment',
    false,
    '{"priority": "medium", "related_id": null}'::jsonb,
    now() - interval '3 hours'
  ),

  -- Read user notification
  (
    'YOUR_ADMIN_USER_ID',
    'New User Registration',
    'A new user has registered: sarah.johnson@email.com',
    'user',
    true,
    '{"priority": "low", "related_id": null}'::jsonb,
    now() - interval '1 day'
  ),

  -- Unread high priority system alert
  (
    'YOUR_ADMIN_USER_ID',
    'Payment Gateway Configuration Required',
    'EcoCash payment gateway needs configuration. Please update merchant details.',
    'system',
    false,
    '{"priority": "high", "related_id": null}'::jsonb,
    now() - interval '2 hours'
  ),

  -- Read system notification
  (
    'YOUR_ADMIN_USER_ID',
    'Database Backup Completed',
    'Daily database backup completed successfully at 3:00 AM.',
    'system',
    true,
    '{"priority": "low", "related_id": null}'::jsonb,
    now() - interval '8 hours'
  ),

  -- Unread user flag notification
  (
    'YOUR_ADMIN_USER_ID',
    'User Account Flagged',
    'User account has been flagged for suspicious messaging activity. Review required.',
    'user',
    false,
    '{"priority": "high", "related_id": null}'::jsonb,
    now() - interval '30 minutes'
  ),

  -- Read inquiry
  (
    'YOUR_ADMIN_USER_ID',
    'Inquiry Follow-up Required',
    'Customer inquiry from 2 days ago requires follow-up response.',
    'inquiry',
    true,
    '{"priority": "medium", "related_id": null}'::jsonb,
    now() - interval '2 days'
  ),

  -- Unread service provider verification
  (
    'YOUR_ADMIN_USER_ID',
    'Service Provider Verification Pending',
    'New service provider application awaiting verification: ABC Auto Repairs.',
    'user',
    false,
    '{"priority": "high", "related_id": null}'::jsonb,
    now() - interval '15 minutes'
  ),

  -- Unread subscription expiry warning
  (
    'YOUR_ADMIN_USER_ID',
    'Premium Subscription Expiring Soon',
    'User premium subscription expiring in 3 days. Auto-renewal is disabled.',
    'system',
    false,
    '{"priority": "medium", "related_id": null}'::jsonb,
    now() - interval '4 hours'
  );

-- =============================================
-- SUCCESS!
-- =============================================
SELECT
  'Sample notifications inserted!' as status,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE read = false) as unread_count,
  COUNT(*) FILTER (WHERE data->>'priority' = 'high') as high_priority_count
FROM notifications;
