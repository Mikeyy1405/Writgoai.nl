# Affiliate Opportunity Discovery System - Testing Guide

## Overview
This system automatically detects products and brands in generated content and finds affiliate programs using Perplexity Pro Sonar.

## How to Test

### 1. Database Setup
First, run the migration to create the `affiliate_opportunities` table:

```bash
# Connect to your Supabase project and run:
psql -h your-host -U postgres -d your-db -f supabase_affiliate_opportunities_migration.sql
```

Or use Supabase Dashboard:
1. Go to SQL Editor
2. Paste contents of `supabase_affiliate_opportunities_migration.sql`
3. Run the script

### 2. Test Product Detection

Test the `/api/affiliate/discover` endpoint:

```bash
curl -X POST http://localhost:3000/api/affiliate/discover \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "content": "In dit artikel bespreken we de beste smartphones van 2025. De iPhone 15 Pro van Apple biedt uitstekende prestaties, terwijl de Samsung Galaxy S24 Ultra een fantastisch scherm heeft. Voor WordPress hosting is Kinsta een uitstekende keuze, en voor SEO tools raden we Ahrefs en Semrush aan.",
    "auto_research": true
  }'
```

Expected response:
```json
{
  "success": true,
  "opportunities": [
    {
      "id": "uuid",
      "product_name": "iPhone 15 Pro",
      "brand_name": "Apple",
      "mentioned_at": "Begin artikel",
      "context": "...de iPhone 15 Pro van Apple biedt uitstekende prestaties...",
      "status": "researching",
      "affiliate_programs": [
        {
          "network": "Awin",
          "type": "affiliate_network",
          "signup_url": "https://...",
          "commission": "1-5%",
          "cookie_duration": "30 days"
        }
      ]
    }
  ],
  "total_detected": 5,
  "total_created": 5
}
```

### 3. Test Manual Research

```bash
curl -X POST http://localhost:3000/api/affiliate/research \
  -H "Content-Type: application/json" \
  -d '{
    "opportunity_id": "OPPORTUNITY_UUID"
  }'
```

Or research a product directly:
```bash
curl -X POST http://localhost:3000/api/affiliate/research \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Ahrefs",
    "brand_name": "Ahrefs"
  }'
```

### 4. Test Opportunities List

```bash
curl "http://localhost:3000/api/affiliate/opportunities?project_id=YOUR_PROJECT_ID"
```

### 5. Test Status Update

```bash
curl -X PATCH http://localhost:3000/api/affiliate/opportunities \
  -H "Content-Type: application/json" \
  -d '{
    "opportunity_id": "OPPORTUNITY_UUID",
    "status": "signed_up",
    "notes": "Registered on Awin network"
  }'
```

### 6. Test Article Generation Integration

Generate an article and check if opportunities are automatically created:

1. Go to `/dashboard/content-plan`
2. Create a new article about "beste smartphones 2025"
3. After generation, check `/dashboard/affiliate-opportunities`
4. You should see automatically detected opportunities

### 7. Test UI Components

#### Dashboard Card
1. Go to `/dashboard`
2. You should see a purple "Affiliate Opportunities" card with count
3. Click to navigate to opportunities page

#### Full Opportunities Page
1. Go to `/dashboard/affiliate-opportunities`
2. Check stats cards at the top
3. Test filter buttons (All, Ontdekt, Onderzoek, etc.)
4. Test action buttons:
   - Research More
   - Sign Up
   - Mark Active
   - Dismiss

#### Project Settings
1. Open a project
2. Go to Settings
3. Click "💼 Affiliate Discovery" tab
4. Toggle auto-detection on/off
5. Toggle auto-research on/off
6. Add items to blacklist (e.g., "Facebook", "Google Ads")
7. Add items to whitelist (e.g., "Apple", "Samsung")
8. Save settings

## Test Scenarios

### Scenario 1: Tech Article
Content about: "Beste smartphones, laptops, WordPress plugins"
Expected Products:
- iPhone, Samsung Galaxy, MacBook
- WordPress, Yoast SEO, WooCommerce
- Various tech products

### Scenario 2: SEO Tools Article
Content about: "Top SEO tools voor 2025"
Expected Products:
- Ahrefs
- Semrush
- Moz
- SE Ranking
- SurferSEO

### Scenario 3: Hosting Article
Content about: "Beste WordPress hosting"
Expected Products:
- Kinsta
- WP Engine
- SiteGround
- Cloudways

### Scenario 4: E-commerce Article
Content about: "Shopify vs WooCommerce"
Expected Products:
- Shopify
- WooCommerce
- Stripe
- PayPal

## Performance Tests

### Cache Testing
1. Research the same product twice
2. Second request should use cache (check console logs)
3. Cache should persist for 24 hours

### Rate Limiting
1. Make 61+ requests to research endpoint within 1 minute
2. Should get rate limit error after 60 requests
3. Wait 1 minute, requests should work again

## Expected Behavior

### On Article Generation
1. Article is generated and saved
2. Product detection runs automatically
3. If products found, opportunities are created
4. If auto_research is enabled, Perplexity is called
5. Affiliate programs are saved to opportunities
6. Process is non-blocking (doesn't fail article generation)

### Product Detection Accuracy
- Should detect specific product names (iPhone 15, Samsung S24)
- Should detect brand names (Apple, Samsung)
- Should ignore generic terms (smartphone, computer)
- Should extract relevant context (surrounding text)
- Should score opportunities based on relevance

### Perplexity Research
- Should find affiliate networks (Awin, Tradedoubler, Daisycon, CJ)
- Should find direct programs
- Should include commission info
- Should include cookie duration
- Should provide signup URLs
- Should focus on NL/EU networks

### UI/UX
- Clean, modern dark theme interface
- Intuitive status indicators
- Easy filtering and searching
- Clear action buttons
- Responsive design
- Real-time updates

## Troubleshooting

### No Products Detected
- Check if content contains actual product/brand names
- Verify AIML_API_KEY is set correctly
- Check console logs for AI errors

### Research Fails
- Verify Perplexity Pro Sonar model is available
- Check AIML_API_KEY permissions
- Look for rate limit errors
- Check internet connectivity

### Opportunities Not Showing
- Verify table was created correctly
- Check project_id is correct
- Ensure user has access to project
- Check browser console for errors

### Build Errors
- Run `npm install` to ensure dependencies
- Check TypeScript errors with `npx tsc --noEmit`
- Verify all imports are correct

## Success Criteria

✅ Database migration runs without errors
✅ Product detection identifies relevant products
✅ Perplexity research finds affiliate programs
✅ API endpoints respond correctly
✅ UI components render properly
✅ Article generation integration works
✅ Dashboard card displays count
✅ Settings tab allows customization
✅ All TypeScript checks pass
✅ Non-blocking implementation (doesn't break article gen)

## Notes

- Affiliate discovery is non-blocking and won't fail article generation
- Perplexity calls are cached for 24 hours to reduce API costs
- Rate limiting is set to 60 requests per minute
- All opportunities are project-scoped for multi-tenancy
- Status workflow: discovered → researching → signed_up → active
