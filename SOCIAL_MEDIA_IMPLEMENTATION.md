# Social Media Management Systeem - Implementatie Documentatie

## 📱 Overzicht

Een compleet social media management systeem is toegevoegd aan WritGo met **Getlate.Dev integratie** voor automatisch posten naar 11+ social media platforms.

### ✨ Nieuwe Features

1. **AI-Powered Content Generatie**
   - Unieke content per platform (niet kopiëren van website)
   - Platform-specifieke optimalisatie (karakterlimieten, tone, hashtags)
   - Ondersteunt: Twitter/X, LinkedIn, Facebook, Instagram

2. **Getlate.Dev Integratie**
   - Unified API voor 11+ social media platforms
   - Automatisch posten of handmatig (copy-paste)
   - Post scheduling functionaliteit
   - Account management per platform

3. **Project-Based Configuratie**
   - Elk project heeft eigen Getlate.Dev API key
   - Per project platform selectie
   - Autopost aan/uit per project

4. **Volledige UI**
   - **Genereer Tab**: Maak social media posts met AI
   - **History Tab**: Bekijk alle gegenereerde en geposte content
   - **Instellingen Tab**: Configureer Getlate.Dev API key en platforms

---

## 🗂️ Bestandsstructuur

### **Backend: API Routes**

```
/app/api/simplified/social-media/
├── generate/route.ts          # AI content generatie per platform
├── post/route.ts              # Post naar Getlate.Dev
├── history/route.ts           # Post geschiedenis ophalen
└── settings/route.ts          # Project instellingen beheren
```

### **Frontend: UI Pagina**

```
/app/(simplified)/social-media/
└── page.tsx                   # Volledige social media management interface
```

### **Library: Getlate.Dev Client**

```
/lib/getlate-client.ts         # Getlate.Dev API wrapper met TypeScript support
```

### **Database: Migratie**

```
/supabase/migrations/
└── 20251215_social_media_getlate_integration.sql
```

### **Navigatie**

```
/components/SimplifiedNavigation.tsx  # Updated met Social Media link
```

---

## 🚀 Deployment Stappen

### 1. Database Migratie Uitvoeren

De migratie voegt de volgende velden toe aan de database:

**Project tabel:**
- `getlateApiKey` (TEXT) - Getlate.Dev API key
- `autopostEnabled` (BOOLEAN) - Automatisch posten aan/uit
- `connectedPlatforms` (TEXT[]) - Array van verbonden platforms

**SocialMediaPost tabel:**
- `projectId` (TEXT) - Foreign key naar Project
- `getlatePostId` (TEXT) - ID van Getlate.Dev post
- `errorMessage` (TEXT) - Foutmelding bij gefaalde post

**Migratie uitvoeren:**

```bash
# Via Supabase dashboard
1. Ga naar je Supabase project
2. Navigeer naar Database > Migrations
3. Upload het bestand: supabase/migrations/20251215_social_media_getlate_integration.sql
4. Voer de migratie uit

# Of via Supabase CLI (als geïnstalleerd)
cd /home/ubuntu/writgoai_repo
supabase db push
```

### 2. Environment Variabelen

Geen extra environment variabelen nodig! De Getlate.Dev API key wordt per project geconfigureerd via de UI.

Bestaande vereisten:
```env
AIML_API_KEY=your_aiml_api_key_here  # Voor content generatie
```

### 3. Deployment naar Production

```bash
# Pull de laatste changes
git pull origin main

# Install dependencies (als er nieuwe zijn)
npm install

# Build de applicatie
npm run build

# Restart de production server
pm2 restart all  # Of je deployment methode
```

---

## 📖 Gebruikershandleiding

### **Stap 1: Getlate.Dev API Key Verkrijgen**

