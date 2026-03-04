# Supabase Authentication Setup - FREE & EASY

**Time to setup**: 10 minutes
**Cost**: FREE (forever)
**No credit card required**

---

## Step 1: Create Supabase Account

1. Go to https://app.supabase.com
2. Click "Sign up"
3. Sign up with GitHub or email
4. No credit card required ✅

---

## Step 2: Create New Project

1. Click "New project"
2. **Project name**: `digital-fte-hr`
3. **Database password**: Create a strong password (you won't need it)
4. **Region**: Choose closest to you
5. Click "Create new project"
6. Wait for project initialization (2 minutes)

---

## Step 3: Get Your Credentials

Once project is ready:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key** (under Project API keys) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 4: Update `.env.local`

Replace in `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Example:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abc123xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 5: Enable Email Auth (Optional but Recommended)

1. In Supabase, go to **Authentication** → **Providers**
2. Find **Email** provider
3. Click **Enable**
4. Enable "Enable email confirmations" (toggle ON)
5. Click **Save**

---

## Step 6: (Optional) Set Up GitHub Social Login

### Create GitHub OAuth App:

1. Go to GitHub.com → Settings → Developer settings → OAuth Apps
2. Click **New OAuth App**
3. **Application name**: `Digital FTE HR`
4. **Homepage URL**: `http://localhost:3000`
5. **Authorization callback URL**: `https://your-project.supabase.co/auth/v1/callback`
6. Click **Create OAuth Application**
7. Copy:
   - **Client ID** → `AUTH_GITHUB_ID`
   - **Client Secret** → `AUTH_GITHUB_SECRET`

### Add to Supabase:

1. In Supabase, go to **Authentication** → **Providers**
2. Find **GitHub**
3. Toggle **Enable**
4. Paste Client ID and Client Secret
5. Click **Save**

---

## Step 7: (Optional) Set Up Google Social Login

### Create Google OAuth:

1. Go to https://console.cloud.google.com/
2. Create new project: `digital-fte-hr`
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Select **Web application**
6. **Name**: `Digital FTE HR`
7. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://your-project.supabase.co`
8. **Authorized redirect URIs**:
   - `https://your-project.supabase.co/auth/v1/callback`
9. Copy:
   - **Client ID** → `AUTH_GOOGLE_ID`
   - **Client Secret** → `AUTH_GOOGLE_SECRET`

### Add to Supabase:

1. In Supabase, go to **Authentication** → **Providers**
2. Find **Google**
3. Toggle **Enable**
4. Paste Client ID and Client Secret
5. Click **Save**

---

## Step 8: Update `.env.local` (If Using Social Login)

Add to your `.env.local`:

```env
# GitHub
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

# Google
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

---

## Step 9: Test Your Setup

### Start dev server:
```bash
cd apps/web
npm run dev
```

### Test Sign Up:
1. Go to `http://localhost:3000/auth/register`
2. Enter email and password
3. Click "Create Account"
4. Check your email for verification link
5. Click verification link
6. Should be verified ✅

### Test Sign In:
1. Go to `http://localhost:3000/auth/login`
2. Enter your email and password
3. Click "Sign In"
4. Should redirect to dashboard ✅

### Test Social Login (if configured):
1. Click "Sign in with GitHub" or "Sign in with Google"
2. Authorize
3. Should redirect to dashboard ✅

---

## Monitoring Users

In Supabase Dashboard:

1. Go to **Authentication** → **Users**
2. See all registered users
3. See email verification status
4. Manage user metadata

---

## Production Deployment

For production on Vercel:

1. Go to Vercel → Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `AUTH_GITHUB_ID` (if using GitHub)
   - `AUTH_GITHUB_SECRET` (if using GitHub)
   - `AUTH_GOOGLE_ID` (if using Google)
   - `AUTH_GOOGLE_SECRET` (if using Google)
3. Deploy

### Update Supabase for Production:

1. In Supabase, go to **Authentication** → **Providers** → **Email**
2. Update "Email confirmations link" redirect URL:
   - Change from `http://localhost:3000` to `https://your-production-url.com`

---

## Free Plan Limits (Supabase)

✅ **Unlimited**:
- Email/password authentication
- Social logins (GitHub, Google, etc.)
- 500 MB storage
- 50,000 monthly active users (free tier)
- Email confirmations
- Password resets

You won't hit these limits unless you're a big app. ✅

---

## Troubleshooting

### "Supabase URL not configured"
→ You haven't set `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`

### "Invalid API key"
→ Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct

### Email not sending
→ In Supabase, go to Auth → Providers → Email → check settings

### Social login not working
→ Check GitHub/Google OAuth redirect URLs match Supabase

### Password reset not working
→ Check email provider is enabled in Supabase Auth settings

---

## What Supabase Gives You FREE

✅ Email/password authentication
✅ Email verification
✅ Password reset
✅ Social login (GitHub, Google, Discord, etc.)
✅ Multi-factor authentication (available)
✅ User management dashboard
✅ Audit logs
✅ PostgreSQL database
✅ Realtime updates
✅ Webhooks

---

## Next Steps

1. ✅ Create Supabase account (free)
2. ✅ Get Supabase credentials
3. ✅ Update `.env.local`
4. ✅ Test sign up/sign in
5. ✅ (Optional) Set up GitHub social login
6. ✅ (Optional) Set up Google social login
7. ✅ Deploy to production

---

**You're all set!** Your app now has production-ready authentication. ✅

