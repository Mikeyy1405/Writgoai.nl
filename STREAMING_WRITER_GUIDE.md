# 🔴 Live Streaming Article Generator

## Overview
The article writer page (`/dashboard/writer`) now supports real-time streaming article generation, allowing users to see content being written word-by-word as the AI generates it.

## Features

### 1. 🎯 Dual Generation Modes

#### **Live Streaming Mode** (Default)
- Real-time text display as AI writes
- See every word appear instantly
- Visual progress bar with percentage
- Stop button to halt generation mid-process
- Auto-scroll as content grows
- Animated cursor indicator during generation

#### **Background Mode**
- Traditional background job processing
- Can leave page during generation
- Poll-based progress updates
- Suitable for long articles

### 2. 📊 Progress Tracking
```
┌────────────────────────────────────────────────┐
│ 🔴 Live aan het schrijven...    1,234 woorden │
│ ────────────────────────────────■─────  85%   │
│                         [⏹️ Stop Generatie]    │
└────────────────────────────────────────────────┘
```

- Real-time word count
- Progress percentage (estimated based on target word count)
- Current generation status
- Stop button (only during streaming)

### 3. 📝 Content Display

**During Streaming:**
```
┌────────────────────────────────────────────┐
│                                            │
│  # Heading 1                              │
│                                            │
│  This is a paragraph that is being        │
│  written right now by the AI...▊         │
│                                            │
│  [auto-scrolls as content grows]          │
│                                            │
└────────────────────────────────────────────┘
```

- Large white content area
- Clean typography
- Animated cursor (▊) during streaming
- Smooth auto-scroll

**After Completion:**
```
┌────────────────────────────────────────────┐
│  [Full article content rendered]           │
│                                            │
│  [📋 Kopiëren] [⬇️ Download] [✏️ Bewerken] │
│                              [💬 Open Chat] │
└────────────────────────────────────────────┘
```

### 4. 💬 Chat Interface

After article completion, users can open a chat sidebar for quick edits:

```
┌──────────────────┐
│ 💬 Quick Edits   │
│ ─────────────────│
│                  │
│ 👤: Voeg een     │
│ paragraaf toe    │
│ over SEO         │
│                  │
│ 🤖: Chat komt    │
│ binnenkort!      │
│                  │
│ [Type message..] │
│              [➤] │
└──────────────────┘
```

**Features:**
- Slide-in from right
- Message history
- Quick edit requests
- Timestamp display
- Loading indicators

### 5. ⚙️ Settings Panel

Located in left sidebar:
```
┌─────────────────────────┐
│ ⚙️ Instellingen         │
│ ─────────────────────── │
│                         │
│ Generatie Modus:        │
│ [🔴 Live Streaming ▼]  │
│                         │
│ Aantal woorden:         │
│ [~2000 woorden ▼]      │
│                         │
│ Taal:                   │
│ [Nederlands ▼]         │
│                         │
│ [🚀 Start Live          │
│     Generatie]          │
└─────────────────────────┘
```

### 6. 📋 Recent Articles Sidebar

```
┌─────────────────────────┐
│ 📋 Recente Artikelen    │
│ ─────────────────────── │
│                         │
│ ✅ Klaar                │
│ Article Title 1         │
│ 23 dec, 14:30          │
│                         │
│ ⏳ 45%                  │
│ Article Title 2         │
│ 23 dec, 14:15          │
│                         │
│ ❌ Mislukt              │
│ Article Title 3         │
│ 23 dec, 13:45          │
└─────────────────────────┘
```

## User Flow

### Starting Generation

1. Select article from content plan or provide details
2. Choose generation mode (streaming/background)
3. Configure settings (word count, language)
4. Click "🚀 Start Live Generatie"
5. Watch content appear in real-time

### During Streaming

1. Content appears word-by-word
2. Progress bar updates automatically
3. Word count increases in real-time
4. Can click "⏹️ Stop Generatie" to halt
5. Auto-scroll keeps latest content visible

### After Completion

1. Full article displayed
2. Action buttons appear:
   - 📋 Copy to clipboard
   - ⬇️ Download HTML
   - ✏️ Edit in WordPress editor
   - 💬 Open chat for modifications

### Making Edits

1. Click "💬 Open Chat"
2. Chat sidebar slides in from right
3. Type modification request
4. Send message
5. View AI response (future: actual edits)

## Technical Implementation

### API Endpoint
- **Route:** `/api/generate/article-stream`
- **Method:** POST
- **Type:** Server-Sent Events (SSE)

