# 🚀 Migration Guide: API Routes → Server Actions

## Overzicht

Dit document beschrijft hoe je frontend componenten migreert van de oude API routes naar de nieuwe Server Actions.

## Waarom Server Actions?

### ✅ Voordelen

1. **Type-safe end-to-end** - Direct function calls zonder fetch() boilerplate
2. **Betere performance** - Geen extra HTTP roundtrips
3. **Automatische revalidation** - Built-in cache management met `revalidatePath()`
4. **Minder code** - 90% minder boilerplate code
5. **Betere error handling** - Direct error throwing en catching
6. **No CORS issues** - Alles is server-side

### ❌ Oude manier (API Routes)

```typescript
// ❌ Oude manier - veel boilerplate
async function generateContent() {
  try {
    const response = await fetch('/api/client/generate-article', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'My Topic',
        keywords: ['keyword1', 'keyword2'],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

### ✅ Nieuwe manier (Server Actions)

```typescript
// ✅ Nieuwe manier - clean en type-safe
import { generateContent } from '@/app/actions/content';

async function handleGenerate() {
  try {
    const result = await generateContent({
      projectId: selectedProject,
      topic: 'My Topic',
      keywords: ['keyword1', 'keyword2'],
      wordCount: 1500,
      tone: 'professional',
      language: 'nl',
      mode: 'quick',
    });

    // result is type-safe!
    console.log(`Generated: ${result.contentId}`);
  } catch (error) {
    // Errors are thrown directly
    toast.error(error.message);
  }
}
```

## 📦 Beschikbare Server Actions

### 1. Content Actions (`app/actions/content.ts`)

```typescript
import {
  generateContent,
  getContentLibrary,
  updateContent,
  deleteContent,
  researchKeywords,
  getArticleIdeas,
  createArticleIdea,
  updateArticleIdea,
  deleteArticleIdea,
} from '@/app/actions/content';

// Vervangt:
// - /api/client/generate-article
// - /api/client/generate-seo-blog
// - /api/client/content-library
// - /api/client/article-ideas
// - etc.
```

### 2. WordPress Actions (`app/actions/wordpress.ts`)

```typescript
import {
  publishToWordPress,
  optimizeWordPressPost,
  getWordPressPosts,
  getWordPressPost,
  updateWordPressPost,
  deleteWordPressPost,
  scanWordPressSite,
} from '@/app/actions/wordpress';

// Vervangt:
// - /api/client/wordpress/publish
// - /api/client/publish-to-wordpress
// - /api/client/wordpress/posts
// - etc.
```

### 3. Media Actions (`app/actions/media.ts`)

```typescript
import {
  generateImage,
  generateVideo,
  generateFeaturedImage,
  uploadFileToS3,
  searchStockImages,
  getImageModels,
} from '@/app/actions/media';

// Vervangt:
// - /api/client/generate-image
// - /api/client/generate-video
// - /api/client/images/search-stock
// - etc.
```

### 4. AutoPilot Actions (`app/actions/autopilot.ts`)

```typescript
import {
  scheduleAutoPilot,
  runAutoPilotNow,
  getAutoPilotStatus,
  getAutoPilotJobs,
  cancelAutoPilotJob,
  scheduleArticleIdea,
  getScheduledIdeas,
  unscheduleArticleIdea,
} from '@/app/actions/autopilot';

// Vervangt:
// - /api/client/autopilot/start
// - /api/client/autopilot/schedule
// - /api/client/autopilot/status
// - etc.
```

### 5. Agency Actions (`app/actions/agency.ts`)

```typescript
import {
  createAssignment,
  getAssignments,
  updateAssignment,
  deleteAssignment,
  createRequest,
  getRequests,
  updateRequest,
  getInvoices,
  getInvoice,
  payInvoice,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
} from '@/app/actions/agency';

// Vervangt:
// - /api/client/assignments
// - /api/client/requests
// - /api/client/invoices
// - /api/client/projects
```

### 6. Utils Actions (`app/actions/utils.ts`)

```typescript
import {
  getCredits,
  addCredits,
  getCreditTransactions,
  getSubscription,
  cancelSubscription,
  getUsageStats,
  getUserSettings,
  updateUserSettings,
  updateWordPressCredentials,
  testWordPressConnection,
} from '@/app/actions/utils';
```

## 🔄 Migratie Stappen

### Stap 1: Import de Server Action

```typescript
'use client'; // Client component

import { generateContent } from '@/app/actions/content';
import { toast } from 'sonner';
```

### Stap 2: Verwijder oude fetch() call

```typescript
// ❌ VERWIJDER DIT
const response = await fetch('/api/client/generate-article', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
const result = await response.json();
```

### Stap 3: Gebruik de Server Action

```typescript
// ✅ VERVANG MET DIT
const result = await generateContent({
  projectId: data.projectId,
  topic: data.topic,
  keywords: data.keywords,
  wordCount: data.wordCount,
  tone: data.tone,
  language: 'nl',
  mode: 'quick',
});
```

### Stap 4: Update error handling

```typescript
try {
  const result = await generateContent(input);
  toast.success('Content succesvol gegenereerd!');
  // Handle success
} catch (error: any) {
  // Errors are thrown directly
  toast.error(error.message);
}
```

## 📝 Voorbeelden

### Voorbeeld 1: Content Generator Form

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateContent } from '@/app/actions/content';
import { toast } from 'sonner';

export default function ContentGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    
    try {
      const result = await generateContent({
        projectId: formData.get('projectId') as string,
        topic: formData.get('topic') as string,
        keywords: (formData.get('keywords') as string).split(','),
        wordCount: Number(formData.get('wordCount')),
        tone: formData.get('tone') as any,
        language: 'nl',
        mode: formData.get('mode') as any,
        includeImages: formData.get('includeImages') === 'true',
        includeFAQ: formData.get('includeFAQ') === 'true',
      });

      toast.success('Content gegenereerd!');
      router.push(`/client-portal/content-library/${result.contentId}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Genereren...' : 'Genereer Content'}
      </button>
    </form>
  );
}
```

### Voorbeeld 2: WordPress Publishing

```typescript
'use client';

