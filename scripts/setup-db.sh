#!/bin/bash

# Database Setup Script for Dough Bake
# This script helps set up the local database schema for testing

echo "🥖 Dough Bake - Local Database Setup"
echo "======================================"
echo ""
echo "⚠️  Note: This sets up a local Postgres database for schema testing."
echo "    Your app connects to Supabase cloud for production."
echo ""

# Check if docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if database container is running
if ! docker ps | grep -q "dough-bake-db"; then
    echo "⚠️  Database container not found. Starting Docker services..."
    docker-compose up -d postgres
    echo "⏳ Waiting for database to start (10 seconds)..."
    sleep 10
fi

# Check if migration file exists
if [ ! -f "supabase/migrations/001_initial_schema.sql" ]; then
    echo "❌ Error: Migration file not found at supabase/migrations/001_initial_schema.sql"
    exit 1
fi

echo "📊 Running database migration on local database..."
echo ""
echo "⚠️  Note: This migration is designed for Supabase and may have some"
echo "    Supabase-specific features. For production, run this migration"
echo "    in your Supabase project SQL editor."
echo ""

# Execute migration
docker exec -i dough-bake-db psql -U postgres -d postgres < supabase/migrations/001_initial_schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Local database setup complete!"
    echo ""
    echo "Connection details:"
    echo "  Host: localhost"
    echo "  Port: 54322"
    echo "  Database: postgres"
    echo "  User: postgres"
    echo "  Password: your-super-secret-and-long-postgres-password"
    echo ""
    echo "⚠️  Remember: Your app uses Supabase cloud, not this local database."
    echo "    Run the migration in your Supabase project for production."
    echo ""
else
    echo ""
    echo "❌ Database setup failed. Check the error messages above."
    echo "    Note: Some Supabase-specific features may not work in plain Postgres."
    exit 1
fi
