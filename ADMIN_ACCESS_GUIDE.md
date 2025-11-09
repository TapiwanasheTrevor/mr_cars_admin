# Admin Access Guide - Mr Cars Admin Dashboard

## 🔐 Quick Access Information

### **Your Project Details**
- **Supabase Project ID**: `doqdyntkcuqawjhkfijm`
- **Supabase URL**: `https://doqdyntkcuqawjhkfijm.supabase.co`
- **Admin Dashboard**: https://mr-cars-admin.vercel.app
- **Login Page**: https://mr-cars-admin.vercel.app/auth/login

---

## 🚀 First Time Setup (3 Steps)

### **Step 1: Fix CORS Issue**

**Read the full guide here**: [SUPABASE_CORS_FIX.md](./SUPABASE_CORS_FIX.md)

**Quick Fix:**
1. Go to: https://supabase.com/dashboard/project/doqdyntkcuqawjhkfijm/auth/url-configuration
2. Set **Site URL** to: `https://mr-cars-admin.vercel.app`
3. Add **Redirect URLs**:
   - `https://mr-cars-admin.vercel.app/*`
   - `http://localhost:3000/*`
4. Click **Save**

---

### **Step 2: Create Your Admin Account**

1. Go to: https://supabase.com/dashboard/project/doqdyntkcuqawjhkfijm/auth/users
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   ```
   Email: admin@mrcars.com (or your preferred email)
   Password: [Create a strong password - min 8 characters]
   Auto Confirm User: ✅ ENABLE THIS
   ```
4. Click **"Create user"**
5. **Write down your password** - you'll need it to login!

---

### **Step 3: Login to Admin Dashboard**

**Local Development:**
```bash
cd /Users/memimal/Desktop/PROJECTS/BOSS\ RITCHIE/mr_cars_admin
npm run dev
```
Then visit: http://localhost:3000/auth/login

**Production:**
Visit: https://mr-cars-admin.vercel.app/auth/login

---

## 🎯 What You Get After Login

Once logged in, you have complete admin control:

### **1. Payment Verification**
📍 `/dashboard/payment-verification`
- Approve/reject manual payment submissions
- Automatically activate subscriptions on payment approval
- View payment history and transaction details

### **2. Subscription Management**
📍 `/dashboard/subscriptions`
- **Grant Free Subscriptions** - Give users free Gold Plus access
- **Change Plans** - Upgrade/downgrade user subscriptions
- **Extend Subscriptions** - Add 1, 3, or custom months
- **Activate/Cancel** - Full subscription status control

### **3. Service Provider Verification**
📍 `/dashboard/service-providers`
- **Approve Applications** - Verify and activate new providers
- **Reject Applications** - Block unqualified providers
- **Manage Active Providers** - Deactivate/reactivate as needed

### **4. Messages & User Flagging**
📍 `/dashboard/messages`
- View all conversations between users
- **User Flags** - See Watch/Warning/Restricted/Banned status
- **Evasion Attempts** - Monitor deal detection system
- **Restriction Status** - See who can't message

### **5. Analytics Dashboard**
📍 `/dashboard/analytics`
- Platform-wide metrics and statistics
- Revenue tracking
- User activity analytics

### **6. Security Monitoring**
📍 `/dashboard/security`
- Security logs and events
- Suspicious activity tracking

### **7. User Management**
📍 `/dashboard/users`
- View all registered users
- Manage user accounts

### **8. Other Admin Features**
- **Listings** - Manage car listings
- **Products** - Product catalog management
- **Rentals** - Rental management
- **Orders** - Order tracking
- **Forum** - Community forum moderation
- **Emergency Requests** - Handle urgent user requests
- **Notifications** - System notifications

---

## 🔑 Recommended Admin Credentials

For your first admin account, use:

```
Email: admin@mrcars.com
Password: [Your secure password - at least 8 characters]
```

**Password Requirements:**
- Minimum 8 characters
- Mix of letters, numbers, and symbols recommended
- Example: `MrCars2025!Admin`

---

## 🛠️ Troubleshooting

### **Problem: CORS Error on Login**
**Solution**: Follow [SUPABASE_CORS_FIX.md](./SUPABASE_CORS_FIX.md)

### **Problem: "Invalid login credentials"**
**Solutions**:
1. Make sure you created the user in Supabase
2. Check "Auto Confirm User" was enabled
3. Try resetting password in Supabase Dashboard
4. Verify email spelling is correct

### **Problem: "Email not confirmed"**
**Solution**:
1. Go to Supabase → Authentication → Users
2. Find your user
3. Click on the user
4. Set "Email Confirmed At" to current time
5. Try logging in again

