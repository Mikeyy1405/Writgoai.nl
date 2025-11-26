
# WritgoAI Agent Kosten Calculator

## 📊 Overzicht

Deze calculator helpt je inschatten hoeveel het kost om een AI agent systeem te draaien voor WritgoAI.

## 💰 API Kosten Breakdown

### 1. LLM Kosten (OpenAI via AI/ML API)

**GPT-4o**
- Input: $2.50 per 1M tokens
- Output: $10.00 per 1M tokens

**GPT-4o-mini**
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

### 2. Web Research API

**Tavily AI**
- Gratis: 1000 searches/maand
- Pro: $50/maand voor 10K searches
- Cost per search: ~$0.005

**Brave Search**
- Gratis: 2000 queries/maand
- Betaald: $5/maand voor 50K queries
- Cost per search: ~$0.0001

**Serper.dev**
- Starter: $5/maand voor 2500 searches
- Cost per search: ~$0.002

### 3. Andere Tools

**Pixabay Images**
- ✅ Gratis (met API key)

**DALL-E 3**
- $0.040 per image (1024x1024)
- $0.080 per image (1792x1024)

**Video Generation (Abacus.AI)**
- ✅ Gratis via DeepAgent credits

## 📈 Scenario Calculaties

### Scenario 1: Klein Agency (10 clients)

**Per Client Per Week:**

Blog Artikel (1x/week):
- Web research: 2 searches × $0.005 = $0.01
- Blog generatie: ~15K tokens (input) + 5K tokens (output)
  - Input: 15K × $2.50/1M = $0.0375
  - Output: 5K × $10/1M = $0.05
  - Subtotaal: $0.0875
- Images: 3 × $0 (Pixabay) = $0

Social Posts (7x/week):
- Generatie: 7 × (2K input + 500 output)
  - Input: 14K × $2.50/1M = $0.035
  - Output: 3.5K × $10/1M = $0.035
  - Subtotaal: $0.07
- Images: 7 × $0 (Pixabay) = $0

Agent Orchestration:
- Planning & tool calls: ~20K tokens
  - Input: 15K × $2.50/1M = $0.0375
  - Output: 5K × $10/1M = $0.05
  - Subtotaal: $0.0875

**Totaal per client/week: $0.30**
**10 clients: $3.00/week**
**Per maand: ~$12/maand**

### Scenario 2: Medium Agency (50 clients)

**50 clients: $15/week**
**Per maand: ~$60/maand**

### Scenario 3: Grote Agency (200 clients)

**200 clients: $60/week**
**Per maand: ~$240/maand**

## 📊 Gedetailleerde Cost Breakdown

| Component | Per Client/Week | 10 Clients | 50 Clients | 200 Clients |
|-----------|-----------------|------------|------------|-------------|
| Web Research | $0.01 | $0.10 | $0.50 | $2.00 |
| Blog Gen | $0.09 | $0.90 | $4.50 | $18.00 |
| Social Gen | $0.07 | $0.70 | $3.50 | $14.00 |
| Agent Orchestration | $0.09 | $0.90 | $4.50 | $18.00 |
| Images | $0.00 | $0.00 | $0.00 | $0.00 |
| Videos | $0.00 | $0.00 | $0.00 | $0.00 |
| **TOTAAL/week** | **$0.26** | **$2.60** | **$13.00** | **$52.00** |
| **TOTAAL/maand** | **$1.04** | **$10.40** | **$52.00** | **$208.00** |

## 🎯 Optimalisatie Tips

### 1. Gebruik GPT-4o-mini voor Simpele Tasks

**Besparingen:**
- GPT-4o-mini is 10-15x goedkoper
- Gebruik voor: social posts, meta descriptions, hashtags
- Gebruik GPT-4o voor: blogs, research, complexe content

**Impact:**
- Besparing: ~40% op LLM kosten
- 50 clients: $52/maand → $31/maand

### 2. Batch Processing

**Strategie:**
- Genereer content voor meerdere dagen tegelijk
- 1 API call in plaats van 7
- Minder orchestration overhead

**Impact:**
- Besparing: ~20% op agent costs
- 50 clients: $52/maand → $42/maand

### 3. Caching

**Implementatie:**
```typescript
// Cache web research resultaten
const cacheKey = `research:${topic}:${date}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Anders: doe research en cache het
const result = await tavilySearch(topic);
await redis.setex(cacheKey, 86400, JSON.stringify(result)); // 24h
return result;
```

**Impact:**
- Besparing: ~30% op research costs
- 50 clients: $0.50/week → $0.35/week

### 4. Use Brave Search (Gratis Tier)

**Gratis tier:**
- 2000 queries/maand gratis
- Genoeg voor ~70 clients (als je 2 searches/client/week doet)

**Besparing:**
- $0.01/client/week → $0.00
- 50 clients: $2/maand besparing

## 💡 Aanbevelingen

### Voor 10-30 Clients
- ✅ GPT-4o voor alles
- ✅ Brave Search (gratis tier)
- ✅ Geen complexe optimalisaties nodig
- **Kosten: $10-30/maand**

### Voor 30-100 Clients
- ✅ Mix GPT-4o en GPT-4o-mini
- ✅ Brave Search (betaald) of Tavily
- ✅ Basic caching
- **Kosten: $30-100/maand**

### Voor 100+ Clients
- ✅ Aggressive gebruik GPT-4o-mini
- ✅ Tavily AI Search
- ✅ Geavanceerde caching & batching
- ✅ Custom optimalisaties
- **Kosten: $100-300/maand**

## 🔄 ROI Berekening

### Voorbeeld: 50 Clients

**Kosten:**
- Agent systeem: $52/maand
- Hosting: $20/maand
- **Totaal: $72/maand**

**Opbrengst (bij $99/client/maand):**
- 50 × $99 = $4,950/maand
- **Winst: $4,878/maand**
- **Margin: 98.5%**

### Agent vs Handmatig

**Handmatig (per client per week):**
- Blog schrijven: 2 uur × $50/uur = $100
- Social posts (7): 1 uur × $50/uur = $50
- **Totaal: $150/week = $600/maand per client**

**Agent:**
- $1.04/maand per client

**Besparing: 99.8%** 🚀

## 📈 Conclusie

Een AI agent systeem is **extreem kostenefficiënt** voor WritgoAI:

1. ✅ Lage operationele kosten (<$100/maand voor 50 clients)
2. ✅ Hoge schaalbaarheid (lineaire kostenstijging)
3. ✅ Excellente ROI (98%+ margin)
4. ✅ Geen menselijke arbeid nodig

**Advies:** Start simpel met je huidige systeem + web research API (Brave/Tavily). Upgrade later naar volledige agent als je 50+ clients hebt.
