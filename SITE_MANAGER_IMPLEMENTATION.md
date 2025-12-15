# Site Manager Implementation - Complete Documentation

## 🎯 Overview

This implementation creates a unified Site Manager for WordPress/WooCommerce content management with AI-powered rewriting and SEO optimization capabilities. This is the **most important feature** as it allows users to manage and optimize all their content from one place with AI assistance.

## 🚀 Key Features

### 1. Unified Content Management
- **Posts**: WordPress blog posts with full editing capabilities
- **Products**: WooCommerce products with pricing, stock, and descriptions
- **Pages**: Static WordPress pages
- **Categories**: Manage post and product categories

### 2. 🤖 AI Rewriting (KRITIEK!)
The most important feature - allows content rewriting with AI:

#### Single Item Rewrite
- Click 🤖 button next to any item
- Select fields to rewrite (title, content, excerpt, meta_description)
- Add custom instructions (e.g., "Make SEO friendly", "Shorter", "More professional")
- Preview AI-generated content before saving
- Save directly to WordPress

#### Bulk Rewrite
- Select multiple items (checkbox selection)
- Click "Herschrijf Selectie" button
- AI processes all items with progress tracking
- Automatic saving to WordPress
- 20% discount for 5+ items

#### API Endpoint
```typescript
POST /api/client/site-manager/rewrite
{
  projectId: string,
  items: [{
    type: 'post' | 'product' | 'page',
    id: number,
    fields: ['title', 'content', 'excerpt', 'meta_description', 'seo_title']
  }],
  instructions: string,
  tone?: 'professional' | 'casual' | 'friendly',
  language?: string,
  autoSave?: boolean
}
```

**Credits**: 10 credits per item (8 credits with 20% bulk discount for 5+ items)

### 3. 🔍 SEO Optimization
AI-powered SEO meta optimization:

- Generate optimized meta titles (max 60 chars)
- Generate optimized meta descriptions (120-160 chars)
- Extract/suggest focus keywords
- SEO score calculation (0-100)
- Color-coded SEO indicators (🟢 70+, 🟡 40-69, 🔴 <40)

**Credits**: 5 credits per item (4 credits with 20% bulk discount for 5+ items)

### 4. WordPress Sync
- Force sync/refresh from WordPress
- Real-time content updates
- Connection validation

## 📁 File Structure

### API Routes
```
/api/client/site-manager/
├── route.ts                    # Main route - fetch all content
├── [id]/route.ts              # Single item CRUD operations
├── rewrite/route.ts           # AI rewriting with streaming
├── seo-optimize/route.ts      # AI SEO optimization
└── sync/route.ts              # Force WordPress sync
```

### Frontend
```
/client-portal/site-manager/
└── page.tsx                    # Main Site Manager UI
```

## 🔧 Technical Implementation

### Backend Architecture

#### Main Content Route (`route.ts`)
- Fetches posts, products, pages, and categories
- Supports pagination and search
- Calculates SEO scores
- Handles WordPress and WooCommerce APIs

#### AI Rewrite Route (`rewrite/route.ts`)
- Streaming API for real-time progress
- Supports single and bulk operations
- Uses Claude Sonnet 4.5 for generation
- Integrates tone of voice settings
- Filters banned words
- Credits integration

#### SEO Optimize Route (`seo-optimize/route.ts`)
- Generates optimized meta titles and descriptions
- Extracts focus keywords
- Updates Yoast SEO meta fields
- Streaming progress updates

### Frontend Architecture

#### Site Manager Page (`page.tsx`)
- Content type tabs (Posts, Products, Pages, Categories)
- Data table with sorting and filtering
- Bulk selection with checkboxes
- Search functionality
- Pagination
- AI Rewrite Modal with live preview
- Streaming progress display

### SEO Score Algorithm
```typescript
function calculateSeoScore(title?, description?, wordCount?): number {
  let score = 0;
  
  // Title (40 points max)
  if (title && title.length >= 30 && title.length <= 60) {
    score += 40;
  } else if (title && title.length > 0) {
    score += 20;
  }
  
  // Description (40 points max)
  if (description && description.length >= 120 && description.length <= 160) {
    score += 40;
  } else if (description && description.length > 0) {
    score += 20;
  }
  
  // Word Count (20 points max)
  if (wordCount >= 300) {
    score += 20;
  } else if (wordCount >= 100) {
    score += 10;
  }
  
  return Math.min(100, score);
}
```

## 🎨 UI Components

### Content Table
- Checkbox column for bulk selection
- Title and excerpt display
- Status badge (✅ Live / 📝 Draft)
- SEO score with color coding
- Categories as badges
- Action buttons (🤖 Rewrite, ✏️ Edit, 🗑️ Delete)

### AI Rewrite Modal
- Field selection checkboxes
- Instructions textarea
- Progress display
- Preview section (safe text rendering, no XSS)
- Generate button
- Save to WordPress button

### Tabs
- 📝 Posts
- 🛒 Products
- 📄 Pages
- 📁 Categories

## 🔐 Security Features

### Authentication
- Session-based authentication via NextAuth
- Project ownership verification
- WordPress Application Password support

### XSS Prevention
- HTML stripped in preview (no dangerouslySetInnerHTML)
- Input sanitization
- Banned words filtering

### API Security
- Request validation
- Error handling
- Rate limiting via credit system

## 💰 Credits System

### Cost Structure
- **AI Rewrite**: 10 credits per item
- **Bulk Rewrite (5+ items)**: 8 credits per item (20% discount)
- **SEO Optimize**: 5 credits per item
- **Bulk SEO (5+ items)**: 4 credits per item (20% discount)

