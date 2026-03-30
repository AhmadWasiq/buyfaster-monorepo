# Stripe Payment Integration Setup

This guide will help you set up Stripe payments in your Buyfaster application.

## 🛠️ Setup Instructions

### 1. Environment Variables

⚠️ **IMPORTANT**: Use **LIVE** (production) keys for real payments, not test keys!

Create a `.env.local` file in your project root with the following variables:

```env
# Stripe Configuration - USE LIVE KEYS FOR PRODUCTION
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here

# Vite Environment Variables (for frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here

# Optional: Supabase for production data
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**🔴 CRITICAL SECURITY WARNING:**
- **NEVER** use `pk_test_` or `sk_test_` keys for production
- **NEVER** commit your `.env.local` file to version control
- **ONLY** use live keys (`pk_live_` and `sk_live_`) for real payments

### 2. Stripe Account Setup

#### For Production Payments:
1. **Create a Stripe account** at [stripe.com](https://stripe.com)
2. **Complete account verification** - Stripe requires business verification for live payments
3. **Enable live mode** in your Stripe dashboard
4. **Navigate to API keys section** in your dashboard
5. **Copy your LIVE keys** (not test keys):
   - **Publishable key**: starts with `pk_live_`
   - **Secret key**: starts with `sk_live_`
6. **Add live keys** to your `.env.local` file

#### Account Verification Requirements:
- Business information
- Tax ID (if applicable)
- Bank account details
- Identity verification
- Business address confirmation

**Note**: Stripe may take 24-48 hours to approve your account for live payments.

### 3. Enable PayPal in Stripe Dashboard (Required for PayPal Integration)

**Important:** PayPal integration requires enabling PayPal in your Stripe dashboard before it will work.

#### For Production PayPal:
1. **Log into your Stripe Dashboard** at [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Ensure you're in LIVE mode** (not test mode)
3. **Go to Settings** → **Payment methods**
4. **Enable PayPal** by toggling it on
5. **Complete PayPal onboarding**:
   - Connect your PayPal Business account
   - Verify your PayPal account status
   - Set up merchant details
6. **Configure PayPal settings**:
   - Set up your business branding
   - Configure return URLs (optional)
   - Set up payment notifications
7. **Save changes**

#### PayPal Production Requirements:
- **PayPal Business Account**: Must be verified and active
- **Account Matching**: Your Stripe business details must match PayPal
- **Country Support**: PayPal availability depends on your region
- **Additional Verification**: May require additional business documentation

**Note:** PayPal integration may take 24-48 hours to activate in production. Test in Stripe's test mode first.

### 4. Supabase Configuration (Optional)

The app includes Supabase integration for data persistence. If you want to use Supabase:

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Add environment variables**:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. **Create a test table** in your Supabase database:
   ```sql
   CREATE TABLE test (id SERIAL PRIMARY KEY);
   ```
4. **Note**: If Supabase is not configured, the app will automatically fall back to local test data.

### 5. Deployment Configuration

The app has been updated to use React 18.3.1 for Stripe compatibility. The Vercel deployment should now work without dependency conflicts. The `vercel.json` has been configured with `--legacy-peer-deps` to handle any remaining dependency issues.

### 6. PayPal Integration Features

The PayPal integration is now **fully functional** through Stripe's PaymentElement! Here's how it works:

- **Automatic Detection**: The PaymentElement automatically shows PayPal as an option if enabled in Stripe
- **Seamless Flow**: Users click PayPal, get redirected to PayPal for authentication, then return to your site
- **Production Ready**: Works with live PayPal accounts for real payments
- **No Extra Code**: Everything is handled by Stripe's PaymentElement - no custom PayPal integration needed
- **Supported Regions**: PayPal is available in regions where Stripe supports it

### 7. Production Testing and Verification

#### Before Going Live:
1. **Test with Stripe Test Mode First**:
   - Use test keys (`pk_test_` and `sk_test_`)
   - Test card payments with `4242 4242 4242 4242`
   - Test PayPal flow (if available in test mode)

2. **Switch to Live Mode**:
   - Replace test keys with live keys
   - Test with small amounts first
   - Verify PayPal integration works

3. **Console Warnings**:
   - The app will show warnings in browser console if test keys are detected
   - Check server logs for Stripe key warnings

#### Production Verification Checklist:
- [ ] Live Stripe keys configured (`pk_live_` and `sk_live_`)
- [ ] PayPal enabled in Stripe dashboard
- [ ] PayPal business account connected and verified
- [ ] Stripe account fully verified for live payments
- [ ] Test payments successful with small amounts
- [ ] No console warnings about test keys
- [ ] Run `npm run validate-production` to check setup

#### Validation Script:
Run this command to validate your production setup:
```bash
npm run validate-production
```
This script will check your environment variables and warn you about any test keys or configuration issues.

## 📁 Files Added/Modified

### New Files:
- `src/components/PaymentPage.tsx` - Main payment page with address form and payment options
- `src/components/PaymentSuccessPage.tsx` - Payment success confirmation page
- `api/create-payment-intent.ts` - API endpoint for creating Stripe payment intents
- `api/stripe-payments.ts` - Complete Stripe API handlers (reference implementation)

### Modified Files:
- `package.json` - Added Stripe dependencies
- `src/components/OCRShoppingFlow.tsx` - Integrated payment flow
- `src/App.tsx` - Will need routing updates if you want direct access to payment pages

## 🔄 Payment Flow

1. **Shopping Cart Confirmation** - User confirms their grocery list
2. **Shipping Address** - User enters delivery address
3. **Payment Method** - User selects card or PayPal (PayPal shows error currently)
4. **Card Details** - User enters card information via Stripe Elements
5. **Payment Processing** - Stripe processes the payment securely
6. **Success Page** - User sees confirmation and order details

## 🎯 Features Implemented

### ✅ Completed
- **Stripe Elements integration** - Secure card input fields
- **Address collection** - Full shipping address form
- **Payment intent creation** - Server-side payment setup
- **Error handling** - Comprehensive error messages
- **Success page** - Order confirmation with auto-redirect
- **Mobile responsive** - Works on all screen sizes
- **Loading states** - User feedback during processing

### 🚧 Pending/Future Enhancements
- **PayPal implementation** - Currently shows error message
- **Saved cards** - Customer can save cards for future purchases
- **Multiple payment methods** - Apple Pay, Google Pay integration
- **Order persistence** - Save orders to database after payment
- **Email confirmations** - Send receipts via email
- **Taxes calculation** - Dynamic tax based on location

## 💡 Usage

Once set up, the payment integration will automatically work when users:

1. Use voice shopping or OCR to create a shopping list
2. Confirm their list of products
3. Click "Confirm & Buy" - this will redirect to the payment page
4. Fill in shipping address and payment details
5. Complete the purchase

## 🐛 Troubleshooting

### Production Issues:

1. **"Test Mode Active" warning shows** - You're using test keys (`pk_test_`) instead of live keys (`pk_live_`)
2. **PayPal not showing** - PayPal not enabled in live Stripe dashboard or PayPal account not verified
3. **Payments failing** - Stripe account not fully verified for live payments
4. **"Account not eligible"** - Your region/country may not support PayPal through Stripe

### Common Issues:

1. **"Failed to initialize payment"** - Check that your Stripe secret key is correctly set in environment variables
2. **Card element not showing** - Verify your Stripe publishable key is set correctly
3. **Payment fails** - Check browser console for detailed error messages
4. **React version conflict** - Use `npm install --legacy-peer-deps` if you encounter peer dependency issues

### Switching from Test to Live Mode:

1. **Update environment variables**:
   ```bash
   # Replace test keys with live keys
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

