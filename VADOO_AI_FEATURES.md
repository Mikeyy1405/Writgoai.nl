
# Vadoo AI Nieuwe Functionaliteiten

## Overzicht
De WritgoAI app is uitgebreid met drie krachtige Vadoo API features voor complete video productie:

### 1. **AI Story Video Genereren** ⭐ (HOOFDFUNCTIE)
Maak complete AI-gegenereerde video verhalen met automatisch script, voiceover en visuals.

**Features:**
- Kies uit verschillende story topics (Horror, Motivational, Reddit, Fun Facts, etc.)
- Of maak custom verhalen met eigen prompt
- 6 verschillende AI voices (mannelijk/vrouwelijk)
- Meerdere video lengtes (30 sec tot 10 minuten)
- Caption thema's (Hormozi, MrBeast, Ali Abdaal)
- Visual stijlen (Realistic, Anime, Cartoon, 3D)
- Multiple aspect ratios (9:16, 16:9, 1:1)
- Multi-language support (NL, EN, ES, FR, DE)
- Custom instructions voor AI
- Optionele achtergrond muziek
- Verwerkingstijd: 2-3 minuten
- Kosten: 2-10 credits (afhankelijk van lengte)

**API Endpoint:** `POST /api/vadoo/generate-story`

**Parameters:**
```typescript
{
  topic?: string,              // Story type of "Custom"
  prompt?: string,             // Custom verhaal (als topic="Custom")
  voice?: string,              // AI voice (default: Charlie)
  theme?: string,              // Caption stijl (default: Hormozi_1)
  style?: string,              // Visual stijl (default: None)
  language?: string,           // Taal (default: Dutch)
  duration?: string,           // Video lengte (default: 30-60)
  aspectRatio?: string,        // Beeldverhouding (default: 9:16)
  customInstructions?: string, // Extra AI instructies
  bgMusic?: string,            // Achtergrond muziek
  bgMusicVolume?: string       // Muziek volume (1-100)
}
```

**Beschikbare Topics:**
- Random AI Story
- Horror Story
- Motivational Story
- Reddit Story
- Fun Facts
- History Facts
- Custom (eigen prompt)

**Beschikbare Voices:**
- Charlie (Mannelijk)
- George (Mannelijk)
- Callum (Mannelijk)
- Sarah (Vrouwelijk)
- Laura (Vrouwelijk)
- Charlotte (Vrouwelijk)

**Credit Kosten:**
- 30-60 seconden: 2 credits
- 60-90 seconden: 3 credits
- 90-120 seconden: 4 credits
- 2-3 minuten: 5 credits
- 5 minuten: 6 credits
- 10 minuten: 10 credits

**Gebruik in UI:**
- Klik op "AI Story Video ⭐" in de WritgoAI chat (highlighted button)
- Selecteer story topic of kies Custom
- Kies video lengte, voice, en stijl
- Pas caption thema en aspect ratio aan
- Voeg optioneel custom instructions toe
- Voeg optioneel achtergrond muziek toe
- Klik "Genereer AI Story"

### 2. **AI Captions Toevoegen** 🎬
Voeg automatisch AI-gegenereerde ondertiteling toe aan bestaande video's.

**Features:**
- Upload een video URL
- Kies uit verschillende caption thema's (Hormozi, MrBeast, Ali Abdaal)
- Automatische Dutch/English ondertiteling
- Verwerkingstijd: 2-3 minuten
- Kosten: 1 credit per video

**API Endpoint:** `POST /api/vadoo/add-captions`

**Parameters:**
```typescript
{
  videoUrl: string,      // Direct link naar video bestand
  theme?: string,        // Caption stijl (default: Hormozi_1)
  language?: string      // Taal (default: Dutch)
}
```

**Gebruik in UI:**
- Klik op "AI Captions toevoegen" in de WritgoAI chat
- Vul video URL in
- Selecteer caption thema
- Klik "Captions Toevoegen"

### 3. **YouTube naar AI Clips** 📺
Maak automatisch virale korte clips uit lange YouTube video's.

**Features:**
- Geef een YouTube URL op
- Kies aantal clips (1-5)
- AI selecteert automatisch de beste momenten
- Voegt captions toe aan clips
- Verwerkingstijd: 2-3 minuten
- Kosten: 2 credits per clip

**API Endpoint:** `POST /api/vadoo/create-clips`

**Parameters:**
```typescript
{
  youtubeUrl: string,    // YouTube video URL
  theme?: string,        // Caption stijl (default: Hormozi_1)
  language?: string,     // Taal (default: Dutch)
  numClips?: number      // Aantal clips (default: 1)
}
```

**Gebruik in UI:**
- Klik op "YouTube naar Clips" in de WritgoAI chat
- Vul YouTube URL in
- Selecteer aantal clips
- Selecteer caption thema
- Klik "Clips Genereren"

