
# Strategische Keyword Research - Verbeteringen

## 📋 Overzicht

De keyword research is **strategisch verbeterd** met:
- **Focus keywords identificatie** (1-3 primaire keywords)
- **Keyword clustering** per onderwerp
- **Buyer journey mapping** (awareness → consideration → decision)
- **Commercial intent prioriteit** (70% commercial keywords)
- **Conversie potentieel** scoring

## 🎯 Belangrijkste Verbeteringen

### 1. Keyword Hiërarchie
Keywords worden nu ingedeeld in 3 tiers:

**PRIMARY (Top 1-3)**
- Beste keywords met hoogste potentie
- Focus voor SEO strategie
- Duidelijke prioriteit

**SECONDARY (5-10)**
- Ondersteunende keywords
- Belangrijke variaties
- Targeted long-tail

**LSI (Rest)**
- Semantische keywords
- Supporting content
- Contextual relevantie

### 2. Commercial Intent Focus

**Nieuwe verdeling (40 keywords):**
- 40% Commercial Intent (kopen, review, vergelijking, beste)
- 30% Long-tail Commercial (specifieke buyer keywords)
- 20% Question-based Commercial (welke is beste, hoe kies je)
- 10% Informational met Intent (gids, tips)

**Oud vs Nieuw:**
```
❌ OUD: Random mix van keywords
- Generic informational keywords
- Geen duidelijke focus
- Te breed, niet conversie-gericht

✅ NIEUW: Strategisch gericht
- 70%+ commercial/buyer intent
- Focus op conversie
- Actionable keywords
```

### 3. Buyer Journey Mapping

Elk keyword krijgt een fase:

**AWARENESS (20-30%)**
- Informatief, kennis zoeken
- "wat is", "hoe werkt", "waarom"

**CONSIDERATION (40-50%)**
- Vergelijken, evalueren
- "beste", "top", "vergelijking", "review"

**DECISION (20-30%)**
- Klaar om te kopen
- "kopen", "prijs", "aanbieding", "waar te koop"

### 4. Keyword Clustering

Keywords worden gegroepeerd per onderwerp:
- Product review cluster
- Koopgids cluster
- Vergelijking cluster
- Tips & tricks cluster
- etc.

### 5. Conversie Potentieel

Elk keyword krijgt een score 0-100:
- **80-100**: Hoge intent (kopen, prijs)
- **60-80**: Commercial (beste, review)
- **20-40**: Informational

## 🔧 Technische Implementatie

### Nieuwe Functies

```typescript
// 1. Strategische analyse
strategicallyAnalyzeKeywords(
  keywords: KeywordData[],
  mainTopic: string,
  onProgress?: ProgressCallback
): Promise<KeywordData[]>

// 2. Verbeterde KeywordData interface
interface KeywordData {
  // ... bestaande velden
  keywordTier?: 'primary' | 'secondary' | 'lsi';
  cluster?: string;
  buyerJourneyStage?: 'awareness' | 'consideration' | 'decision';
  conversionPotential?: number;
}
```

### API Flow

```
1. Keyword Generation (40 keywords)
   ↓
2. Strategic Analysis (AI clustering & mapping)
   ↓
3. Sorting (primary → secondary → lsi)
   ↓
4. Return met stats
```

## 📊 Output Voorbeeld

### Stats Response
```json
{
  "stats": {
    "excellent": 15,
    "good": 20,
    "moderate": 5,
    "primary": 3,
    "secondary": 10,
    "lsi": 27,
    "decision": 10,
    "consideration": 18,
    "awareness": 12,
    "clusters": 5,
    "clusterNames": ["product review", "koopgids", "vergelijking", "tips", "algemeen"]
  }
}
```

### Keyword Voorbeeld
```json
{
  "keyword": "beste shampoo voor fijn haar",
  "searchVolume": 2400,
  "difficulty": 45,
  "potentialScore": 78,
  "keywordTier": "primary",
  "cluster": "product review",
  "buyerJourneyStage": "consideration",
  "conversionPotential": 75,
  "intent": "commercial"
}
```

## 🚀 Gebruik

### Voor Klanten
De keyword research is nu **strategischer**:
- ✅ Duidelijke focus keywords geïdentificeerd
- ✅ Keywords gegroepeerd per onderwerp
- ✅ Buyer journey inzicht
- ✅ Conversie-gerichte keywords prioriteit

### Voor Content Planning
- Start met PRIMARY keywords voor pillar content
- Gebruik SECONDARY voor supporting content
- LSI keywords voor context en variatie
- Focus op DECISION stage voor maximum conversie

## 📈 Verwachte Resultaten

**Betere SEO Strategie:**
- Duidelijke focus op 1-3 primaire keywords
- Strategische content planning per cluster
- Betere conversie door commercial focus

**Meer Conversies:**
- 70%+ commercial intent keywords
- Focus op buyer journey stages
- Actionable, conversie-gerichte keywords

**Efficiënter:**
- Minder tijd nodig voor keyword selectie
- Duidelijke hiërarchie en prioriteit
- Gestructureerde clusters

## 🔄 Migratie

**Geen breaking changes!**
- Oude keywords blijven werken
- Nieuwe velden zijn optioneel
- Fallback logica aanwezig

## ⚙️ Configuratie

**Timeout verhoogd:**
```typescript
export const maxDuration = 90; // 90 seconden (was 60)
```

**Extra AI analyse stap:**
- Claude 4.5 Sonnet voor strategische analyse
- Intelligent keyword clustering
- Buyer journey mapping

## 📝 Toekomstige Verbeteringen

- [ ] Dashboard visualisatie van keyword hiërarchie
- [ ] Cluster-based content planning
- [ ] Automated buyer journey content flow
- [ ] Competitive gap analysis per cluster

---

**Status:** ✅ Live in productie
**Versie:** 2.0
**Datum:** 3 november 2024
