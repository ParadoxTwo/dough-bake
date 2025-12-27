#!/bin/bash

# Script to get local Supabase credentials for .env.local

echo "🔑 Getting Local Supabase Credentials"
echo "====================================="
echo ""

# Check if Supabase is running
if ! supabase status > /dev/null 2>&1; then
    echo "❌ Supabase is not running. Start it with: npm run supabase:start"
    exit 1
fi

echo "📋 Local Supabase Credentials:"
echo ""

# Get status and extract key information
supabase status | grep -A 20 "API URL" | head -10

echo ""
echo "💡 Add these to your .env.local file:"
echo ""
echo "NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from above>"
echo ""