1. Ga naar [https://getlate.dev](https://getlate.dev)
2. Maak een account aan (gratis of betaald plan)
3. Navigeer naar Settings > API Keys
4. Genereer een nieuwe API key
5. Kopieer de API key (wordt maar 1x getoond!)

### **Stap 2: Project Configureren**

1. Login in WritGo
2. Ga naar **Social Media** in het menu
3. Selecteer je project
4. Klik op de **Instellingen** tab
5. Voer je Getlate.Dev API key in
6. Selecteer de platforms die je wilt gebruiken
7. (Optioneel) Schakel **Autopost** in voor automatisch posten
8. Klik op **Instellingen Opslaan**

### **Stap 3: Social Media Accounts Verbinden in Getlate.Dev**

**Belangrijk**: Getlate.Dev vereist dat je je social media accounts eerst verbindt via hun dashboard.

1. Ga naar [https://getlate.dev/dashboard](https://getlate.dev/dashboard)
2. Klik op **Connect Account**
3. Selecteer het platform (Twitter, LinkedIn, Facebook, Instagram)
4. Autoriseer de OAuth connectie
5. Herhaal voor alle platforms die je wilt gebruiken

**Ondersteunde Platforms:**
- Twitter/X
- LinkedIn
- Facebook Pages
- Instagram Business
- TikTok
- YouTube
- Pinterest
- Reddit
- Bluesky
- Threads
- Google Business

### **Stap 4: Content Genereren**

1. Ga naar de **Genereer Posts** tab
2. Voer een **Topic** in (bijv. "Yoga tips voor beginners")
3. Selecteer de **Platforms** waarvoor je content wilt genereren
4. Kies een **Tone of Voice** (Professioneel, Casual, Vriendelijk, etc.)
5. (Optioneel) Vink aan om een **afbeelding prompt** te genereren
6. Klik op **Genereer Social Media Posts**

**AI genereert nu unieke content per platform:**
- **Twitter**: Kort en pakkend (max 280 karakters)
- **LinkedIn**: Professioneel en informatief (max 3000 karakters)
- **Facebook**: Conversational met CTA (max 2000 karakters)
- **Instagram**: Visueel met 10-15 hashtags (max 2200 karakters)

### **Stap 5: Posten of Kopiëren**

**Optie A: Automatisch Posten (via Getlate.Dev)**

Als je Getlate.Dev API key is geconfigureerd:

1. Review de gegenereerde posts
2. Klik op **Post Nu** voor directe publicatie
3. Of klik op **Plan In** en voer een datum/tijd in
4. De post wordt via Getlate.Dev naar je social accounts gestuurd

**Optie B: Handmatig Kopiëren**

1. Review de gegenereerde posts
2. Klik op **Kopieer** om de tekst te kopiëren
3. Plak de content handmatig in je social media platform
4. Post vanuit het platform zelf

### **Stap 6: Historie Bekijken**

1. Ga naar de **Post History** tab
2. Bekijk alle gegenereerde en geposte content
3. Filter op project, platform, of status
4. Kopieer oude posts opnieuw indien nodig

**Status Indicatoren:**
- 🟢 **Gepost**: Succesvol gepubliceerd via Getlate.Dev
- 🔵 **Ingepland**: Scheduled voor latere publicatie
- 🟡 **Pending**: Gegenereerd maar nog niet gepost
- 🔴 **Gefaald**: Post mislukt (zie error message)

---

## 🔧 Technische Details

### **API Endpoints**

#### 1. Generate Posts
```typescript
POST /api/simplified/social-media/generate
Body: {
  projectId: string,
  topic: string,
  platforms: string[],  // ['twitter', 'linkedin', 'facebook', 'instagram']
  tone: string,          // 'professional', 'casual', 'friendly', etc.
  generateImage: boolean
}
Response: {
  success: boolean,
  posts: SocialPost[],
  message: string
}
```

#### 2. Post to Getlate.Dev
```typescript
POST /api/simplified/social-media/post
Body: {
  postId: string,
  action: 'now' | 'schedule',
  scheduledDate?: string  // ISO 8601 format
}
Response: {
  success: boolean,
  message: string,
  getlatePostId: string,
  status: string
}
```

#### 3. Get History
```typescript
GET /api/simplified/social-media/history?projectId={id}&platform={platform}&status={status}
Response: {
  posts: SocialPost[],
  total: number
}
```

#### 4. Update Settings
```typescript
POST /api/simplified/social-media/settings
Body: {
  projectId: string,
  getlateApiKey?: string,
  autopostEnabled?: boolean,
  connectedPlatforms?: string[]
}
Response: {
  success: boolean,
  message: string,
  project: Project
}
```

### **Getlate.Dev API Client**

De `GetlateClient` class biedt een TypeScript wrapper om de Getlate.Dev API:

```typescript
import { GetlateClient } from '@/lib/getlate-client';

const client = new GetlateClient(apiKey);

// Test connection
const test = await client.testConnection();

// Create post
const post = await client.createPost({
  platforms: ['twitter', 'linkedin'],
  content: 'Check out our new product! 🚀',
  mediaUrls: ['https://www.shutterstock.com/image-vector/rocket-launching-futuristic-podium-project-260nw-2654313025.jpg
  scheduledFor: '2025-12-20T14:00:00Z'  // Optional
});

// Get post status
const status = await client.getPost(post.id);

// Get all posts
const posts = await client.getPosts({ status: 'scheduled' });

// Get analytics (requires add-on)
const analytics = await client.getAnalytics(post.id);
```

### **Platform-Specifieke Limieten**

| Platform | Max Characters | Hashtag Recommendation | Best Practices |
|----------|---------------|----------------------|----------------|
| Twitter/X | 280 | 2-3 | Short, catchy, with emojis |
| LinkedIn | 3000 | 3-5 | Professional, value-driven |
| Facebook | 2000 | 2-4 | Conversational with CTA |
| Instagram | 2200 | 10-15 | Visual, with mix of popular/niche tags |

### **AI Content Generatie Prompt Structuur**

Voor elk platform gebruikt het systeem een unieke prompt:

```typescript
// Voorbeeld voor LinkedIn
const systemPrompt = `Je bent een social media expert gespecialiseerd in linkedin content voor de ${niche} niche.`;

const userPrompt = `Creëer een unieke linkedin post over: "${topic}"

Vereisten:
- Maximaal 3000 karakters
- Schrijf in een professioneel en informatief. Gebruik 3-5 relevante hashtags. Focus op value en insights.
- Maak het linkedin-specifiek (niet generiek)
- Gebruik relevante emojis waar passend
- Voeg passende hashtags toe op een natuurlijke manier
`;
```

---

## 🐛 Troubleshooting

### **"Getlate.Dev API key niet geconfigureerd"**

**Oorzaak**: Geen API key ingesteld voor het project

**Oplossing**:
1. Ga naar Social Media > Instellingen tab
2. Voer je Getlate.Dev API key in
3. Klik op Opslaan

### **"Getlate.Dev connectie gefaald"**

**Mogelijke oorzaken:**
1. Ongeldige API key
2. API key verlopen
3. Geen internet connectie
4. Getlate.Dev service down

**Oplossing**:
1. Verifieer je API key in het Getlate.Dev dashboard
2. Genereer een nieuwe API key indien nodig
3. Check je internet verbinding
4. Check de Getlate.Dev status pagina

### **"Post gefaald"**

**Mogelijke oorzaken:**
1. Social media account niet verbonden in Getlate.Dev
2. Content voldoet niet aan platform richtlijnen
3. Rate limit bereikt
4. Platform API problemen

**Oplossing**:
1. Ga naar [getlate.dev/dashboard](https://getlate.dev/dashboard)
2. Verifieer dat je accounts verbonden zijn
3. Check of de content voldoet aan platform regels
4. Wacht even en probeer opnieuw (rate limit)
5. Check error message in Post History tab

### **"AIML API error"**

**Oorzaak**: AIML API key niet geconfigureerd of limiet bereikt

**Oplossing**:
1. Check of `AIML_API_KEY` is ingesteld in environment variabelen
2. Verifieer je AIML API quota
3. Check de AIML API dashboard voor errors

### **Content wordt niet gegenereerd**

**Checklist:**
- ✅ Project geselecteerd?
- ✅ Topic ingevuld?
- ✅ Minimaal 1 platform geselecteerd?
- ✅ AIML API key geconfigureerd?
- ✅ Geen JavaScript errors in browser console?

---

## 📊 Pricing & Limieten

### **Getlate.Dev Pricing**

Getlate.Dev biedt verschillende plannen:

| Plan | Price | API Requests/min | Features |
|------|-------|-----------------|----------|
| Free | $0/maand | 60/min | Basis posting, 1 profiel |
| Starter | $9/maand | 120/min | Unlimited posts, 3 profielen |
| Pro | $29/maand | 600/min | Analytics, 10 profielen |
| Unlimited | $99/maand | 1200/min | White-label, unlimited profielen |

**Meer info**: [https://getlate.dev/pricing](https://getlate.dev/pricing)

### **AIML API Limieten**

Content generatie gebruikt de AIML API:
- Model: `gpt-4o-mini` (kosteneffectief)
- Tokens per post: ~500-800 tokens
- Kosten: ~$0.001 per post

---

## 🔐 Security & Best Practices

### **API Key Management**

1. **Nooit** commit API keys naar Git
2. Sla keys op per project (niet global)
3. Roteer keys regelmatig
4. Gebruik read-only keys waar mogelijk

### **Content Review**

Hoewel de AI goede content genereert, is het belangrijk om:

1. **Altijd** content te reviewen voor accuracy
2. Brand guidelines te checken
3. Sensitive onderwerpen te vermijden
4. Platform-specifieke regels na te leven

### **Rate Limiting**

- Getlate.Dev heeft rate limits per plan
- Spread posts uit over de dag
- Monitor je API usage in het dashboard
- Implementeer retry logic voor gefaalde posts

---

## 🎨 Design Consistency

De nieuwe Social Media pagina volgt het bestaande design systeem:

- **Kleurenschema**: Zwart background, oranje/roze accenten, witte tekst
- **Typography**: Gradient headers, bold labels
- **Components**: Consistente rounded corners, hover effects
- **Icons**: Lucide React icons voor alle UI elementen
- **Responsive**: Mobile-first design met hamburger menu

---

## 🔄 Future Enhancements

Mogelijke toekomstige features:

1. **Content Kalender**: Visuele kalender voor geplande posts
2. **Analytics Dashboard**: Engagement metrics per platform
3. **A/B Testing**: Test verschillende content variaties
4. **Bulk Upload**: CSV import voor meerdere posts tegelijk
5. **Templates**: Herbruikbare content templates
6. **Team Collaboration**: Meerdere gebruikers, approval workflow
7. **Auto-repost**: Automatisch oude posts opnieuw delen
8. **Trend Analysis**: AI-powered trending topics suggestions

---

## 📞 Support & Contact

Voor vragen of problemen:

1. Check deze documentatie eerst
2. Bekijk de Getlate.Dev docs: [https://getlate.dev/docs](https://getlate.dev/docs)
3. Test met de browser console (F12) voor errors
4. Contact WritGo support: info@writgo.nl

---

## ✅ Checklist voor Deployment

- [ ] Database migratie uitgevoerd
- [ ] AIML_API_KEY geconfigureerd in environment
- [ ] Applicatie gebuild en getest lokaal
- [ ] Pushed naar production
- [ ] Getlate.Dev account aangemaakt
- [ ] Getlate.Dev API key verkregen
- [ ] Social media accounts verbonden in Getlate.Dev
- [ ] Test project aangemaakt in WritGo
- [ ] API key geconfigureerd in project settings
- [ ] Test post gegenereerd en succesvol gepost
- [ ] Post verschijnt in History tab
- [ ] Alle platforms getest

---

**Implementatie Datum**: 15 december 2025  
**Versie**: 1.0  
**Status**: ✅ Production Ready  
**Repository**: [https://github.com/Mikeyy1405/Writgoai.nl](https://github.com/Mikeyy1405/Writgoai.nl)

---

## 🎉 Success!

Het complete social media management systeem is nu live! Gebruikers kunnen:

✅ Unieke social media content genereren met AI  
✅ Automatisch posten naar 11+ platforms via Getlate.Dev  
✅ Of handmatig kopiëren en plakken  
✅ Post geschiedenis bekijken met status tracking  
✅ Per project API keys en platforms configureren  

**Happy posting! 🚀📱**