2. **Enable PayPal in live mode**:
   - Go to Stripe dashboard → Settings → Payment methods
   - Ensure PayPal is enabled for live mode

3. **Test with small amounts**:
   - Use real cards but small amounts ($1-5) first
   - Test PayPal flow with your PayPal account

4. **Monitor payments**:
   - Check Stripe dashboard for payment status
   - Verify webhooks if you have them configured

### Debug Mode:
- Payment errors are logged to the browser console
- Server logs show Stripe key warnings
- Open DevTools to see detailed error information
- Check Vercel function logs for API errors

## 🔒 Security & Legal Notes

### Security:
- **Never commit** your `.env.local` file or expose secret keys
- **Use test keys** during development and testing
- **Switch to live keys** only when ready for production
- **All card information** is handled securely by Stripe - never touches your servers
- **Payment processing** is PCI compliant through Stripe

### Legal & Compliance (Production):
- **Business Registration**: Ensure your business is properly registered
- **Terms of Service**: Have clear terms for your payment processing
- **Privacy Policy**: Include data handling and payment information policies
- **Refund Policy**: Define clear refund and dispute resolution processes
- **Tax Compliance**: Handle tax collection appropriately for your region
- **Consumer Protection**: Comply with consumer protection laws in your market

### Production Checklist:
- [ ] Business legally registered and compliant
- [ ] Privacy policy and terms of service published
- [ ] Refund policy clearly stated
- [ ] Tax collection properly configured
- [ ] Customer support contact information available
- [ ] SSL certificate properly configured
- [ ] GDPR/CCPA compliance if applicable

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Test with Stripe's test cards: `4242 4242 4242 4242`
4. Review Stripe's documentation for additional troubleshooting