### Credit Deduction
```typescript
await deductCredits(
  clientId,
  totalCredits,
  `Site Manager AI Rewrite - ${itemCount} items`,
  {
    model: TEXT_MODELS.CLAUDE_SONNET,
    tool: 'site_manager_rewrite'
  }
);
```

## 🔄 Streaming Progress

Both AI Rewrite and SEO Optimize use streaming for real-time feedback:

```typescript
// Progress events
{ type: 'progress', progress: 10, message: "Processing item 1/5..." }
{ type: 'progress', progress: 50, message: "Item 3 completed" }

// Completion event
{ 
  type: 'complete', 
  message: "All done!", 
  results: [...],
  creditsUsed: 40
}

// Error event
{ type: 'error', error: "Something went wrong" }
```

## 🗑️ Deprecated Routes Removed

The following routes have been removed and replaced by the new unified Site Manager:

- `/api/client/wordpress-config/` → Integrated into site-manager
- `/api/client/wordpress-categories/` → Integrated into site-manager  
- `/api/client/woocommerce/rewrite/` → Replaced by `/api/client/site-manager/rewrite/`
- `/api/client/woocommerce/rewrite-product/` → Replaced by unified rewrite
- `/api/client/publish-to-wordpress/` → Replaced by `/api/client/site-manager/[id]/`
- `/api/client/generate-woocommerce-product/` → Can be integrated later

**Note**: The main `/api/client/wordpress/` and `/api/client/woocommerce/` directories remain for backwards compatibility with other features.

## 📝 Usage Examples

### Fetch Posts
```typescript
const response = await fetch(
  '/api/client/site-manager?projectId=xxx&type=posts&page=1&limit=20'
);
const { items, pagination } = await response.json();
```

### AI Rewrite Single Item
```typescript
const response = await fetch('/api/client/site-manager/rewrite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'xxx',
    items: [{
      type: 'post',
      id: 123,
      fields: ['title', 'content', 'meta_description'],
      currentTitle: 'Old Title',
      currentContent: 'Old content...'
    }],
    instructions: 'Make it more SEO friendly and engaging',
    autoSave: false
  })
});

// Stream progress
const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const data = JSON.parse(decoder.decode(value));
  console.log(data.message);
}
```

### Update Item
```typescript
await fetch('/api/client/site-manager/123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'xxx',
    type: 'post',
    data: {
      title: 'New Title',
      content: 'New content...',
      status: 'publish'
    }
  })
});
```

## 🔮 Future Enhancements

Potential improvements for future iterations:

1. **Advanced Filters**
   - Filter by date range
   - Filter by author
   - Filter by SEO score range

2. **Batch Operations**
   - Bulk delete
   - Bulk status change
   - Bulk category assignment

3. **Analytics**
   - View counts tracking
   - Engagement metrics
   - SEO performance over time

4. **AI Features**
   - Automatic keyword suggestions
   - Content gap analysis
   - Competitor analysis

5. **Media Management**
   - Featured image upload
   - Image optimization
   - Gallery management

## 🐛 Known Limitations

1. **Yoast SEO Integration**: Meta field updates may require Yoast SEO plugin configuration
2. **Large Content**: Very large content (>10,000 words) may timeout during AI processing
3. **Categories**: Category management is read-only in current version
4. **Media**: Featured images can't be uploaded yet, only URLs can be set

## 🎓 WordPress REST API Notes

The WordPress REST API uses POST (not PUT) for updates when addressing a specific resource by ID. This is different from standard REST conventions but is how WordPress REST API works:

```typescript
// WordPress standard for updates:
POST /wp-json/wp/v2/posts/123  // Updates post 123

// NOT:
PUT /wp-json/wp/v2/posts/123   // WordPress doesn't use this
```

## 🏁 Acceptance Criteria Status

- ✅ Kan alle posts/products/pages ophalen van WordPress
- ✅ Kan inline items bewerken en naar WordPress pushen
- ✅ 🤖 **AI Herschrijf werkt** - single en bulk
- ✅ 🤖 **AI SEO Optimize werkt** - genereert betere meta titles/descriptions
- ✅ SEO score wordt berekend en getoond per item
- ✅ Bulk selectie werkt
- ✅ Streaming progress tijdens AI operaties
- ✅ Credits worden correct afgetrokken
- ✅ Alle oude WordPress/WooCommerce routes zijn verwijderd

## 👥 Integration Points

### Existing Libraries Used
- `@/lib/aiml-api` - AI model integration
- `@/lib/woocommerce-api` - WooCommerce API client
- `@/lib/banned-words` - Content filtering
- `@/lib/tone-of-voice-helper` - Tone settings
- `@/lib/credits` - Credit management
- `@/lib/db` - Database access

### UI Components Used
- `@/components/ui/button`
- `@/components/ui/input`
- `@/components/ui/select`
- `@/components/ui/dialog`
- `@/components/ui/checkbox`
- `@/components/ui/textarea`
- `@/components/ui/badge`
- `@/components/ui/label`

## 📊 Performance Considerations

1. **Pagination**: Content loaded in pages of 20 items
2. **Streaming**: Large operations use streaming for responsiveness
3. **Lazy Loading**: Images and heavy content loaded on demand
4. **Caching**: WordPress data cached per request
5. **Timeouts**: API routes have 300s max duration for long operations

## 🎉 Conclusion

The Site Manager is now fully implemented with all critical features:

- ✅ Unified content management interface
- ✅ AI-powered content rewriting (single + bulk)
- ✅ AI-powered SEO optimization
- ✅ Real-time streaming progress
- ✅ Credit system integration
- ✅ Security hardening (XSS prevention)
- ✅ Backwards compatibility maintained

The feature is ready for production use! 🚀