### **Problem: Can't access Supabase Dashboard**
**Solutions**:
1. Go to https://supabase.com
2. Click "Sign In"
3. Use your Supabase account credentials (NOT admin credentials)
4. If you forgot, use "Forgot Password"

---

## 📊 Database Access

### **Supabase Dashboard Access:**
- **Main Dashboard**: https://supabase.com/dashboard
- **Project Dashboard**: https://supabase.com/dashboard/project/doqdyntkcuqawjhkfijm
- **Table Editor**: https://supabase.com/dashboard/project/doqdyntkcuqawjhkfijm/editor
- **SQL Editor**: https://supabase.com/dashboard/project/doqdyntkcuqawjhkfijm/sql
- **Authentication**: https://supabase.com/dashboard/project/doqdyntkcuqawjhkfijm/auth/users

### **Important Tables:**
- `users` - All registered users
- `user_subscriptions` - Subscription records
- `subscription_plans` - Available plans (Free, Gold Plus)
- `payment_transactions` - All payments
- `service_providers` - Mechanics, tow trucks, etc.
- `conversations` - User messaging
- `messages` - Message content
- `user_flags` - Flagged users (evasion detection)
- `security_logs` - Security events

---

## 🔒 Security Best Practices

### **For Your Admin Account:**
1. ✅ Use a strong, unique password
2. ✅ Don't share credentials
3. ✅ Enable 2FA on your Supabase account
4. ✅ Regularly review security logs
5. ✅ Log out when done

### **For User Management:**
1. ✅ Document all manual subscription grants
2. ✅ Use admin notes when approving/rejecting
3. ✅ Review flagged users weekly
4. ✅ Monitor payment fraud attempts
5. ✅ Verify service providers thoroughly

---

## 📞 Quick Commands

### **Start Local Development:**
```bash
cd /Users/memimal/Desktop/PROJECTS/BOSS\ RITCHIE/mr_cars_admin
npm run dev
```

### **Build for Production:**
```bash
npm run build
```

### **View Build Output:**
```bash
npm run start
```

### **Open Supabase Dashboard:**
```bash
open https://supabase.com/dashboard/project/doqdyntkcuqawjhkfijm
```

### **Open Admin Login:**
```bash
# Local
open http://localhost:3000/auth/login

# Production
open https://mr-cars-admin.vercel.app/auth/login
```

---

## 🎓 Admin Workflows

### **Daily Tasks:**
1. Check payment verification queue
2. Review new service provider applications
3. Monitor flagged users and evasion attempts
4. Respond to emergency requests

### **Weekly Tasks:**
1. Review subscription analytics
2. Audit user flags and restrictions
3. Check security logs for anomalies
4. Update payment account details if needed

### **Monthly Tasks:**
1. Generate revenue reports
2. Review service provider performance
3. Analyze user growth metrics
4. Update subscription plans if needed

---

## 📚 Documentation References

- **Feature Summary**: [docs/ADMIN_FEATURES_SUMMARY.md](./docs/ADMIN_FEATURES_SUMMARY.md)
- **Quick Start**: [docs/ADMIN_QUICK_START.md](./docs/ADMIN_QUICK_START.md)
- **User Flagging System**: [USER_FLAGGING_ADMIN.md](./USER_FLAGGING_ADMIN.md)
- **Backend Implementation**: [docs/BACKEND_IMPLEMENTATION_GUIDE.md](./docs/BACKEND_IMPLEMENTATION_GUIDE.md)
- **CORS Fix**: [SUPABASE_CORS_FIX.md](./SUPABASE_CORS_FIX.md)

---

## ✅ Setup Checklist

Complete these steps in order:

- [ ] Read [SUPABASE_CORS_FIX.md](./SUPABASE_CORS_FIX.md)
- [ ] Configure Supabase Site URL and Redirect URLs
- [ ] Enable Email authentication in Supabase
- [ ] Create admin user in Supabase with "Auto Confirm User" enabled
- [ ] Write down your admin password
- [ ] Test login locally (`npm run dev`)
- [ ] Test login on production (https://mr-cars-admin.vercel.app/auth/login)
- [ ] Explore the dashboard features
- [ ] Read admin documentation
- [ ] Set up 2FA on Supabase account
- [ ] Bookmark important links

---

## 🆘 Getting Help

If you encounter issues:

1. **Check documentation** in the `/docs` folder
2. **Review CORS fix guide**: [SUPABASE_CORS_FIX.md](./SUPABASE_CORS_FIX.md)
3. **Check browser console** for error messages
4. **Verify environment variables** in Vercel
5. **Check Supabase logs** in the dashboard
6. **Test locally first** before testing production

---

**Version**: 1.0
**Last Updated**: November 9, 2025
**Project**: Mr Cars Admin Dashboard
**Status**: Ready for Production
