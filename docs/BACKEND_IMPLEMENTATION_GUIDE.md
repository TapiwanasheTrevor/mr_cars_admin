# Backend Implementation Guide for Web App
## Mr Cars - Mobile Features Parity Documentation

**Date**: November 8, 2025
**Target**: Backend/Web Development Team
**Purpose**: Implement mobile app features on web platform

---

## 📋 Executive Summary

The Mr Cars mobile app has been enhanced with premium subscription features, messaging, service provider network, and analytics. This document provides complete technical specifications for implementing these features on the web application.

### What's New in Mobile App:
1. ✅ **Subscription Tiers System** (Basic, Gold Plus, Premium)
2. ✅ **Real-time Messaging** between users
3. ✅ **Service Provider Network** (mechanics, breakdown services)
4. ✅ **Payment Gateway Integration** (Bank Transfer, M-Pesa, Cash)
5. ✅ **Analytics Dashboard** (Gold Plus+ exclusive)
6. ✅ **Prominent Tier Badges** throughout UI

---

## 🗄️ Database Schema

### Complete Table Structure

All tables are already created in Supabase and ready for web app integration.

#### 1. Subscription Tables

**subscription_plans**
```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,  -- 'Basic', 'Gold Plus', 'Premium'
    description TEXT,
    price DECIMAL(10,2) NOT NULL,  -- 0.00, 29.99, 99.99
    currency TEXT DEFAULT 'USD',
    billing_period TEXT,  -- 'monthly', 'yearly', 'lifetime'

    -- Features
    max_listings INTEGER DEFAULT 5,  -- -1 for unlimited
    has_analytics BOOLEAN DEFAULT false,
    has_priority_support BOOLEAN DEFAULT false,
    has_featured_placement BOOLEAN DEFAULT false,
    has_api_access BOOLEAN DEFAULT false,

    -- Stripe integration
    stripe_price_id TEXT,
    stripe_product_id TEXT,

    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**Current Seed Data:**
```javascript
const plans = [
  {
    name: 'Basic',
    price: 0.00,
    max_listings: 5,
    has_analytics: false,
    billing_period: 'lifetime'
  },
  {
    name: 'Gold Plus',
    price: 29.99,
    max_listings: -1,  // unlimited
    has_analytics: true,
    billing_period: 'monthly'
  },
  {
    name: 'Premium',
    price: 99.99,
    max_listings: -1,  // unlimited
    has_analytics: true,
    billing_period: 'monthly'
  }
];
```

**user_subscriptions**
```sql
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    plan_name TEXT NOT NULL,  -- denormalized for quick access
    status TEXT NOT NULL,  -- 'active', 'cancelled', 'expired', 'past_due', 'trialing'

    -- Billing
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,

    -- Trial
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,

    -- Stripe
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,

    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,

    CONSTRAINT unique_active_user_subscription UNIQUE (user_id, status)
);
```

**subscription_history**
```sql
CREATE TABLE subscription_history (
    id UUID PRIMARY KEY,
    subscription_id UUID REFERENCES subscriptions(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,  -- 'created', 'upgraded', 'downgraded', 'cancelled', 'renewed', 'expired'
    from_plan_id TEXT,
    to_plan_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ
);
```

#### 2. Payment Tables

**payment_gateways**
```sql
CREATE TABLE payment_gateways (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,  -- 'Bank Transfer', 'M-Pesa', 'Cash on Delivery'
    payment_type TEXT NOT NULL,  -- 'bank_transfer', 'mobile_money', 'cash', 'card', 'paypal'
    description TEXT,

    is_active BOOLEAN DEFAULT true,
    requires_verification BOOLEAN DEFAULT false,
    processing_time_hours INTEGER DEFAULT 24,

    instructions TEXT,
    account_details JSONB,  -- { "account_number": "...", "phone": "..." }

    icon_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**Current Seed Data:**
```javascript
const gateways = [
  {
    name: 'Bank Transfer',
    payment_type: 'bank_transfer',
    requires_verification: true,
    processing_time_hours: 48,
    instructions: 'Please transfer to account number: XXXX-XXXX-XXXX'
  },
  {
    name: 'M-Pesa',
    payment_type: 'mobile_money',
    requires_verification: true,
    processing_time_hours: 2,
    instructions: 'Send payment to: 0700-XXX-XXX'
  },
  {
    name: 'Cash on Delivery',
    payment_type: 'cash',
    requires_verification: false,
    processing_time_hours: 0,
    instructions: 'Cash payment accepted'
  }
];
```

**payment_transactions**
```sql
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    subscription_id UUID REFERENCES subscriptions(id),
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_invoice_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL,  -- 'pending', 'succeeded', 'failed', 'refunded'
    payment_method TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ
);
```

**bank_accounts**
```sql
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    gateway_id UUID NOT NULL REFERENCES payment_gateways(id),

    -- Account details
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    bank_name TEXT,
    branch_name TEXT,
    swift_code TEXT,
    routing_number TEXT,

    -- Mobile money specific
    phone_number TEXT,
    provider_name TEXT,  -- 'M-Pesa', 'Airtel Money', etc.

    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

#### 3. Messaging Tables

**conversations**
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    participant1_id UUID NOT NULL REFERENCES auth.users(id),
    participant2_id UUID NOT NULL REFERENCES auth.users(id),
    car_id UUID REFERENCES cars(id),  -- optional link to car listing
    last_message_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,

    CONSTRAINT unique_conversation UNIQUE (participant1_id, participant2_id, car_id)
);
```

**messages**
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    receiver_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',  -- 'text', 'image', 'offer', 'system'
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    metadata JSONB,  -- { "image_url": "...", "offer_amount": 5000 }
    created_at TIMESTAMPTZ
);
```

#### 4. Service Provider Tables

**service_providers**
```sql
CREATE TABLE service_providers (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL,  -- 'mechanic', 'towing', 'breakdown_assistance'
    description TEXT,
    phone_number TEXT,
    email TEXT,
    location TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    service_areas JSONB,  -- ["Nairobi", "Kiambu", ...]
    operating_hours JSONB,  -- { "monday": "08:00-18:00", ... }

    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    verification_documents JSONB,

    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**service_provider_reviews**
```sql
CREATE TABLE service_provider_reviews (
    id UUID PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES service_providers(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    rating INTEGER NOT NULL,  -- 1-5
    review_text TEXT,
    service_type TEXT,
    created_at TIMESTAMPTZ
);
```

**service_provider_notifications**
```sql
CREATE TABLE service_provider_notifications (
    id UUID PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES service_providers(id),
    user_id UUID REFERENCES auth.users(id),
    notification_type TEXT NOT NULL,  -- 'service_request', 'review', 'verification'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ
);
```

#### 5. Analytics Table

**car_shares**
```sql
CREATE TABLE car_shares (
    id UUID PRIMARY KEY,
    car_id UUID NOT NULL REFERENCES cars(id),
    user_id UUID REFERENCES auth.users(id),
    share_method TEXT,  -- 'link', 'whatsapp', 'sms', 'email', 'facebook'
    created_at TIMESTAMPTZ
);
```

---

## 🔐 Row Level Security (RLS) Policies

All tables have RLS enabled. Here are the key policies:

### Subscription Plans
```sql
-- Anyone can view active subscription plans
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
FOR SELECT USING (is_active = true);
```

### User Subscriptions
```sql
-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
FOR UPDATE USING (auth.uid() = user_id);
```

### Payment Gateways
```sql
-- Anyone can view active payment gateways
CREATE POLICY "Anyone can view active payment gateways" ON payment_gateways
FOR SELECT USING (is_active = true);
```

### Messages
```sql
-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON messages
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages" ON messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can update received messages (mark as read)
CREATE POLICY "Users can update received messages" ON messages
FOR UPDATE USING (auth.uid() = receiver_id);
```

### Service Providers
```sql
-- Anyone can view verified, active providers
CREATE POLICY "Anyone can view active providers" ON service_providers
FOR SELECT USING (is_verified = true AND is_active = true);

-- Users can create their own provider profile
CREATE POLICY "Users can create provider profile" ON service_providers
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own provider profile
CREATE POLICY "Users can update their profile" ON service_providers
FOR UPDATE USING (auth.uid() = user_id);
```

---

## 📡 API Endpoints to Implement

### 1. Subscription Endpoints

#### GET /api/subscription-plans
Get all active subscription plans
```javascript
// Response
[
  {
    "id": "uuid",
    "name": "Basic",
    "description": "Free plan with limited features",
    "price": 0.00,
    "currency": "USD",
    "billing_period": "lifetime",
    "max_listings": 5,
    "has_analytics": false,
    "has_priority_support": false,
    "display_order": 1
  },
  {
    "id": "uuid",
    "name": "Gold Plus",
    "description": "Most popular plan with analytics",
    "price": 29.99,
    "currency": "USD",
    "billing_period": "monthly",
    "max_listings": -1,  // unlimited
    "has_analytics": true,
    "has_priority_support": true,
    "display_order": 2
  },
  // ...
]
```

#### GET /api/users/:userId/subscription
Get user's current subscription
```javascript
// Response
{
  "id": "uuid",
  "user_id": "uuid",
  "plan_id": "uuid",
  "plan_name": "Gold Plus",
  "status": "active",
  "current_period_start": "2025-11-01T00:00:00Z",
  "current_period_end": "2025-12-01T00:00:00Z",
  "cancel_at_period_end": false,
  "plan": {
    "name": "Gold Plus",
    "price": 29.99,
    "max_listings": -1,
    "has_analytics": true
  }
}
```

#### POST /api/subscriptions
Create new subscription
```javascript
// Request
{
  "plan_id": "uuid",
  "payment_method_id": "uuid",  // optional for Stripe
  "trial_days": 14  // optional
}

// Response
{
  "id": "uuid",
  "user_id": "uuid",
  "plan_id": "uuid",
  "plan_name": "Gold Plus",
  "status": "trialing",
  "trial_end": "2025-11-22T00:00:00Z",
  "stripe_subscription_id": "sub_xxxxx"
}
```

#### PUT /api/subscriptions/:id/cancel
Cancel subscription
```javascript
// Request
{
  "cancel_at_period_end": true,  // or false for immediate cancellation
  "reason": "Too expensive"  // optional
}

// Response
{
  "id": "uuid",
  "status": "active",
  "cancel_at_period_end": true,
  "cancelled_at": "2025-11-08T10:30:00Z"
}
```

#### PUT /api/subscriptions/:id/upgrade
Upgrade/downgrade subscription
```javascript
// Request
{
  "new_plan_id": "uuid",
  "prorate": true  // optional, default true
}

// Response
{
  "id": "uuid",
  "plan_name": "Premium",
  "status": "active",
  "previous_plan": "Gold Plus",
  "prorated_amount": 70.00
}
```

### 2. Payment Endpoints

#### GET /api/payment-gateways
Get available payment methods
```javascript
// Response
[
  {
    "id": "uuid",
    "name": "Bank Transfer",
    "payment_type": "bank_transfer",
    "description": "Direct bank transfer",
    "is_active": true,
    "requires_verification": true,
    "processing_time_hours": 48,
    "instructions": "Please transfer to account number: XXXX-XXXX-XXXX",
    "display_order": 1
  },
  // ...
]
```

#### POST /api/payment-transactions
Create payment transaction
```javascript
// Request
{
  "subscription_id": "uuid",
  "gateway_id": "uuid",
  "amount": 29.99,
  "currency": "USD",
  "payment_method": "bank_transfer",
  "metadata": {
    "reference_number": "TXN123456",
    "account_number": "1234567890"
  }
}

// Response
{
  "id": "uuid",
  "user_id": "uuid",
  "subscription_id": "uuid",
  "amount": 29.99,
  "status": "pending",
  "payment_method": "bank_transfer",
  "created_at": "2025-11-08T10:30:00Z"
}
```

#### GET /api/users/:userId/payment-transactions
Get user's payment history
```javascript
// Response
[
  {
    "id": "uuid",
    "amount": 29.99,
    "currency": "USD",
    "status": "succeeded",
    "payment_method": "bank_transfer",
    "description": "Gold Plus subscription",
    "created_at": "2025-11-08T10:30:00Z"
  },
  // ...
]
```

#### POST /api/bank-accounts
Save user's bank account details
```javascript
// Request
{
  "gateway_id": "uuid",
  "account_name": "John Doe",
  "account_number": "1234567890",
  "bank_name": "Equity Bank",
  "phone_number": "0712345678",  // for mobile money
  "provider_name": "M-Pesa",  // for mobile money
  "is_default": true
}

// Response
{
  "id": "uuid",
  "user_id": "uuid",
  "account_name": "John Doe",
  "account_number": "****7890",  // masked
  "is_verified": false,
  "created_at": "2025-11-08T10:30:00Z"
}
```

### 3. Messaging Endpoints

#### GET /api/conversations
Get user's conversations
```javascript
// Query params: ?limit=20&offset=0
// Response
[
  {
    "id": "uuid",
    "participant1_id": "uuid",
    "participant2_id": "uuid",
    "car_id": "uuid",  // optional
    "last_message_at": "2025-11-08T10:30:00Z",
    "unread_count": 3,
    "other_user": {
      "id": "uuid",
      "username": "john_doe",
      "avatar_url": "https://..."
    },
    "car": {  // if car_id exists
      "id": "uuid",
      "make": "Toyota",
      "model": "Corolla",
      "year": 2020,
      "thumbnail_url": "https://..."
    },
    "last_message": {
      "content": "Is this still available?",
      "sender_id": "uuid",
      "created_at": "2025-11-08T10:30:00Z"
    }
  },
  // ...
]
```

#### GET /api/conversations/:id/messages
Get messages in conversation
```javascript
// Query params: ?limit=50&before_id=uuid (for pagination)
// Response
[
  {
    "id": "uuid",
    "conversation_id": "uuid",
    "sender_id": "uuid",
    "receiver_id": "uuid",
    "content": "Is this still available?",
    "message_type": "text",
    "is_read": true,
    "read_at": "2025-11-08T10:35:00Z",
    "created_at": "2025-11-08T10:30:00Z",
    "sender": {
      "id": "uuid",
      "username": "john_doe",
      "avatar_url": "https://..."
    }
  },
  // ...
]
```

#### POST /api/messages
Send new message
```javascript
// Request
{
  "receiver_id": "uuid",
  "car_id": "uuid",  // optional, for first message
  "content": "Is this still available?",
  "message_type": "text"  // or 'image', 'offer'
}

// Response
{
  "id": "uuid",
  "conversation_id": "uuid",  // created or existing
  "sender_id": "uuid",
  "receiver_id": "uuid",
  "content": "Is this still available?",
  "message_type": "text",
  "is_read": false,
  "created_at": "2025-11-08T10:30:00Z"
}
```

#### PUT /api/messages/:id/read
Mark message as read
```javascript
// Response
{
  "id": "uuid",
  "is_read": true,
  "read_at": "2025-11-08T10:35:00Z"
}
```

#### PUT /api/conversations/:id/mark-read
Mark all messages in conversation as read
```javascript
// Response
{
  "conversation_id": "uuid",
  "marked_read_count": 5
}
```

### 4. Service Provider Endpoints

#### GET /api/service-providers
Search for service providers
```javascript
// Query params: ?business_type=mechanic&location=Nairobi&latitude=-1.286389&longitude=36.817223&radius=10
// Response
[
  {
    "id": "uuid",
    "business_name": "ABC Motors",
    "business_type": "mechanic",
    "description": "Professional car repair services",
    "phone_number": "0712345678",
    "email": "abc@motors.com",
    "location": "Nairobi, Kenya",
    "latitude": -1.286389,
    "longitude": 36.817223,
    "service_areas": ["Nairobi", "Kiambu"],
    "operating_hours": {
      "monday": "08:00-18:00",
      "tuesday": "08:00-18:00",
      // ...
    },
    "is_verified": true,
    "average_rating": 4.5,
    "total_reviews": 23,
    "distance_km": 2.5  // if lat/lng provided
  },
  // ...
]
```

#### POST /api/service-providers
Register as service provider
```javascript
// Request
{
  "business_name": "ABC Motors",
  "business_type": "mechanic",
  "description": "Professional car repair services",
  "phone_number": "0712345678",
  "email": "abc@motors.com",
  "location": "Nairobi, Kenya",
  "latitude": -1.286389,
  "longitude": 36.817223,
  "service_areas": ["Nairobi", "Kiambu"],
  "operating_hours": {
    "monday": "08:00-18:00",
    "tuesday": "08:00-18:00"
  }
}

// Response
{
  "id": "uuid",
  "user_id": "uuid",
  "business_name": "ABC Motors",
  "is_verified": false,  // requires admin verification
  "is_active": true,
  "created_at": "2025-11-08T10:30:00Z"
}
```

#### POST /api/service-providers/:id/reviews
Add review for service provider
```javascript
// Request
{
  "rating": 5,
  "review_text": "Excellent service! Very professional.",
  "service_type": "engine_repair"
}

// Response
{
  "id": "uuid",
  "provider_id": "uuid",
  "user_id": "uuid",
  "rating": 5,
  "review_text": "Excellent service! Very professional.",
  "created_at": "2025-11-08T10:30:00Z"
}
```

#### GET /api/service-providers/:id/reviews
Get reviews for service provider
```javascript
// Query params: ?limit=20&offset=0
// Response
[
  {
    "id": "uuid",
    "rating": 5,
    "review_text": "Excellent service! Very professional.",
    "service_type": "engine_repair",
    "created_at": "2025-11-08T10:30:00Z",
    "user": {
      "id": "uuid",
      "username": "john_doe",
      "avatar_url": "https://..."
    }
  },
  // ...
]
```

### 5. Analytics Endpoints (Gold Plus+ Only)

#### GET /api/cars/:id/analytics
Get analytics for car listing
```javascript
// Requires: User is owner AND has Gold Plus or Premium subscription
// Response
{
  "car_id": "uuid",
  "total_views": 245,
  "total_shares": 12,
  "total_inquiries": 8,
  "conversion_rate": 3.27,  // (inquiries / views) * 100
  "views_by_date": [
    { "date": "2025-11-01", "count": 23 },
    { "date": "2025-11-02", "count": 31 },
    // ...
  ],
  "shares_by_method": [
    { "method": "whatsapp", "count": 7 },
    { "method": "link", "count": 3 },
    { "method": "facebook", "count": 2 }
  ],
  "top_referrers": [
    { "source": "google", "count": 102 },
    { "source": "facebook", "count": 56 }
  ]
}
```

#### POST /api/cars/:id/share
Track car share
```javascript
// Request
{
  "share_method": "whatsapp"  // or 'link', 'sms', 'email', 'facebook'
}

// Response
{
  "id": "uuid",
  "car_id": "uuid",
  "user_id": "uuid",
  "share_method": "whatsapp",
  "created_at": "2025-11-08T10:30:00Z"
}
```

---

## 🎨 UI Components to Implement

### 1. Subscription Tier Badges

**Component**: `SubscriptionBadge`

Display user's subscription tier prominently on:
- Profile pages
- Car listing cards (seller badge)
- User avatars in comments
- Chat messages

**Badge Styles:**
```css
.subscription-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.subscription-badge.basic {
  background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%);
  color: white;
}

.subscription-badge.gold-plus {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #1F2937;
}

.subscription-badge.premium {
  background: linear-gradient(135deg, #E5E7EB 0%, #9CA3AF 100%);
  color: #1F2937;
}
```

**Icons:**
- Basic: ✓ (verified icon)
- Gold Plus: ⭐ (premium icon)
- Premium: 💎 (diamond icon)

### 2. Subscription Plans Page

**Component**: `SubscriptionPlansGrid`

Display 3 subscription tiers side-by-side with:
- Plan name and description
- Monthly/yearly price
- Feature list with checkmarks
- "Current Plan" badge for active plan
- "Upgrade" or "Subscribe" CTA button

**Features to highlight:**
```javascript
const planFeatures = {
  basic: [
    'Up to 5 active listings',
    'Basic support',
    'Standard listing visibility'
  ],
  goldPlus: [
    'Unlimited listings',
    'Advanced analytics dashboard',
    'Priority support',
    'Featured placement',
    'Gold Plus badge'
  ],
  premium: [
    'Everything in Gold Plus',
    'API access',
    'Dedicated account manager',
    'Premium badge',
    'Early access to new features'
  ]
};
```

### 3. Payment Gateway Selection

**Component**: `PaymentMethodSelector`

Display available payment methods with:
- Gateway icon/logo
- Payment method name
- Processing time
- Verification requirement indicator
- Instructions on selection

### 4. Messaging Interface

**Component**: `ConversationsList` and `ChatWindow`

Implement real-time chat UI with:
- Conversation list (left sidebar on desktop)
- Unread message badges
- Last message preview
- Car thumbnail (if conversation is about a listing)
- Chat window with message bubbles
- Typing indicators (optional)
- Read receipts
- Image/offer message types

### 5. Service Provider Directory

**Component**: `ServiceProviderGrid`

Display service providers with:
- Business name and type
- Star rating (1-5)
- Total reviews count
- Verification badge
- Location and distance
- "Contact" button
- Operating hours

### 6. Analytics Dashboard (Gold Plus+ only)

**Component**: `ListingAnalyticsDashboard`

Show for car owners with Gold Plus or Premium:
- Total views chart (line graph)
- Share distribution (pie chart)
- Inquiry conversion rate
- Top referrers table
- Export data button

**Access Control:**
```javascript
const canViewAnalytics = (user, listing) => {
  const isOwner = user.id === listing.user_id;
  const hasPremium = ['Gold Plus', 'Premium'].includes(user.subscription?.plan_name);
  return isOwner && hasPremium;
};
```

---

## 🔄 Real-time Features (Optional)

### Supabase Realtime Subscriptions

For real-time updates, implement Supabase Realtime subscriptions:

#### Messages
```javascript
// Subscribe to new messages in conversation
const subscription = supabase
  .channel(`conversation:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    // Add new message to UI
    addMessageToChat(payload.new);
  })
  .subscribe();
