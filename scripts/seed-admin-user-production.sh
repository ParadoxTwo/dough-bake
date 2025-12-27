#!/bin/bash

# Script to seed admin user in production using Supabase Admin API
# Usage: ./scripts/seed-admin-user-production.sh
#   or: SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> ./scripts/seed-admin-user-production.sh
#
# The script will automatically load environment variables from .env.production if it exists.
# Command-line environment variables take precedence over .env.production values.

echo "🔐 Seeding Admin User (Production)"
echo "==================================="
echo ""

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables from .env.production if it exists
ENV_FILE="${PROJECT_ROOT}/.env.production"
if [ -f "$ENV_FILE" ]; then
    echo "📄 Loading environment variables from .env.production..."
    # Export variables from .env.production, ignoring comments and empty lines
    # This handles KEY=value format and exports them
    set -a
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip comments and empty lines
        if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "${line// }" ]]; then
            continue
        fi
        # Export the variable (handles KEY=value format)
        export "$line"
    done < "$ENV_FILE"
    set +a
    echo "✅ Environment variables loaded"
    echo ""
else
    echo "ℹ️  .env.production not found, using environment variables from shell"
    echo ""
fi

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] && [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable is required"
    echo "   Set it in .env.production or as an environment variable"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required"
    echo "   Set it in .env.production or as an environment variable"
    exit 1
fi

API_URL="${SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

echo "📧 Creating admin user: winbro2.ej@gmail.com"
echo ""

# Create user using Supabase Admin API
RESPONSE=$(curl -s -X POST "${API_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"winbro2.ej@gmail.com\",
    \"password\": \"Winbro2@admin\",
    \"email_confirm\": true,
    \"user_metadata\": {
      \"name\": \"Edwin John\"
    }
  }")

# Check if user was created or already exists
if echo "$RESPONSE" | grep -q '"id"'; then
    USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "✅ User created/updated successfully"
    echo "   User ID: ${USER_ID}"
elif echo "$RESPONSE" | grep -q "already registered" || echo "$RESPONSE" | grep -q "User already registered"; then
    echo "ℹ️  User already exists, fetching user ID..."
    # Get user ID by email
    USER_RESPONSE=$(curl -s -X GET "${API_URL}/auth/v1/admin/users?email=winbro2.ej@gmail.com" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
    USER_ID=$(echo "$USER_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$USER_ID" ]; then
        echo "❌ Could not find user ID"
        exit 1
    fi
    echo "   User ID: ${USER_ID}"
else
    echo "❌ Failed to create user:"
    echo "$RESPONSE" | head -10
    echo ""
    echo "💡 Alternative: Create the user manually in Supabase Dashboard"
    exit 1
fi

echo ""
echo "👤 Updating profile to admin role..."

# Update profile and customer using REST API (PostgREST)
UPDATE_RESPONSE=$(curl -s -X PATCH "${API_URL}/rest/v1/profiles?id=eq.${USER_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"role": "admin"}')

# Create or update customer record
CUSTOMER_RESPONSE=$(curl -s -X POST "${API_URL}/rest/v1/customers" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d "{\"user_id\": \"${USER_ID}\", \"name\": \"Edwin John\"}")

if [ $? -eq 0 ]; then
    echo "✅ Profile updated to admin"
    echo "✅ Customer record created/updated"
    echo ""
    echo "🎉 Admin user setup complete!"
    echo ""
    echo "📋 Login credentials:"
    echo "   Email: winbro2.ej@gmail.com"
    echo "   Password: Winbro2@admin"
else
    echo "⚠️  Could not update profile via API. Please update manually:"
    echo "   UPDATE public.profiles SET role = 'admin' WHERE id = '${USER_ID}';"
    echo "   INSERT INTO public.customers (user_id, name) VALUES ('${USER_ID}', 'Edwin John') ON CONFLICT (user_id) DO UPDATE SET name = 'Edwin John';"
fi

