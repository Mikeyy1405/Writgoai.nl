# Social Media Setup Guide

This guide explains how to set up and troubleshoot the social media posting functionality in WritGo.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Supabase Storage Configuration](#supabase-storage-configuration)
3. [Late.dev Integration](#latedev-integration)
4. [Autopilot Configuration](#autopilot-configuration)
5. [Troubleshooting](#troubleshooting)

## Environment Setup

### Required Environment Variables

Add these to your `.env.local` file (or Vercel environment variables):

```bash
# Supabase (required for image storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AIML API (required for image generation)
# Get your API key from https://aimlapi.com
AIML_API_KEY=your-aiml-api-key

# Unsplash (optional - fallback for image generation)
# Get your access key from https://unsplash.com/developers
UNSPLASH_ACCESS_KEY=your-unsplash-access-key

# Late.dev (required for social media posting)
# Get your API key from https://getlate.dev/dashboard/api
LATE_API_KEY=your-late-api-key

# Cron Jobs (required for autopilot)
# Generate with: openssl rand -base64 32
CRON_SECRET=your-secure-random-string

# App URL (required)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Supabase Storage Configuration

### 1. Create Storage Bucket

The app will automatically create the `social-media-images` bucket when first needed, but you can also create it manually:

1. Go to your Supabase Dashboard
2. Navigate to Storage
3. Click "Create Bucket"
4. Name: `social-media-images`
5. Set as **Public** bucket
6. File size limit: 10MB
7. Allowed MIME types: `image/png`, `image/jpeg`, `image/jpg`, `image/webp`, `image/gif`

### 2. Verify Bucket Permissions

Make sure the bucket is set to **public** so that images can be accessed by external services like Late.dev.

To check/update bucket policies:

```sql
-- Check current policies
SELECT * FROM storage.buckets WHERE name = 'social-media-images';

-- Make bucket public if needed
UPDATE storage.buckets
SET public = true
WHERE name = 'social-media-images';
```

### 3. Image Storage Structure

Images are organized in the following folder structure:

```
social-media-images/
  └── social/
      └── 2024/
          └── 12/
              └── 1735123456789_social-1735123456789.png
```

This structure helps organize images by year and month for easier management.

## Late.dev Integration

### 1. Get API Key

1. Sign up at https://getlate.dev
2. Go to Dashboard → API
3. Create an API key
4. Add it to your environment variables as `LATE_API_KEY`

### 2. Connect Social Accounts

1. In WritGo dashboard, go to Social Media
2. Select your project
3. Click "Activeer Social Media" if not activated
4. Click "Koppel Account" for each platform you want to connect
5. Follow the OAuth flow to authorize each platform

### 3. Supported Platforms

- Instagram (requires images)
- Facebook
- Twitter/X
- LinkedIn
- TikTok (requires videos)
- Threads
- Bluesky
- Pinterest
- YouTube
- Reddit

**Note:** Instagram and TikTok require media (images/videos) for all posts.

## Autopilot Configuration

### 1. Cron Job Setup

The autopilot runs via a Vercel Cron job configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/social-autopilot",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs every hour. The cron schedule format is:

```
┌─────────── minute (0 - 59)
│ ┌───────── hour (0 - 23)
│ │ ┌─────── day of month (1 - 31)
│ │ │ ┌───── month (1 - 12)
│ │ │ │ ┌─── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
0 * * * *
```

Examples:
- `0 * * * *` - Every hour at minute 0
- `0 9,15,21 * * *` - At 9 AM, 3 PM, and 9 PM
- `0 9-17 * * 1-5` - Every hour from 9 AM to 5 PM on weekdays

### 2. Enable Autopilot

1. Go to Social Media → Automatisering tab
2. Configure your settings:
   - **Frequency:** How often to post (daily, twice daily, etc.)
   - **Post Times:** What times to post (e.g., 09:00, 15:00, 21:00)
   - **Post Types:** Which types of posts to rotate (storytelling, educational, etc.)
   - **Auto Publish:** Whether to publish immediately or save as draft
   - **Target Platforms:** Which platforms to post to
3. Click "Opslaan" to save your configuration
4. The autopilot will start running on the next scheduled hour

### 3. Manual Trigger (Testing)

To test the autopilot without waiting for the cron:

```bash
# Local testing
curl -X GET 'http://localhost:3000/api/cron/social-autopilot' \
  -H 'Authorization: Bearer YOUR_CRON_SECRET'

# Production testing
curl -X GET 'https://your-domain.com/api/cron/social-autopilot' \
  -H 'Authorization: Bearer YOUR_CRON_SECRET'
```

## Troubleshooting

### Issue: Images not showing or publishing fails

**Symptoms:**
- Images appear in dashboard but fail when publishing
- Error: "Image URL not accessible" or 403/404 errors
- Instagram posts fail with media requirement error

**Causes:**
1. Supabase bucket doesn't exist or is not public
2. AIML API not configured (images can't be generated)
3. Image storage failed but error was masked (older version)
4. Temporary AIML URLs expired before being saved

**Solutions:**

1. **Check Supabase bucket exists and is public:**
   ```sql
   SELECT * FROM storage.buckets WHERE name = 'social-media-images';
   ```

2. **Verify AIML API key is set:**
   ```bash
   # Check in Vercel dashboard or .env.local
   echo $AIML_API_KEY
   ```

3. **Check application logs for image generation errors:**
   Look for these log messages:
   - `🎨 Generating image with AIML...`
   - `📥 Temporary image URL received:`
   - `💾 Saving to permanent storage...`
   - `✅ Image saved permanently:`

4. **Regenerate posts with failed images:**
   - Delete the post with the broken image
   - Generate a new post - images will be saved properly with the updated code

### Issue: Autopilot not generating posts

**Symptoms:**
- No posts appear even though autopilot is enabled
- Schedule shows "next run" time but nothing happens

**Causes:**
1. CRON_SECRET not configured
2. Vercel cron not deployed
3. Schedule not saved properly
4. Connected accounts missing

**Solutions:**

1. **Verify CRON_SECRET is set:**
   - Check Vercel environment variables
   - Generate new secret: `openssl rand -base64 32`

2. **Check Vercel cron deployment:**
   - Go to Vercel Dashboard → Your Project → Cron
   - Verify the cron job appears and is enabled
   - Check recent executions and logs

3. **Verify schedule configuration:**
   ```sql
   SELECT * FROM social_schedules WHERE enabled = true;
   ```

4. **Check connected accounts:**
   ```sql
   SELECT * FROM social_accounts WHERE connected = true;
   ```

5. **Manual test the cron endpoint:**
   ```bash
   curl -X GET 'https://your-domain.com/api/cron/social-autopilot' \
     -H 'Authorization: Bearer YOUR_CRON_SECRET'
   ```

### Issue: Posts generate but won't publish

**Symptoms:**
- Posts appear in dashboard with status "draft"
- Publish button shows error

**Causes:**
1. Late.dev API not configured
2. No connected accounts for selected platforms
3. Image issues (see above)

**Solutions:**

1. **Verify LATE_API_KEY is set:**
   ```bash
   echo $LATE_API_KEY
   ```

2. **Check connected accounts:**
   - Go to Social Media dashboard
   - Click "Koppel Account" for each platform
   - Verify accounts show as "Connected"

3. **Check Late.dev dashboard:**
   - Go to https://getlate.dev/dashboard
   - Verify accounts are connected there
   - Check for any API usage limits or errors

### Issue: Strategy generation fails

**Symptoms:**
- "Genereer Strategie" button fails or hangs
- No strategy appears after clicking

**Causes:**
1. AIML API key missing or invalid
2. Website URL not accessible
3. Perplexity API issues

**Solutions:**

1. **Verify AIML_API_KEY:**
   - The app uses AIML API for both Perplexity and Claude
   - Check your AIML dashboard for API usage and limits

2. **Check website URL:**
   - Make sure the project's website URL is valid and accessible
   - The strategy generator analyzes the website content

3. **Check console logs:**
   - Look for specific error messages about API calls

## Support

For additional help:
- Check server logs in Vercel dashboard
- Review Supabase logs for storage errors
- Check Late.dev dashboard for posting errors
- Verify all environment variables are correctly set

## Architecture Overview

### Image Generation Flow

```
1. User clicks "Generate Post" or Autopilot triggers
2. AI generates post content using Claude (via AIML)
3. AI generates image prompt based on content
4. AIML Flux Pro generates image → temporary URL
5. Download image from temporary URL
6. Upload to Supabase Storage → permanent URL
7. Save post with permanent URL to database
8. Post appears in dashboard
```

### Publishing Flow

```
1. User clicks "Publish" on a post
2. Verify image URL is accessible
3. Download image from Supabase Storage
4. Upload image to Late.dev (presigned URL)
5. Create post on Late.dev with media
6. Late.dev publishes to connected platforms
7. Update post status in database
```

### Autopilot Flow

```
1. Vercel Cron triggers every hour
2. Check for enabled schedules with next_run_at <= now
3. For each due schedule:
   a. Select post type (rotation)
   b. Choose topic from content ideas
   c. Generate post with image
   d. If auto_publish: publish immediately
   e. Else: save as draft/scheduled
4. Update last_run_at and calculate next_run_at
```
