#!/bin/bash

echo "=========================================="
echo "🚀 VERCEL DEPLOYMENT SCRIPT"
echo "=========================================="
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found!"
  echo "   Please run this script from the apps/web directory"
  exit 1
fi

echo "✓ Current directory: $(pwd)"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v)
echo "✓ Node.js version: $NODE_VERSION"
echo ""

# Build the project locally first
echo "📦 Building project locally..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed! Please fix errors above."
  exit 1
fi
echo "✓ Build successful"
echo ""

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo "   NOTE: If this is your first time, you'll be prompted to login"
echo ""

vercel --prod

if [ $? -eq 0 ]; then
  echo ""
  echo "=========================================="
  echo "✅ DEPLOYMENT SUCCESSFUL!"
  echo "=========================================="
  echo ""
  echo "📝 Next Steps:"
  echo "   1. Your app is now live on Vercel"
  echo "   2. Add environment variables in Vercel dashboard:"
  echo "      - NEXT_PUBLIC_SUPABASE_URL"
  echo "      - NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "      - NEXTAUTH_SECRET"
  echo "   3. Redeploy after adding env vars"
  echo ""
  echo "🔗 Visit Vercel dashboard to see your live URL:"
  echo "   https://vercel.com/dashboard"
  echo ""
else
  echo ""
  echo "❌ Deployment failed!"
  echo "   Please check the errors above."
  exit 1
fi
