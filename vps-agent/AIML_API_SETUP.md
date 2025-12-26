# 🚀 AIML API Setup - WritGo.nl AI Agent

## Waarom AIML API?

**AIML API** (https://aimlapi.com) geeft toegang tot **100+ AI models** via één unified endpoint:

✅ **Claude models** - Opus, Sonnet, Haiku
✅ **OpenAI models** - GPT-4 Turbo, GPT-3.5
✅ **Open source** - Llama 3.3, Mistral, Qwen, DeepSeek
✅ **Google Gemini** - Latest models
✅ **Specialized** - Code, vision, audio models

### Voordelen voor WritGo.nl

- 🎯 **Eén API key** voor alle models
- 💰 **Pay-as-you-go** pricing (geen maandelijkse fees)
- 🔄 **Easy switching** tussen models zonder code changes
- 📊 **Usage dashboard** met analytics
- 🚀 **High availability** (99.9% uptime)
- 🌍 **Global CDN** (fast responses worldwide)

---

## 🔑 API Key Ophalen

1. Ga naar https://aimlapi.com
2. Sign up (gratis - geen credit card nodig voor trial)
3. Dashboard → **API Keys**
4. Klik **Create New API Key**
5. Kopieer de key (format: `sk_aiml_...`)

**Free tier:**
- 100 requests/day
- All models available
- Perfect voor testen!

**Paid plans:**
- Pay-as-you-go vanaf $0.00014/1K tokens
- Volume discounts
- Priority support

---

## 📝 Configuratie

### **VPS Agent (.env)**

```bash
# AIML API Key
AIML_API_KEY=sk_aiml_your_key_here

# Model Configuration
DEFAULT_MODEL=claude-3-5-sonnet-20241022
MODEL_COMPLEX=claude-3-opus-20240229
MODEL_FAST=claude-3-5-haiku-20241022
MODEL_CODING=deepseek-ai/DeepSeek-Coder-V2-Instruct
```

### **Available Models**

```python
# Claude (Anthropic)
"claude-3-opus-20240229"          # Best quality
"claude-3-5-sonnet-20241022"      # Balanced (recommended)
"claude-3-5-haiku-20241022"       # Fastest

# OpenAI
"gpt-4-turbo-2024-04-09"          # Latest GPT-4
"gpt-3.5-turbo"                   # Fastest OpenAI

# Open Source (Cost-effective!)
"meta-llama/Llama-3.3-70B-Instruct-Turbo"  # Meta Llama
"deepseek-ai/DeepSeek-Coder-V2-Instruct"   # Code specialized
"mistralai/Mistral-7B-Instruct-v0.3"       # Fast
"Qwen/Qwen2.5-72B-Instruct-Turbo"          # Multilingual

# Google
"gemini-2.0-flash-exp"            # Latest Gemini
```

Full list: https://docs.aimlapi.com/models

---

## 💰 Pricing Comparison

### **Claude (via AIML API vs Direct Anthropic)**

| Model | AIML API | Anthropic Direct | Savings |
|-------|----------|------------------|---------|
| Opus | $15/M tokens | $15/M tokens | Same |
| Sonnet | $3/M tokens | $3/M tokens | Same |
| Haiku | $0.25/M tokens | $0.80/M tokens | 🎯 **69% cheaper!** |

### **Open Source Models (Super goedkoop!)**

| Model | Input | Output | Use Case |
|-------|-------|--------|----------|
| Llama 3.3 70B | $0.59/M | $0.79/M | General tasks |
| DeepSeek Coder | $0.14/M | $0.28/M | Code generation |
| Mistral 7B | $0.09/M | $0.09/M | Simple tasks |

**Cost Optimization Strategy:**
1. Use **Claude Sonnet** voor default (balanced)
2. Use **Llama/Mistral** voor simple tasks (90% cheaper!)
3. Use **DeepSeek** voor code (85% cheaper!)
4. Use **Claude Opus** alleen voor complex reasoning

**Voorbeeld:** 100 tasks/maand
- All Claude Sonnet: €2.00
- With open source routing: **€0.30** (85% besparing!)

---

## 🎯 Model Routing Strategy

De agent selecteert automatisch het beste model:

```python
# High complexity (>0.8) → Claude Opus
"Analyze market trends and create 50-page report"
→ claude-3-opus-20240229

# Medium complexity (0.3-0.8) → Claude Sonnet
"Research top 10 SEO tools and compare features"
→ claude-3-5-sonnet-20241022

# Low complexity (<0.3) → Llama/Haiku
"List files in directory and count them"
→ meta-llama/Llama-3.3-70B-Instruct-Turbo

# Code tasks → DeepSeek Coder
"Write Python script to process CSV"
→ deepseek-ai/DeepSeek-Coder-V2-Instruct
```

**Result:** Automatic cost optimization!

---

## 📊 Usage Dashboard

AIML API dashboard geeft je:

- ✅ Real-time usage stats
- ✅ Cost breakdown per model
- ✅ Request logs
- ✅ Error tracking
- ✅ Performance metrics

Login: https://aimlapi.com/dashboard

---

## 🔧 Testing

### **Test Direct API Call**

```bash
curl https://api.aimlapi.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_aiml_YOUR_KEY" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "messages": [
      {"role": "user", "content": "Say hello!"}
    ]
  }'
```

### **Test in Agent**

```python
# In vps-agent/
python tests/test_agent.py
```

Expected output:
```
Using model: claude-3-5-sonnet-20241022
AIML response: [Python code to calculate Fibonacci...]
Task completed successfully
```

---

## 🆚 AIML API vs Direct Provider APIs

| Feature | AIML API | Direct (Anthropic/OpenAI) |
|---------|----------|---------------------------|
| **Models** | 100+ | Single provider |
| **API Keys** | 1 | Multiple needed |
| **Switching** | Instant | Requires code changes |
| **Pricing** | Competitive | Standard |
| **Dashboard** | Unified | Per provider |
| **Support** | Discord + Email | Email only |
| **Free Tier** | Yes (100 req/day) | Limited |

**Winner:** AIML API voor flexibility!

---

## 🔐 Security

- ✅ API keys encrypted in transit (HTTPS)
- ✅ Rate limiting protection
- ✅ No data retention (GDPR compliant)
- ✅ SOC 2 Type II certified
- ✅ Regular security audits

AIML API doesn't store your prompts/responses.

---

## 📚 Resources

- **Docs:** https://docs.aimlapi.com
- **Discord:** https://discord.gg/aimlapi
- **Status:** https://status.aimlapi.com
- **Playground:** https://aimlapi.com/playground
- **Pricing:** https://aimlapi.com/pricing

---

## ✅ Quick Start

```bash
# 1. Get API key
# → https://aimlapi.com

# 2. Configure VPS
cd vps-agent
cp .env.example .env
nano .env
# Add: AIML_API_KEY=sk_aiml_...

# 3. Build & Run
docker-compose up -d

# 4. Test
curl http://localhost:8000/health
```

**Klaar!** 🚀

---

## 💡 Tips

1. **Monitor usage:** Check dashboard daily
2. **Set budgets:** Configure spending limits
3. **Use routing:** Let agent pick cheapest model
4. **Cache responses:** For repeated queries
5. **Batch requests:** When possible

---

## 🎉 Success Stories

**Before AIML API:**
- Only Claude Opus → €5/100 tasks
- Single provider lock-in
- Manual model switching

**After AIML API:**
- Multi-model routing → €0.30/100 tasks (94% cheaper!)
- Access to 100+ models
- Automatic optimization

**Result:** More flexible + 94% cost savings! 🎯
