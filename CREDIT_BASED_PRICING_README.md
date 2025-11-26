
# 💳 Credit-Based Pricing System - WritgoAI

## 📊 Nieuwe Pricing Tiers

WritgoAI gebruikt een eenvoudig credit-based systeem waarbij **iedereen toegang heeft tot alle tools**. 
De enige verschillen tussen de tiers zijn het aantal credits en extra features zoals support en multi-user accounts.

### Pricing Overzicht

| Tier | Prijs/maand | Credits/maand | Geschatte Content Output |
|------|-------------|---------------|--------------------------|
| **Basis** | €49 | 2.000 | ~15-20 blogs of 8-10 videos |
| **Professional** | €99 | 6.000 | ~50 blogs of 25 videos |
| **Business** | €199 | 15.000 | ~125 blogs of 60 videos |
| **Enterprise** | €399 | 40.000 | ~330 blogs of 160 videos |

---

## 🎯 Credit Kosten per Tool

| Tool | Credits | Wat krijg je |
|------|---------|-------------|
| **SEO Blog** | 100-120 | Volledige blog met research, 1500+ woorden |
| **Social Media Post** | 50 | LinkedIn/Facebook/Instagram post |
| **AI Video** | 200-250 | Video met voiceover, beelden, muziek |
| **Keyword Research** | 30 | Scan + 20 keyword suggesties |
| **Code Generator** | 70 | Interactief webcomponent |
| **Product Review** | 80 | Volledige review artikel |
| **Linkbuilding** | 60 | Linkbuilding strategie |
| **Web Research** | 10 | Real-time web search |
| **Chat Berichten** | 1-5 | AI assistent conversaties |

---

## 💡 Features per Tier

### 🥉 Basis (€49/maand)
- ✅ 2000 credits per maand
- ✅ Alle AI modellen (GPT-4, Claude, Gemini)
- ✅ Alle tools: Blog, Video, Social, Code
- ✅ Content Library
- ✅ Keyword Research
- ✅ Email support
- ✅ Top-up credits mogelijk

### 🥈 Professional (€99/maand) ⭐ Most Popular
- ✅ Alles van Basis
- ✅ 6000 credits per maand
- ✅ Priority support (< 2 uur)
- ✅ Advanced AI modellen
- ✅ Bulk content generatie
- ✅ Social media automation
- ✅ Analytics dashboard

### 🥇 Business (€199/maand)
- ✅ Alles van Professional
- ✅ 15000 credits per maand
- ✅ Multi-user accounts (tot 5 gebruikers)
- ✅ White-label optie
- ✅ Dedicated account manager
- ✅ Custom integraties
- ✅ Priority support

### 💎 Enterprise (€399/maand)
- ✅ Alles van Business
- ✅ 40000 credits per maand
- ✅ Onbeperkte gebruikers
- ✅ Volledige white-label
- ✅ Custom development
- ✅ 24/7 dedicated support
- ✅ Maandelijks strategiegesprek

---

## 💰 Extra Credits (Top-ups)

Als je door je maandelijkse credits heen bent, kun je eenmalig extra credits kopen:

| Package | Prijs | Credits | Prijs per Credit |
|---------|-------|---------|------------------|
| Small | €10 | 500 | €0,020 |
| Medium | €18 | 1000 | €0,018 |
| Large | €40 | 2500 | €0,016 |

**Voordelen van top-up credits:**
- ✅ Blijven altijd beschikbaar (verlopen nooit)
- ✅ Worden pas gebruikt na maandelijkse credits
- ✅ Direct beschikbaar na betaling
- ✅ Ideaal voor drukke periodes

---

## 🔄 Credit Renewal System

### Maandelijkse Credits (Subscription Credits)
- Worden automatisch vernieuwd aan het begin van elke facturatieperiode
- Als niet gebruikt, vervallen ze aan het einde van de maand
- Worden **eerst** gebruikt bij content generatie

### Top-up Credits
- Blijven altijd beschikbaar
- Worden **daarna** gebruikt (na subscription credits)
- Vervallen nooit

### Credit Volgorde
1. Eerst: Maandelijkse subscription credits
2. Daarna: Top-up credits (gekochte extra credits)
3. Voor speciale accounts: Unlimited mode (geen credit check)

---

## 📈 Waarom Deze Pricing?

