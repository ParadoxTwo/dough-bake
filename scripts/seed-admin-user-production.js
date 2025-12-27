#!/usr/bin/env node

/**
 * Script to seed admin user in production
 * Usage: node scripts/seed-admin-user-production.js
 * 
 * Requires environment variables:
 * - SUPABASE_URL (your production Supabase URL) or NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (your production service role key)
 * 
 * Optional environment variables:
 * - ADMIN_EMAIL (default: winbro2.ej@gmail.com)
 * - ADMIN_PASSWORD (default: Winbro2@admin)
 * - ADMIN_NAME (default: Edwin John)
 */

const https = require('https');
const http = require('http');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'winbro2.ej@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Winbro2@admin';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Edwin John';

async function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = client.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function createAdminUser() {
  console.log('🔐 Seeding Admin User (Production)');
  console.log('===================================\n');

  try {
    // Check if user already exists
    console.log('📧 Checking if user exists...');
    const checkResponse = await makeRequest(
      `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(ADMIN_EMAIL)}`,
      { method: 'GET' }
    );

    let userId;

    if (checkResponse.status === 200 && checkResponse.data.users && checkResponse.data.users.length > 0) {
      userId = checkResponse.data.users[0].id;
      console.log(`ℹ️  User already exists: ${userId}`);
    } else {
      // Create new user
      console.log('📧 Creating admin user...');
      const createResponse = await makeRequest(
        `${SUPABASE_URL}/auth/v1/admin/users`,
        {
          method: 'POST',
        },
        {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: {
            name: ADMIN_NAME,
          },
        }
      );

      if (createResponse.status === 200 || createResponse.status === 201) {
        userId = createResponse.data.id;
        console.log('✅ User created successfully');
        console.log(`   User ID: ${userId}`);
      } else {
        throw new Error(`Failed to create user: ${JSON.stringify(createResponse.data)}`);
      }
    }

    // Update profile to admin using REST API
    console.log('\n👤 Updating profile to admin role...');
    const updateProfileResponse = await makeRequest(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Prefer': 'return=representation',
        },
      },
      {
        role: 'admin',
      }
    );

    if (updateProfileResponse.status === 200 || updateProfileResponse.status === 204) {
      console.log('✅ Profile updated to admin');
    } else {
      console.warn('⚠️  Could not update profile via REST API. Status:', updateProfileResponse.status);
    }

    // Create or update customer record
    console.log('👤 Creating/updating customer record...');
    const customerResponse = await makeRequest(
      `${SUPABASE_URL}/rest/v1/customers`,
      {
        method: 'POST',
        headers: {
          'Prefer': 'resolution=merge-duplicates',
        },
      },
      {
        user_id: userId,
        name: ADMIN_NAME,
      }
    );

    if (customerResponse.status === 201 || customerResponse.status === 200) {
      console.log('✅ Customer record created/updated');
    } else {
      console.warn('⚠️  Could not create customer record. Status:', customerResponse.status);
      // Try update if insert failed
      const updateCustomerResponse = await makeRequest(
        `${SUPABASE_URL}/rest/v1/customers?user_id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Prefer': 'return=representation',
          },
        },
        {
          name: ADMIN_NAME,
        }
      );
      if (updateCustomerResponse.status === 200) {
        console.log('✅ Customer record updated');
      }
    }

    console.log('\n🎉 Admin user setup complete!');
    console.log('\n📋 Login credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n💡 If profile update failed, run this SQL in Supabase Dashboard:');
    console.log(`   UPDATE public.profiles SET role = 'admin' WHERE id = '${userId}';`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Alternative: Create the user manually in Supabase Dashboard:');
    console.error('   1. Go to Authentication > Users');
    console.error('   2. Click "Add User"');
    console.error('   3. Enter email and password');
    console.error('   4. Check "Auto Confirm User"');
    console.error('   5. Then run this SQL in the SQL Editor:');
    console.error(`      UPDATE public.profiles SET role = 'admin' WHERE email = '${ADMIN_EMAIL}';`);
    console.error(`      INSERT INTO public.customers (user_id, name) SELECT id, '${ADMIN_NAME}' FROM public.profiles WHERE email = '${ADMIN_EMAIL}' ON CONFLICT (user_id) DO UPDATE SET name = '${ADMIN_NAME}';`);
    process.exit(1);
  }
}

createAdminUser();
