# Social Media Suite Implementation

## ✅ Completed

### Phase 1: New Unified API Routes
All new API routes have been created under `/api/client/social/`:

- **`/api/client/social/route.ts`** - GET/POST for posts management with filters
- **`/api/client/social/[id]/route.ts`** - GET/PUT/DELETE for specific post
- **`/api/client/social/generate/route.ts`** - AI content generation with platform optimization
- **`/api/client/social/analytics/route.ts`** - Analytics data aggregation
- **`/api/client/social/queue/route.ts`** - Queue management and reordering
- **`/api/client/social/ideas/route.ts`** - AI content ideas generation and storage

### Phase 2: Complete Frontend Implementation
New unified Social Media Suite page at `/client-portal/social/page.tsx`:

#### 6 Tabs Implemented:
1. **📅 Kalender Tab** (`calendar-tab.tsx`)
   - Month view with calendar grid
   - Color-coded posts per platform (🔵 LinkedIn, 🟢 Instagram, 🟠 X, 🔴 Facebook, ⚫ TikTok)
   - Click to view/edit posts
   - Week/Day views (placeholders for future implementation)

2. **📝 Posts Tab** (`posts-tab.tsx`)
   - Complete posts list with search
   - Filters by status and platform
   - Bulk delete functionality
   - Individual post actions

3. **🚀 Wachtrij Tab** (`queue-tab.tsx`)
   - Scheduled posts organized by day
   - Queue overview with post count
   - Shuffle option (placeholder)

4. **💡 Ideeën Tab** (`ideas-tab.tsx`)
   - AI-generated content ideas
   - Category badges (trending, seasonal, evergreen, engagement)
   - Urgency indicators
   - Estimated engagement scores
   - "Maak Post" button per idea

5. **📊 Analytics Tab** (`analytics-tab.tsx`)
   - Overview cards: Total Posts, Reach, Engagement, Clicks
   - Performance per platform (bar chart visualization)
   - Top performing posts
   - Best posting times

6. **⚙️ Instellingen Tab** (`settings-tab.tsx`)
   - getLate.dev account connections
   - Connect/disconnect buttons per platform
   - Connection status indicators
   - Default posting times (placeholder)

#### Post Creator Modal (`post-creator-modal.tsx`)
- Multi-platform selection
- AI generation toggle with topic input
- Per-platform content editor with character count
- Scheduling options (now or scheduled)
- Media upload (placeholder for future)
- Credit-based AI generation

### Phase 3: Platform-Specific Optimization
Implemented in `/api/client/social/generate/route.ts`:

- **LinkedIn**: 500-1500 chars, professional tone, paragraphs and bullet points
- **Instagram**: 150-300 chars, visual and engaging, emojis and 5-10 hashtags
- **Twitter/X**: 50-280 chars (max 280), punchy and direct, max 2 hashtags
- **TikTok**: 50-150 chars, trending and energetic, hook-first format
- **Facebook**: 200-500 chars, conversational, call-to-action focused

### Phase 4: Credit System
Credit tracking implemented for:
- AI Content (1 platform): 5 credits
- AI Content (multi-platform): 10 credits
- AI Image: 10 credits (placeholder)
- AI Video: 25 credits (placeholder)

Usage tracked via `trackUsage()` function for billing purposes.

## 🚧 Remaining Work

### 1. getLate.dev Integration
**Files to check/update:**
- Settings Tab needs to properly connect to `/api/client/late-dev/accounts`
- Post publishing needs integration with `/api/client/late-dev/publish`
- Account sync functionality

**Required:**
```typescript
// In settings-tab.tsx - verify getLate.dev account fetching
// In post-creator-modal.tsx - add actual publishing via getLate.dev
```

### 2. AI Media Generation
**Not yet implemented:**
- Image generation integration (10 credits)
- Video generation integration (25 credits)