### Waarde voor Geld
Als je vergelijkt met concurrenten:
- Jasper AI (blog writing): ~$39/maand (limited)
- Writesonic: ~$19/maand (very limited)
- Pictory (video): ~$23/maand
- Surfer SEO: ~$69/maand
- Semrush (keyword research): ~$119/maand

**Totaal als aparte tools: $269+ per maand** ($300+ euro)

WritgoAI Basis tier: **€49/maand** = **83% korting** voor volledige suite!

### Psychologie
- Geen feature locks = geen frustratie
- Transparante pricing = vertrouwen
- Natuurlijke upsells = meer waarde als je het nodig hebt
- Fair use based pricing = eerlijker dan "unlimited" claims

---

## 🚀 Implementation Details

### Stripe Products & Prices
```
Basis:        price_1SNwzqFIOSLx4Sb7FzoSXUMS
Professional: price_1SNwzrFIOSLx4Sb7cOwRoyDG
Business:     price_1SNwzrFIOSLx4Sb7XaKycKEK
Enterprise:   price_1SNwzrFIOSLx4Sb7RNsAblpC
```

### Database Schema
```typescript
model Client {
  // Credit systeem
  subscriptionCredits   Float    // Maandelijkse credits (vervallen)
  topUpCredits          Float    // Gekochte credits (blijven)
  isUnlimited           Boolean  // Voor speciale accounts
  totalCreditsUsed      Float    // Lifetime usage tracking
  
  // Subscription info
  subscriptionPlan      String?  // basis, professional, business, enterprise
  subscriptionStatus    String?  // active, cancelled, past_due
  monthlyCredits        Float?   // Hoeveel credits per maand
}
```

### API Routes
- `/api/stripe/create-checkout` - Start subscription checkout
- `/api/stripe/buy-credits` - Buy one-time credit top-ups
- `/api/stripe/webhook` - Handle Stripe events (payment, renewal, cancellation)
- `/api/client/credits` - Check current credit balance

---

## 📝 Migration Notes voor Bestaande Klanten

### Grandfathering
Bestaande klanten die €24,99 betalen:
- Behouden hun oude prijs **lifetime**
- Krijgen 2000 credits/maand (Basis tier waarde)
- Kunnen upgraden naar nieuwe tiers met 50% korting eerste 3 maanden

### Communicatie Template
```
Beste [Naam],

We hebben geweldig nieuws! WritgoAI heeft een nieuwe pricing structuur die 
transparanter en eerlijker is. 

Jij behoudt als bestaande klant je oude prijs van €24,99/maand - lifetime!
Je krijgt vanaf nu 2000 credits per maand, waarmee je dezelfde content kunt 
blijven maken als voorheen.

Wil je meer content maken? Upgrade naar Professional (€99) of Business (€199)
met 50% korting de eerste 3 maanden als dank voor je trouw!

Vragen? Mail naar info@WritgoAI.nl

Met vriendelijke groet,
Het WritgoAI Team
```

---

## ✅ Testing Checklist

- [ ] Stripe producten aangemaakt
- [ ] .env variabelen ingesteld
- [ ] Pricing page geüpdatet (4 tiers)
- [ ] Checkout flow werkt voor alle tiers
- [ ] Webhook verwerkt nieuwe tiers correct
- [ ] Credits worden correct toegekend
- [ ] Top-up flow werkt
- [ ] Credit display werkt in client portal
- [ ] Credit warnings tonen wanneer bijna op
- [ ] Admin dashboard toont tier analytics

---

## 🎨 UI/UX Guidelines

### Colors
- Primary CTA: Orange (#ff6b35)
- Popular badge: Orange gradient
- Background: Dark theme (grays)
- Text: White/Gray contrast

### Layout
- Pricing page: 4 column grid (responsive: 2 cols on tablet, 1 on mobile)
- Professional tier = highlighted (Most Popular)
- Clear credit amounts prominently displayed
- Easy-to-scan feature lists

### Copy Guidelines
- **Simpel & Direct**: "2000 credits/maand" niet "Up to 2000 credits"
- **Eerlijk**: "~15-20 blogs" niet "Unlimited blogs"
- **Transparant**: Toon credit kosten per tool
- **Nederlands**: Alle teksten in het Nederlands

---

## 📞 Support

Voor vragen over de nieuwe pricing:
- Email: info@WritgoAI.nl
- Admin panel: https://WritgoAI.nl/admin
- Client portal: https://WritgoAI.nl/client-portal

---

*Laatste update: 30 Oktober 2025*
