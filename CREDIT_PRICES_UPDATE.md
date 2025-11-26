
# Credit Prijzen Update - Alle Kosten Gecorrigeerd

## Samenvatting

Alle credit prijzen zijn gecontroleerd en gecorrigeerd om consistent te zijn met de actuele credit kosten in `lib/credits.ts`.

## Gevonden en Gecorrigeerde Inconsistenties

### 1. ✅ Blog Generator Knop
**Bestand**: `app/client-portal/blog-generator/page.tsx`

**Probleem**: Knop toonde oude prijzen
- Blog: 10 Credits → **50 Credits** ✅
- Product Review: 15 Credits → **50 Credits** ✅
- Top Lijst: 15 Credits → **50 Credits** ✅

**Status**: ✅ GEFIXED

### 2. ✅ Prijzen Pagina Schattingen
**Bestand**: `app/prijzen/page.tsx`

**Probleem**: Content schattingen waren gebaseerd op oude prijzen

**Gecorrigeerd**:

| Pakket | Oud | Nieuw | 
|--------|-----|-------|
| **Basis (2000 credits)** | ≈ 15-20 blogs of 8-10 videos | ≈ **40 blogs** of **25 videos** ✅ |
| **Professional (6000 credits)** | ≈ 50 blogs of 25 videos | ≈ **120 blogs** of **75 videos** ✅ |
| **Business (15000 credits)** | ≈ 125 blogs of 60 videos | ≈ **300 blogs** of **187 videos** ✅ |
| **Enterprise (40000 credits)** | ≈ 330 blogs of 160 videos | ≈ **800 blogs** of **500 videos** ✅ |

**Berekening**:
- Blog: 50 credits per artikel
- Video (met voiceover & muziek): 80 credits per video
- Simple video: 10-20 credits per video

**Status**: ✅ GEFIXED

### 3. ✅ Custom Video Generator API
**Bestand**: `app/api/ai-agent/generate-custom-video/route.ts`

**Probleem**: API gebruikte 100 credits maar `credits.ts` specificeerde 80

**Gecorrigeerd**:
```typescript
// Was: const VIDEO_GENERATION_COST = 100;
const VIDEO_GENERATION_COST = 80; // 80 credits per video met voiceover & muziek
```

**Status**: ✅ GEFIXED

## Actuele Credit Kosten Overzicht

### Content Generatie
| Type | Kosten | Status |
|------|--------|--------|
| SEO Blog Post | 50 credits | ✅ Consistent |
| Product Review | 50 credits | ✅ Consistent |
| Top Lijst | 50 credits | ✅ Consistent |
| Social Media Post | 15 credits | ✅ Consistent |
| News Article | 40 credits | ✅ Consistent |
| Linkbuilding | 35 credits | ✅ Consistent |
| Code Generation | 25 credits | ✅ Consistent |

### Media
| Type | Kosten | Status |
|------|--------|--------|
| Custom Video (voiceover + muziek) | 80 credits | ✅ Consistent |
| Simple Video (Luma AI) | 10 credits | ✅ Consistent |
| Simple Video (Runway ML) | 20 credits | ✅ Consistent |
| AI Afbeelding (Standard) | 5 credits | ✅ Consistent |
| AI Afbeelding (Premium) | 20 credits | ✅ Consistent |

### Research & Tools
| Type | Kosten | Status |
|------|--------|--------|
| Web Search | 10 credits | ✅ Consistent |
| Keyword Research | 30 credits | ✅ Consistent |

### Chatbot
| Type | Kosten | Status |
|------|--------|--------|
| Chat Message (Basic) | 1 credit | ✅ Consistent |
| Chat Message (Advanced) | 5 credits | ✅ Consistent |
| Chat Message (Premium) | 20 credits | ✅ Consistent |

## Credit Calculator Component

**Bestand**: `components/credit-calculator.tsx`

De credit calculator was al correct en toonde:
- ✅ 20 blogs voor 1000 credits (1000 / 50 = 20)
- ✅ 12 videos voor 1000 credits (1000 / 80 = 12.5)
- ✅ 66+ social posts voor 1000 credits (1000 / 15 = 66.6)
- ✅ 100 web searches voor 1000 credits (1000 / 10 = 100)

**Status**: ✅ Al correct - geen wijzigingen nodig

## Testing

✅ TypeScript compilatie: Succesvol  
✅ Next.js build: Succesvol zonder errors  
✅ Dev server: Start zonder problemen  
✅ Alle prijzen consistent: JA

## Deployment

✅ **Live op WritgoAI.nl**  
- Checkpoint: "Credit prijzen gecorrigeerd overal"
- Datum: 1 november 2025
- Status: ✅ Succesvol opgeslagen

## Verificatie Checklist

### UI Componenten
- [x] Blog Generator knop toont 50 credits
- [x] Prijzen pagina toont correcte schattingen voor alle pakketten
- [x] Credit calculator toont correcte berekeningen
- [x] Buy credits pagina (geen credit kosten vermeld - alleen pakket prijzen)

### API Routes
- [x] Blog generation API gebruikt 50 credits
- [x] Custom video API gebruikt 80 credits  
- [x] Simple video API gebruikt 10/20 credits
- [x] Alle andere API's gebruiken correcte credit kosten

### Configuratie
- [x] `lib/credits.ts` bevat alle actuele kosten
- [x] Alle bestanden refereren correct naar deze kosten

## Belangrijke Notities

### Voor Gebruikers
✨ **1000 gratis credits bij registratie** kunnen nu worden gebruikt voor:
- **20 SEO blogs** (volledig geoptimaliseerd met research)
- **25 social media posts** (Instagram, Facebook, LinkedIn)
- **12 AI videos** (met voiceover en muziek)
- **100 web searches** (real-time research)
- **1000+ chat berichten** (AI assistent)
- **Onbeperkt Pixabay afbeeldingen** (altijd gratis!)

### Voor Ontwikkelaars
Alle credit kosten zijn gecentraliseerd in `lib/credits.ts` met het `CREDIT_COSTS` object. 

Bij het toevoegen van nieuwe features:
1. Voeg credit kost toe aan `CREDIT_COSTS`
2. Update UI componenten met de nieuwe prijs
3. Update prijzen pagina schattingen indien relevant
4. Test alle flows

---

**Conclusie**: Alle credit prijzen zijn nu 100% consistent door de hele applicatie! 🎉
