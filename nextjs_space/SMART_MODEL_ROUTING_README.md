
# 🧠 WritgoAI Slimme Model Routing Systeem

## 🎯 Overzicht

WritgoAI DeepAgent gebruikt nu **intelligente model routing** zoals ChatLLM's RouteLLM systeem. Dit betekent dat de AI automatisch het beste en meest kostenefficiënte model kiest voor elke taak.

## ✨ Belangrijkste Features

### 1. **Automatische Model Selectie**
De AI kiest automatisch uit 300+ modellen op basis van:
- **Taak complexiteit** (simpel → budget, complex → premium)
- **Conversatie lengte** (kort → snel, lang → consistent)  
- **Content type** (blog → creatief, research → diep, chat → snel)
- **Kosten optimalisatie** (tot 90% besparing mogelijk!)

### 2. **Drie Model Tiers**

#### 💰 **Budget Tier** - Snel & Goedkoop
**Primary Model:** `gemini-1.5-flash-8b`
- Ultra compact en supersnel
- Perfect voor simpele vragen
- Kostenbesparend

**Gebruikt voor:**
- Korte vragen (wie, wat, waar)
- Definities en betekenissen
- Ja/nee vragen
- Snelle antwoorden

**Voorbeelden:**
```
"Hoi, wat kun je voor mij doen?"
"Wat is de definitie van AI?"
"Wanneer is de deadline?"
```

#### ⚖️ **Balanced Tier** - Goed Genoeg & Betaalbaar
**Primary Model:** `gemini-2.5-flash`
- Snelste Gemini met 1M context window
- Beste prijs/kwaliteit verhouding
- Voor 80% van alle taken

**Gebruikt voor:**
- Normale conversaties
- Quick content (social media posts)
- Uitleg en summaries
- Standaard support vragen

**Voorbeelden:**
```
"Leg uit hoe elektrische fietsen werken"
"Maak een Instagram post over duurzaamheid"
"Kun je dit samenvatten?"
```

#### 💎 **Premium Tier** - Beste Kwaliteit
**Primary Model:** `gpt-4o`
- OpenAI's beste alles-in-één model
- Voor complexe en belangrijke taken
- Hoogste kwaliteit output

**Gebruikt voor:**
- Lange content (blogs, artikelen)
- Diepgaande analyses
- Creatief schrijfwerk
- Complexe strategie en planning
- Lange conversaties (>8 messages)

**Voorbeelden:**
```
"Schrijf een blog van 1500 woorden over AI trends"
"Analyseer deze data en geef strategische aanbevelingen"
"Maak een complete content strategie voor Q1 2025"
```

### 3. **Slimme Fallback Systeem**

Als het primary model niet beschikbaar is, schakelt het systeem automatisch over naar fallback modellen:

**Premium Fallbacks:**
1. `claude-3-5-sonnet-20241022` (Beste voor lange content)
2. `gemini-2.5-pro` (1M context window!)
3. `deepseek-r1` (Beste reasoning/prijs)

**Balanced Fallbacks:**
1. `gpt-4o-mini` (Goede budget OpenAI)
2. `claude-3-5-haiku-20241022` (Snelste Claude)
3. `deepseek-chat` (Multi-taak specialist)

**Budget Fallbacks:**
1. `gpt-3.5-turbo` (Legacy maar betrouwbaar)
2. `llama-3.2-3b-instruct` (Open source)

## 📊 Kostenbesparingen

### Voorbeeld Scenario's

**Scenario 1: Simpele Vragen (50/dag)**
- **Zonder routing:** Alles met GPT-4o = €15/dag
- **Met routing:** Budget tier = €1.50/dag
- **Besparing:** 90% (€13.50/dag)

**Scenario 2: Mixed Workload (100 taken/dag)**
- 60 simpele vragen → Budget tier
- 30 normale chats → Balanced tier
- 10 blogs → Premium tier
- **Totaal:** €8/dag vs €30/dag zonder routing
- **Besparing:** 73%

**Scenario 3: Content Productie (20 blogs/week)**
- **Met routing:** Premium alleen voor blogs = €12/week
- **Zonder routing:** Premium voor alles = €35/week
- **Besparing:** 66%

## 🎨 Visual Indicators in UI

Het systeem toont nu visuele indicators per model tier:

- **💎 Premium** (Oranje badge): `GPT-4o`, `Claude 3.5`, `Gemini Pro`, `DeepSeek R1`
- **⚡ Balanced** (Groene badge): `Gemini Flash`, `GPT-4o Mini`, `Claude Haiku`
- **💰 Budget** (Grijze badge): `Gemini 1.5 Flash 8B`, `GPT-3.5`, `Llama 3.2`
- **🔧 Tools** (Oranje): Aantal gebruikte tools

## 🔧 Technische Implementatie

### Message Validatie Fixes

Het systeem heeft nu **strikte message validatie** om AIML API fouten te voorkomen:

