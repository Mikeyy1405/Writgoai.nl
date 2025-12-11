# Writgo Architectuur Analyse & Vereenvoudiging

## 🔍 Huidige Architectuur

### Database Structuur

#### 1. Client Table
```sql
CREATE TABLE "Client" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  companyName TEXT,
  website TEXT,
  password TEXT NOT NULL,
  
  -- Subscription & Credits
  subscriptionPlan TEXT,
  subscriptionStatus TEXT,
  subscriptionCredits DOUBLE PRECISION DEFAULT 0,
  topUpCredits DOUBLE PRECISION DEFAULT 0,
  isUnlimited BOOLEAN DEFAULT false,
  
  -- Social Media Platforms (direct op client)
  facebookAccessToken TEXT,
  facebookConnected BOOLEAN DEFAULT false,
  facebookPageId TEXT,
  facebookPageName TEXT,
  
  instagramAccessToken TEXT,
  instagramConnected BOOLEAN DEFAULT false,
  instagramAccountId TEXT,
  instagramUsername TEXT,
  
  tiktokAccessToken TEXT,
  tiktokConnected BOOLEAN DEFAULT false,
  tiktokOpenId TEXT,
  tiktokUsername TEXT,
  
  youtubeAccessToken TEXT,
  youtubeConnected BOOLEAN DEFAULT false,
  youtubeChannelId TEXT,
  youtubeChannelName TEXT,
  
  linkedinPageId TEXT,
  
  -- Content Settings (direct op client)
  targetAudience TEXT,
  brandVoice TEXT,
  keywords TEXT[],
  automationActive BOOLEAN DEFAULT false,
  contentPlan JSONB,
  
  -- WordPress (direct op client)
  wordpressUrl TEXT,
  wordpressUsername TEXT,
  wordpressPassword TEXT,
  
  -- Affiliate & Moneybird
  affiliateCode TEXT UNIQUE,
  moneybirdContactId TEXT,
  moneybirdSubscriptionId TEXT,
  
  -- Timestamps
  createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Project Table
```sql
CREATE TABLE "Project" (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,  -- Foreign key naar Client
  name TEXT NOT NULL,
  websiteUrl TEXT NOT NULL,
  description TEXT,
  
  -- DUPLICATE content settings (ook in Client!)
  targetAudience TEXT,
  brandVoice TEXT,
  keywords TEXT[],
  contentPillars TEXT[],
  niche TEXT,
  writingStyle TEXT,
  
  -- DUPLICATE WordPress settings (ook in Client!)
  wordpressUrl TEXT,
  wordpressUsername TEXT,
  wordpressPassword TEXT,
  wordpressCategory TEXT,
  wordpressAutoPublish BOOLEAN DEFAULT false,
  
  -- Project-specific analysis
  contentAnalysis JSONB,
  contentStrategy JSONB,
  keywordResearch JSONB,
  
  -- Status
  isActive BOOLEAN DEFAULT true,
  isPrimary BOOLEAN DEFAULT false,
  
  createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. ContentPiece Table
```sql
CREATE TABLE "ContentPiece" (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,       -- Foreign key naar Client
  projectId TEXT,               -- Optional foreign key naar Project
  title TEXT,
  content TEXT,
  contentType TEXT,
  platform TEXT,
  status TEXT,
  scheduledAt TIMESTAMP(3),
  publishedAt TIMESTAMP(3),
  createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
```

### 🤔 Probleem: Dubbele Structuur

**Er zijn 2 parallelle systemen:**

1. **Client-level**: Platforms en content settings direct op Client
   - Social media tokens (Facebook, Instagram, TikTok, YouTube)
   - WordPress credentials
   - Target audience, brand voice, keywords
   - Automation settings

2. **Project-level**: Projects met eigen settings
   - Aparte target audience, brand voice, keywords
   - Aparte WordPress credentials
   - Content strategy per project

**Dit is verwarrend omdat:**
- Een Client heeft al platforms verbonden (Facebook, Instagram, etc.)
- Een Project heeft geen eigen platform integraties
- Content kan zowel naar clientId als projectId verwijzen
- Settings zijn gedupliceerd

---

## 📊 Writgo Businessmodel Analyse

### Doelgroep & USP

**Doelgroep:**
- Lokale Nederlandse dienstverleners (tandartsen, schoonmakers, etc.)
- Geen tech-savvy gebruikers
- Willen "set and forget" oplossing

**4 Pakketten:**
| Pakket | Prijs | Platforms | Posts/maand |
|--------|-------|-----------|-------------|
| Instapper | €197 | 1-2 | 15-20 |
| Starter | €297 | 2-3 | 25-30 |
| Groei | €497 | 3-4 | 40-50 |
| Dominant | €797 | 4-5 | 60-80 |

**Kernbelofte:**
- ✅ Volledig autonoom (zero-touch)
- ✅ Platform flexibiliteit (klant kiest zelf platforms)
- ✅ Alles uit handen

**Dit betekent:**
- 1 klant = 1 bedrijf = 1 set platforms = 1 contentstream
- GEEN complexe project management
- GEEN verschillende websites per klant
- Gewoon: "Verbind je socials, wij posten automatisch"

---

## ⚠️ Gap: Huidige vs Gewenste Architectuur

### Huidig (Complex - voor Agencies)
```
Client
  ├── Project 1 (Website A)
  │     ├── Content Strategy
  │     ├── WordPress
  │     └── Content Pieces
  ├── Project 2 (Website B)
  │     ├── Content Strategy
  │     ├── WordPress
  │     └── Content Pieces
  └── Platforms (Facebook, Instagram, etc.)
```

### Gewenst (Simpel - voor Writgo)
```
Klant (Account)
  ├── Pakket (Instapper/Starter/Groei/Dominant)
  ├── Bedrijfsinfo (naam, branche, website)
  ├── Verbonden Platforms
  │     ├── Facebook (✓ verbonden)
  │     ├── Instagram (✓ verbonden)
  │     ├── LinkedIn (niet verbonden)
  │     └── TikTok (niet verbonden)
  ├── Content Settings
  │     ├── Brand voice
  │     ├── Target audience
  │     └── Keywords
  └── Geplande & Gepubliceerde Content
```

---

## 🎯 Voorstel: Vereenvoudigd Model

### Optie 1: Verwijder Projects (Meest Radicaal) ✅ RECOMMENDED

**Aanpassingen:**
1. **Client Table blijft leidend**
   - Alle platform integraties blijven op Client
   - Alle content settings blijven op Client
   - Subscription plan bepaalt aantal platforms + posts

2. **Project Table = DEPRECATED**
   - Niet meer nodig voor Writgo use case
   - Kan blijven staan voor backward compatibility
   - Admin kan nog steeds projects maken (voor oude klanten)

3. **ContentPiece Table: alleen clientId**
   - `projectId` wordt optioneel/deprecated
   - Alle content hangt direct aan Client

4. **Admin Interface**
   - Verberg "Projecten" menu voor nieuwe klanten
   - Klant aanmaken = direct platforms kunnen verbinden
   - Flow: Klant → Pakket → Platforms → Content Loopt

5. **Client Dashboard**
   - Simpele 4-pagina interface (al geïmplementeerd)
   - OVERZICHT: Statistieken + platform status
   - PLATFORMS: Direct platforms verbinden (geen project layer)
   - CONTENT: Kalender met geplande posts
   - ACCOUNT: Pakket, facturen, support

**Voordelen:**
- ✅ Past perfect bij Writgo businessmodel
- ✅ Geen verwarrende abstracties
- ✅ Simpele onboarding flow
- ✅ Gemakkelijk te uitleggen aan klanten
- ✅ Minder code complexiteit

**Nadelen:**
- ❌ Backward compatibility: bestaande projects blijven werken maar UI past
- ❌ Minder flexibel voor toekomstige use cases (bijv. 1 klant met 2 bedrijven)

---

### Optie 2: Auto-Create Default Project (Middenweg)

**Aanpassingen:**
1. Bij het aanmaken van een nieuwe klant wordt automatisch 1 "Default Project" aangemaakt
2. Project naam = Company name
3. Project settings sync automatisch met Client settings
4. UI verbergt project complexiteit voor klanten
5. Admin kan nog steeds extra projects maken indien nodig

**Voordelen:**
- ✅ Backward compatible
- ✅ Flexibel voor edge cases
- ✅ Database structuur blijft intact

**Nadelen:**
- ❌ Extra complexiteit onder de motorkap
- ❌ Sync issues tussen Client en Project
- ❌ Niet echt simpeler voor developers

---

## 🚀 Implementatie Plan (Optie 1 - Recommended)

### Fase 1: Fix 500 Error (Direct)
1. Debug de klant aanmaak API error
2. Test klant aanmaken werkt correct

### Fase 2: Admin Interface Vereenvoudiging
1. Update "Nieuwe Klant" formulier:
   - Voeg pakket dropdown toe (Instapper, Starter, Groei, Dominant)
   - Voeg directe platform connect knoppen toe (optioneel, kan ook later)
   - Verwijder project-gerelateerde velden

2. Klanten overzicht pagina:
   - Toon verbonden platforms per klant
   - Toon aantal gepubliceerde posts deze maand
   - Toon pakket en status

3. Verberg/Verplaats "Projecten" menu:
   - Optie A: Verwijder uit navigatie voor nieuwe setup
   - Optie B: Verplaats naar "Legacy" sectie
   - Optie C: Houd maar toon warning "Deprecated"

### Fase 3: Client Dashboard (Al Geïmplementeerd!)
- ✅ Dashboard is al vereenvoudigd (4 pagina's)
- ✅ Platforms pagina is al aanwezig
- ✅ Content kalender is al aanwezig
- Alleen connecten: platforms direct aan Client in plaats van Project

### Fase 4: API & Backend Updates
1. Update content generation logic:
   - Haal settings van Client in plaats van Project
   - Genereer content direct voor Client
   
2. Update distribution logic:
   - Post naar platforms verbonden aan Client
   - Gebruik Client settings

3. Create migration script (optioneel):
   - Voor bestaande klanten met projects
   - Migrate project settings naar client
   - Bewaar projects als backup

### Fase 5: Testing & Documentation
1. Test volledige flow:
   - Klant aanmaken
   - Pakket toewijzen
   - Platforms verbinden
   - Content genereren
   - Content distribueren

2. Update documentatie:
   - Setup guide voor eerste klant
   - Admin handleiding
   - Client onboarding flow

---

## 📋 Beslissing Nodig

**Vraag voor gebruiker:**
Welke optie heeft je voorkeur?

**Optie 1 (Recommended):**
- Verwijder Project layer volledig uit nieuwe workflow
- Simpelste oplossing, past perfect bij businessmodel
- Snelste implementatie

**Optie 2 (Middenweg):**
- Behoud Projects maar maak automatisch
- Meer flexibiliteit voor toekomst
- Iets complexer

**Of iets anders?**
