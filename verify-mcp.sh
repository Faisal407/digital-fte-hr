#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# MCP Server Verification Script
# Checks if all 6 MCP servers are properly configured
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║        MCP Server Configuration Verification                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ ERROR: .env.local not found"
    echo "   Run: cp .env.local.example .env.local"
    exit 1
fi

# Check if .mcp.json exists
if [ ! -f .mcp.json ]; then
    echo "❌ ERROR: .mcp.json not found"
    exit 1
fi

echo "✅ Configuration files found"
echo ""

# ── Check GitHub MCP ─────────────────────────────────────────────────────────
echo "🔍 Checking GitHub MCP..."
if grep -q "^GITHUB_PERSONAL_ACCESS_TOKEN=github_pat_" .env.local; then
    echo "   ✅ GITHUB_PERSONAL_ACCESS_TOKEN configured"
else
    echo "   ⚠️  GITHUB_PERSONAL_ACCESS_TOKEN not configured"
    echo "      Get from: https://github.com/settings/tokens?type=beta"
fi

# ── Check PostgreSQL MCP ────────────────────────────────────────────────────
echo ""
echo "🔍 Checking PostgreSQL MCP..."
if grep -q "^DATABASE_URL=postgresql://" .env.local; then
    echo "   ✅ DATABASE_URL configured"

    # Try to connect
    DB_URL=$(grep "^DATABASE_URL=" .env.local | cut -d'=' -f2)
    if command -v psql &> /dev/null; then
        if psql "$DB_URL" -c "SELECT 1;" &> /dev/null; then
            echo "   ✅ PostgreSQL connection successful"
        else
            echo "   ⚠️  PostgreSQL connection failed"
            echo "      Ensure database is running"
        fi
    else
        echo "   ℹ️  psql not installed (can't test connection)"
    fi
else
    echo "   ⚠️  DATABASE_URL not configured"
    echo "      Local Docker: postgresql://postgres:password@localhost:5432/digitalfte_dev"
fi

# ── Check AWS MCP ───────────────────────────────────────────────────────────
echo ""
echo "🔍 Checking AWS MCP..."
AWS_KEY_FOUND=false
AWS_SECRET_FOUND=false
AWS_REGION_FOUND=false

if grep -q "^AWS_ACCESS_KEY_ID=AKIA_" .env.local; then
    echo "   ✅ AWS_ACCESS_KEY_ID configured"
    AWS_KEY_FOUND=true
else
    echo "   ⚠️  AWS_ACCESS_KEY_ID not configured"
fi

if grep -q "^AWS_SECRET_ACCESS_KEY=" .env.local && ! grep "^AWS_SECRET_ACCESS_KEY=$" .env.local; then
    echo "   ✅ AWS_SECRET_ACCESS_KEY configured"
    AWS_SECRET_FOUND=true
else
    echo "   ⚠️  AWS_SECRET_ACCESS_KEY not configured"
fi

if grep -q "^AWS_REGION=" .env.local; then
    echo "   ✅ AWS_REGION configured"
    AWS_REGION_FOUND=true
else
    echo "   ⚠️  AWS_REGION not configured"
fi

if [ "$AWS_KEY_FOUND" = true ] && [ "$AWS_SECRET_FOUND" = true ]; then
    if command -v aws &> /dev/null; then
        if aws sts get-caller-identity &> /dev/null; then
            echo "   ✅ AWS credentials valid"
        else
            echo "   ⚠️  AWS credentials invalid or expired"
        fi
    else
        echo "   ℹ️  AWS CLI not installed (can't validate credentials)"
    fi
fi

# ── Check Playwright MCP ────────────────────────────────────────────────────
echo ""
echo "🔍 Checking Playwright MCP..."
echo "   ℹ️  Playwright MCP auto-manages browsers"
echo "   ℹ️  First run will download browsers (~500MB, takes 2-3 min)"

# ── Check Filesystem MCP ───────────────────────────────────────────────────
echo ""
echo "🔍 Checking Filesystem MCP..."
if [ -f .mcp.json ] && grep -q "filesystem" .mcp.json; then
    echo "   ✅ Filesystem MCP configured in .mcp.json"
else
    echo "   ⚠️  Filesystem MCP not in .mcp.json"
fi

# ── Check Memory MCP ───────────────────────────────────────────────────────
echo ""
echo "🔍 Checking Memory MCP..."
if [ -f .mcp.json ] && grep -q "memory" .mcp.json; then
    echo "   ✅ Memory MCP configured in .mcp.json"
else
    echo "   ⚠️  Memory MCP not in .mcp.json"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   Summary                                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Fill any missing environment variables in .env.local"
echo "2. Start Claude Code: claude-code"
echo "3. Test: 'Tell me your GitHub status'"
echo ""
echo "For detailed setup: See MCP_SETUP_GUIDE.md"
echo ""
