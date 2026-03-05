# Vercel Deployment - Quick Start (5 minutes)

## 🚀 Deploy in 5 Steps

### Step 1: Generate NextAuth Secret
```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))
```
**Save this value** - you'll need it in Step 4.

### Step 2: Go to Vercel
Visit: https://vercel.com/import

### Step 3: Connect GitHub
1. Click "Import Git Repository"
2. Authorize & select: `digital-fte-hr`
3. Choose **Root Directory: `apps/web`** ⚠️ (important!)

### Step 4: Add Environment Variables

In Vercel, click "Environment Variables" and add **6 variables**:

```
NEXTAUTH_URL=https://<YOUR-VERCEL-DOMAIN>.vercel.app
NEXTAUTH_SECRET=<PASTE-YOUR-SECRET-FROM-STEP-1>
NEXT_PUBLIC_API_URL=https://<YOUR-API-DOMAIN>/api/v1
AWS_COGNITO_CLIENT_ID=<your-cognito-client-id>
AWS_COGNITO_CLIENT_SECRET=<your-cognito-client-secret>
AWS_COGNITO_ISSUER=https://cognito-idp.us-west-2.amazonaws.com/<pool-id>
```

⚠️ **Important**: After Vercel generates your domain, update `NEXTAUTH_URL` to match it.

### Step 5: Deploy
Click **"Deploy"** button. Wait 2-5 minutes.

---

## ✅ Verify It Works

1. Visit: `https://<your-vercel-domain>.vercel.app`
2. Try logging in (redirects to Cognito)
3. Check browser console (F12) - no red errors

---

## 🔗 Environment Variables Reference

| Variable | Value |
|----------|-------|
| `NEXTAUTH_URL` | Your Vercel domain (auto-generated after deploy) |
| `NEXTAUTH_SECRET` | Random base64 string from Step 1 |
| `NEXT_PUBLIC_API_URL` | Your backend API base URL |
| `AWS_COGNITO_CLIENT_ID` | From AWS Cognito console |
| `AWS_COGNITO_CLIENT_SECRET` | From AWS Cognito console |
| `AWS_COGNITO_ISSUER` | User pool issuer from AWS |

---

## ⚠️ Common Mistakes

❌ **Forgot to set Root Directory**
- Make sure you selected `apps/web` in Step 3

❌ **NEXTAUTH_SECRET not set**
- Must be in Vercel environment variables (not .env.local)

❌ **NEXTAUTH_URL doesn't match Vercel domain**
- Update after Vercel generates your domain

❌ **API calls fail with CORS error**
- Check `NEXT_PUBLIC_API_URL` is accessible
- Verify backend CORS allows your Vercel domain

---

## 🆘 Troubleshooting

**App shows blank page?**
- Check browser console (F12) for errors
- Check Vercel deployment logs: Dashboard → Deployments

**Login doesn't work?**
- Verify Cognito redirect URI includes your Vercel domain:
  - Add: `https://<your-vercel-domain>.vercel.app/api/auth/callback/cognito`

**Build failed?**
- Check error in Vercel logs
- Run locally: `npm run build` in `apps/web/`

**Still stuck?**
- See full guide: `DEPLOYMENT.md`

---

## 📝 What's Deployed

✅ Next.js 14 frontend
✅ Authentication (NextAuth.js + Cognito)
✅ Job search, resume builder, application tracking
✅ All responsive UI components
✅ API client (connects to your backend)

---

## 🎯 Next Steps

1. ✅ Deploy to Vercel
2. 🔄 Connect backend API
3. 🔐 Configure AWS Cognito
4. 📊 Monitor with Vercel Analytics
5. 🚀 Set up custom domain (optional)

---

**Your app will be live at:** `https://<project-name>.vercel.app`

**Redeploy anytime:** Push to `main` branch on GitHub