**Add to:**
- `/api/client/social/generate/route.ts` - implement `generateImage` and `generateVideo`
- `post-creator-modal.tsx` - add media generation UI

### 3. Drag & Drop Functionality
**Not yet implemented:**
- Calendar: drag posts between days
- Queue: reorder posts

**Recommended library:** `@dnd-kit/core` or native HTML5 drag and drop

### 4. Cleanup Old Routes

**Directories to remove:**
```bash
rm -rf /app/api/client/social-media/*
rm -rf /app/api/client/social-media-posts/*
rm -rf /app/api/client/social-media-ideas/*
rm -rf /app/api/client/social-media-topics/*
rm -rf /app/api/client/generate-social-post/*
rm -rf /app/api/client/getlate/*
```

**Keep but integrate:**
- `/api/client/late-dev/*` - These should remain as they handle getLate.dev OAuth

**Update references:**
Search codebase for imports/calls to old routes and update to new `/api/client/social/*` routes.

### 5. Database Schema Verification
Ensure the following models exist in Prisma/Supabase schema:

```prisma
model SocialMediaPost {
  id            String    @id @default(uuid())
  projectId     String
  content       String
  platform      String
  status        String    // draft, scheduled, published, failed
  scheduledFor  DateTime?
  media         Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  project       Project   @relation(fields: [projectId], references: [id])
  sourceIdea    SocialMediaIdea? @relation(fields: [sourceIdeaId], references: [id])
  sourceIdeaId  String?
}

model SocialMediaIdea {
  id                    String   @id @default(uuid())
  projectId             String
  title                 String
  description           String
  suggestedPlatforms    String[]
  category              String   // trending, seasonal, evergreen, engagement
  urgency               String   // high, medium, low
  estimatedEngagement   Int
  createdAt             DateTime @default(now())
  
  project               Project  @relation(fields: [projectId], references: [id])
  posts                 SocialMediaPost[]
}
```

### 6. Week and Day Calendar Views
Implement in `calendar-tab.tsx`:
- Week view: 7-day grid with hourly slots
- Day view: Single day with hourly timeline

### 7. Testing
**Manual testing checklist:**
- [ ] Load social media page
- [ ] Select project
- [ ] Test all 6 tabs load correctly
- [ ] Create post manually
- [ ] Generate post with AI
- [ ] Schedule post for future
- [ ] View post in calendar
- [ ] View post in queue
- [ ] Generate AI ideas
- [ ] View analytics
- [ ] Connect social media account
- [ ] Test bulk delete
- [ ] Test search and filters

## 🎯 Navigation Update
Updated `/lib/navigation-config.ts`:
- Changed link from `/client-portal/social-media-suite` to `/client-portal/social`
- Added "Nieuw" badge to indicate new unified page

## 📊 Features Overview

### What Works Now:
✅ Complete 6-tab interface  
✅ Project selection  
✅ AI content generation per platform  
✅ Post CRUD operations  
✅ Scheduling system  
✅ Queue management  
✅ Ideas generation  
✅ Analytics dashboard  
✅ Credit tracking  
✅ Platform-specific optimization  

### What Needs Work:
⚠️ getLate.dev account connection (API exists, needs frontend integration)  
⚠️ Actual publishing to social platforms  
⚠️ Drag & drop for calendar and queue  
⚠️ AI image generation  
⚠️ AI video generation  
⚠️ Week/Day calendar views  
⚠️ Old routes cleanup  

## 🔐 Security Notes
- All routes protected with session authentication
- Project ownership verification on all operations
- Client can only access their own projects and posts
- Credit usage tracked for billing

## 💡 Future Enhancements
1. Real-time post status updates from getLate.dev
2. Post templates system
3. Content calendar export (PDF/iCal)
4. Team collaboration features
5. Performance insights from actual social media metrics
6. A/B testing for posts
7. Best time to post recommendations based on historical data
8. Hashtag suggestions based on content
9. Image/video preview in calendar
10. Bulk scheduling wizard
