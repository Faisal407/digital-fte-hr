# AWS Cognito OAuth Setup Guide

## Status: 🟡 Ready for Configuration

The application is now configured to use **AWS Cognito OAuth** instead of custom credentials. However, it requires real AWS Cognito credentials to function.

---

## What Has Changed

### ✅ Removed
- ❌ Credentials provider (email/password with mock database)
- ❌ Custom registration API endpoint
- ❌ Form-based authentication

### ✅ Added
- ✅ AWS Cognito OAuth provider
- ✅ Cognito-based login flow
- ✅ Cognito-based signup flow
- ✅ Token refresh mechanism
- ✅ Session management via JWT

---

## What You Need to Do

### Step 1: Create AWS Cognito User Pool

1. Go to **AWS Console** → **Cognito**
2. Click **Create user pool**
3. Choose **Cognito user pool** (not Cognito Identity)
4. Configure:
   - **Pool name**: `digital-fte-hr-users`
   - **Sign-in options**: ✅ Email, ✅ Username (optional)
5. Click **Next**

### Step 2: Configure Security Settings

1. **Password policy**: Use default (8+ chars, uppercase, number, special)
2. **MFA**: Optional (can enable later)
3. **Account recovery**: Email only
4. Click **Next**

### Step 3: Configure Sign-up & Self-serve Signup

1. **Self-registration**: ✅ Enable
2. **Attributes to verify**: Email
3. **Verification method**: Link (email)
4. Click **Next**

### Step 4: Configure Message Delivery

1. **Email provider**: ✅ Cognito (default)
2. Click **Next**

### Step 5: Review & Create

Click **Create user pool**

### Step 6: Create App Client

1. In your new user pool, go to **App integration** → **App clients and analytics**
2. Click **Create app client**
3. **App client name**: `digital-fte-hr-web`
4. **Auth flows enabled**:
   - ✅ ALLOW_AUTHORIZATION_CODE_AUTH
   - ✅ ALLOW_REFRESH_TOKEN_AUTH
5. **App client settings**:
   - **Callback URLs**: `http://localhost:3000/api/auth/callback/cognito`
   - **Sign-out URLs**: `http://localhost:3000/auth/login`
   - **Allowed OAuth Flows**: Authorization code, Refresh token
   - **Allowed OAuth Scopes**: `openid`, `email`, `profile`
6. Click **Save changes**

### Step 7: Create Hosted UI

1. Go to **App integration** → **App client settings** (or **Domain**)
2. Under **Domain**, create a domain:
   - **Domain prefix**: `digital-fte-hr-XXXXX` (must be globally unique)
3. Click **Create domain**

### Step 8: Get Your Credentials

In your user pool:

1. **User pool ID**: Found in **General settings** (format: `us-west-2_XXXXXXXXX`)
2. **Client ID**: Found in **App clients** → Your app client
3. **Client Secret**: Found in **Show Details** on your app client
4. **Cognito Domain**: The domain prefix you created + `.auth.region.amazoncognito.com`

---

## Update Environment Variables

Update `.env.local` with your real credentials:

```env
# AWS Cognito OAuth
AWS_COGNITO_CLIENT_ID=YOUR_CLIENT_ID_HERE
AWS_COGNITO_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
AWS_COGNITO_ISSUER=https://cognito-idp.us-west-2.amazonaws.com/us-west-2_XXXXXXXXX

# Cognito Hosted UI URLs
NEXT_PUBLIC_COGNITO_SIGNUP_URL=https://YOUR-DOMAIN.auth.us-west-2.amazoncognito.com/signup?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/api/auth/callback/cognito

NEXT_PUBLIC_COGNITO_LOGIN_URL=https://YOUR-DOMAIN.auth.us-west-2.amazoncognito.com/login?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/api/auth/callback/cognito
```

---

## Test the Flow

### 1. Start Dev Server
```bash
cd apps/web
npm run dev
```

### 2. Test Sign In
- Go to `http://localhost:3000/auth/login`
- Click "Sign in with AWS Cognito"
- You'll be redirected to Cognito's Hosted UI
- Sign in with your Cognito user account
- Should redirect back to dashboard

### 3. Test Sign Up
- Go to `http://localhost:3000/auth/register`
- Click "Create Account with AWS Cognito"
- Cognito's signup form appears
- Complete registration
- Verify email
- Sign in with new credentials

---

## Cognito Flow Architecture

```
User clicks "Sign in"
    ↓
Redirected to Cognito Hosted UI
    ↓
User enters credentials
    ↓
Cognito validates & generates code
    ↓
Redirected back to http://localhost:3000/api/auth/callback/cognito
    ↓
NextAuth exchanges code for tokens
    ↓
JWT session created
    ↓
Redirected to /dashboard
```

---

## Advantages of Cognito OAuth

✅ **No password storage** - Cognito handles all password security
✅ **Multi-factor authentication** - Built-in MFA support
✅ **User management** - Easy user pool management in AWS Console
✅ **Token refresh** - Automatic token rotation
✅ **Enterprise-ready** - Supports SAML, OpenID Connect
✅ **Compliance** - HIPAA, PCI-DSS ready
✅ **Scaling** - AWS-managed, auto-scaling
✅ **Audit logs** - CloudTrail integration

---

## Production Deployment

For production, update your Cognito URLs:

```env
NEXT_PUBLIC_COGNITO_SIGNUP_URL=https://YOUR-DOMAIN.auth.us-west-2.amazoncognito.com/signup?response_type=code&client_id=PROD_CLIENT_ID&redirect_uri=https://yourapp.com/api/auth/callback/cognito

NEXT_PUBLIC_COGNITO_LOGIN_URL=https://YOUR-DOMAIN.auth.us-west-2.amazoncognito.com/login?response_type=code&client_id=PROD_CLIENT_ID&redirect_uri=https://yourapp.com/api/auth/callback/cognito
```

---

## Troubleshooting

### "Cognito signup URL not configured"
→ You haven't set `NEXT_PUBLIC_COGNITO_SIGNUP_URL` in `.env.local`

### "Invalid client id" error
→ Check that `AWS_COGNITO_CLIENT_ID` matches your Cognito app client ID

### "Redirect URI mismatch"
→ Make sure your Cognito app client callback URLs include `http://localhost:3000/api/auth/callback/cognito`

### Not redirecting to dashboard after login
→ Check `NEXTAUTH_URL` is set to `http://localhost:3000`

---

## Support

This setup guide covers:
- ✅ User pool creation
- ✅ App client configuration
- ✅ Environment variables
- ✅ Testing login/signup flows
- ✅ Production deployment

For more details, see [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)

