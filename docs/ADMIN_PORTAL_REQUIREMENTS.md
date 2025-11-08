# Mr Cars Admin Portal - Requirements Documentation

## Executive Summary

The Mr Cars Admin Portal is a web-based management system that connects to the same Supabase backend as the mobile app. It provides comprehensive tools for staff to manage, administer, and regulate all aspects of the Mr Cars platform.

**Technology Stack:**
- Frontend: React.js or Next.js with TypeScript
- Backend: Supabase (shared with mobile app)
- Authentication: Supabase Auth with admin role enforcement
- Real-time: Supabase Realtime for live updates
- Styling: Tailwind CSS + shadcn/ui components

---

## 1. Admin Authentication & Access Control

### 1.1 Admin User Management
**Purpose:** Secure access control for Mr Cars staff

**Features:**
- Admin-only authentication system
- Role-based access control (RBAC)
  - Super Admin (full access)
  - Content Moderator (listings, forum)
  - Support Agent (messaging, tickets)
  - Finance Manager (payments, subscriptions)
  - Analytics Viewer (read-only analytics)

**Database Schema:**
```sql
-- New table for admin users
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'moderator', 'support', 'finance', 'analytics')),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin activity log
CREATE TABLE admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Functionality:**
- [ ] Admin login with 2FA
- [ ] Session management
- [ ] Activity logging
- [ ] Password reset for admins
- [ ] Admin user creation/deactivation

---

## 2. Dashboard & Analytics

### 2.1 Main Dashboard
**Purpose:** Real-time overview of platform health and metrics

**Widgets:**
1. **Platform Statistics**
   - Total users (active vs inactive)
   - Total listings (by category: sale, rental, parts)
   - Active subscriptions (by tier)
   - Revenue (daily, weekly, monthly)

2. **Real-time Activity**
   - Recent user registrations
   - New listings posted
   - Active conversations
   - Emergency requests pending
   - Payment transactions

3. **Performance Metrics**
   - User growth chart (last 30 days)
   - Revenue trends
   - Conversion rates (free to premium)
   - Most viewed listings

4. **Alerts & Notifications**
   - Flagged content requiring moderation
   - Payment failures
   - Service provider complaints
   - System errors

**Database Views Required:**
```sql
-- Platform stats view
CREATE VIEW admin_platform_stats AS
SELECT
    (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
    (SELECT COUNT(*) FROM cars WHERE status = 'active') as active_listings,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
    (SELECT SUM(amount) FROM payment_transactions WHERE created_at > NOW() - INTERVAL '30 days') as revenue_30d;

-- Real-time activity feed
CREATE VIEW admin_activity_feed AS
SELECT
    'user_registration' as type,
    u.id as resource_id,
    u.email as description,
    u.created_at
FROM auth.users u
WHERE u.created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT
    'new_listing' as type,
    c.id,
    c.make || ' ' || c.model as description,
    c.created_at
FROM cars c
WHERE c.created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 50;
```

### 2.2 Advanced Analytics
**Purpose:** Deep insights into platform performance

**Reports:**
- [ ] User Analytics
  - User demographics
  - User engagement metrics
  - User retention rates
  - Churn analysis

- [ ] Listing Analytics
  - Most viewed categories
  - Average listing duration
  - Conversion rates (views to inquiries)
  - Share analytics

- [ ] Financial Analytics
  - Revenue breakdown by tier
  - Payment method distribution
  - Refund rates
  - Subscription renewal rates

- [ ] Geographic Analytics
  - Users by location
  - Service provider coverage maps
  - Hot zones for emergency requests

**Key Functionality:**
- [ ] Export reports to CSV/PDF
- [ ] Date range filtering
- [ ] Custom report builder
- [ ] Scheduled email reports

---

## 3. User Management

### 3.1 User Directory
**Purpose:** Comprehensive user management interface

**Features:**
- [ ] Searchable user list (by name, email, phone, ID)
- [ ] Advanced filters:
  - Account status (active, suspended, deleted)
  - Subscription tier (free, starter, growth, enterprise)
  - Registration date range
  - User type (buyer, seller, both)
  - Service provider status

**User Details View:**
- Profile information
- Subscription history
- Listing history (all categories)
- Message history
- Payment history
- Emergency requests
- Activity timeline
- Reports/flags against user

### 3.2 User Actions
**Purpose:** Administrative control over user accounts

**Actions:**
- [ ] View full user profile
- [ ] Edit user information
- [ ] Suspend/unsuspend account
- [ ] Delete account (with confirmation)
- [ ] Reset password
- [ ] Refund subscription
- [ ] Add internal notes
- [ ] Send notification to user
- [ ] View login history
- [ ] Export user data (GDPR compliance)

**Database Schema:**
```sql
-- User moderation table
CREATE TABLE user_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    reason TEXT,
    admin_id UUID REFERENCES admin_users(id),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notes (internal)
CREATE TABLE user_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    admin_id UUID REFERENCES admin_users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. Listing Management

### 4.1 All Listings Dashboard
**Purpose:** Centralized listing management across all categories

**Categories:**
- Car Sales
- Car Rentals
- Tires & Batteries
- Parts & Accessories (if implemented)

**Listing List View:**
- [ ] Tabbed interface by category
- [ ] Search by title, make, model, seller
- [ ] Filters:
  - Status (active, pending, expired, flagged)
  - Price range
  - Date posted
  - Seller type (individual, dealer)
  - Has reports/flags

**Listing Details:**
- All listing information
- Image gallery
- Seller information
- View/share analytics
- Inquiry/message count
- Flag/report history

### 4.2 Listing Moderation
**Purpose:** Content quality control

**Features:**
- [ ] Approve/reject pending listings
- [ ] Flag inappropriate content
- [ ] Remove listings (with reason)
- [ ] Edit listing details
- [ ] Feature listing (promoted placement)
- [ ] Hide/unhide listing
- [ ] Add moderation notes

**Database Schema:**
```sql
-- Listing moderation
CREATE TABLE listing_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL,
    listing_type TEXT NOT NULL, -- 'car_sale', 'car_rental', 'tire_battery'
    action TEXT NOT NULL,
    reason TEXT,
    admin_id UUID REFERENCES admin_users(id),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flagged content
CREATE TABLE flagged_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL, -- 'listing', 'forum_post', 'message'
    content_id UUID NOT NULL,
    reported_by UUID REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'actioned', 'dismissed'
    reviewed_by UUID REFERENCES admin_users(id),
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);
```

### 4.3 Featured Listings
**Purpose:** Manage promoted content

**Features:**
- [ ] Set featured status
- [ ] Configure featured duration
- [ ] Feature pricing management
- [ ] Featured listings rotation
- [ ] Analytics on featured performance

---

## 5. Subscription & Payment Management

### 5.1 Subscription Dashboard
**Purpose:** Monitor and manage Gold Plus subscriptions

**Features:**
- [ ] Active subscriptions list
- [ ] Filter by plan (Starter, Growth, Enterprise)
- [ ] Filter by status (active, cancelled, expired, past_due)
- [ ] Search by user
- [ ] Upcoming renewals
- [ ] Failed payments

**Subscription Details:**
- User information
- Plan details
- Payment history
- Next billing date
- Cancellation date (if applicable)
- Subscription timeline

### 5.2 Subscription Actions
**Purpose:** Administrative subscription control

**Actions:**
- [ ] Cancel subscription
- [ ] Refund payment
- [ ] Extend subscription
- [ ] Change plan
- [ ] Apply discount/credit
- [ ] Retry failed payment
- [ ] Send renewal reminder

### 5.3 Payment Transactions
**Purpose:** Financial transaction monitoring

**Features:**
- [ ] All transactions list
- [ ] Filter by status (success, failed, pending, refunded)
- [ ] Filter by date range
- [ ] Search by user, transaction ID
- [ ] Export to CSV
- [ ] Refund processing
- [ ] Failed payment analysis

**Transaction Details:**
- Amount
- Payment method
- Stripe transaction ID
- User details
- Subscription/plan
- Status and timestamps
- Refund information (if applicable)

### 5.4 Financial Reports
**Purpose:** Revenue and financial analytics

**Reports:**
- [ ] Revenue by period (daily, weekly, monthly, yearly)
- [ ] Revenue by plan
- [ ] Subscription churn rate
- [ ] Average revenue per user (ARPU)
- [ ] Lifetime value (LTV) calculations
- [ ] Refund rate and reasons
- [ ] Failed payment trends

---

## 6. Service Provider Management

### 6.1 Provider Directory
**Purpose:** Manage emergency service providers

**Features:**
- [ ] All providers list
- [ ] Filter by business type (mechanic, towing, etc.)
- [ ] Filter by status (active, pending, suspended)
- [ ] Search by name, location
- [ ] Map view of provider coverage

**Provider Profile:**
- Business information
- Contact details
- Service radius
- Available hours
- Rating and reviews
- Emergency request history
- Response time analytics
- Verification status

### 6.2 Provider Verification
**Purpose:** Quality assurance for service providers

**Features:**
- [ ] Review provider applications
- [ ] Verify documents (licenses, insurance)
- [ ] Approve/reject applications
- [ ] Request additional information
- [ ] Background check status
- [ ] Certification verification

**Database Schema:**
```sql
-- Provider verification
CREATE TABLE provider_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES service_providers(id),
    verification_type TEXT NOT NULL, -- 'license', 'insurance', 'background_check'
    status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    documents JSONB, -- URLs to uploaded documents
    verified_by UUID REFERENCES admin_users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);
```

### 6.3 Emergency Request Monitoring
**Purpose:** Oversee emergency assistance system

**Features:**
- [ ] All emergency requests dashboard
- [ ] Filter by status (pending, accepted, in_progress, completed, cancelled)
- [ ] Map view of active requests
- [ ] Response time analytics
- [ ] Provider performance metrics
- [ ] User satisfaction ratings

**Request Details:**
- User information
- Location and details
- Assigned provider
- Timeline (created, accepted, completed)
- GPS tracking history
- Communication log
- Rating and review

### 6.4 Provider Performance
**Purpose:** Track and manage provider quality

**Metrics:**
- Average response time
- Acceptance rate
- Completion rate
- Average rating
- Review count
- Revenue generated

**Actions:**
- [ ] Suspend provider
- [ ] Remove provider
- [ ] Adjust service radius
- [ ] Feature provider
- [ ] Send warning/notification

---

## 7. Messaging & Communication

### 7.1 Conversation Monitoring
**Purpose:** Oversee platform communications

**Features:**
- [ ] All conversations list
- [ ] Search by user, car listing
- [ ] Filter by date
- [ ] Flagged conversations
- [ ] View full conversation history
- [ ] Export conversation

### 7.2 Moderation Tools
**Purpose:** Prevent abuse and ensure safety

**Features:**
- [ ] View reported messages
- [ ] Block users from messaging
- [ ] Delete inappropriate messages
- [ ] Send warning to users
- [ ] View message statistics

### 7.3 Support Messaging
**Purpose:** Admin-to-user communication

**Features:**
- [ ] Send message to user
- [ ] Broadcast announcements
- [ ] Support ticket system
- [ ] Canned responses
- [ ] Message templates

**Database Schema:**
```sql
-- Support tickets
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    subject TEXT NOT NULL,
    category TEXT NOT NULL, -- 'technical', 'billing', 'account', 'other'
    status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'waiting_user', 'resolved', 'closed'
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    assigned_to UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Support ticket messages
CREATE TABLE support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id),
    sender_type TEXT NOT NULL, -- 'user', 'admin'
    message TEXT NOT NULL,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 8. Forum Management

### 8.1 Forum Overview
**Purpose:** Moderate community discussions

**Features:**
- [ ] All posts dashboard
- [ ] Filter by category
- [ ] Flagged posts
- [ ] Most active discussions
- [ ] Trending topics

### 8.2 Post Moderation
**Purpose:** Content quality and safety control

**Features:**
- [ ] Approve/reject posts
- [ ] Delete posts/comments
- [ ] Pin important posts
- [ ] Lock discussions
- [ ] Ban users from forum
- [ ] Edit post content

### 8.3 Poll Management
**Purpose:** Oversee community polls

**Features:**
- [ ] View all polls
- [ ] Delete polls
- [ ] View poll results
- [ ] Export poll data
- [ ] Feature polls

---

## 9. Content Management

### 9.1 App Content
**Purpose:** Manage static content in the app

**Features:**
- [ ] Edit Terms & Conditions
- [ ] Edit Privacy Policy
- [ ] Edit About Us
- [ ] Edit FAQ
- [ ] Manage help documentation
- [ ] Update onboarding content

### 9.2 Notifications
**Purpose:** Push notification management

**Features:**
- [ ] Send push notifications
  - To all users
  - To specific user segments
  - To individual users
- [ ] Schedule notifications
- [ ] Notification templates
- [ ] Notification analytics (open rates)

**Database Schema:**
```sql
-- Admin notifications
CREATE TABLE admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'all', 'segment', 'individual'
    target_criteria JSONB, -- For segment targeting
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES admin_users(id),
    status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sent', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification delivery tracking
CREATE TABLE notification_delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES admin_notifications(id),
    user_id UUID REFERENCES auth.users(id),
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    opened_at TIMESTAMP WITH TIME ZONE
);
```

### 9.3 Banners & Promotions
**Purpose:** Manage in-app promotional content

**Features:**
- [ ] Create promotional banners
- [ ] Set banner display rules
- [ ] Schedule banner campaigns
- [ ] Track banner click-through rates
- [ ] A/B testing for banners

---

## 10. Reports & Complaints

### 10.1 User Reports
**Purpose:** Handle user-submitted complaints

**Types:**
- Inappropriate listings
- Scam reports
- Service provider complaints
- User harassment
- Fake accounts

**Features:**
- [ ] Report queue (pending review)
- [ ] Assign to moderator
- [ ] View report details
- [ ] Take action (suspend user, remove content, etc.)
- [ ] Mark as resolved/dismissed
- [ ] Send response to reporter

### 10.2 Fraud Detection
**Purpose:** Identify suspicious activity

**Features:**
- [ ] Duplicate account detection
- [ ] Suspicious listing patterns
- [ ] Payment fraud alerts
- [ ] Unusual activity monitoring
- [ ] IP-based tracking

---

## 11. Settings & Configuration

### 11.1 Platform Settings
**Purpose:** Configure app-wide settings

**Settings:**
- [ ] Subscription plan pricing
- [ ] Listing limits (free vs premium)
- [ ] Service provider radius limits
- [ ] Emergency request timeout settings
- [ ] Payment gateway configuration
- [ ] Commission rates (if applicable)

### 11.2 Feature Toggles
**Purpose:** Enable/disable features remotely

**Features:**
- [ ] Toggle messaging system
- [ ] Toggle forum
- [ ] Toggle emergency services
- [ ] Toggle new user registrations
- [ ] Maintenance mode

**Database Schema:**
```sql
-- App configuration
CREATE TABLE app_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES admin_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 11.3 Email Templates
**Purpose:** Manage automated email communications