import { publishToWordPress } from '@/app/actions/wordpress';
import { toast } from 'sonner';

async function handlePublish(contentId: string, projectId: string) {
  try {
    const result = await publishToWordPress({
      contentId,
      projectId,
      status: 'publish',
      categories: ['Blog'],
      tags: ['AI', 'Content'],
    });

    toast.success(`Gepubliceerd: ${result.url}`);
    window.open(result.url, '_blank');
  } catch (error: any) {
    toast.error(error.message);
  }
}
```

### Voorbeeld 3: Image Generator

```typescript
'use client';

import { generateImage } from '@/app/actions/media';
import { toast } from 'sonner';

async function handleGenerateImage(prompt: string) {
  try {
    const result = await generateImage({
      prompt,
      model: 'FLUX_PRO',
      width: 1920,
      height: 1080,
      quality: 'high',
    });

    toast.success(`Afbeelding gegenereerd! (${result.creditsUsed} credits)`);
    return result.imageUrl;
  } catch (error: any) {
    toast.error(error.message);
    return null;
  }
}
```

### Voorbeeld 4: AutoPilot Schedule

```typescript
'use client';

import { scheduleAutoPilot } from '@/app/actions/autopilot';
import { toast } from 'sonner';

async function handleSchedule(projectId: string) {
  try {
    const result = await scheduleAutoPilot({
      projectId,
      enabled: true,
      frequency: 'daily',
      mode: 'research',
      articlesPerRun: 2,
      autoPublish: true,
      publishingTime: '09:00',
    });

    toast.success(
      `AutoPilot ingeschakeld! Volgende run: ${result.nextRun.toLocaleString()}`
    );
  } catch (error: any) {
    toast.error(error.message);
  }
}
```

### Voorbeeld 5: Credits & Settings

```typescript
'use client';

import { getCredits, updateUserSettings } from '@/app/actions/utils';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    loadCredits();
  }, []);

  async function loadCredits() {
    try {
      const result = await getCredits();
      setCredits(result.credits.total);
    } catch (error) {
      console.error('Failed to load credits');
    }
  }

  async function handleUpdateSettings(formData: FormData) {
    try {
      await updateUserSettings({
        name: formData.get('name') as string,
        targetAudience: formData.get('targetAudience') as string,
        brandVoice: formData.get('brandVoice') as string,
      });

      toast.success('Instellingen opgeslagen!');
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <div>
      <p>Credits: {credits}</p>
      <form action={handleUpdateSettings}>
        {/* Settings fields */}
      </form>
    </div>
  );
}
```

## 🎯 Best Practices

### 1. Error Handling

```typescript
try {
  const result = await serverAction(input);
  // Handle success
} catch (error: any) {
  // Error message is already translated
  toast.error(error.message);
}
```

### 2. Loading States

```typescript
const [loading, setLoading] = useState(false);

async function handleAction() {
  setLoading(true);
  try {
    await serverAction();
  } finally {
    setLoading(false); // Always reset loading
  }
}
```

### 3. Form Actions

```typescript
// Use native form actions for better UX
<form action={handleSubmit}>
  <input name="topic" />
  <button type="submit">Submit</button>
</form>
```

### 4. Optimistic Updates

```typescript
import { useOptimistic } from 'react';

const [optimisticContent, addOptimistic] = useOptimistic(
  content,
  (state, newContent) => [...state, newContent]
);

async function handleCreate(data) {
  addOptimistic(data); // Update UI immediately
  try {
    await createContent(data); // Persist to server
  } catch {
    // Revert on error
  }
}
```

## 🔐 Security

Alle Server Actions:
- ✅ Vereisen authenticatie via `auth()`
- ✅ Checken project/resource ownership
- ✅ Valideren input data
- ✅ Gebruiken prepared statements (Prisma)
- ✅ Return safe error messages (geen sensitive data)

## 📊 Voortgang

### Gemigreerd
- ✅ Content generation
- ✅ WordPress publishing
- ✅ Media generation
- ✅ AutoPilot
- ✅ Agency operations
- ✅ Utils & settings

### Te migreren
- [ ] Content generator pages
- [ ] AutoPilot dashboard
- [ ] Content library
- [ ] WordPress management
- [ ] Project settings

## 🐛 Troubleshooting

### Problem: "Error: Cannot find module '@/app/actions/...'"

**Oplossing:**
```typescript
// Zorg dat import correct is
import { generateContent } from '@/app/actions/content';
// NIET: import { generateContent } from 'app/actions/content';
```

### Problem: Type errors

**Oplossing:**
```typescript
// Gebruik TypeScript types
import type { GenerateContentInput } from '@/app/actions/content';

const input: GenerateContentInput = {
  projectId: '...',
  topic: '...',
  // etc.
};
```

### Problem: "Not authenticated" error

**Oplossing:**
Server Actions vereisen een geldige sessie. Zorg dat de gebruiker ingelogd is.

## 📚 Resources

- [Next.js Server Actions Docs](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React useOptimistic Hook](https://react.dev/reference/react/useOptimistic)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/best-practices)
