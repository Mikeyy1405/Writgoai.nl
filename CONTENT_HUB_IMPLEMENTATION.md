# Content Hub - Implementation Guide

## 🎯 Overview

The Content Hub is a unified content workflow system that replaces 5 separate tools with one comprehensive solution:

- ❌ `/client-portal/blog-generator` → ✅ `/client-portal/content-hub`
- ❌ `/client-portal/topical-mapping` → ✅ `/client-portal/content-hub`
- ❌ `/client-portal/content-research` → ✅ `/client-portal/content-hub`
- ❌ `/client-portal/auto-writer` → ✅ `/client-portal/content-hub`
- ❌ `/client-portal/content-library` → ✅ `/client-portal/content-hub`

## 🚀 Features

### 1. WordPress Integration
- Connect WordPress sites via REST API
- Test connections before saving
- Store credentials securely (TODO: Add encryption)
- Manage multiple sites per client

### 2. Topical Authority Mapping
- Auto-generate 400-500+ article ideas
- Organize into topical clusters
- Priority scoring based on:
  - Search volume
  - Keyword difficulty
  - Commercial intent
  - Content gaps vs competitors

### 3. One-Click Article Generation
Complete workflow in one click:
1. **Research Phase**: SERP analysis, competitor research, sources
2. **Writing Phase**: AI-generated content with SEO optimization
3. **SEO Phase**: Meta tags, schema markup, internal links, featured images
4. **Publishing Phase**: Direct to WordPress with proper categorization

### 4. Batch Processing
- Select multiple articles
- Generate all at once
- Progress tracking for each article
- Queue-based processing

## 📁 File Structure

```
nextjs_space/
├── app/
│   ├── api/content-hub/
│   │   ├── connect-wordpress/route.ts    # WordPress connection management
│   │   ├── generate-map/route.ts         # Topical map generation
│   │   ├── write-article/route.ts        # Article generation
│   │   └── publish-wordpress/route.ts    # WordPress publishing
│   └── client-portal/content-hub/
│       ├── page.tsx                      # Main hub page
│       └── components/
│           ├── website-connector.tsx     # WordPress setup
│           ├── topical-map-view.tsx      # Article clusters
│           ├── article-row.tsx           # Individual article
│           ├── article-generator.tsx     # Generation UI
│           ├── cluster-card.tsx          # Cluster display
│           ├── batch-generator.tsx       # Batch processing
│           ├── progress-tracker.tsx      # Progress display
│           └── published-content.tsx     # Published articles
├── lib/content-hub/
│   ├── wordpress-client.ts               # WordPress REST API
│   ├── serp-analyzer.ts                  # SERP analysis
│   ├── article-writer.ts                 # AI content generation
│   ├── image-generator.ts                # Featured images
│   ├── internal-linker.ts                # Auto internal linking
│   └── seo-optimizer.ts                  # SEO metadata
└── prisma/
    ├── schema.prisma                     # Updated with new models
    └── migrations/
        └── 20251203150910_add_content_hub_models/
            └── migration.sql              # Migration file
```

## 🗄️ Database Schema

### ContentHubSite
Stores connected WordPress sites for each client.

```prisma
model ContentHubSite {
  id                    String   @id @default(cuid())
  clientId              String
  client                Client   @relation(...)
  
  // WordPress Connection
  wordpressUrl          String
  wordpressUsername     String?
  wordpressAppPassword  String?  // TODO: Encrypt in production
  isConnected           Boolean  @default(false)
  lastSyncedAt          DateTime?
  
  // Site Analysis
  existingPages         Int      @default(0)
  authorityScore        Float?
  niche                 String?
  
  // Topical Map
  topicalMap            Json?
  totalArticles         Int      @default(0)
  completedArticles     Int      @default(0)
  
  articles              ContentHubArticle[]
  
  @@index([clientId])
  @@index([wordpressUrl])
}
```

### ContentHubArticle
Tracks each article from idea to publication.

```prisma
model ContentHubArticle {
  id                String   @id @default(cuid())
  siteId            String
  site              ContentHubSite @relation(...)
  
  // Article Info
  title             String
  slug              String?
  cluster           String
  keywords          String[]
  searchVolume      Int?
  difficulty        Int?
  searchIntent      String?  // informational, commercial, transactional
  priority          Int      @default(0)
  
  // Status: pending → researching → writing → publishing → published / failed
  status            String   @default("pending")
  
  // Generated Content
  content           String?  @db.Text
  metaTitle         String?
  metaDescription   String?
  featuredImage     String?
  images            String[]
  faqSection        Json?
  schemaMarkup      Json?
  
  // WordPress
  wordpressPostId   Int?
  wordpressUrl      String?
  publishedAt       DateTime?
  
  @@index([siteId])
  @@index([status])
  @@index([cluster])
}
```

## 🔧 Installation & Setup

### 1. Run Database Migration