**Templates:**
- Welcome email
- Subscription confirmation
- Payment receipt
- Subscription renewal reminder
- Password reset
- Account suspension notice

---

## 12. Audit & Compliance

### 12.1 Audit Logs
**Purpose:** Comprehensive activity tracking

**Logged Actions:**
- All admin actions
- User account changes
- Content modifications
- Payment transactions
- System configuration changes

**Features:**
- [ ] Searchable audit log
- [ ] Filter by admin, action type, date
- [ ] Export audit logs
- [ ] Retention policy management

### 12.2 GDPR Compliance
**Purpose:** Data privacy compliance

**Features:**
- [ ] User data export (on request)
- [ ] User data deletion (on request)
- [ ] Consent management
- [ ] Privacy policy version tracking
- [ ] Data retention policies

---

## 13. Technical Requirements

### 13.1 Database Access
**Shared Supabase Instance:**
- Read/write access to all existing tables
- Admin-specific tables (listed above)
- Real-time subscriptions for live updates
- Row Level Security (RLS) with admin role checks

**RLS Policies Required:**
```sql
-- Example: Only admins can access admin tables
CREATE POLICY "Admin access only" ON admin_users
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users au
        WHERE au.user_id = auth.uid()
        AND au.is_active = true
    )
);
```

### 13.2 API Requirements
**Supabase Functions:**
- All existing mobile app functions
- Additional admin-specific functions:
  - User statistics aggregation
  - Revenue calculations
  - Bulk actions (e.g., bulk user suspension)
  - Report generation

