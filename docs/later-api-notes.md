# Later.dev API Notes

## Base URL
```
https://getlate.dev/api/v1
```

## Authentication
- Bearer token: `Authorization: Bearer YOUR_API_KEY`

## Key Concepts

### Profiles
- Containers that group social media accounts together
- Think of them as "brands" or "projects"
- Each profile can have multiple connected social accounts

### Accounts
- Connected social media accounts (Twitter, Instagram, etc.)
- Accounts belong to profiles

### Posts
- Content to publish
- Can be scheduled to multiple accounts across different platforms

### Queue
- Optional posting schedule
- Recurring time slots (e.g., "Monday 9am, Wednesday 2pm")

## Supported Platforms
- Twitter/X
- Instagram (Feed, Stories, Reels, Carousels)
- Facebook (Page posts, Stories, videos)
- LinkedIn (Posts, images, video, PDF)
- TikTok (Videos, photo carousels)
- YouTube (Videos, Shorts)
- Pinterest (Single image/video per Pin)
- Reddit (Text posts, link posts)
- Bluesky (Text, images, videos)
- Threads (Text, images, videos)
- Google Business (Text with image)

## API Endpoints

### Create Profile
```bash
POST /profiles
{
  "name": "My First Profile",
  "description": "Testing the Late API"
}
```

### Connect Social Account
```bash
GET /connect/{platform}?profileId={profileId}&redirect_url={redirectUrl}&apiKey={apiKey}
```
Returns a JSON response with OAuth URL to authorize the account:
```json
{
  "authUrl": "https://www.instagram.com/oauth/authorize?...",
  "state": "..."
}
```

Platforms: twitter, instagram, facebook, linkedin, tiktok, youtube, pinterest, reddit, bluesky, threads, google_business

### List Accounts
```bash
GET /accounts
```

### Create Post
```bash
POST /posts
{
  "content": "Hello world!",
  "scheduledFor": "2024-01-16T12:00:00",
  "timezone": "Europe/Amsterdam",
  "platforms": [
    {
      "platform": "twitter",
      "accountId": "acc_xyz789"
    }
  ]
}
```

### Post with Media
```bash
POST /posts
{
  "content": "Check out this image!",
  "media": ["media_abc123"],
  "platforms": [...]
}
```

### Upload Media
```bash
POST /media
Content-Type: multipart/form-data
file: <binary>
```

### Post Status Options
- `scheduled` - Will publish at scheduledFor time
- `published` - Publish immediately (omit scheduledFor)
- `draft` - Save without publishing

## Rate Limits
| Plan | Requests per Minute |
|------|---------------------|
| Free | 60 |
| Build | 120 |
| Accelerate | 600 |
| Unlimited | 1,200 |

## Environment Variable Needed
```
LATE_API_KEY=your-api-key
```
