# Fix video API validation errors and add all AIML models

## 🎯 Probleem
Video generatie faalde met deze errors:
- ❌ `Invalid enum value. Expected 'klingai/...' | 'runway/...', received 'luma/ray-2'`
- ❌ `Invalid enum value. Expected '5' | '10', received '8'` (duration)
- ❌ `Invalid enum value. Expected '16:9', received '9:16'` (aspect ratio)
- ❌ `Error: Unknown model: luma/ray-2`

## ✅ Oplossing

### 1. Model Validatie Gefixt
- ❌ Verwijderd: ongeldige `luma/ray-2` en `luma/ray-flash-2` modellen
- ✅ Toegevoegd: **25+ geldige AIML API modellen** van alle grote providers
- ✅ Default model: `minimax/hailuo-02` (10 credits, goede prijs/kwaliteit)

### 2. Duration Validatie Gefixt
- ✅ Automatisch normaliseren naar 5 of 10 seconden (API requirement)
- ✅ Invalid durations zoals 8 seconden worden automatisch geconverteerd
- ✅ Validatie in `generateVideo()` functie

### 3. Aspect Ratio Gefixt
- ✅ Default: `16:9` voor maximale compatibiliteit met AIML API
- ✅ Automatische normalisatie van `9:16` → `16:9` indien nodig
- ✅ Voorkomt API validation errors

### 4. Database Migratie Tools Toegevoegd
Twee opties om bestaande database records te fixen:
- ✅ **Admin API**: `GET/POST /api/admin/fix-video-models`
- ✅ **SQL Script**: `fix_video_models.sql`
- ✅ **Documentatie**: `DATABASE_MIGRATION_README.md`

## 📦 Nieuwe Video Modellen (25+)

### Budget Tier (8-10 credits)
- ⭐ `minimax/hailuo-02` - **Default, beste prijs/kwaliteit**
- `video-01` - Snelle generatie
- `sber-ai/kandinsky5-distill-t2v` - Budget optie
- `veed/fabric-1.0-fast` - Snelle generatie

### Standard Tier (12-15 credits)
- `minimax/hailuo-2.3` - Verbeterde kwaliteit
- `kling-video/v1.6/standard/text-to-video` - Gladde beweging
- `pixverse/v5/text-to-video` - Goede all-round
- `pixverse/v5/image-to-video` - Image-to-video
- `pixverse/v5/transition` - Transition effects
- `gen3a_turbo` - Runway Gen-3

### Premium Tier (20-35 credits)
- `runway/gen4_turbo` - State-of-the-art (20 credits)
- `runway/gen4_aleph` - Hoogste kwaliteit (25 credits)
- `runway/act_two` - Character animation (20 credits)
- `openai/sora-2-t2v` - OpenAI Sora (25 credits)
- `openai/sora-2-i2v` - Sora image-to-video (25 credits)
- `openai/sora-2-pro-t2v` - Sora Pro (35 credits)
- `openai/sora-2-pro-i2v` - Sora Pro i2v (35 credits)

Zie `lib/aiml-api-client.ts` voor volledige lijst.

## 🔄 Database Migratie Vereist

**⚠️ BELANGRIJK:** Na merge moet de database worden gemigreerd om oude model names te fixen.

### Kies ONE van deze opties:

#### Optie 1: Via Admin API (Aanbevolen - na deployment)
```bash
# Check welke scenes invalid zijn
curl https://writgoai.nl/api/admin/fix-video-models

# Fix alle invalid models automatisch
curl -X POST https://writgoai.nl/api/admin/fix-video-models
```

#### Optie 2: Via Supabase SQL Editor
1. Open Supabase Dashboard → SQL Editor
2. Kopieer en run `fix_video_models.sql`
3. Verificatie queries worden automatisch uitgevoerd

### Model Mapping
De migratie update automatisch:
- `luma/ray-2` → `minimax/hailuo-02` (gelijke kwaliteit/prijs)
- `luma/ray-flash-2` → `video-01` (budget optie)
- Alle andere invalid models → `minimax/hailuo-02` (safe default)

## 📝 Gewijzigde Files

### Core Changes
- ✅ `lib/aiml-api-client.ts` - 25+ modellen toegevoegd, validatie gefixt
- ✅ `app/api/video-studio/projects/route.ts` - Defaults geüpdatet

### Migration Tools (NEW)
- 🆕 `app/api/admin/fix-video-models/route.ts` - Admin API endpoint
- 🆕 `fix_video_models.sql` - SQL migratie script
- 🆕 `DATABASE_MIGRATION_README.md` - Uitgebreide documentatie

## ✅ Testing Checklist

- [x] Alle nieuwe modellen hebben correcte configuratie
- [x] Duration validatie werkt (5 en 10 seconden)
- [x] Aspect ratio normalisatie werkt
- [x] Default model is geldig (`minimax/hailuo-02`)
- [x] Migratie scripts zijn getest
- [ ] **Database migratie moet na deployment worden uitgevoerd**
- [ ] Verificatie na migratie dat `invalid_count = 0`

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Review en merge deze PR
- [ ] Verify alle tests slagen

### Post-Deployment
- [ ] Deploy naar productie
- [ ] **Run database migratie** (kies een optie hierboven)
- [ ] Verificatie: `curl https://writgoai.nl/api/admin/fix-video-models`
  - Moet tonen: `"invalid": 0`
- [ ] Test nieuwe video generatie met `minimax/hailuo-02`
- [ ] Monitor logs voor eventuele API errors

## 📊 Impact

### Voor Gebruikers
- ✅ Video generatie werkt weer
- ✅ Keuze uit 25+ modellen (was: 5)
- ✅ Betere prijs/kwaliteit verhouding
- ✅ Meer flexibiliteit in model selectie

### Voor Development
- ✅ Duidelijke validatie errors
- ✅ Automatische parameter normalisatie
- ✅ Database migratie tools voor toekomst
- ✅ Uitgebreide documentatie

## 🔗 Related Issues

Fixes: Video generation failing with invalid model errors

## 📸 Screenshots

N/A - Backend only changes

---

**Samenvatting:** Deze PR lost alle video API validatie errors op door 25+ geldige AIML modellen toe te voegen en parameter validatie te implementeren. Database migratie is vereist na deployment.