### 13.3 Security Requirements
**Authentication:**
- Separate admin authentication flow
- 2FA mandatory for all admins
- IP whitelisting option
- Session timeout (30 minutes idle)

**Authorization:**
- Role-based access control
- Action-level permissions
- Audit logging for all actions

**Data Protection:**
- Encrypted connections (HTTPS only)
- Sensitive data masking in UI
- Secure credential storage

### 13.4 Performance Requirements
- Dashboard loads in < 2 seconds
- Real-time updates with < 1 second latency
- Support 50+ concurrent admin users
- Export reports in < 10 seconds

---

## 14. UI/UX Requirements

### 14.1 Design System
**Components:**
- Use shadcn/ui component library
- Tailwind CSS for styling
- Consistent with modern admin dashboards
- Dark mode support

**Layout:**
- Sidebar navigation
- Responsive design (desktop, tablet)
- Breadcrumb navigation
- Global search
- Notification center

### 14.2 User Experience
**Key Principles:**
- Minimize clicks to common actions
- Batch operations support
- Keyboard shortcuts
- Quick filters and search
- Contextual help tooltips

### 14.3 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode

---

## 15. Implementation Phases

### Phase 1: MVP (Weeks 1-3)
**Priority Features:**
- [ ] Admin authentication & roles
- [ ] Main dashboard with key metrics
- [ ] User management (view, search, suspend)
- [ ] Listing management (view, approve, remove)
- [ ] Subscription overview
- [ ] Basic audit logging

