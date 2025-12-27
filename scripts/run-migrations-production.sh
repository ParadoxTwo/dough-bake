#!/bin/bash

# Script to run Supabase migrations in production
# Usage: ./scripts/run-migrations-production.sh
#
# This script applies all migration files from supabase/migrations/ to your production Supabase database.
# It requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.

echo "🚀 Running Database Migrations (Production)"
echo "============================================"
echo ""

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables from .env.production if it exists
ENV_FILE="${PROJECT_ROOT}/.env.production"
if [ -f "$ENV_FILE" ]; then
    echo "📄 Loading environment variables from .env.production..."
    set -a
    while IFS= read -r line || [ -n "$line" ]; do
        if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "${line// }" ]]; then
            continue
        fi
        export "$line"
    done < "$ENV_FILE"
    set +a
    echo "✅ Environment variables loaded"
    echo ""
fi

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] && [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required"
    exit 1
fi

API_URL="${SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

# Check if migrations directory exists
MIGRATIONS_DIR="${PROJECT_ROOT}/supabase/migrations"
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "❌ Migrations directory not found: $MIGRATIONS_DIR"
    exit 1
fi

echo "📁 Migrations directory: $MIGRATIONS_DIR"
echo "🌐 Supabase URL: $API_URL"
echo ""

# Get list of migration files sorted by name
MIGRATION_FILES=($(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort))

if [ ${#MIGRATION_FILES[@]} -eq 0 ]; then
    echo "❌ No migration files found in $MIGRATIONS_DIR"
    exit 1
fi

echo "📋 Found ${#MIGRATION_FILES[@]} migration file(s):"
for file in "${MIGRATION_FILES[@]}"; do
    echo "   - $(basename "$file")"
done
echo ""

# Ask for confirmation
read -p "⚠️  This will apply migrations to PRODUCTION database. Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 1
fi

echo ""
echo "🔄 Applying migrations..."
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found."
    echo ""
    echo "📝 Please run migrations manually via Supabase Dashboard:"
    echo "   1. Go to https://supabase.com/dashboard"
    echo "   2. Select your project"
    echo "   3. Navigate to SQL Editor"
    echo "   4. Apply each migration file in order:"
    for file in "${MIGRATION_FILES[@]}"; do
        echo "      - $(basename "$file")"
    done
    echo ""
    echo "💡 To install Supabase CLI: npm install -g supabase"
    exit 1
fi

# Check if project is linked
if [ ! -f "${PROJECT_ROOT}/.supabase/config.toml" ]; then
    echo "⚠️  Supabase project not linked."
    echo ""
    echo "To link your project:"
    echo "   1. Get your project reference ID from Supabase Dashboard > Settings > General"
    echo "   2. Run: supabase link --project-ref <your-project-ref-id>"
    echo ""
    echo "Alternatively, run migrations manually via Supabase Dashboard SQL Editor"
    exit 1
fi

echo "🔄 Applying migrations using Supabase CLI..."
echo ""

# Use Supabase CLI to push migrations
if supabase db push; then
    echo ""
    echo "✅ All migrations applied successfully!"
    SUCCESS_COUNT=${#MIGRATION_FILES[@]}
    FAILED_COUNT=0
else
    echo ""
    echo "❌ Migration failed. Please check the error above."
    echo ""
    echo "💡 Alternative: Run migrations manually via Supabase Dashboard SQL Editor"
    SUCCESS_COUNT=0
    FAILED_COUNT=${#MIGRATION_FILES[@]}
fi

echo ""
echo "============================================"
if [ $FAILED_COUNT -eq 0 ]; then
    echo "✅ All migrations applied successfully!"
else
    echo "⚠️  $SUCCESS_COUNT migration(s) applied, $FAILED_COUNT need manual execution"
    echo ""
    echo "💡 To apply remaining migrations manually:"
    echo "   1. Go to https://supabase.com/dashboard"
    echo "   2. Select your project"
    echo "   3. Navigate to SQL Editor"
    echo "   4. Copy and paste the migration SQL files"
fi
echo ""