```

#### Notifications
```javascript
// Subscribe to service provider notifications
const subscription = supabase
  .channel(`provider:${providerId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'service_provider_notifications',
    filter: `provider_id=eq.${providerId}`
  }, (payload) => {
    // Show notification
    showNotification(payload.new);
  })
  .subscribe();
```

---

## 🔧 Business Logic to Implement

### 1. Listing Limit Enforcement

**Check before creating car listing:**
```javascript
async function canCreateListing(userId) {
  // Get user's subscription
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('plan_name, plan:subscription_plans(max_listings)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  // Default to Basic if no subscription
  const maxListings = subscription?.plan?.max_listings ?? 5;

  // -1 means unlimited
  if (maxListings === -1) return true;

  // Count active listings
  const { count } = await supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active');

  return count < maxListings;
}
```

### 2. Analytics Access Control

**Check before showing analytics:**
```javascript
async function canViewAnalytics(userId, carId) {
  // Check ownership
  const { data: car } = await supabase
    .from('cars')
    .select('user_id')
    .eq('id', carId)
    .single();

  if (car.user_id !== userId) return false;

  // Check subscription
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('plan:subscription_plans(has_analytics)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  return subscription?.plan?.has_analytics ?? false;
}
```

### 3. Subscription Upgrade/Downgrade Logic

**Handle plan changes:**
```javascript
async function changeSubscription(userId, newPlanId, prorate = true) {
  // Get current subscription
  const { data: currentSub } = await supabase
    .from('user_subscriptions')
    .select('*, plan:subscription_plans(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  // Get new plan
  const { data: newPlan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', newPlanId)
    .single();

  // Calculate prorated amount if needed
  let proratedAmount = 0;
  if (prorate && currentSub) {
    const remainingDays = getDaysBetween(new Date(), currentSub.current_period_end);
    const totalDays = getDaysBetween(currentSub.current_period_start, currentSub.current_period_end);
    const unusedCredit = (currentSub.plan.price / totalDays) * remainingDays;
    proratedAmount = newPlan.price - unusedCredit;
  }

  // Update subscription (handled by Stripe webhook in production)
  const { data: updatedSub } = await supabase
    .from('user_subscriptions')
    .update({
      plan_id: newPlanId,
      plan_name: newPlan.name,
      updated_at: new Date().toISOString()
    })
    .eq('id', currentSub.id)
    .select()
    .single();

  return {
    subscription: updatedSub,
    prorated_amount: proratedAmount
  };
}
```

### 4. Payment Verification Workflow

**For manual payment methods (Bank Transfer, M-Pesa):**
```javascript
async function submitPaymentProof(userId, transactionId, proofData) {
  // Update transaction with proof
  const { data: transaction } = await supabase
    .from('payment_transactions')
    .update({
      status: 'pending',
      metadata: {
        ...proofData,
        submitted_at: new Date().toISOString()
      }
    })
    .eq('id', transactionId)
    .eq('user_id', userId)
    .select()
    .single();

  // Notify admin for verification (implement notification system)
  await notifyAdminForVerification(transaction);

  return transaction;
}

async function verifyPayment(transactionId, adminId, approved) {
  const status = approved ? 'succeeded' : 'failed';

  // Update transaction
  const { data: transaction } = await supabase
    .from('payment_transactions')
    .update({
      status,
      metadata: {
        verified_by: adminId,
        verified_at: new Date().toISOString()
      }
    })
    .eq('id', transactionId)
    .select()
    .single();

  if (approved && transaction.subscription_id) {
    // Activate subscription
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: addMonths(new Date(), 1).toISOString()
      })
      .eq('id', transaction.subscription_id);
  }

  return transaction;
}
```

### 5. Service Provider Verification

**Admin verification workflow:**
```javascript
async function verifyServiceProvider(providerId, adminId, approved, notes) {
  const { data: provider } = await supabase
    .from('service_providers')
    .update({
      is_verified: approved,
      is_active: approved,
      verification_documents: {
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        notes: notes
      }
    })
    .eq('id', providerId)
    .select()
    .single();

  // Notify provider
  await supabase
    .from('service_provider_notifications')
    .insert({
      provider_id: providerId,
      notification_type: 'verification',
      title: approved ? 'Verification Approved' : 'Verification Rejected',
      message: notes || (approved ? 'Your profile has been verified!' : 'Please update your documents.'),
      is_read: false
    });

  return provider;
}
```

---

## 🧪 Testing Checklist

### Subscription Features
- [ ] Display subscription plans correctly
- [ ] Create subscription (all 3 tiers)
- [ ] Upgrade from Basic to Gold Plus
- [ ] Downgrade from Premium to Gold Plus
- [ ] Cancel subscription (immediate and at period end)
- [ ] Renew expired subscription
- [ ] Verify listing limit enforcement (5 for Basic)
- [ ] Verify analytics access (Gold Plus+ only)
- [ ] Display subscription badge on user profile
- [ ] Display subscription badge on car listings

### Payment Features
- [ ] List available payment gateways
- [ ] Submit payment via Bank Transfer
- [ ] Submit payment via M-Pesa
- [ ] Submit payment via Cash on Delivery
- [ ] View payment transaction history
- [ ] Admin: Verify payment proof
- [ ] Admin: Reject payment
- [ ] Save bank account details
- [ ] Update bank account details
- [ ] Delete bank account

### Messaging Features
- [ ] Create conversation when sending first message
- [ ] Send text message
- [ ] Send image message (optional)
- [ ] Send offer message (optional)
- [ ] Receive real-time messages
- [ ] Mark message as read
- [ ] Mark conversation as read
- [ ] Display unread count
- [ ] List conversations with pagination
- [ ] Load message history with pagination
- [ ] Link conversation to car listing

### Service Provider Features
- [ ] Register as service provider
- [ ] Update provider profile
- [ ] Search providers by type
- [ ] Search providers by location (with radius)
- [ ] Filter verified providers only
- [ ] View provider details
- [ ] Submit review for provider
- [ ] View provider reviews
- [ ] Admin: Verify provider
- [ ] Admin: Reject provider
- [ ] Display provider notifications
- [ ] Mark notification as read

### Analytics Features
- [ ] Track car view (increment counter)
- [ ] Track car share (with method)
- [ ] Track inquiry (first message on car)
- [ ] Display analytics dashboard (Gold Plus+ only)
- [ ] Show "Upgrade" prompt for Basic users
- [ ] Export analytics data (CSV/PDF)
- [ ] View analytics charts (views over time)
- [ ] View share distribution
- [ ] Calculate conversion rate

---

## 📚 Additional Resources

### Supabase Documentation
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

### Database Functions Available

```sql
-- Get or create conversation between two users
SELECT get_or_create_conversation(
  'user1_id'::uuid,
  'user2_id'::uuid,
  'car_id'::uuid  -- optional
);

-- Mark message as read
SELECT mark_message_as_read('message_id'::uuid);

-- Mark all messages in conversation as read
SELECT mark_conversation_as_read('conversation_id'::uuid);

-- Get car share count
SELECT get_car_share_count('car_id'::uuid);
```

### Environment Variables Needed

```env
# Supabase
SUPABASE_URL=https://fmaxqpvwjpnzwraprrud.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe (for payment processing)
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Optional: For SMS/Email notifications
TWILIO_ACCOUNT_SID=xxxxx
TWILIO_AUTH_TOKEN=xxxxx
SENDGRID_API_KEY=xxxxx
```

---

## 🚨 Security Considerations

### Important Security Rules

1. **Never expose service role key to frontend**
   - Use anon key for client-side
   - Use service role key only on backend for admin operations

2. **Validate subscription status server-side**
   - Don't trust client claims about subscription tier
   - Always verify against database before granting access

3. **Rate limiting**
   - Implement rate limits on messaging endpoints
   - Implement rate limits on analytics tracking
   - Implement rate limits on search endpoints

4. **Payment verification**
   - Always verify payments server-side
   - Never auto-activate subscriptions without verification
   - Store payment proof securely

5. **Data validation**
   - Validate all user inputs
   - Sanitize text content in messages
   - Validate file uploads (images)
   - Check for SQL injection attempts

6. **Privacy**
   - Don't expose other users' email addresses
   - Don't expose phone numbers without permission
   - Respect RLS policies

---

## 📞 Support & Questions

For questions about implementation:
- Check Supabase dashboard for table structure
- Review RLS policies in database
- Test API endpoints using Postman/Insomnia
- Check mobile app code for reference implementation

**Database URL**: https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud

**Mobile App Reference**:
- Subscription Service: `lib/services/subscription_service.dart`
- Payment Gateway Service: `lib/services/payment_gateway_service.dart`
- Messaging Service: Implemented in Supabase service
- Service Provider Service: `lib/services/service_provider_service.dart`
- Analytics Service: `lib/services/analytics_service.dart`

---

**Document Version**: 1.0
**Last Updated**: November 8, 2025
**Prepared By**: Mobile Development Team