### Phase 2: Core Management (Weeks 4-6)
**Features:**
- [ ] Advanced analytics
- [ ] Service provider management
- [ ] Payment transaction management
- [ ] Forum moderation
- [ ] Report queue
- [ ] Support ticket system

### Phase 3: Advanced Features (Weeks 7-9)
**Features:**
- [ ] Content management
- [ ] Notification system
- [ ] Advanced reporting
- [ ] Fraud detection
- [ ] Feature toggles
- [ ] Email template management

### Phase 4: Optimization (Weeks 10-12)
**Features:**
- [ ] Performance optimization
- [ ] Advanced search
- [ ] Bulk operations
- [ ] Export functionality
- [ ] API rate limiting
- [ ] Caching strategies

---

## 16. Success Metrics

### 16.1 Admin Efficiency
- Average time to moderate listing: < 2 minutes
- Average time to resolve support ticket: < 24 hours
- Average time to review provider application: < 1 hour

### 16.2 Platform Health
- Flagged content review time: < 4 hours
- Payment failure resolution rate: > 90%
- User complaint response time: < 12 hours

### 16.3 System Performance
- Dashboard load time: < 2 seconds
- Query response time: < 500ms
- Real-time update latency: < 1 second

---

## 17. Maintenance & Support

### 17.1 Documentation
- Admin user guide
- API documentation
- Database schema documentation
- Troubleshooting guide

