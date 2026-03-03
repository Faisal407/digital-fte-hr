# Digital FTE HR - Vercel Deployment Guide

## Overview
This guide walks through deploying the Next.js 14 web application to Vercel.

## Prerequisites
- GitHub account with repository access
- Vercel account (free at https://vercel.com)
- AWS Cognito credentials for authentication
- Backend API running (local or remote)

## Step 1: Generate NextAuth Secret

Generate a secure NEXTAUTH_SECRET:

```bash
# On macOS/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))
```

Save this value - you'll need it for environment variables.

## Step 2: Connect GitHub to Vercel

1. Go to https://vercel.com/import
2. Click "Import Git Repository"
3. Authorize Vercel to access your GitHub account
4. Select your `digital-fte-hr` repository
5. Vercel will auto-detect Next.js framework

## Step 3: Configure Project Settings

In the "Configure Project" dialog:

### Project Name
- Keep default or use: `digital-fte-hr-web`

### Root Directory
- Select the `apps/web` directory (important!)
- This tells Vercel where the Next.js app is located

### Build & Development Settings
- Build Command: `npm run build` (auto-detected)
- Install Command: `npm install --legacy-peer-deps`
- Output Directory: `.next` (auto-detected)

## Step 4: Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

### Production Environment
```
NEXTAUTH_URL=https://<your-vercel-domain>.vercel.app
NEXTAUTH_SECRET=<your-generated-secret-from-step-1>
NEXT_PUBLIC_API_URL=https://<your-api-domain>/api/v1
AWS_COGNITO_CLIENT_ID=<your-cognito-client-id>
AWS_COGNITO_CLIENT_SECRET=<your-cognito-client-secret>
AWS_COGNITO_ISSUER=https://cognito-idp.us-west-2.amazonaws.com/<pool-id>
```

### Preview & Development Environments
```
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=<your-generated-secret>
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
AWS_COGNITO_CLIENT_ID=<your-cognito-client-id>
AWS_COGNITO_CLIENT_SECRET=<your-cognito-client-secret>
AWS_COGNITO_ISSUER=https://cognito-idp.us-west-2.amazonaws.com/<pool-id>
```

**Notes:**
- `NEXTAUTH_URL` must match your Vercel domain in production
- `NEXT_PUBLIC_*` variables are exposed to the browser
- All other variables are server-side only

## Step 5: Configure Cognito (if needed)

If using AWS Cognito for authentication, ensure:

1. Cognito User Pool is created in AWS
2. App client is configured with:
   - Client ID and Secret
   - OAuth 2.0 settings enabled
   - Allowed redirect URIs include:
     - `https://<your-vercel-domain>.vercel.app/api/auth/callback/cognito`
     - `http://localhost:3001/api/auth/callback/cognito` (for preview)

## Step 6: Deploy

Click the "Deploy" button in Vercel. This will:

1. Install dependencies (`npm install --legacy-peer-deps`)
2. Run build (`npm run build`)
3. Deploy to CDN
4. Generate unique URL: `https://<project-name>.vercel.app`

## Step 7: Verify Deployment

After deployment completes (~2-5 minutes):

1. Click "Visit" to open the deployed app
2. Test login flow (should redirect to Cognito)
3. Check browser console for errors (F12)
4. Verify environment variables loaded correctly

### Common Issues

**Issue: "NextAuth Secret is not set"**
- Solution: Ensure `NEXTAUTH_SECRET` is set in Vercel environment variables
- Don't rely on .env.local - it's not deployed

**Issue: "CORS error when calling API"**
- Solution: Check `NEXT_PUBLIC_API_URL` matches your backend
- Ensure backend is running and accessible
- Check CORS configuration on backend

**Issue: "Cognito callback failed"**
- Solution: Verify Cognito redirect URIs include your Vercel domain
- Check Cognito client ID and secret in environment variables
- Ensure `AWS_COGNITO_ISSUER` is correct (includes pool ID)

**Issue: Build fails**
- Solution: Check build logs in Vercel dashboard
- Common cause: Missing environment variables
- Run `npm run build` locally to reproduce

## Step 8: Set Up CI/CD

Vercel automatically deploys on:
- **Production**: Push to `main` branch
- **Preview**: Create pull requests

To prevent deployments:
1. Go to Project Settings → Git
2. Configure "Ignored Build Step" to skip certain branches
3. Or add `vercel-ignore` script in `package.json`

## Step 9: Custom Domain (Optional)

To use your own domain:

1. Go to Project Settings → Domains
2. Add your domain (e.g., `fte-hr.yourdomain.com`)
3. Update DNS records (Vercel will show instructions)
4. Update `NEXTAUTH_URL` to use custom domain

## Step 10: Monitor & Debug

### View Logs
- Vercel Dashboard → Deployments → Select deployment → Logs

### Enable Debug Mode
- Add to environment variables: `NEXT_DEBUG=1`
- Check NextAuth logs: `DEBUG=next-auth* npm run dev`

### Analytics
- Vercel Dashboard → Analytics tab
- Monitor performance, errors, and traffic

## Rollback Deployment

If you need to revert to a previous version:

1. Go to Deployments
2. Find the previous working deployment
3. Click the three-dot menu → "Promote to Production"

## Environment Variables Reference

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `NEXTAUTH_URL` | String | `https://app.vercel.app` | Auth callback URL (production only) |
| `NEXTAUTH_SECRET` | String | Random base64 | NextAuth session encryption key |
| `NEXT_PUBLIC_API_URL` | String | `https://api.example.com/api/v1` | Backend API base URL (public) |
| `AWS_COGNITO_CLIENT_ID` | String | `abc123...` | Cognito app client ID |
| `AWS_COGNITO_CLIENT_SECRET` | String | `xyz789...` | Cognito app client secret |
| `AWS_COGNITO_ISSUER` | String | `https://cognito-idp.us-west-2.amazonaws.com/us-west-2_xxx` | Cognito user pool issuer |

## Troubleshooting

### App won't load
1. Check browser console (F12) for errors
2. Check Vercel deployment logs
3. Verify environment variables are set
4. Test with `https://<your-domain>.vercel.app/` (note trailing slash)

### Login redirects to blank page
1. Verify `NEXTAUTH_URL` matches your domain
2. Check Cognito callback URI configuration
3. Ensure cookies are enabled in browser

### API calls fail with 404
1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Test API endpoint directly in browser
3. Check CORS headers on backend

### Build fails
1. Check `npm run build` works locally
2. Verify all environment variables in Vercel match local `.env.local`
3. Check Node version compatibility (Next.js 14 needs Node 18+)

## Deployment Checklist

- [ ] GitHub repository is public or Vercel has access
- [ ] `apps/web/` directory exists with Next.js app
- [ ] `package.json` has build and dev scripts
- [ ] `.gitignore` excludes `node_modules` and `.next`
- [ ] `NEXTAUTH_SECRET` generated and stored securely
- [ ] All 6 environment variables set in Vercel
- [ ] Cognito configured with correct redirect URIs
- [ ] Backend API is running and accessible
- [ ] Build succeeds: `npm run build`
- [ ] App loads at `https://<your-domain>.vercel.app`
- [ ] Login flow works end-to-end
- [ ] API calls from frontend to backend work

## Post-Deployment

### Monitor Application Health
1. Set up error tracking (Sentry, LogRocket)
2. Monitor performance with Web Vitals
3. Set up uptime monitoring for backend API

### Update Backend CORS
Add Vercel domain to backend CORS configuration:
```
ALLOWED_ORIGINS=http://localhost:3001,https://<your-vercel-domain>.vercel.app
```

### Backup & Security
1. Never commit secrets to git
2. Use environment variables for all sensitive data
3. Rotate `NEXTAUTH_SECRET` periodically
4. Monitor AWS Cognito login attempts

## Additional Resources

- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [AWS Cognito Setup](https://docs.aws.amazon.com/cognito/)

---

**Need help?** Check Vercel logs: Dashboard → Deployments → Select deployment → Logs
