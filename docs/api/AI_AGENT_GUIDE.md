
# WritgoAI Agent Systeem - Complete Gids

## 📋 Overzicht

Deze gids legt uit hoe je een AI agent systeem zoals DeepAgent kunt bouwen voor je WritgoAI app.

## 🏗️ Architectuur van DeepAgent

DeepAgent (waar ik op draai) werkt als volgt:

```
┌─────────────────────────────────────────────────────┐
│              USER INPUT / PROMPT                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│         LLM met Function Calling                     │
│         (GPT-4o, Claude, etc.)                       │
│                                                       │
│  - Begrijpt de taak                                  │
│  - Besluit welke tools nodig zijn                    │
│  - Genereert tool calls                              │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│           TOOL ORCHESTRATOR                          │
│                                                       │
│  - Valideert tool calls                              │
│  - Voert tools uit in veilige sandbox                │
│  - Verzamelt resultaten                              │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              TOOL EXECUTION                          │
│                                                       │
│  Tools:                                              │
│  ├─ File Operations (lezen, schrijven)              │
│  ├─ Code Execution (bash, python, node)             │
│  ├─ Web Research (scraping, API calls)              │
│  ├─ Asset Generation (images, videos)               │
│  ├─ Database Operations                             │
│  └─ External API Calls                              │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│           RESULT PROCESSING                          │
│                                                       │
│  - Verwerk tool outputs                              │
│  - Update conversatie context                        │
│  - Check of taak compleet is                         │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │  Klaar?      │
              └──────┬───────┘
                     │
         ┌───────────┴───────────┐
         │                       │
       NEE                      JA
         │                       │
         ▼                       ▼
  Terug naar LLM        FINAL OUTPUT
  (nieuwe iteratie)
```

## 🔑 Wat Je Nodig Hebt

### 1. LLM API met Function Calling

**OpenAI (Aangeraden)**
```bash
# Je hebt dit al via AI/ML API
AIML_API_KEY=eb1cd6eaee0d4c5ca30dffe07cdcb600
```

**Waarom OpenAI?**
- ✅ Beste function calling support
- ✅ Goede balans prijs/kwaliteit
- ✅ Je gebruikt het al via AI/ML API
- ✅ Stabiel en betrouwbaar

**Kosten:**
- GPT-4o: $2.50 per 1M input tokens, $10 per 1M output tokens
- GPT-4o-mini: $0.15 per 1M input tokens, $0.60 per 1M output tokens

### 2. Web Research API

**Optie A: Tavily AI (Aangeraden voor agents)**
```bash
TAVILY_API_KEY=tvly-xxxxxxxxxxxxx
```
- Prijs: $0-5/maand voor 1000 searches
- Beste voor AI agents (geoptimaliseerde output)
- Website: https://tavily.com

**Optie B: Brave Search API (Gratis tier beschikbaar)**
```bash
BRAVE_SEARCH_API_KEY=BSA-xxxxxxxxxxxxx
```
- Gratis: 2000 queries/maand
- Daarna: $5/maand voor 50K queries
- Website: https://brave.com/search/api/

**Optie C: Serper.dev (Google Search)**
```bash
SERPER_API_KEY=xxxxxxxxxxxxx
```
- $5/maand voor 2500 searches
- Google search resultaten
- Website: https://serper.dev

### 3. Video Generation (Optioneel)

Je hebt al Abacus.AI! Maar alternatieven:

**RunwayML**
```bash
RUNWAY_API_KEY=xxxxxxxxxxxxx
```
- ~$0.05 per seconde video
- High quality AI video

**Pika Labs**
- Nog in beta
- Vergelijkbaar met Runway

### 4. Social Media Management

**Late.dev (Eerder besproken)**
```bash
LATEDEV_API_KEY=xxxxxxxxxxxxx
```
- Unified API voor Instagram, TikTok, YouTube
- ~$49-199/maand

## 💻 Implementatie Voor WritgoAI

### Stap 1: Installeer Dependencies

```bash
cd /home/ubuntu/writgo_planning_app/nextjs_space
yarn add langchain @langchain/openai @langchain/community
```

### Stap 2: Basis Agent Class

Zie: `/home/ubuntu/writgo_planning_app/AGENT_IMPLEMENTATION.ts`

### Stap 3: Voeg Tools Toe

Zie: `/home/ubuntu/writgo_planning_app/AGENT_TOOLS.ts`

### Stap 4: API Route

Zie: `/home/ubuntu/writgo_planning_app/AGENT_API_ROUTE.ts`

## 💰 Kosten Calculator

### Scenario 1: Kleine Agency (10 clients)
**Per week per client:**
- LLM tokens: ~100K → $0.25
- Web research: 2 queries → $0.01
- Images: Pixabay gratis
- Video: 1x 30sec → $0.50

**Totaal per client/week: $0.76**
**10 clients: $7.60/week → ~$30/maand**

### Scenario 2: Groeiende Agency (50 clients)
**50 clients: $38/week → ~$152/maand**

### Scenario 3: Scale-up (200 clients)
**200 clients: $152/week → ~$608/maand**

## 🛡️ Veiligheid

### Rate Limiting
```typescript
// Per client limits
const LIMITS = {
  maxRequestsPerDay: 10,
  maxRequestsPerHour: 5,
  maxTokensPerRequest: 50000,
  timeout: 300000 // 5 min
};
```

### Tool Sandboxing
```typescript
// Alleen veilige tools toestaan
const ALLOWED_TOOLS = [
  'generate_blog_article',
  'web_research',
  'generate_social_post',
  'publish_to_wordpress'
];

// VERBODEN tools
const FORBIDDEN_TOOLS = [
  'shell_command',      // Geen terminal access
  'file_system_write',  // Geen file writes
  'database_query'      // Geen directe DB access
];
```

## 📊 Vergelijking: Zelf Bouwen vs Services

| Aspect | Zelf Bouwen | LangChain | Make.com/Zapier |
|--------|-------------|-----------|-----------------|
| Kosten | $30-600/mnd | $30-600/mnd | $9-299/mnd |
| Controle | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Snelheid | Langzaam | Medium | Snel |
| Flexibiliteit | Maximaal | Hoog | Medium |
| Onderhoud | Veel | Medium | Weinig |

## 🚀 Aanbeveling Voor WritgoAI

**Start Simpel:**
1. ✅ Gebruik je huidige content generator (heb je al)
2. ✅ Voeg Tavily AI Search toe voor web research
3. ✅ Gebruik Late.dev voor social media posting
4. ❌ Bouw GEEN volledige agent (nog niet nodig)

**Waarom?**
- Je huidige systeem werkt goed
- Agent systeem is overkill voor jouw use case
- Je kunt later upgraden als nodig

**Wel nuttig: Simpele workflow orchestration**
```typescript
// In plaats van een volledige agent:
class ContentWorkflow {
  async generateWeekContent(clientId: string) {
    // 1. Research
    const topics = await this.tavilySearch(clientId);
    
    // 2. Generate
    const content = await this.generateContent(topics);
    
    // 3. Publish
    await this.publishToWordPress(content);
    await this.publishToSocial(content);
    
    return content;
  }
}
```

Dit is simpeler, goedkoper, en makkelijker te onderhouden dan een volledige agent.

## 📞 Volgende Stappen

Wil je:
1. **Optie A:** Een simpele workflow orchestrator (aangeraden)
2. **Optie B:** Een volledige agent zoals DeepAgent
3. **Optie C:** Gewoon Tavily toevoegen voor betere research

Laat me weten en ik help je met de implementatie! 🚀