### 17.2 Training
- Admin onboarding materials
- Video tutorials
- Role-specific training
- Best practices guide

### 17.3 Support
- Admin help center
- Technical support contact
- Feature request process
- Bug reporting system

---

## Appendix A: Database Schema Summary

**New Tables Required:**
1. `admin_users` - Admin account management
2. `admin_activity_log` - Audit trail
3. `user_moderation` - User moderation history
4. `user_notes` - Internal notes on users
5. `listing_moderation` - Listing moderation history
6. `flagged_content` - User-reported content
7. `provider_verification` - Service provider verification
8. `support_tickets` - Support ticket system
9. `support_ticket_messages` - Ticket conversation
10. `admin_notifications` - Push notification management
11. `notification_delivery` - Notification tracking
12. `app_config` - Platform configuration

**Existing Tables to Access:**
- `auth.users` (read/write)
- `cars` (all categories)
- `subscriptions`
- `payment_transactions`
- `service_providers`
- `emergency_requests`
- `conversations`
- `messages`
- `forum_posts`
- `forum_comments`
- `forum_polls`
- All other mobile app tables

---

## Appendix B: API Endpoints Required

**Admin-Specific Endpoints:**
- `POST /admin/auth/login` - Admin login
- `GET /admin/dashboard/stats` - Dashboard statistics
- `GET /admin/users` - User list with filters
- `PUT /admin/users/:id/suspend` - Suspend user
- `GET /admin/listings` - All listings
- `PUT /admin/listings/:id/moderate` - Moderate listing
- `GET /admin/subscriptions` - Subscription list
- `POST /admin/subscriptions/:id/refund` - Process refund
- `GET /admin/providers` - Service provider list
- `PUT /admin/providers/:id/verify` - Verify provider
- `GET /admin/reports` - Flagged content
- `POST /admin/notifications/send` - Send notification
- `GET /admin/analytics/revenue` - Revenue analytics
- `GET /admin/audit-log` - Audit log

---

## Appendix C: Technology Stack Details

**Frontend:**
- React 18+ or Next.js 14+
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Recharts for analytics
- React Query for data fetching
- Zustand for state management

**Backend:**
- Supabase (shared with mobile)
- PostgreSQL (via Supabase)
- Supabase Realtime
- Supabase Edge Functions (if needed)

**Development Tools:**
- ESLint + Prettier
- Husky for git hooks
- Jest for testing
- Storybook for component development

**Deployment:**
- Vercel or Netlify
- CI/CD with GitHub Actions
- Environment-based deployments (staging, production)

---

**Document Version:** 1.0
**Last Updated:** 2025-01-08
**Status:** Draft for Review
**Next Review:** After Mobile App Launch
