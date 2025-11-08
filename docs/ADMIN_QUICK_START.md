# Admin Quick Start Guide

**For Mr Cars Admin Dashboard**

---

## 🚀 Quick Navigation

| Task | Go To |
|------|-------|
| Approve a payment | [Payment Verification](/dashboard/payment-verification) |
| Verify a service provider | [Service Providers](/dashboard/service-providers) → Unverified tab |
| Grant free subscription | [Subscriptions](/dashboard/subscriptions) → "Grant Subscription" |
| Extend someone's subscription | [Subscriptions](/dashboard/subscriptions) → Actions → Extend |
| View user messages | [Messages](/dashboard/messages) |
| Check platform stats | [Analytics](/dashboard/analytics) |
| Configure payment methods | [Payments](/dashboard/payments) |

---

## ⚡ Common Admin Tasks

### 1. **Approve a Bank Transfer Payment**

**Scenario**: User uploaded payment proof via mobile app, needs admin approval

**Steps**:
```
1. Go to: /dashboard/payment-verification
2. Click: "Pending" tab
3. Find the payment in the list
4. Click: Actions → "View Details"
5. Review: Payment amount, user info, payment method
6. Click: Actions → "Approve Payment"
7. Add notes (optional): "Verified with bank statement"
8. Click: "Approve Payment"
```

**What Happens**:
- Payment status → Completed
- Associated subscription → Auto-activated
- User receives notification (mobile app)
- User can now access premium features

---

### 2. **Verify a New Mechanic**

**Scenario**: Mechanic registered on mobile app, needs verification to appear in directory

**Steps**:
```
1. Go to: /dashboard/service-providers
2. Click: "Unverified" tab
3. Find the mechanic
4. Click: Actions → "View Details"
5. Review: Business name, location, services, documents
6. Click: Actions → "Approve & Verify"
7. Add notes: "Documents verified, license checked"
8. Click: "Approve & Verify"
```

**What Happens**:
- Provider status → Verified & Active
- Appears in mobile app service provider directory
- Can receive inquiries from users
- Profile is marked with verification badge

---

### 3. **Grant Free Premium Subscription**

**Scenario**: Partnership deal, influencer promo, or support compensation

**Steps**:
```
1. Go to: /dashboard/subscriptions
2. Click: "Grant Subscription" button
3. Get user ID from Users page (copy their ID)
4. Paste user ID
5. Select plan: "Premium" (or Gold Plus)
6. Set duration: e.g., 3 months
7. Add notes: "Partnership with AutoBlog ZA - 3 month promo"
8. Click: "Grant Subscription"
```

**What Happens**:
- User's account upgraded instantly
- Premium features unlocked
- Shows as "admin_granted" in payment history
- User receives notification

---

### 4. **Extend an Expiring Subscription**

**Scenario**: User's subscription expires tomorrow, support wants to extend as courtesy

**Steps**:
```
1. Go to: /dashboard/subscriptions
2. Search for user
3. Find their subscription
4. Click: Actions dropdown
5. Select: "Extend +1 Month" (or +3 Months)
6. Done!
```

**What Happens**:
- End date automatically pushed forward
- User retains access without interruption
- No payment required

---

### 5. **Change a User's Plan**

**Scenario**: User wants to downgrade from Premium to Gold Plus

**Steps**:
```
1. Go to: /dashboard/subscriptions
2. Find user's subscription
3. Click: Actions → "Change Plan"
4. Select: "Gold Plus" from dropdown
5. Click: "Change Plan"
```

**What Happens**:
- Plan changed immediately
- Features adjusted to new plan level
- End date remains the same
- User sees new plan in mobile app

---

### 6. **Reject a Payment (Invalid Proof)**

**Scenario**: User submitted blurry/wrong payment proof

**Steps**:
```
1. Go to: /dashboard/payment-verification
2. Find the payment
3. Click: Actions → "Reject Payment"
4. Enter reason: "Payment proof is unclear. Please upload a clearer image showing transaction reference number."
5. Click: "Reject Payment"
```

**What Happens**:
- Payment marked as failed
- User receives rejection reason via notification
- User can resubmit with better proof

---

### 7. **Block Inappropriate Conversation**

**Scenario**: User reports harassment in messages

**Steps**:
```
1. Go to: /dashboard/messages
2. Find the conversation (search by username)
3. Click: Actions → "View Conversation"
4. Review messages
5. Click: Actions → "Block"
```

