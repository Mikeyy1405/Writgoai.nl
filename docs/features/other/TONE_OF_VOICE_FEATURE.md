# ✨ Custom Tone of Voice Feature

## Overzicht

De **Custom Tone of Voice** functie stelt klanten in staat om hun eigen schrijfstijl en merkenstem te definiëren. De AI gebruikt deze instructies automatisch bij ALLE content generatie (blogs, social posts, video scripts, etc.).

---

## 🎯 Waar wordt Tone of Voice opgeslagen?

Tone of Voice kan op **2 niveaus** worden opgeslagen:

### 1. Client-niveau (Standaard voor alle projecten)
- **Locatie:** `Client.brandVoice` + `ClientAISettings.toneOfVoice`
- **Gebruik:** Wordt gebruikt voor ALLE content als geen project-specifieke tone is ingesteld
- **Instelbaar via:** AI Settings pagina (`/client-portal/ai-settings`)

### 2. Project-niveau (Override voor specifiek project)
- **Locatie:** `Project.brandVoice` + `Project.customInstructions`
- **Gebruik:** Overschrijft client-level tone voor dit specifieke project
- **Instelbaar via:** Project Settings (toekomstige feature)

---

## 🔧 Database Schema

```prisma
model Client {
  brandVoice    String?  // Legacy tone of voice
  aiSettings    ClientAISettings?
}

model ClientAISettings {
  toneOfVoice         String?  // Custom tone of voice
  customInstructions  String?  // Extra instructies (SEO, stijl, etc.)
}

model Project {
  brandVoice          String?  // Project-specific tone of voice
  customInstructions  String?  // Project-specific instructies
}
```

---

## 📝 Tone of Voice Voorbeelden

### Voorbeeld 1: Casual & Vriendelijk
```
Gebruik 'je' en 'jij', schrijf alsof je een vriend adviseert. Kort en krachtig, zonder vakjargon. 
Gebruik emoji's waar passend. Eindig zinnen met een persoonlijke noot.

Vermijd woorden als: revolutionair, gamechanger, ultiem, baanbrekend.
```

### Voorbeeld 2: Professioneel & Gezaghebbend
```
Gebruik 'u' en formele aanspreking. Schrijf zakelijk maar toegankelijk. 
Gebruik feiten en cijfers. Vermijd overdreven claims. Toon expertise zonder arrogant te zijn.

Voorkeurswoorden: professioneel, betrouwbaar, effectief, bewezen.
```

### Voorbeeld 3: Inspirerend & Motiverend
```
Gebruik 'jij/je', schrijf energiek en positief. Moedig de lezer aan tot actie. 
Gebruik storytelling. Eindig altijd met een inspirerende call-to-action. Denk: Tony Robbins meets marketing.

Gebruik actieve werkwoorden: bereik, realiseer, transformeer, ontdek.
```

---

## 💻 Implementatie

### Helper Functie
```typescript
import { getClientToneOfVoice, generateToneOfVoicePrompt } from '@/lib/tone-of-voice-helper';

// Haal tone of voice op
const toneData = await getClientToneOfVoice(clientId, projectId);

// Genereer prompt instructies
const tonePrompt = generateToneOfVoicePrompt(toneData, 'professional');
```

### In Content Generatie Routes
```typescript
// 1. Import helper
import { getClientToneOfVoice, generateToneOfVoicePrompt } from '@/lib/tone-of-voice-helper';

// 2. Haal tone op
const toneData = await getClientToneOfVoice(user.id, projectId);

// 3. Gebruik in prompt
const toneInstructions = generateToneOfVoicePrompt(toneData, 'professional');

const prompt = `
Schrijf een blog artikel over: ${topic}

${toneInstructions}

Verdere instructies...
`;
```

---

## 🚀 Routes die Tone of Voice gebruiken

✅ **Blog Generatie**
- `/api/ai-agent/generate-blog` ✅ GEÏMPLEMENTEERD
- `/api/ai-agent/generate-seo-blog`
- `/api/ai-agent/generate-article`

🔄 **Social Media**
- `/api/ai-agent/generate-social-post`
- `/api/social-media/generate-media`

