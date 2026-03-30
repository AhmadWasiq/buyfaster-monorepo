#!/usr/bin/env node

/**
 * Production Setup Validation Script
 * Run this script to verify your Stripe and PayPal setup for production payments
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for environment file
const envPath = path.join(__dirname, '.env.local');
let envExists = false;
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
  envExists = true;
} catch (error) {
  console.log('❌ No .env.local file found');
  process.exit(1);
}

console.log('🔍 Validating Production Payment Setup...\n');

// Check Stripe keys
const stripePublishableMatch = envContent.match(/VITE_STRIPE_PUBLISHABLE_KEY=(.+)/);
const stripeSecretMatch = envContent.match(/STRIPE_SECRET_KEY=(.+)/);

let stripePublishableKey = '';
let stripeSecretKey = '';

if (stripePublishableMatch) {
  stripePublishableKey = stripePublishableMatch[1].trim();
  console.log(`✅ Found Stripe Publishable Key: ${stripePublishableKey.substring(0, 10)}...`);
} else {
  console.log('❌ VITE_STRIPE_PUBLISHABLE_KEY not found in .env.local');
}

if (stripeSecretMatch) {
  stripeSecretKey = stripeSecretMatch[1].trim();
  console.log(`✅ Found Stripe Secret Key: ${stripeSecretKey.substring(0, 10)}...`);
} else {
  console.log('❌ STRIPE_SECRET_KEY not found in .env.local');
}

// Validate key formats
console.log('\n🔐 Key Validation:');

if (stripePublishableKey.startsWith('pk_live_')) {
  console.log('✅ Publishable key is LIVE (pk_live_...)');
} else if (stripePublishableKey.startsWith('pk_test_')) {
  console.log('⚠️  Publishable key is TEST (pk_test_...) - Switch to live key for production');
} else if (stripePublishableKey) {
  console.log('❌ Invalid publishable key format');
}

if (stripeSecretKey.startsWith('sk_live_')) {
  console.log('✅ Secret key is LIVE (sk_live_...)');
} else if (stripeSecretKey.startsWith('sk_test_')) {
  console.log('⚠️  Secret key is TEST (sk_test_...) - Switch to live key for production');
} else if (stripeSecretKey) {
  console.log('❌ Invalid secret key format');
}

// Check for Supabase (optional)
const supabaseUrlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

console.log('\n🗄️  Database Configuration:');
if (supabaseUrlMatch && supabaseKeyMatch) {
  console.log('✅ Supabase configuration found');
} else {
  console.log('⚠️  Supabase not configured - app will use local test data');
}

// Summary
console.log('\n📊 Setup Summary:');
const isLivePublishable = stripePublishableKey.startsWith('pk_live_');
const isLiveSecret = stripeSecretKey.startsWith('sk_live_');

if (isLivePublishable && isLiveSecret) {
  console.log('🎉 PRODUCTION READY: Both keys are live - real payments will be processed');
  console.log('\n📋 Next Steps:');
  console.log('1. Enable PayPal in your Stripe dashboard (live mode)');
  console.log('2. Test with small amounts first');
  console.log('3. Deploy to production');
} else if (stripePublishableKey && stripeSecretKey) {
  console.log('🧪 TEST MODE: Using test keys - no real payments will be processed');
  console.log('\n📋 To go live:');
  console.log('1. Get live keys from Stripe dashboard');
  console.log('2. Replace pk_test_ and sk_test_ keys with pk_live_ and sk_live_');
  console.log('3. Run this script again to verify');
} else {
  console.log('❌ SETUP INCOMPLETE: Missing Stripe keys');
}

console.log('\n🔗 Useful Links:');
console.log('- Stripe Dashboard: https://dashboard.stripe.com/');
console.log('- PayPal Setup: https://dashboard.stripe.com/settings/payment_methods');
console.log('- API Keys: https://dashboard.stripe.com/apikeys');

console.log('\n✨ Validation complete!');