```typescript
// ✅ CORRECT: Content is altijd een string
{
  role: 'user',
  content: 'Hallo wereld'
}

// ✅ CORRECT: Tool messages met content
{
  role: 'tool',
  tool_call_id: 'call_123',
  content: 'Tool execution completed'
}

// ✅ CORRECT: Assistant met tool_calls (content = null)
{
  role: 'assistant',
  content: null,
  tool_calls: [...]
}

// ❌ FOUT: Lege content
{
  role: 'user',
  content: ''  // Dit wordt nu gefixed naar '...'
}
```

### Model Selectie Logica

```typescript
function selectOptimalModel(message: string, history: any[]) {
  // 1. Check conversatie lengte
  if (history.length > 8) return 'gpt-4o'; // Premium
  
  // 2. Check input lengte
  if (message.length > 1000) return 'gpt-4o'; // Premium
  
  // 3. Check taak indicators
  if (isPremiumTask(message)) return 'gpt-4o';
  if (isBudgetTask(message)) return 'gemini-1.5-flash-8b';
  
  // 4. Default: balanced
  return 'gemini-2.5-flash';
}
```

## 📚 Beschikbare Modellen

### OpenAI Models
- `gpt-5` - Nieuwste (400K context)
- `gpt-4o` - Beste alles-in-één (128K)
- `gpt-4o-mini` - Budget GPT-4o
- `gpt-4-turbo` - Sneller dan GPT-4
- `o1-mini` - Reasoning specialist

### Google Gemini Models
- `gemini-2.5-pro` - **1M context!**
- `gemini-2.5-flash` - Snelste + 1M context
- `gemini-2.0-flash-thinking-exp` - Met reasoning
- `gemini-1.5-flash-8b` - Ultra compact

### Anthropic Claude Models
- `claude-3-5-sonnet-20241022` - Beste voor lange content
- `claude-3-5-haiku-20241022` - Snelste Claude
- `claude-3-7-sonnet-20250219` - Nieuwste release

### DeepSeek Models
- `deepseek-r1` - Beste reasoning/prijs ratio
- `deepseek-v3` - Multi-taak
- `deepseek-chat` - Algemene chat

### Meta Llama Models
- `llama-4-scout` - Nieuwste Llama 4
- `llama-3.2-90b-vision-instruct` - Met vision
- `llama-3.1-405b` - Grootste open source

### Specialist Models
- `perplexity/sonar-pro` - Real-time web search
- `bagoodex/bagoodex-search-v1` - AIML native search
- `mistral-large-latest` - Premium Mistral
- `qwen-max` - Beste Qwen

## 🚀 Gebruik in Code

### Direct Model Call
```typescript
import { callWithModel } from '@/lib/aiml-agent';

const response = await callWithModel(
  'gpt-4o',
  [{ role: 'user', content: 'Schrijf een blog' }]
);
```

### Smart Router (Automatisch)
```typescript
import { smartModelRouter } from '@/lib/aiml-agent';

const response = await smartModelRouter(
  'blog_writing',
  [{ role: 'user', content: 'Schrijf een blog' }],
  { forceTier: 'premium' } // Optioneel
);
```

### Real-Time Web Search
```typescript
import { realTimeWebSearch } from '@/lib/aiml-agent';

const result = await realTimeWebSearch(
  'Wat is het weer vandaag in Amsterdam?',
  { searchRecency: 'day' }
);

console.log(result.answer); // Actuele info
console.log(result.sources); // Bronnen
```

## 🎯 Best Practices

1. **Vertrouw op automatische selectie** - Het systeem kiest slim
2. **Force tier alleen bij nodig** - Laat het systeem beslissen
3. **Monitor kosten** - Check het model tier in UI
4. **Gebruik web search** - Voor actuele info altijd web_search tool
5. **Test fallbacks** - Systeem schakelt automatisch over

## 🔍 Debug Informatie

Console logs tonen nu:
```
🎯 Slimme Model Routing: gemini-2.5-flash (balanced) - Standaard query - Balanced model voor efficiëntie
✅ Filtered history: 5 valid messages
🔄 Iteration 1/10
✅ Tool web_search succeeded
💳 Deducted 0.1 credits for gemini-2.5-flash
```

## 🆘 Troubleshooting

### "Body validation error!"
**Opgelost!** Strikte message validatie voorkomt dit nu.

### "Er ging iets mis met de AI"
**Opgelost!** Betere error handling en fallback systeem.

### "Insufficient credits"
Normaal - koop credits of gebruik gratis tier modellen.

### Model niet beschikbaar
Systeem schakelt automatisch over naar fallback model.

## 📈 Future Enhancements

- [ ] User-configurable tier preferences
- [ ] Cost tracking dashboard
- [ ] A/B testing different models
- [ ] Custom model routing rules
- [ ] Performance analytics per model

---

**Documentatie versie:** 1.0  
**Laatste update:** 26 oktober 2025  
**Auteur:** WritgoAI Development Team