```bash
cd nextjs_space
npx prisma migrate deploy
```

This creates the `ContentHubSite` and `ContentHubArticle` tables.

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Verify Installation

```bash
# Check if migration was successful
npx prisma studio
# Look for ContentHubSite and ContentHubArticle tables
```

## 🎨 User Flow

### Step 1: Connect WordPress

1. Navigate to `/client-portal/content-hub`
2. Click "Add Website"
3. Enter:
   - WordPress URL (e.g., https://example.com)
   - Username
   - Application Password (from WordPress → Users → Profile)
4. Click "Connect & Test"
5. System verifies connection and saves credentials

### Step 2: Generate Topical Map

1. Select connected website
2. Click "Generate Topical Map"
3. System analyzes niche and generates 400-500+ article ideas
4. Articles organized into topical clusters
5. Each article has:
   - Search volume estimate
   - Keyword difficulty
   - Commercial intent indicator
   - Priority score

### Step 3: Generate Articles

**Option A: Single Article**
1. Find article in cluster view
2. Click "Generate" button
3. Watch real-time progress:
   - ✅ Research & Analysis
   - ✅ Content Generation
   - ✅ SEO & Images
   - ✅ Publishing (optional)

**Option B: Batch Generation**
1. Select multiple articles (checkbox)
2. Click "Start Batch"
3. System processes queue sequentially
4. Progress shown for each article

### Step 4: Publish to WordPress

**Auto-publish** (during generation):
- Enable "Auto-publish" option
- Article published immediately after generation

**Manual publish** (after generation):
- Click "Publish" button on completed article
- Optionally schedule for future date
- System:
  - Uploads featured image
  - Creates/assigns category
  - Adds tags
  - Sets SEO meta (Yoast/RankMath compatible)
  - Publishes post

## 🔒 Security Considerations

### Current Implementation
✅ Request body parsing fixed to prevent double-read errors
✅ HTML sanitization in image prompt generation
✅ Input validation for WordPress connections
✅ Auth checks on all API routes
✅ Database cascade deletes for data integrity

### TODO: Production Requirements
⚠️ **WordPress Password Encryption**
Currently, Application Passwords are stored in plain text. Before production:

```typescript
// Example implementation needed in connect-wordpress/route.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encrypted = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

Add to `.env`:
```
ENCRYPTION_KEY=<32-byte-random-key>
```

## 🧪 Testing Checklist

### WordPress Connection
- [ ] Test with valid credentials
- [ ] Test with invalid credentials
- [ ] Test with unreachable site
- [ ] Test with missing REST API
- [ ] Verify credentials are saved
- [ ] Verify connection can be re-tested

### Topical Map Generation
- [ ] Generate map with default settings (500 articles)
- [ ] Verify clusters are created
- [ ] Verify articles are saved to database
- [ ] Test with different niches
- [ ] Verify priority scores are assigned
- [ ] Check search volume/difficulty data

### Article Generation
- [ ] Generate single article
- [ ] Verify all phases complete successfully
- [ ] Check content quality and length
- [ ] Verify SEO metadata is generated
- [ ] Verify featured image is created
- [ ] Check internal links are added
- [ ] Verify FAQ section (if enabled)
- [ ] Test with different options enabled/disabled

### WordPress Publishing
- [ ] Publish generated article
- [ ] Verify post appears in WordPress
- [ ] Check featured image upload
- [ ] Verify category creation/assignment
- [ ] Check tags are added
- [ ] Verify SEO meta fields (Yoast/RankMath)
- [ ] Test scheduled publishing
- [ ] Test draft vs publish status

### Batch Processing
- [ ] Select multiple articles (3-5)
- [ ] Start batch generation
- [ ] Verify progress tracking
- [ ] Check all articles complete
- [ ] Verify error handling for failures
- [ ] Test with mix of different clusters

### Error Handling
- [ ] Test with network failures
- [ ] Test with API rate limits
- [ ] Test with invalid article data
- [ ] Verify failed status updates
- [ ] Check error messages are user-friendly

## 📊 Performance Metrics

### Expected Times
- **WordPress Connection Test**: 2-5 seconds
- **Topical Map Generation** (500 articles): 30-60 seconds
- **Single Article Generation**: 45-90 seconds
  - Research: 5-10 seconds
  - Writing: 30-60 seconds
  - SEO & Images: 10-20 seconds
- **WordPress Publishing**: 5-10 seconds
- **Batch (5 articles)**: 4-8 minutes

### Resource Usage
- **Database**: ~1KB per article metadata, ~10-50KB per article content
- **API Calls**: 
  - Topical map: 1-4 AI calls
  - Article: 3-5 AI calls
  - Images: 1 call per image

## 🐛 Common Issues & Solutions

### Issue: "WordPress not connected"
**Solution**: 
1. Check WordPress URL is accessible
2. Verify Application Password is correct
3. Ensure WordPress REST API is enabled
4. Check for firewall/security plugins blocking API

### Issue: "Topical map generation failed"
**Solution**:
1. Check AI API is responding
2. Verify client has sufficient credits
3. Try with simpler niche description
4. Check logs for specific error

### Issue: "Article generation stuck at X%"
**Solution**:
1. Check article status in database
2. Look for error in API logs
3. Retry generation
4. If persists, delete and recreate article

### Issue: "Publishing fails but article generated"
**Solution**:
1. Verify WordPress credentials still valid
2. Check WordPress site is online
3. Try manual publish from article list
4. Check WordPress error logs

## 🔄 Migration from Old Tools

### Redirects Already in Place
All old tool URLs automatically redirect to Content Hub:
- `/client-portal/blog-generator` → `/client-portal/content-hub`
- `/client-portal/topical-mapping` → `/client-portal/content-hub`
- `/client-portal/content-research` → `/client-portal/content-hub`
- `/client-portal/auto-writer` → `/client-portal/content-hub`
- `/client-portal/content-library` → `/client-portal/content-hub`

### Data Migration
Old tools' data remains intact but is not automatically migrated. If needed:

1. **Topical Maps**: Can be imported via UI (if implemented in old tool)
2. **Generated Content**: Available in existing SavedContent model
3. **WordPress Configs**: Need to be re-entered in Content Hub

## 📝 API Documentation

### POST /api/content-hub/connect-wordpress
Connect and test WordPress site.

**Request:**
```json
{
  "wordpressUrl": "https://example.com",
  "username": "admin",
  "applicationPassword": "xxxx xxxx xxxx xxxx"
}
```

**Response:**
```json
{
  "success": true,
  "site": {
    "id": "site_123",
    "wordpressUrl": "https://example.com",
    "isConnected": true,
    "existingPages": 127,
    "siteInfo": {
      "name": "Example Site",
      "description": "...",
      "url": "https://example.com"
    }
  }
}
```

### POST /api/content-hub/generate-map
Generate topical authority map.

**Request:**
```json
{
  "siteId": "site_123",
  "niche": "yoga and meditation",
  "targetArticles": 500,
  "language": "nl"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 523 article ideas",
  "map": {
    "totalArticles": 523,
    "categories": [...],
    "estimatedMonths": 10,
    "seoOpportunityScore": 85
  }
}
```

### POST /api/content-hub/write-article
Generate article content.

**Request:**
```json
{
  "articleId": "article_456",
  "generateImages": true,
  "includeFAQ": true,
  "autoPublish": false
}
```

**Response:**
```json
{
  "success": true,
  "article": {
    "id": "article_456",
    "title": "Yoga voor beginners",
    "wordCount": 2847,
    "metaTitle": "...",
    "metaDescription": "...",
    "slug": "yoga-voor-beginners",
    "featuredImage": "https://...",
    "status": "published",
    "generationTime": 67
  }
}
```

### POST /api/content-hub/publish-wordpress
Publish article to WordPress.

**Request:**
```json
{
  "articleId": "article_456",
  "status": "publish",
  "scheduledDate": "2024-01-15T09:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "wordpress": {
    "postId": 789,
    "url": "https://example.com/yoga-voor-beginners/",
    "status": "publish"
  }
}
```

## 🎓 Best Practices

### For Users
1. **Start Small**: Connect one site and generate a small topical map first
2. **Review Before Publishing**: Check generated content before auto-publish
3. **Use Batch Wisely**: Start with 3-5 articles, then scale up
4. **Monitor Progress**: Watch for failed generations and retry
5. **Regular Syncing**: Re-analyze site periodically to update existing pages count

### For Developers
1. **Error Handling**: Always wrap API calls in try-catch
2. **Status Updates**: Update article status at each phase
3. **Logging**: Log all major operations for debugging
4. **Validation**: Validate all user inputs
5. **Testing**: Test with real WordPress sites before production

## 🚀 Future Enhancements

Potential additions for future versions:

1. **Google Search Console Integration**
   - Import actual rankings
   - Track performance over time
   - Identify content gaps from real data

2. **Advanced Analytics**
   - Content performance dashboard
   - ROI tracking per article
   - Authority score progression

3. **Content Calendar**
   - Schedule article generation
   - Plan publication dates
   - Editorial calendar view

4. **Team Collaboration**
   - Assign articles to writers
   - Editorial review workflow
   - Comments and feedback

5. **Multilingual Support**
   - Generate in multiple languages
   - Cross-language content mapping
   - Translation workflow

6. **Custom AI Instructions**
   - Brand voice customization
   - Industry-specific templates
   - Custom fact-checking rules

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review API logs in browser console
3. Check database for article/site status
4. Contact development team with:
   - Error messages
   - Steps to reproduce
   - Screenshots if UI issue

---

**Version**: 1.0.0  
**Last Updated**: December 3, 2024  
**Status**: ✅ Ready for Testing
