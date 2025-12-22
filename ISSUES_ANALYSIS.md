# Writgo.nl App - Issues Analysis

## Gevonden Problemen

### 1. **Database Schema Mismatch** (KRITIEK)
De code gebruikt `projects` tabel met `user_id`, maar de database heeft ook een `Project` tabel met `clientId`. Dit zorgt voor verwarring en mogelijke fouten.

**Bestanden:**
- `app/api/projects/list/route.ts` - Gebruikt `projects.user_id`
- `app/api/articles/list/route.ts` - Gebruikt `projects.user_id`
- Database heeft zowel `projects` als `Project` tabellen

### 2. **AI Client Configuratie** (KRITIEK)
De AI client gebruikt `AIML_API_KEY` maar de `.env.example` toont andere keys.

**Probleem in `lib/ai-client.ts`:**
```typescript
apiKey: process.env.AIML_API_KEY || '',
```

**Maar `.env.example` heeft:**
```
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 3. **Articles Update API Verkeerd Gedrag** (KRITIEK)
De `app/api/articles/update/route.ts` verwacht `article_id` maar de editor stuurt andere data.

**Editor stuurt:**
```javascript
{
  title: article.title,
  content: editedContent,
  word_count: ...,
  project_id: project.id,
  status: 'draft'
}
```

**API verwacht:**
```javascript
{ article_id: ... }
```

### 4. **Missing word_count Column** (KRITIEK)
De `articles` tabel heeft geen `word_count` kolom, maar de code probeert deze te gebruiken.

### 5. **Content Plan Generatie - JSON Parsing** (MEDIUM)
De JSON parsing in `app/api/simple/generate-content-plan/route.ts` kan falen als AI geen valide JSON teruggeeft.

### 6. **Supabase Auth Cookie Handling** (MEDIUM)
De `lib/supabase-server.ts` gebruikt synchrone cookies() call die kan falen in bepaalde contexten.

### 7. **Missing Tables voor Writgo Features**
De volgende tabellen worden verwacht maar ontbreken mogelijk:
- `writgo_content_queue`
- `writgo_activity_log`

### 8. **Project WordPress Status Altijd "Verbonden"**
In `app/dashboard/projects/page.tsx` toont altijd "WordPress verbonden" ongeacht of credentials zijn ingesteld.

### 9. **Library Page - Publish Functie Broken**
De publish functie in library roept `/api/articles/update` aan met verkeerde parameters.

### 10. **Topic Discovery Hardcoded Date**
In `lib/topic-discovery.ts` staat "december 2024" hardcoded.

## Oplossingen Nodig

1. Fix AI client configuratie om juiste env vars te gebruiken
2. Fix articles/update API om nieuwe artikelen te kunnen aanmaken
3. Voeg word_count kolom toe aan articles tabel of verwijder uit code
4. Fix project WordPress status weergave
5. Update topic discovery met dynamische datum
6. Verbeter JSON parsing met betere error handling
