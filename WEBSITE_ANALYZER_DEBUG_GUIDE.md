# 🔍 Website Analyzer Debug Guide

## ✅ Changes Made

Ik heb uitgebreide debugging en logging toegevoegd aan de Website Analyzer om het probleem op te lossen waarbij de analyse "complete" zegt maar geen informatie toont.

### 📁 Updated Files

1. **`nextjs_space/lib/analyzer/website-analyzer.ts`**
   - ✅ Uitgebreide console logging bij elke stap
   - ✅ Betere error handling met gedetailleerde error messages
   - ✅ Fallback analysis met duidelijke reasoning
   - ✅ Database save error handling (analysis blijft geldig zelfs als save faalt)
   - ✅ Visual indicators (emojis) voor betere leesbaarheid

2. **`nextjs_space/app/api/admin/analyzer/website/route.ts`**
   - ✅ Request/response logging
   - ✅ Authentication status logging
   - ✅ Detailed error logging met stack traces
   - ✅ Input validation logging

3. **`nextjs_space/components/analyzer/WebsiteAnalyzer.tsx`**
   - ✅ Frontend API call logging
   - ✅ Response data logging (preview + full data)
   - ✅ State update logging
   - ✅ Error logging met volledige details

## 🧪 How to Test

### 1. Start de Development Server

```bash
cd /home/ubuntu/writgoai_app/nextjs_space
npm run dev
```

### 2. Open de Browser Console

1. Open je browser (Chrome/Firefox/Safari)
2. Ga naar de pagina met de Website Analyzer
3. Open Developer Tools (F12 of Cmd+Option+I)
4. Ga naar het "Console" tab

### 3. Run de Analyse

1. Selecteer een client
2. Klik op "🤖 Analyseer Mijn Website"
3. Bekijk de console logs

## 📊 Console Log Format

De logs zijn nu georganiseerd in drie niveaus:

### 🟦 Frontend Logs (Blauw)
```
🟦 ========================================
🟦 [Frontend] Starting website analysis...
🟦 ========================================
🟦 Client ID: abc123
🟦 Is valid: true
🟦 [Frontend] Making API request...
```

### 🔵 API Logs (Blauw)
```
🔵 ========================================
🔵 [API] POST /api/admin/analyzer/website
🔵 ========================================
✅ [API] Authenticated as: info@writgo.nl
📝 [API] Request body: { clientId: "abc123" }
```

### 🔵 Service Logs (Blauw met emojis)
```
🔵 ========================================
🔵 [Website Analyzer] Starting analysis for client abc123
🔵 ========================================

🔵 STEP 1: Collecting website data...
   📂 Collecting data for client abc123...
   📂 Fetching client info...
   ✅ Client found: { name: "Test Client", ... }
   📂 Fetching blog posts...
   ✅ Found 5 blog posts
   📂 Fetching social media posts...
   ✅ Found 10 social media posts

🔵 STEP 2: Analyzing with AI...
   🤖 Preparing AI analysis prompt...
   🔑 Checking API key...
   ✅ API key found (sk-proj-...)
   🌐 Calling AI API (model: gpt-4o)...
   📡 AI API response status: 200
   ✅ AI API response received
   📄 Raw AI response (first 200 chars): {...
   🔄 Parsing JSON response...
   ✅ JSON parsed successfully
   🔍 Validating response structure...
   ✅ Response structure validated
   ✅ AI analysis successful!

🔵 STEP 3: Saving to database...
   💾 Saving analysis to database...
   ✅ Analysis saved to database (ID: xyz789)

✅ ========================================
✅ [Website Analyzer] ANALYSIS COMPLETE!
✅ ========================================
📊 Final Results: {...}
```

## 🔍 What to Look For

### ✅ Success Scenario

Als alles werkt zie je:
1. ✅ Client found
2. ✅ Blog posts found (aantal)
3. ✅ Social posts found (aantal)
4. ✅ AI API response received
5. ✅ JSON parsed successfully
6. ✅ Analysis saved to database
7. 🟩 [Frontend] Full analysis data: {...}

### ❌ Error Scenarios

#### Scenario 1: Geen Content
```
⚠️  WARNING: No blog posts or social media posts found for this client!
⚠️  Analysis will be based on client info and fallback data only
```
**Oplossing:** Maak eerst blog posts of social media posts aan voor deze client