## Technische Details

### Database Schema
Videos worden opgeslagen in de `Video` tabel met:
- `vid`: Unieke Vadoo video ID
- `clientId`: Klant die video aanvroeg
- `status`: processing → completed/failed
- `videoUrl`: Download link (beschikbaar 30 minuten)
- `thumbnailUrl`: Thumbnail van video

### Credit Systeem
- **Captions:** 1 credit per video
- **Clips:** 2 credits per clip
- Automatic deductie van `subscriptionCredits` eerst, dan `topUpCredits`
- Unlimited accounts worden niet belast

### Webhook Integratie
Vadoo stuurt een webhook naar `/api/vadoo/webhook` wanneer video klaar is:
```typescript
{
  vid: string,
  video_url: string,
  thumbnail_url?: string,
  status: 'completed' | 'failed'
}
```

De app update automatisch de video status en toont download link.

### Polling Mechanisme
De WritgoAI chat poll elke 5 seconden de video status via `/api/ai-agent/video-status/[id]`:
- Toont "⏳ Video wordt gegenereerd..." tijdens processing
- Toont "✅ Video klaar!" met download link bij completion
- Toont "❌ Video generatie mislukt" bij errors
- Timeout na 10 minuten

## UI Components

### Quick Actions Buttons
In de WritgoAI chat zie je nu 6 quick action buttons:
1. **Tekst schrijven** - Content generatie
2. **Afbeeldingen maken** - AI afbeeldingen (20+ modellen)
3. **Video generatie** - Korte video clips maken
4. **AI Captions toevoegen** - Ondertiteling toevoegen
5. **YouTube naar Clips** - Clips uit YouTube video's
6. **AI Story Video ⭐** - Complete AI verhaal video's (HOOFDFUNCTIE, highlighted)

### Caption Dialog
- Video URL input
- Caption thema selector
- Kosten indicator (1 credit)
- Tijd indicator (2-3 minuten)

### Clips Dialog
- YouTube URL input
- Aantal clips selector (1-5)
- Caption thema selector
- Kosten indicator (2 credits per clip)
- Tijd indicator (2-3 minuten)

### AI Story Dialog (UITGEBREID)
- Story topic selector (7 opties)
- Custom prompt input (voor Custom topic)
- Video lengte selector (6 opties met credit kosten)
- AI voice selector (6 voices)
- Caption stijl selector (4 thema's)
- Beeldverhouding selector (3 formaten)
- Taal selector (5 talen)
- Visual stijl selector (5 stijlen)
- Custom instructions textarea
- Achtergrond muziek input (optioneel)
- Muziek volume slider (optioneel)
- Real-time kosten berekening (2-10 credits)
- Complete feature overzicht

## Beschikbare Caption Thema's
1. **Hormozi_1** - Alex Hormozi stijl (default)
2. **Hormozi_2** - Alternatieve Hormozi stijl
3. **MrBeast** - MrBeast video stijl
4. **Ali_Abdaal** - Ali Abdaal stijl

## Error Handling
- Insufficient credits → Toont credit paywall
- Invalid URL → Validatie error
- API failure → Gebruiksvriendelijke error message
- Timeout → "Video generatie duurt langer dan verwacht"

## Files Aangepast
1. `lib/vadoo.ts` - Nieuwe API functies (addAICaptions, createAIClips, createAIVideo)
2. `app/api/vadoo/add-captions/route.ts` - Caption API endpoint
3. `app/api/vadoo/create-clips/route.ts` - Clips API endpoint
4. `app/api/vadoo/generate-story/route.ts` - AI Story Video API endpoint (NIEUW)
5. `components/writgo-deep-agent.tsx` - UI dialogs en functionaliteit (uitgebreid)

## Testing
Log in op https://WritgoAI.nl met:
- Email: mikeschonewille@gmail.com
- Ga naar WritgoAI chat
- Test de nieuwe buttons

## Kosten Overzicht
| Feature | Credits | Verwerkingstijd |
|---------|---------|-----------------|
| **AI Story 30-60 sec** | 2 | 2-3 minuten |
| **AI Story 60-90 sec** | 3 | 2-3 minuten |
| **AI Story 90-120 sec** | 4 | 2-3 minuten |
| **AI Story 2-3 min** | 5 | 2-3 minuten |
| **AI Story 5 min** | 6 | 2-3 minuten |
| **AI Story 10 min** | 10 | 2-3 minuten |
| AI Captions | 1 | 2-3 minuten |
| 1 AI Clip | 2 | 2-3 minuten |
| 3 AI Clips | 6 | 2-3 minuten |
| 5 AI Clips | 10 | 2-3 minuten |

## Volgende Stappen
- Test de functionaliteiten met echte video's
- Monitor credit usage
- Optimaliseer caption thema's
- Eventueel meer thema's toevoegen
