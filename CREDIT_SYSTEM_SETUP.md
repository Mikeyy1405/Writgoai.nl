# Credit-Based Pricing System - Implementation Guide

This guide will help you complete the setup of the credit-based pricing system for WritGo AI.

## 📋 Overview

The credit-based pricing system has been implemented with:
- ✅ 3 Stripe subscription packages (Starter €49, Pro €79, Enterprise €199)
- ✅ Credit tracking and deduction system
- ✅ Updated homepage with new pricing UI
- ✅ Dashboard credit display
- ✅ Billing management page
- ✅ API route credit checks

## 🚀 Setup Steps

### 1. Database Migration

Run the SQL migration in your Supabase SQL editor:

```bash
# The migration file is located at:
supabase_credit_system_migration.sql
```

This will create:
- `subscribers` table with credit fields
- `credit_usage_logs` table for tracking
- Necessary indexes and RLS policies

**To run:**
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase_credit_system_migration.sql`
4. Execute the SQL

### 2. Stripe Configuration

#### 2.1 Get Your Stripe Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)
3. Create a webhook endpoint (see section 2.3)

#### 2.2 Verify Product IDs

The following Stripe product/price IDs are configured:

```typescript
Starter: 
  - Product: prod_TWavMxIzCetTGr
  - Price: price_1ShHhdFIOSLx4Sb72B9SvWgF
  
Pro:
  - Product: prod_TWavIkuyNlIsXj
  - Price: price_1SZXjlFIOSLx4Sb7TzzqKcyH
  
Enterprise:
  - Product: prod_TWaw3ohDFnxM8b
  - Price: price_1SZXkCFIOSLx4Sb7UYgvmuRq
```

**Verify these exist in your Stripe dashboard at:**
https://dashboard.stripe.com/products

If they don't exist, create them or update `lib/stripe-config.ts` with your actual IDs.

#### 2.3 Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing Secret** (starts with `whsec_`)

#### 2.4 Add Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Make sure these are also set:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Enable Stripe Customer Portal

1. Go to https://dashboard.stripe.com/settings/billing/portal
2. Activate the customer portal
3. Configure what customers can do:
   - ✅ Update payment method
   - ✅ View invoice history
   - ✅ Cancel subscription
   - ❌ Update subscription (we handle this separately)

### 4. Test the Flow

#### 4.1 Test Checkout

1. Navigate to your homepage: `https://your-domain.com`
2. Click on a pricing package (use test mode)
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Verify:
   - Credits are added to database
   - User appears in `subscribers` table
   - `subscription_active` is true

#### 4.2 Test Credit Deduction

1. Generate an article through the dashboard
2. Check the API response includes `credits_used` and `credits_remaining`
3. Verify credits were deducted in the database
4. Check `credit_usage_logs` table for the log entry

#### 4.3 Test Credit Display

1. Check the dashboard sidebar shows current credit balance
2. Navigate to Settings page
3. Verify billing information displays correctly
4. Click "Manage Subscription" to test Stripe portal link

## 🔧 Configuration

### Adjusting Credit Costs

Edit `lib/credit-costs.ts` to change how many credits each action costs:

```typescript
export const CREDIT_COSTS = {
  article_short: 1,    // Change these values
  article_medium: 2,
  article_long: 3,
  // ...
};
```

### Adjusting Package Prices

Edit `lib/stripe-config.ts` and update Stripe product prices in your dashboard:

```typescript
export const STRIPE_PACKAGES = {
  starter: {
    price_eur: 49,    // Update price
    credits: 100,     // Update credits
    // ...
  },
};
```

**Important:** Also update the corresponding price in Stripe dashboard!

## 📊 Monitoring

### Check Subscriber Status

```sql
SELECT 
  user_id,
  subscription_tier,
  credits_remaining,
  monthly_credits,
  subscription_active,
  next_billing_date
FROM subscribers
WHERE subscription_active = true;
```

### Check Credit Usage

```sql
SELECT 
  user_id,
  action,
  credits_used,
  created_at
FROM credit_usage_logs
ORDER BY created_at DESC
LIMIT 100;
```

### Calculate Revenue

```sql
SELECT 
  subscription_tier,
  COUNT(*) as subscribers,
  SUM(monthly_credits) as total_credits
FROM subscribers
WHERE subscription_active = true
GROUP BY subscription_tier;
```

## 🐛 Troubleshooting

### Webhook Not Working

1. Check webhook URL is accessible publicly
2. Verify webhook secret in environment variables
3. Check Stripe webhook logs for errors
4. Ensure API route is not behind authentication

### Credits Not Deducting

1. Verify database migration ran successfully
2. Check `subscribers` table exists and has data
3. Look at API route logs for errors
3. Ensure user has an active subscription

### Checkout Redirect Issues

1. Verify `NEXT_PUBLIC_APP_URL` is set correctly
2. Check Stripe product/price IDs match
3. Ensure success/cancel URLs are accessible

## 📚 Additional Resources

- **Credit Costs Documentation**: `docs/CREDIT_COSTS.md`
- **Stripe API Docs**: https://stripe.com/docs/api
- **Supabase Docs**: https://supabase.com/docs

## 🎯 Testing Checklist

- [ ] Database migration completed
- [ ] Stripe keys added to environment
- [ ] Webhook endpoint configured
- [ ] Test checkout flow works
- [ ] Credits added after checkout
- [ ] Credits deducted on generation
- [ ] Dashboard shows credit balance
- [ ] Settings page displays billing info
- [ ] Stripe portal link works
- [ ] Webhook handles all events
- [ ] Insufficient credits shows error (402)

## 🚨 Security Notes

1. **Never commit** `.env.local` or `.env` files
2. Use **test mode** keys for development
3. Switch to **live mode** keys only in production
4. Protect webhook endpoint with signature verification (already implemented)
5. Use RLS policies on Supabase tables (already configured)

## 💡 Next Steps

After completing setup:

1. **Marketing**: Update marketing materials with new pricing
2. **Documentation**: Add credit costs to help center
3. **Analytics**: Set up tracking for conversion rates
4. **Support**: Prepare FAQs about credit system
5. **Testing**: Do thorough testing before launching

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Stripe dashboard for webhook errors
3. Check Supabase logs for database errors
4. Review Next.js console for API errors

## 📝 Notes

- Credits reset monthly on billing date
- Unused credits do NOT roll over
- All features available to all tiers (only credits differ)
- Profit margins: Starter 87%, Pro 80%, Enterprise 69%
- API costs averaged at €0.062 per credit for typical usage

Good luck with your launch! 🚀