#### Scenario 2: AI API Fout
```
❌ AI API error: { status: 401, error: "Invalid API key" }
🔄 Using fallback analysis...
```
**Oplossing:** Check de `AIML_API_KEY` in je `.env` file

#### Scenario 3: Database Save Fout
```
❌ Error saving analysis to database: { error: "...", code: "..." }
⚠️  Analysis will be returned but not saved to database
```
**Oplossing:** Check de database migratie voor `WebsiteAnalysis` tabel

#### Scenario 4: JSON Parse Fout
```
❌ No content in AI response: {...}
```
**Oplossing:** Check de AI API response format

## 🐛 Common Issues & Solutions

### Issue 1: "Complete" maar geen data getoond

**Mogelijk oorzaak:**
- Frontend ontvangt lege response
- Response heeft niet de verwachte structuur
- State update faalt

**Check in console:**
```
🟩 [Frontend] Full analysis data: {...}
```

Als dit object leeg is of missende velden heeft, is daar het probleem.

### Issue 2: Fallback analysis gebruikt

**Mogelijk oorzaak:**
- AI API fout (401, 429, 500)
- JSON parse fout
- Incomplete response

**Check in console:**
```
⚠️ Fallback analyse gebruikt (AI fout: ...)
```

### Issue 3: Database save faalt

**Mogelijk oorzaak:**
- `WebsiteAnalysis` tabel bestaat niet
- Foreign key constraint fout
- RLS policy blokkeert de save

**Check in console:**
```
❌ Error saving analysis to database: { error: "...", code: "..." }
```

## 🔧 Quick Fixes

### Fix 1: Check Database Tabel

```sql
-- Check if WebsiteAnalysis table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'WebsiteAnalysis';

-- If not exists, run migration
-- /home/ubuntu/writgoai_app/supabase/migrations/20251212_website_analysis_table.sql
```

### Fix 2: Check API Key

```bash
cd /home/ubuntu/writgoai_app/nextjs_space
grep AIML_API_KEY .env.local
# Should output: AIML_API_KEY=sk-proj-...
```

### Fix 3: Check Client Has Content

```sql
-- Check blog posts
SELECT COUNT(*) FROM "BlogPost" WHERE "clientId" = 'YOUR_CLIENT_ID';

-- Check social media posts
SELECT COUNT(*) FROM "SocialMediaPost" 
WHERE "strategyId" IN (
  SELECT id FROM "SocialMediaStrategy" 
  WHERE "clientId" = 'YOUR_CLIENT_ID'
);
```

## 📧 Debugging Checklist

Gebruik deze checklist bij het debuggen:

- [ ] Console toont frontend logs (🟦)
- [ ] Console toont API logs (🔵)
- [ ] Console toont service logs (🔵 + emojis)
- [ ] Client ID is geldig en niet "default-client-id"
- [ ] Client bestaat in database
- [ ] Er zijn blog posts OF social media posts
- [ ] AI API key is geconfigureerd
- [ ] AI API response is succesvol (200)
- [ ] JSON parse is succesvol
- [ ] Database save is succesvol (of waarschuwing zichtbaar)
- [ ] Frontend ontvangt volledige data
- [ ] Frontend toont analyse resultaten

## 🎯 Next Steps

Na het bekijken van de console logs:

1. **Als alles werkt:**
   - ✅ Geniet van je werkende Website Analyzer!
   - Share de logs met mij om te bevestigen

2. **Als er errors zijn:**
   - 📸 Maak screenshots van de console logs
   - 📋 Kopieer de volledige error messages
   - 🔗 Share met mij voor verdere diagnose

## 📝 Notes

- Alle logs zijn nu visueel onderscheiden met emojis en kleuren
- Frontend logs: 🟦 (blauw)
- API logs: 🔵 (donkerblauw)
- Success: ✅ (groen)
- Errors: ❌ (rood)
- Warnings: ⚠️ (geel)
- Info: 📊📁💾🤖 (diverse info icons)

Dit maakt het veel makkelijker om de flow te volgen en problemen te identificeren!

---

**Commit:** `7be8e56` - "fix: Add extensive debugging and logging to website analyzer"
**Pushed to:** `main` branch op GitHub
