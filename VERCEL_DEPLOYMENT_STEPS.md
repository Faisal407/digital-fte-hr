# Step-by-Step Vercel Deployment Guide

**Date:** March 5, 2026
**Status:** Ready for Deployment ✅

---

## 📋 Quick Reference

Your GitHub repository is ready:
- **Repository:** https://github.com/Faisal407/digital-fte-hr
- **Branch:** master
- **Root Directory:** `digital-fte-hr/apps/web`

---

## 🚀 STEP 1: Open Vercel Dashboard

1. Go to: **https://vercel.com/dashboard**
2. You should already be logged in from our previous authentication
3. Look for button that says **"Add New"** or **"New Project"**

**Screenshot landmarks:**
- Top-left: "Vercel" logo
- Top-right: Your username/avatar
- Center: List of existing projects (if any)

---

## 🔗 STEP 2: Import Your GitHub Repository

1. Click **"Add New"** → **"Project"** (or just **"New Project"**)
2. You'll see: **"Import Git Repository"**
3. Click **"Select a Repository"** dropdown
4. Search for: **`digital-fte-hr`**
5. Click on the repository to select it
6. Click **"Import"**

**What you'll see:**
```
Import Git Repository
Search your GitHub repositories...
[Search box]

↓ (Your repos will appear)
digital-fte-hr
↓
Click to select
```

---

## ⚙️ STEP 3: Configure Build Settings

After clicking Import, you'll see "Configure Project" page.

### 3a) Framework Preset
- **Shows:** "Detected: Next.js"
- **Action:** Keep as is ✓

### 3b) Root Directory
- **Current:** Will show `digital-fte-hr`
- **Need to change to:** `digital-fte-hr/apps/web`
- **How:**
  1. Click the dropdown or text field
  2. Select: `apps/web`
  3. Or type: `apps/web`

### 3c) Build Command
- **Should show:** `npm run build`
- **Action:** Keep as is ✓

### 3d) Output Directory
- **Should show:** `.next`
- **Action:** Keep as is ✓

---

## 🔐 STEP 4: Add Environment Variables (Optional but Recommended)

1. Click **"Environment Variables"** tab/section
2. Add each variable one by one:

### Variable 1: NEXT_PUBLIC_SUPABASE_URL
```
Name:  NEXT_PUBLIC_SUPABASE_URL
Value: https://your-project.supabase.co
```
(Leave blank for now if you don't have Supabase yet)

### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Name:  NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: your-anon-key-here
```
(Leave blank for now if you don't have Supabase yet)

### Variable 3: NEXTAUTH_URL
```
Name:  NEXTAUTH_URL
Value: https://digital-fte-hr.vercel.app
```
(Replace with your actual Vercel domain once deployed)

### Variable 4: NEXTAUTH_SECRET
```
Name:  NEXTAUTH_SECRET
Value: generated-secret-key-here
```
(You can generate a random string or use: https://generate-secret.vercel.app/)

### Variable 5: NEXT_PUBLIC_API_URL (Optional)
```
Name:  NEXT_PUBLIC_API_URL
Value: http://localhost:4000/api/v1
```
(Or your production API URL)

**How to add variables:**
1. Click "+ Add Another" for each new variable
2. Type in "Name" field
3. Type in "Value" field
4. Repeat for each variable

**Note:** You can skip environment variables for now. They can be added later:
- Go to Project Settings → Environment Variables
- Add them anytime
- Redeploy to apply changes

---

## 🎬 STEP 5: Deploy!

1. Scroll to bottom of page
2. Click **"Deploy"** button (large blue button)
3. Wait for deployment to complete

**What happens next:**
```
✓ Analyzing project...
✓ Installing dependencies...
✓ Building application...
✓ Uploading artifacts...
✓ Deployment complete!
```

**Duration:** 3-5 minutes

---

## ✅ STEP 6: Verify Deployment

Once deployment shows "Ready":

1. Click the **preview URL** (shown on success page)
2. You should see your app loading
3. Test these pages:
   - `/auth/login` → See login form ✓
   - `/auth/register` → See registration form ✓
   - Click links between pages ✓

**Expected URLs:**
```
https://[your-project-name].vercel.app/
https://[your-project-name].vercel.app/auth/login
https://[your-project-name].vercel.app/auth/register
```

---

## 📊 After Deployment: Next Steps

### 1. Configure Supabase (If Not Done Yet)
```
1. Go to https://supabase.com
2. Create free account
3. Create new project
4. Get URL and Anon Key
5. Add to Vercel Environment Variables
6. Redeploy
```

### 2. Set Up Custom Domain (Optional)
```
1. Go to Vercel Project Settings
2. Domains section
3. Add your custom domain
4. Update DNS records (instructions provided)
```

### 3. Enable Auto-deployments
- Automatic ✓ (enabled by default from GitHub)
- Every push to master → Auto-deploys
- Pull requests → Get preview deployments

### 4. Monitor Deployments
```
Vercel Dashboard:
- Click your project
- Deployments tab
- See all deployment history
- Rollback if needed
```

---

## 🔧 Troubleshooting

### Issue: Build Fails
**Solution:**
1. Go to Deployment → Logs
2. Look for error message
3. Check app structure (apps/web exists?)
4. Check package.json exists in apps/web

### Issue: Environment Variables Not Working
**Solution:**
1. Verify variables added in Settings
2. Redeploy after adding (important!)
3. Check variable names are exactly correct

### Issue: App Shows 404
**Solution:**
1. Try: `/auth/login` (explicit path)
2. Check Root Directory is set to `apps/web`
3. Check build succeeded (no errors in logs)

### Issue: Authentication Doesn't Work
**Solution:**
1. Add SUPABASE credentials to env vars
2. Verify Supabase project created
3. Redeploy after adding env vars
4. In Supabase: Auth → URL Configuration → Add Vercel domain

---

## 💡 Pro Tips

1. **Enable Vercel CLI for faster future deployments**
   ```bash
   npm install -g vercel
   cd digital-fte-hr/apps/web
   vercel
   ```

2. **Set up error tracking**
   - Vercel → Settings → Error Tracking
   - Get notified of crashes

3. **Monitor performance**
   - Vercel → Analytics tab
   - See Web Core Vitals
   - Optimize based on data

4. **Pull request previews**
   - Push to new branch
   - Create pull request
   - Automatic preview URL created
   - Test before merging

---

## 📞 Support

**Vercel Docs:** https://vercel.com/docs
**Vercel Community:** https://github.com/vercel/next.js/discussions
**GitHub Issues:** https://github.com/Faisal407/digital-fte-hr/issues

---

## ✨ You're Ready!

Everything is set up and ready to deploy. Just follow these 6 steps in the Vercel dashboard and your app will be live in a few minutes! 🚀

**Current Time to Deployment:** < 5 minutes

Good luck! 🎉