🎥 **Video Content**
- `/api/videos/generate` (script generatie)
- `/api/video-workflow/generate-script`

📰 **Overige Content**
- `/api/ai-agent/generate-news-article`
- `/api/ai-agent/generate-product-review`
- `/api/ai-agent/generate-linkbuilding`

---

## 🎨 UI/UX - AI Settings Pagina

### Tone of Voice Sectie
- **Locatie:** `/client-portal/ai-settings` → Content Tab
- **Veld type:** Large textarea (6 rijen)
- **Voorbeelden:** 3 concrete voorbeelden met verschillende stijlen
- **Pro Tip:** Uitleg over specificiteit en voorbeelden

### Key Features
- ✨ Voorbeelden van goede tone of voice beschrijvingen
- 💡 Pro tips voor optimaal gebruik
- 📝 Grote textarea voor gedetailleerde instructies
- 💾 Automatisch opslaan in database

---

## 🔍 Hoe werkt het?

### Flow Diagram
```
1. Klant vult tone of voice in → AI Settings pagina
2. Opslaan in database → ClientAISettings + Project
3. Content generatie gestart → Blog/Social/Video route
4. Route haalt tone op → getClientToneOfVoice()
5. Tone wordt toegevoegd → AI prompt
6. AI genereert content → Met custom merkenstem
```

### Hiërarchie
```
Project Tone of Voice (hoogste prioriteit)
    ↓ (als niet ingevuld)
ClientAISettings.toneOfVoice
    ↓ (als niet ingevuld)
Client.brandVoice (legacy)
    ↓ (als niet ingevuld)
Default Tone (fallback)
```

---

## 📊 Voorbeeld Output

### ZONDER Custom Tone of Voice
```
Kunstmatige intelligentie heeft de afgelopen jaren een transformatie ondergaan. 
De technologie biedt nu ongekende mogelijkheden voor bedrijven.
```

### MET Custom Tone of Voice (Casual)
```
Heb je het al gemerkt? AI is niet meer weg te denken uit ons dagelijks leven! 
Van je smartphone tot je favoriete app – overal vind je slimme technologie terug. 
Laten we eens kijken wat dit voor jouw bedrijf kan betekenen 🚀
```

---

## ✅ Testing Checklist

- [x] Tone of Voice opslaan werkt
- [x] Tone wordt geladen uit database
- [x] Helper functie werkt correct
- [x] Blog generatie gebruikt custom tone
- [ ] Social media posts gebruiken custom tone
- [ ] Video scripts gebruiken custom tone
- [ ] Alle content types testen met verschillende tones

---

## 🔜 Toekomstige Uitbreidingen

1. **Per-Project Tone of Voice UI**
   - Aparte pagina voor project-specifieke instellingen
   - Override client-level tone per project

2. **Tone of Voice Templates**
   - Vooraf gedefinieerde templates (casual, professional, etc.)
   - Eén-klik setup voor veelvoorkomende stijlen

3. **AI Tone Analyzer**
   - Scan bestaande content om tone automatisch te detecteren
   - Suggesties voor tone of voice op basis van website scan

4. **A/B Testing**
   - Test verschillende tones
   - Zie welke tone beter presteert

---

## 📚 Gerelateerde Bestanden

- `/lib/tone-of-voice-helper.ts` - Helper functies
- `/app/client-portal/ai-settings/page.tsx` - UI
- `/app/api/client/ai-profile/route.ts` - API voor opslaan
- `/app/api/ai-agent/generate-blog/route.ts` - Voorbeeld implementatie
- `/lib/isolated-blog-generator.ts` - Blog generator met tone support

---

## 🐛 Troubleshooting

**Q: Tone of voice wordt niet gebruikt in content**
A: Check of de content generatie route de `getClientToneOfVoice()` helper gebruikt

**Q: Oude tone blijft terugkomen**
A: Clear de database cache of herstart de server

**Q: Custom instructions verschijnen niet**
A: Zorg dat `customInstructions` wordt meegenomen in de prompt

---

**Datum:** 30 Oktober 2025  
**Versie:** 1.0  
**Auteur:** WritgoAI Development Team
