# Supabase CORS Error Fix

## 🚨 Problem
Getting CORS error when trying to login on deployed Vercel site:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://fmaxqpvwjpnzwraprrud.supabase.co/auth/v1/token
```

## ✅ Solution

### **Step 1: Configure Supabase Authentication URLs**

1. Go to your Supabase Dashboard:
   - URL: https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud
   - Or visit: https://supabase.com/dashboard and select your project

2. Navigate to **Authentication** → **URL Configuration**

3. Update the following settings:

   **Site URL:**
   ```
   https://mr-cars-admin.vercel.app
   ```

   **Redirect URLs** (Add all of these):
   ```
   https://mr-cars-admin.vercel.app/*
   https://mr-cars-admin.vercel.app/auth/login
   https://mr-cars-admin.vercel.app/dashboard
   https://mr-cars-admin.vercel.app/auth/reset-password
   http://localhost:3000/*
   http://localhost:3000/auth/login
   http://localhost:3000/dashboard
   ```

4. Click **Save**

---

### **Step 2: Enable Email Auth (if not already enabled)**

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** provider is enabled
3. Disable "Confirm email" if you want to test immediately (optional)

---

### **Step 3: Check Vercel Environment Variables**

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: **mr_cars_admin**
3. Go to **Settings** → **Environment Variables**
4. Ensure these variables are set for **Production**, **Preview**, and **Development**:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://fmaxqpvwjpnzwraprrud.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtYXhxcHZ3anBuendyYXBycnVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2ODM0MTYsImV4cCI6MjA3NjI1OTQxNn0.c5j3zK0tvgrA_mve-0AGW0n8yP80OeFApfhzGDXsvn4
   ```

5. If you added/changed variables, **redeploy** your site:
   - Go to **Deployments**
   - Click on the latest deployment
   - Click **Redeploy**

---

### **Step 4: Create Admin User in Supabase**

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter:
   - **Email**: `admin@mrcars.com`
   - **Password**: `AdminMrCars2025!` (or your preferred password)
   - **Auto Confirm User**: ✅ Enable this!
4. Click **Create user**

---

### **Step 5: Test the Login**

**Local Testing (Recommended First):**
```bash
npm run dev
```
Then visit: http://localhost:3000/auth/login

**Production Testing:**
Visit: https://mr-cars-admin.vercel.app/auth/login

**Test Credentials:**
```
Email: admin@mrcars.com
Password: AdminMrCars2025! (or whatever you set)
```

---

## 🔍 Additional Troubleshooting

### If CORS Error Persists:

1. **Clear Browser Cache** and try in incognito mode
2. **Wait 5-10 minutes** for Supabase settings to propagate
3. **Check Supabase API Status**: https://status.supabase.com/

### Check Supabase Network Restrictions:

1. Go to **Settings** → **API** in Supabase Dashboard
2. Scroll to **Network Restrictions**
3. Make sure it's not blocking your Vercel IP ranges

### Alternative: Use Supabase CLI to Update

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref fmaxqpvwjpnzwraprrud

# Update auth config
supabase config api.external_url=https://mr-cars-admin.vercel.app
```

---

## 📱 Quick Access Links

**Supabase Dashboard:**
- Project: https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud
- Auth Config: https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud/auth/url-configuration
- Users: https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud/auth/users

**Vercel Dashboard:**
- Project: https://vercel.com/dashboard
- Environment Variables: Look for your project settings

**Admin Login:**
- Local: http://localhost:3000/auth/login
- Production: https://mr-cars-admin.vercel.app/auth/login

---

## ✅ Checklist

- [ ] Updated Supabase Site URL
- [ ] Added all Redirect URLs in Supabase
- [ ] Enabled Email Auth in Supabase
- [ ] Created admin user in Supabase
- [ ] Verified environment variables in Vercel
- [ ] Redeployed Vercel site (if env vars changed)
- [ ] Tested login locally
- [ ] Tested login on production

---

## 🎯 Expected Result

After following these steps, you should be able to:
1. Visit https://mr-cars-admin.vercel.app/auth/login
2. Enter your admin credentials
3. Successfully login without CORS errors
4. Be redirected to `/dashboard`

---

**Last Updated**: November 9, 2025
**Issue**: CORS Authentication Error
**Status**: Fix in Progress
