# API Documentation - WordPress AI Agent AutoPilot

## Table of Contents
- [AutoPilot APIs](#autopilot-apis)
- [Content Optimizer APIs](#content-optimizer-apis)
- [Cron Job APIs](#cron-job-apis)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## AutoPilot APIs

### Start AutoPilot Job

Start een nieuwe autonome content generatie job.

**Endpoint:** `POST /api/client/autopilot/start`

**Authentication:** Required (NextAuth session)

**Request Body:**
```json
{
  "articleIdeaId": "string (required)",
  "frequency": "once | daily | weekly | monthly (optional, default: once)"
}
```

**Response (200):**
```json
{
  "success": true,
  "jobId": "job-abc123",
  "message": "AutoPilot job started successfully"
}
```

**Response (400):**
```json
{
  "error": "articleIdeaId is required"
}
```

**Response (404):**
```json
{
  "error": "ArticleIdea not found or access denied"
}
```

**Example:**
```typescript
const response = await fetch('/api/client/autopilot/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    articleIdeaId: 'cm5abc123',
    frequency: 'weekly',
  }),
});

const data = await response.json();
console.log('Job ID:', data.jobId);
```

---

### Get Job Status

Haal de huidige status en progress van een AutoPilot job op.

**Endpoint:** `GET /api/client/autopilot/status/[jobId]`

**Authentication:** Required (NextAuth session)

**Path Parameters:**
- `jobId` (string, required): The job ID returned from start endpoint

**Response (200):**
```json
{
  "job": {
    "id": "job-abc123",
    "status": "writing",
    "progress": 45.5,
    "currentStep": "Writing article with Claude AI...",
    "error": null,
    "result": null,
    "startedAt": "2025-01-15T10:00:00Z",
    "completedAt": null
  },
  "progress": 45.5,
  "currentStep": "Writing article with Claude AI...",
  "eta": 120
}
```

**Job Status Values:**
- `pending`: Job is queued
- `researching`: Performing research with Perplexity
- `writing`: Writing article with Claude
- `generating_image`: Creating featured image with Flux Pro
- `publishing`: Publishing to WordPress
- `completed`: Job completed successfully
- `failed`: Job failed with error

**Response (404):**
```json
{
  "error": "Job not found"
}
```

**Response (403):**
```json
{
  "error": "Access denied"
}
```

**Example:**
```typescript
const response = await fetch(`/api/client/autopilot/status/${jobId}`);
const data = await response.json();

console.log('Progress:', data.progress);
console.log('Current Step:', data.currentStep);
console.log('ETA:', data.eta, 'seconds');
```

---

## Content Optimizer APIs

### Analyze Posts

Analyzeer WordPress posts voor SEO optimization opportunities.

**Endpoint:** `POST /api/client/content-optimizer/analyze`

**Authentication:** Required (NextAuth session)

**Request Body:**
```json
{
  "projectId": "string (required)",
  "postId": "number (optional, analyze specific post)"
}
```

**Response (200):**
```json
{
  "posts": [
    {
      "id": 123,
      "title": "10 Tips voor SEO in 2025",
      "seoScore": 65,
      "issues": [
        "Content too short (< 800 words)",
        "Missing H2 headings",
        "No recent dates or statistics"
      ],
      "canOptimize": true
    }
  ],
  "total": 1,
  "optimizable": 1
}
```

**Response (404):**
```json
{
  "error": "Project not found or access denied"
}
```

**SEO Score Calculation:**
- **100**: Perfect SEO optimization
- **80-99**: Good, minor improvements possible
- **60-79**: Fair, several improvements recommended
- **40-59**: Poor, significant improvements needed
- **0-39**: Very poor, major overhaul required

**Example:**
```typescript
const response = await fetch('/api/client/content-optimizer/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'proj-xyz789',
  }),
});

const data = await response.json();
const lowScorePosts = data.posts.filter(p => p.seoScore < 70);
```

---

### Optimize Post

Optimize een WordPress post met AI improvements.

**Endpoint:** `POST /api/client/content-optimizer/optimize`

**Authentication:** Required (NextAuth session)

**Request Body:**
```json
{
  "projectId": "string (required)",
  "postId": "number (required)",
  "improvements": "string (optional, custom improvement instructions)",
  "includeFAQ": "boolean (optional, default: true)"
}
```

**Response (200):**
```json
{
  "success": true,
  "result": {
    "newContent": "<div>...</div>",
    "newTitle": "Verbeterde Titel voor SEO",
    "newMetaDescription": "Nieuwe meta beschrijving...",
    "improvements": [
      "Fixed: Content too short",
      "Fixed: Missing headings",
      "Added FAQ section",
      "Improved SEO optimization",
      "Updated with fresh information"
    ],
    "seoScoreIncrease": 25,
    "wordpressUpdated": true
  }
}
```

**Response (400):**
```json
{
  "error": "projectId and postId are required"
}
```

**Example:**
```typescript
const response = await fetch('/api/client/content-optimizer/optimize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'proj-xyz789',
    postId: 456,
    improvements: 'Add more statistics and update for 2025',
    includeFAQ: true,
  }),
});

const data = await response.json();
console.log('SEO Score Increase:', data.result.seoScoreIncrease);
```

---

### Stream Optimization Progress (SSE)

Stream real-time optimization progress via Server-Sent Events.

**Endpoint:** `GET /api/client/content-optimizer/optimize?jobId=[jobId]`

**Authentication:** Required (NextAuth session)

**Query Parameters:**
- `jobId` (string, required): The optimization job ID

**Response:** Server-Sent Events stream

**Event Data:**
```json
{
  "progress": 45.5,
  "currentStep": "Rewriting content with Claude...",
  "status": "processing"
}
```

**Example:**
```typescript
const eventSource = new EventSource(
  `/api/client/content-optimizer/optimize?jobId=${jobId}`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Progress:', data.progress);
  
  if (data.status === 'completed') {
    eventSource.close();
  }
};

eventSource.onerror = () => {
  console.error('SSE connection error');
  eventSource.close();
};
```

---

## Cron Job APIs

### AutoPilot Runner

Runs scheduled AutoPilot jobs every hour.

**Endpoint:** `GET /api/cron/autopilot-runner`

**Authentication:** Required (Bearer token in Authorization header)

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

**Response (200):**
```json
{
  "success": true,
  "message": "AutoPilot cron completed",
  "results": {
    "processed": 5,
    "succeeded": 4,
    "failed": 1,
    "skipped": 0,
    "errors": [
      {
        "articleId": "cm5xyz",
        "error": "Insufficient credits"
      }
    ]
  }
}
```

**Response (401):**
```json
{
  "error": "Unauthorized"
}
```

**Cron Schedule:**
```
0 * * * * (Every hour at minute 0)
```

**What it does:**
1. Finds all ArticleIdeas with `autopilotNextRun <= now`
2. Checks client has sufficient credits (≥200)
3. Runs AutoPilot job for each
4. Updates `autopilotLastRun` and `autopilotNextRun`
5. Logs results

---

## Error Handling

### Standard Error Response

All API endpoints return errors in this format:

```json
{
  "error": "Error message here"
}
```

### HTTP Status Codes

- **200**: Success
- **400**: Bad Request (invalid parameters)
- **401**: Unauthorized (not authenticated)
- **403**: Forbidden (access denied)
- **404**: Not Found (resource doesn't exist)
- **500**: Internal Server Error

### Common Errors

#### Insufficient Credits
```json
{
  "error": "Insufficient credits. Required: 103, Available: 50"
}
```

#### WordPress Not Configured
```json
{
  "error": "WordPress not configured for this project"
}
```

#### API Key Missing
```json
{
  "error": "AIML_API_KEY not configured"
}
```

#### Job Already Running
```json
{
  "error": "AutoPilot job already running for this article"
}
```

---

## Rate Limiting

### API Rate Limits

- **AutoPilot Start**: 10 requests/minute per client
- **Status Check**: 60 requests/minute per client
- **Analyze Posts**: 5 requests/minute per client
- **Optimize Post**: 3 requests/minute per client

### External API Limits

**Perplexity API:**
- 50 requests/minute
- Automatic retry with exponential backoff

**AIML API (Claude & Flux):**
- Model-specific limits
- Automatic retry on rate limit errors

**AWS S3:**
- No strict limit
- Throttled at high volumes

### Handling Rate Limits

If you hit a rate limit, the API returns:
```json
{
  "error": "Rate limit exceeded. Please try again in 30 seconds."
}
```

**Best Practices:**
- Use the job status endpoint to poll, not restart jobs
- Cache analysis results
- Batch operations where possible
- Implement exponential backoff on retries

---

## Webhook Support (Future)

Coming soon: Webhook notifications for job completion.

```json
{
  "event": "autopilot.completed",
  "jobId": "job-abc123",
  "articleId": "cm5xyz",
  "wordpressUrl": "https://example.com/article-slug",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## SDK Examples

### TypeScript Client

```typescript
class AutoPilotClient {
  private baseUrl = '/api/client/autopilot';

  async startJob(articleIdeaId: string, frequency: string = 'once') {
    const response = await fetch(`${this.baseUrl}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleIdeaId, frequency }),
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    return await response.json();
  }

  async getStatus(jobId: string) {
    const response = await fetch(`${this.baseUrl}/status/${jobId}`);
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    return await response.json();
  }

  async pollUntilComplete(jobId: string, onProgress?: (progress: number) => void) {
    while (true) {
      const data = await this.getStatus(jobId);
      
      if (onProgress) {
        onProgress(data.progress);
      }
      
      if (data.job.status === 'completed') {
        return data.job.result;
      }
      
      if (data.job.status === 'failed') {
        throw new Error(data.job.error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Usage
const client = new AutoPilotClient();
const { jobId } = await client.startJob('cm5abc123', 'weekly');
const result = await client.pollUntilComplete(jobId, (progress) => {
  console.log(`Progress: ${progress}%`);
});
console.log('Article URL:', result.wordpressUrl);
```

---

## Support

For questions or issues:
- GitHub Issues: https://github.com/Mikeyy1405/Writgoai.nl/issues
- Email: info@writgo.nl
- Documentation: /AUTOPILOT_V2_README.md
