# Branding System Migration Guide

## Overview
This guide provides instructions for migrating the database and using the new centralized branding system.

## Database Migration

### Step 1: Run Prisma Migration
The BrandSettings model has been added to the Prisma schema. To apply this migration in your production environment:

```bash
cd nextjs_space
npx prisma migrate deploy
```

Or for development:
```bash
npx prisma migrate dev --name add_brand_settings
```

### Step 2: Initialize Default Settings
The system will automatically create default brand settings on first access. However, you can also manually insert them:

```sql
INSERT INTO "BrandSettings" (
  id,
  "companyName",
  tagline,
  "logoUrl",
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "updatedAt"
) VALUES (
  'default',
  'WritgoAI',
  'Content die scoort',
  '/writgo-media-logo.png',
  '#FF6B35',
  '#0B3C5D',
  '#FF9933',
  NOW()
) ON CONFLICT (id) DO NOTHING;
```

## Using the Branding System

### For Admins
1. Navigate to the Admin Panel
2. Click on "Branding" in the sidebar
3. Configure your brand settings:
   - Upload logos (main, light mode, dark mode)
   - Set your color scheme
   - Add company information
   - Configure social media links
4. Click "Save" to apply changes
5. The page will reload to show your new branding

### For Developers

#### Using the BrandLogo Component
```tsx
import { BrandLogo } from '@/components/brand/brand-logo';

// Full logo with large size
<BrandLogo variant="full" size="lg" />

// Icon only
<BrandLogo variant="icon" size="md" />

// Text only
<BrandLogo variant="text" size="sm" />

// With tagline
<BrandLogo variant="full" size="xl" showTagline={true} />
```

#### Using Brand Context
```tsx
import { useBrand } from '@/lib/brand-context';

function MyComponent() {
  const brand = useBrand();
  
  return (
    <div>
      <h1>{brand.companyName}</h1>
      <p style={{ color: brand.primaryColor }}>
        {brand.tagline}
      </p>
    </div>
  );
}
```

#### CSS Variables
Brand colors are automatically injected as CSS variables:
```css
/* Available variables */
--brand-primary-color
--brand-secondary-color
--brand-accent-color

/* Usage */
.my-button {
  background-color: var(--brand-primary-color);
}
```

## API Endpoints

### Public Endpoint
```
GET /api/brand
```
Returns current brand settings (cached for 1 hour). No authentication required.

### Admin Endpoints
```
GET /api/admin/branding
PUT /api/admin/branding
POST /api/admin/branding/upload
```
Requires admin authentication (role='admin').

## Features

### Logo Management
- **Main Logo**: Primary logo with transparent background (PNG recommended)
- **Light Mode Logo**: Optional logo optimized for dark backgrounds
- **Dark Mode Logo**: Optional logo optimized for light backgrounds
- **Icon Logo**: Square icon version for favicons and small spaces
- **Favicon**: Automatic generation of 32x32, 192x192, 512x512 versions

### Color Scheme
- **Primary Color**: Main brand color (#FF6B35 default)
- **Secondary Color**: Supporting brand color (#0B3C5D default)
- **Accent Color**: Highlight color (#FF9933 default)

### Company Information
- Company name and tagline
- Contact email, phone, and address
- Social media profile links (LinkedIn, Twitter, Facebook, Instagram)

### Live Preview
The admin interface includes a live preview panel showing:
- Header appearance with new logo
- Color palette visualization
- Button preview with primary color

## Backwards Compatibility

The system is fully backwards compatible:
- If no custom settings are configured, defaults to existing WritgoAI branding
- Fallback to default logo (`/writgo-media-logo.png`) if uploads fail
- All existing components updated to use the centralized system

## Caching

Brand settings are cached for performance:
- In-memory cache with 1-hour TTL
- API responses include cache headers
- Automatic cache invalidation on settings update

## Troubleshooting

### Logo Not Showing
1. Check if the logo was uploaded successfully
2. Verify the file is accessible in S3/storage
3. Check browser console for errors
4. Clear cache and reload

### Colors Not Updating
1. Ensure settings were saved successfully
2. Reload the page to re-inject CSS variables
3. Check if custom CSS is overriding brand colors

### Admin Access
Only users with `role: 'admin'` can access branding settings. Check user permissions in the database.

## Migration Checklist

- [ ] Run database migration
- [ ] Verify default settings are created
- [ ] Test logo upload functionality
- [ ] Configure custom branding in admin panel
- [ ] Test all pages with new branding
- [ ] Verify caching is working
- [ ] Test backwards compatibility
- [ ] Update favicon in production
- [ ] Clear CDN cache if applicable