### Streaming Events
```javascript
// Start event
data: {"type":"start","title":"Article Title"}

// Content chunks
data: {"type":"chunk","content":"<p>Text chunk...</p>"}

// Completion event
data: {"type":"complete","content":"...","wordCount":1234,"articleId":"abc123"}

// Error event
data: {"type":"error","error":"Error message"}
```

### Stop Functionality
- Uses `AbortController` to cancel fetch request
- Preserves partial content when stopped
- Updates state to show completion status
- Maintains word count of partial content

### Progress Calculation
```javascript
// Estimate based on current vs target word count
const progress = (currentWords / targetWords) * 100;
// Cap at 95% until actual completion
const displayProgress = Math.min(95, progress);
```

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ ✍️ Artikel Schrijver              [← Terug naar Content Plan]│
├─────────────────────────────────────────────────────────────┤
│ 💡 Tip: Je kunt deze pagina verlaten tijdens generatie...  │
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│ 📝 Artikel  │  🔴 85% | 1,234 woorden  [⏹️ Stop]           │
│ ─────────── │  ═════════════════════■─────────             │
│ Title       │                                               │
│ Type        │  ┌──────────────────────────────────────┐   │
│ Cluster     │  │                                       │   │
│ Keywords    │  │  # Article Content                   │   │
│             │  │                                       │   │
│ ⚙️ Settings │  │  Paragraph text being written...▊    │   │
│ ─────────── │  │                                       │   │
│ Mode        │  │  [auto-scrolls]                      │   │
│ Word Count  │  │                                       │   │
│ Language    │  │                                       │   │
│ [Start]     │  └──────────────────────────────────────┘   │
│             │                                               │
│ 📋 Recent   │  [📋 Copy] [⬇️ Download] [💬 Chat]           │
│ ─────────── │                                               │
│ Article 1   │                                               │
│ Article 2   │                                               │
│ Article 3   │                                               │
└─────────────┴───────────────────────────────────────────────┘
```

## Benefits

### For Users
- ✅ See content being created in real-time
- ✅ Know exactly what's being generated
- ✅ Stop if content isn't going in right direction
- ✅ Immediate feedback on quality
- ✅ Can leave during background generation

### For Developers
- ✅ SSE streaming reduces server load vs polling
- ✅ Better user engagement
- ✅ Client-side abort control
- ✅ Modular architecture (streaming + background modes)

## Future Enhancements

### Planned Features
- [ ] Live chat API for real content modifications
- [ ] Section-by-section progress ("Sectie 3/10: Introduction")
- [ ] Pause/resume streaming
- [ ] Save draft versions during streaming
- [ ] Multiple simultaneous streams
- [ ] Streaming preview in modal while browsing

### Chat API Integration
When implemented, the chat feature will:
- Send modification requests to AI
- Apply edits to existing content
- Show diff of changes
- Support multiple edit iterations
- Preserve edit history

## Security Notes

### Content Safety
- Content comes from server-controlled Claude AI API
- No user-generated HTML injection
- All content validated server-side
- Rate limiting on streaming endpoints

### Stop Mechanism
- Client-side abort only affects fetch
- Server-side generation may continue briefly
- Partial content is safe to display
- No data loss on abort

## Troubleshooting

### Streaming Not Working
1. Check network connection
2. Verify API key is configured
3. Check browser console for errors
4. Try background mode as fallback

### Stop Button Not Responding
1. May take a few seconds to abort
2. Partial content is preserved
3. Check network tab for cancelled request

### Chat Not Opening
1. Ensure article is completed
2. Check for fullContent or streamedContent
3. Verify no JavaScript errors

## Code Examples

### Using the Writer Page
```typescript
// Navigate to writer with article from content plan
router.push(`/dashboard/writer?project=${projectId}&article=${index}`);

// Navigate to writer with existing job
router.push(`/dashboard/writer?job=${jobId}`);
```

### Integrating Streaming
```typescript
const response = await fetch('/api/generate/article-stream', {
  method: 'POST',
  body: JSON.stringify({
    project_id: projectId,
    title: articleTitle,
    keyword: mainKeyword,
    word_count: 2000,
    language: 'nl'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Process SSE data...
}
```

## Support

For issues or questions:
1. Check console for error messages
2. Verify API configuration
3. Review network requests
4. Check recent jobs for status

---

**Last Updated:** December 23, 2024
**Version:** 1.0.0