**What Happens**:
- Conversation blocked
- Users cannot send new messages
- Flags conversation for review

---

### 8. **Deactivate a Service Provider**

**Scenario**: Multiple complaints about a mechanic

**Steps**:
```
1. Go to: /dashboard/service-providers
2. Find the provider
3. Click: Actions → "Deactivate"
```

**What Happens**:
- Provider removed from mobile app directory
- Cannot receive new inquiries
- Can be reactivated later

---

## 📊 Understanding the Dashboard Stats

### **Payment Verification Page**

| Stat | Meaning |
|------|---------|
| Pending Review | Payments waiting for admin approval |
| Approved Today | Payments you've processed today |
| Total Revenue | All completed payments (all time) |
| Needs Attention | Same as Pending Review (action required) |

### **Subscriptions Page**

| Stat | Meaning |
|------|---------|
| Total Revenue | Sum of all active subscription payments |
| Active Subscriptions | Currently active subscriptions |
| Gold Plus+ Users | Users with Gold Plus or Premium plans |
| Monthly Recurring | Expected monthly revenue from auto-renew subscriptions |

### **Service Providers Page**

| Stat | Meaning |
|------|---------|
| Total Providers | All registered service providers |
| Verified | Approved and active providers |
| Pending Verification | Waiting for admin approval |
| Active Services | Currently operational providers |

---

## ⚠️ Important Notes

### **Do's**
✅ Always review payment details before approving
✅ Add clear notes when rejecting (user will see this)
✅ Verify service provider documents before approving
✅ Use "Grant Subscription" for partnerships/promos
✅ Keep admin notes for audit trail

### **Don'ts**
❌ Don't approve payments without verifying
❌ Don't reject without explaining why
❌ Don't delete providers (deactivate instead)
❌ Don't grant subscriptions without documenting reason
❌ Don't bulk-approve without checking each item

---

## 🔍 Filters & Search

### **Payment Verification**
- **Pending** - Needs your review
- **Completed** - Already approved
- **Failed** - Rejected payments
- **All** - Complete history

### **Service Providers**
- **All** - Everyone
- **Verified** - Approved providers
- **Unverified** - Needs review
- **Active** - Currently operational
- **By Type** - Mechanic, Breakdown, Towing, etc.

### **Subscriptions**
- **All** - All subscriptions
- **Active** - Currently active
- **Expired** - Past end date
- **Pending** - Awaiting payment verification
- **Cancelled** - User or admin cancelled

---

## 🆘 What If...

### **"User says they paid but I don't see the payment"**
1. Check Payment Verification → All tab
2. Search by user ID or transaction ref
3. If not found → Payment didn't reach system
4. Ask user to resubmit from mobile app

### **"I approved a payment but subscription not active"**
1. Go to Subscriptions page
2. Search for user
3. Check subscription status
4. If still pending → Manually activate (Actions → Activate)

### **"Service provider says they're verified but not showing in app"**
1. Go to Service Providers
2. Find the provider
3. Check: is_verified = Yes AND is_active = Yes
4. If active = No → Click Actions → Activate

### **"User wants refund"**
1. This is handled outside admin panel (bank transfer)
2. Go to Payment Verification
3. Find transaction → View Details
4. Note the payment method and amount
5. Process refund through bank/payment provider
6. Go to Subscriptions → Find user → Actions → Cancel

---

## 🎯 Best Practices

### **Response Times**
- **Pending payments**: Approve/reject within 24 hours
- **Service providers**: Verify within 48 hours
- **User messages**: Monitor daily for issues
- **Subscription issues**: Resolve immediately

### **Documentation**
- Always add notes when taking admin actions
- Be specific in rejection reasons
- Document reasons for free subscriptions
- Keep verification notes clear

### **Quality Control**
- Verify payment amounts match plans
- Check service provider documents thoroughly
- Review user reports before blocking/deactivating
- Double-check before deleting anything

---

## 📞 Need Help?

| Issue | Solution |
|-------|----------|
| Can't find a user | Use Users page, search by email or username |
| Payment not showing | Check all tabs, may be in different status |
| Subscription not activating | Check payment status first, may be pending |
| Stats seem wrong | Click Refresh button (top right) |
| Action failed | Check toast notification for error, try again |

---

**Quick Tip**: Keep this guide bookmarked for fast reference!

**Last Updated**: November 8, 2025
