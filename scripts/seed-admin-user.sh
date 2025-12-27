#!/bin/bash

# Script to seed admin user using Supabase Admin API
# This uses the service role key to create a user

echo "🔐 Seeding Admin User"
echo "===================="
echo ""

# Check if Supabase is running
if ! supabase status > /dev/null 2>&1; then
    echo "❌ Supabase is not running. Start it with: npm run supabase:start"
    exit 1
fi

# Get credentials from Supabase status (JSON format)
STATUS_JSON=$(supabase status --output json 2>/dev/null)

if [ -z "$STATUS_JSON" ]; then
    echo "❌ Could not get Supabase status. Make sure Supabase is running."
    exit 1
fi

# Parse JSON to get service role key and API URL
# Try using jq if available, otherwise use sed
if command -v jq > /dev/null 2>&1; then
    SERVICE_ROLE_KEY=$(echo "$STATUS_JSON" | jq -r '.SERVICE_ROLE_KEY')
    API_URL=$(echo "$STATUS_JSON" | jq -r '.API_URL')
else
    SERVICE_ROLE_KEY=$(echo "$STATUS_JSON" | sed -n 's/.*"SERVICE_ROLE_KEY":"\([^"]*\)".*/\1/p')
    API_URL=$(echo "$STATUS_JSON" | sed -n 's/.*"API_URL":"\([^"]*\)".*/\1/p')
fi

if [ -z "$SERVICE_ROLE_KEY" ] || [ "$SERVICE_ROLE_KEY" = "null" ]; then
    echo "❌ Could not get service role key. Make sure Supabase is running."
    exit 1
fi

if [ -z "$API_URL" ] || [ "$API_URL" = "null" ]; then
    echo "❌ Could not get API URL. Make sure Supabase is running."
    exit 1
fi

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
if echo "$RESPONSE" | grep -q "id"; then
    USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "✅ User created successfully"
    echo "   User ID: ${USER_ID}"
elif echo "$RESPONSE" | grep -q "already registered"; then
    echo "ℹ️  User already exists, updating profile..."
    # Get user ID by email
    USER_RESPONSE=$(curl -s -X GET "${API_URL}/auth/v1/admin/users?email=winbro2.ej@gmail.com" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
    USER_ID=$(echo "$USER_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
else
    echo "❌ Failed to create user:"
    echo "$RESPONSE" | head -5
    exit 1
fi

if [ -z "$USER_ID" ]; then
    echo "❌ Could not get user ID"
    exit 1
fi

echo ""
echo "👤 Updating profile to admin role..."

# Update profile to admin using SQL
supabase db execute "
UPDATE public.profiles
SET role = 'admin'
WHERE id = '${USER_ID}';

INSERT INTO public.customers (user_id, name)
VALUES ('${USER_ID}', 'Edwin John')
ON CONFLICT (user_id) DO UPDATE SET name = 'Edwin John';
" > /dev/null 2>&1

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
    echo "⚠️  Could not update profile. You may need to manually update:"
    echo "   UPDATE public.profiles SET role = 'admin' WHERE id = '${USER_ID}';"
fi

