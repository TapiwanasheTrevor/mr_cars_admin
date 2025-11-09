# Admin Dashboard Setup Checklist

## ✅ Completed Steps

- [x] Updated `.env` file with correct Supabase URL: `https://fmaxqpvwjpnzwraprrud.supabase.co`
- [x] Updated `.env` file with correct anon key
- [x] Updated all documentation with correct project ID
- [x] Pushed changes to GitHub

---

## 🚀 Next Steps (DO THESE NOW)

### **Step 1: Fix CORS in Supabase** ⏰ 2 minutes

I just opened the configuration page for you. In that browser window:

1. **Set Site URL** to:
   ```
   https://mr-cars-admin.vercel.app
   ```

2. **Add Redirect URLs** (click "+ Add URL" for each):
   ```
   https://mr-cars-admin.vercel.app/*
   https://mr-cars-admin.vercel.app/auth/login
   https://mr-cars-admin.vercel.app/dashboard
   http://localhost:3000/*
   http://localhost:3000/auth/login
   http://localhost:3000/dashboard
   ```

3. **Click "Save"**

**Status**: [ ] Not Done

---

### **Step 2: Create Admin User** ⏰ 1 minute

Click this link to create your admin account:
👉 https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud/auth/users

1. Click **"Add user"** → **"Create new user"**
2. Fill in:
   - **Email**: `admin@mrcars.com` (or your preferred email)
   - **Password**: [Your secure password - write it down!]
   - **Auto Confirm User**: ✅ **MUST ENABLE THIS**
3. Click **"Create user"**

**Status**: [ ] Not Done

---

### **Step 3: Update Vercel Environment Variables** ⏰ 3 minutes

Go to your Vercel project settings:
👉 https://vercel.com/dashboard

1. Find and select **mr_cars_admin** project
2. Go to **Settings** → **Environment Variables**
3. Update or add these variables for **all environments** (Production, Preview, Development):

   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://fmaxqpvwjpnzwraprrud.supabase.co`

   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtYXhxcHZ3anBuendyYXBycnVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2ODM0MTYsImV4cCI6MjA3NjI1OTQxNn0.c5j3zK0tvgrA_mve-0AGW0n8yP80OeFApfhzGDXsvn4`

4. **Redeploy the site**:
   - Go to **Deployments** tab
   - Click on the latest deployment
   - Click **"Redeploy"** button
   - Wait for deployment to complete (~2-3 minutes)

**Status**: [ ] Not Done

---

### **Step 4: Test Login Locally** ⏰ 2 minutes

```bash
cd /Users/memimal/Desktop/PROJECTS/BOSS\ RITCHIE/mr_cars_admin
npm run dev
```

Then open: http://localhost:3000/auth/login

**Login with:**
- Email: `admin@mrcars.com`
- Password: [The password you created in Step 2]

**Expected Result**: Should login successfully and redirect to `/dashboard`

**Status**: [ ] Not Done

---

### **Step 5: Test Production Login** ⏰ 1 minute

After Vercel redeploys (Step 3), visit:
👉 https://mr-cars-admin.vercel.app/auth/login

**Login with same credentials**

**Expected Result**: Should login without CORS errors

**Status**: [ ] Not Done

---

## 📊 Your Admin Credentials

**Write these down securely!**

```
Email: ___________________________
Password: ___________________________
Created: [Date]
```

---

## 🎯 Quick Access Links

**Supabase:**
- Dashboard: https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud
- Auth Config: https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud/auth/url-configuration
- Users: https://supabase.com/dashboard/project/fmaxqpvwjpnzwraprrud/auth/users

**Admin Dashboard:**
- Local: http://localhost:3000/auth/login
- Production: https://mr-cars-admin.vercel.app/auth/login

**Vercel:**
- Dashboard: https://vercel.com/dashboard

---

## 🆘 Troubleshooting

### Problem: Still getting CORS error
**Solution**:
1. Make sure you saved the URL configuration in Supabase (Step 1)
2. Wait 5 minutes for settings to propagate
3. Clear browser cache or try incognito mode
4. Verify Vercel environment variables are set (Step 3)
5. Make sure you redeployed on Vercel (Step 3)

### Problem: "Invalid login credentials"
**Solution**:
1. Verify you enabled "Auto Confirm User" when creating the account
2. Check email spelling is correct
3. Try resetting password in Supabase Dashboard

### Problem: Environment variables not updating on Vercel
**Solution**:
1. Make sure you selected ALL environments (Production, Preview, Development)
2. Click "Save" after adding each variable
3. MUST redeploy for changes to take effect

---

## 📚 Full Documentation

After setup is complete, read:
- [ADMIN_ACCESS_GUIDE.md](./ADMIN_ACCESS_GUIDE.md) - Complete admin guide
- [SUPABASE_CORS_FIX.md](./SUPABASE_CORS_FIX.md) - Detailed CORS troubleshooting
- [USER_FLAGGING_ADMIN.md](./USER_FLAGGING_ADMIN.md) - User flagging system docs
- [docs/ADMIN_FEATURES_SUMMARY.md](./docs/ADMIN_FEATURES_SUMMARY.md) - All admin features

---

## ⏱️ Total Setup Time: ~10 minutes

**Last Updated**: November 9, 2025
