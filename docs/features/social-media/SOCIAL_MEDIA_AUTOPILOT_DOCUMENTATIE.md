# Social Media Autopilot - Documentatie

## 📱 Overzicht

De Social Media Autopilot is een nieuwe feature in WritgoAI die automatische social media content generatie en publicatie mogelijk maakt via de **Gelaten.dev API**. Deze feature integreert naadloos met het bestaande WritgoAI platform en ondersteunt meerdere social media platforms.

## 🎯 Ondersteunde Platforms

Via Gelaten.dev ondersteunen we de volgende platforms:

1. **LinkedIn** - Zakelijke netwerk content
2. **Facebook** - Algemene sociale media posts
3. **Instagram** - Visuele en lifestyle content
4. **Twitter/X** - Korte, snelle updates
5. **YouTube** - Community posts en beschrijvingen

## ✨ Hoofdfunctionaliteiten

### 1. **Per-Project Configuratie**

Elke project kan zijn eigen social media instellingen hebben:

- **Gelaten API Key**: Connectie met Gelaten.dev
- **Gekoppelde Accounts**: Automatisch detecteren van verbonden social media accounts
- **Autopilot Instellingen**: 
  - Posts per week (1-14)
  - Content types (blog promo, product highlights, tips, quotes)
  - Post tone (professional, casual, enthusiastic)
- **Planning Voorkeuren**:
  - Specifieke dagen (ma-zo selecteerbaar)
  - Standaard posting tijd
  - Timezone (default: Europe/Amsterdam)
- **Automatisering**:
  - Auto-publish bij nieuwe blog
  - Auto-approve posts (zonder handmatige goedkeuring)

### 2. **AI Content Generatie**

De AI genereert platform-specifieke content:

- **Platform Limieten**: Respecteert karakterlimieten per platform
  - LinkedIn: 3000 karakters
  - Facebook: 63206 karakters
  - Instagram: 2200 karakters
  - Twitter: 280 karakters
  - YouTube: 5000 karakters (community posts)

- **Content Types**:
  - **Blog Promotie**: Posts die nieuwe blogartikelen promoten
  - **Product Highlights**: Affiliate producten uitlichten
  - **Tips & Tricks**: Waardevolle tips delen
  - **Quotes**: Inspirerende quotes (toekomstige feature)

- **AI Personalisatie**:
  - Brand voice uit project settings
  - Target audience specifieke taal
  - Niche-specifieke content
  - Optionele hashtags
  - Optionele emoji's

### 3. **Post Management**

Volledig beheer over social media posts:

- **Post Statussen**:
  - **Draft**: Concept, nog niet gepubliceerd
  - **Scheduled**: Ingepland voor latere publicatie
  - **Published**: Succesvol gepubliceerd
  - **Failed**: Publicatie mislukt (met error details)

- **Post Acties**:
  - Preview bekijken
  - Handmatig bewerken
  - Direct publiceren
  - Inplannen voor later
  - Verwijderen (alleen drafts en scheduled)

### 4. **Autopilot Uitvoering**

"Autopilot Uitvoeren" knop genereert automatisch:

- Posts voor alle gekoppelde platforms
- Op basis van project content types
- Gebruikt recente blogartikelen voor promotie
- Genereert originele tips content
- Slaat alles op als drafts voor review

### 5. **Credit Systeem**

Social media posts kosten credits:

| Platform | Credits per Post |
|----------|-----------------|
| LinkedIn | 5 credits |
| Facebook | 4 credits |
| Instagram | 4 credits |
| Twitter | 3 credits |
| YouTube | 5 credits |

**Credit Tracking**:
- Credits worden alleen afgetrokken bij daadwerkelijke publicatie
- Niet bij generatie of opslaan als draft
- Credit usage wordt geregistreerd in `CreditUsage` tabel
- Type: `social_media_post`

## 🗄️ Database Schema

### SocialMediaConfig
```prisma
model SocialMediaConfig {
  id                  String   @id @default(cuid())
  projectId           String   @unique
  gelatenApiKey       String?
  linkedinAccountId   String?
  facebookAccountId   String?
  instagramAccountId  String?
  twitterAccountId    String?
  youtubeAccountId    String?
  autopilotEnabled    Boolean  @default(false)
  postsPerWeek        Int      @default(3)
  contentTypes        String[]
  postTone            String?
  includeHashtags     Boolean  @default(true)
  includeEmojis       Boolean  @default(true)
  scheduleDays        String[]
  scheduleTime        String?
  timezone            String   @default("Europe/Amsterdam")
  autoPublishBlog     Boolean  @default(false)
  autoApprove         Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

### SocialMediaPost
```prisma
model SocialMediaPost {
  id                String        @id @default(cuid())
  projectId         String
  platform          String
  content           String        @db.Text
  mediaUrl          String?
  linkUrl           String?
  contentType       String
  sourceArticleId   String?
  status            String        @default("draft")
  scheduledFor      DateTime?
  publishedAt       DateTime?
  postId            String?       // Gelaten post ID
  platformPostId    String?       // Platform native ID
  engagementData    Json?
  creditsUsed       Int           @default(0)
  approvedBy        String?
  approvedAt        DateTime?
  error             String?
  retryCount        Int           @default(0)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}
```

## 🔌 API Endpoints

### Configuratie
- `GET /api/client/social-media/config?projectId=<id>` - Haal config op
- `POST /api/client/social-media/config` - Update config
- `POST /api/client/social-media/test-connection` - Test Gelaten verbinding

### Content Generatie
- `POST /api/client/social-media/generate-post` - Genereer post content
- `POST /api/client/social-media/autopilot-run` - Voer autopilot uit

### Post Management
- `GET /api/client/social-media/posts?projectId=<id>&status=<status>` - Haal posts op
- `POST /api/client/social-media/posts` - Maak nieuwe post
- `DELETE /api/client/social-media/posts?postId=<id>` - Verwijder post
- `POST /api/client/social-media/publish` - Publiceer post

## 🎨 UI Componenten

### 1. Project Configuratie Component
**Locatie**: Project Detail Pagina (`/client-portal/projects/[id]`)

**Component**: `ProjectSocialMediaConfig`

**Functionaliteit**:
- Gelaten API key invoer
- Test verbinding knop
- Display gekoppelde accounts met platform icons
- Autopilot instellingen
- Content preferences
- Scheduling opties

### 2. Social Media Autopilot Pagina
**Locatie**: `/client-portal/social-media`

**Hoofdfunctionaliteit**:
- Project selectie dropdown
- "Autopilot Uitvoeren" actie knop
- "Nieuwe Post" handmatige creatie
- Tabbed interface voor post statussen
- Post cards met preview en acties
- Post preview dialog
- Nieuwe post dialog met AI generatie

**Tab Overzicht**:
- **Concepten**: Nog niet gepubliceerde posts
- **Ingepland**: Posts met toekomstige publicatiedatum
- **Gepubliceerd**: Succesvol gepubliceerde posts
- **Mislukt**: Posts met errors

## 🚀 Gebruiksworkflow

### Setup Flow
1. Ga naar Project Detail pagina
2. Scroll naar "Social Media Autopilot" sectie
3. Voer Gelaten.dev API key in (van https://gelaten.dev/api)
4. Klik "Test" om verbinding te valideren
5. Configureer autopilot settings:
   - Schakel autopilot in
   - Stel posts per week in
   - Selecteer content types
   - Kies posting dagen en tijd
   - Stel post tone in
6. Klik "Instellingen Opslaan"

### Content Generatie Flow
1. Ga naar Social Media Autopilot pagina (`/client-portal/social-media`)
2. Selecteer het gewenste project
3. **Optie A - Autopilot**:
   - Klik "Autopilot Uitvoeren"
   - Systeem genereert automatisch posts voor alle platforms
   - Posts worden opgeslagen als drafts
4. **Optie B - Handmatig**:
   - Klik "Nieuwe Post"
   - Selecteer platform en content type
   - Klik "AI Genereren" voor automatische content
   - Of schrijf handmatig
   - Optioneel: voeg link en planning toe
   - Klik "Post Opslaan"

### Publicatie Flow
1. Bekijk draft posts in "Concepten" tab
2. Klik oogicon om post preview te zien
3. Klik "Publiceer" om direct te posten
4. Credits worden afgetrokken
5. Post verschijnt in "Gepubliceerd" tab

## 🔐 Beveiliging

- **API Key Opslag**: Gelaten API keys worden encrypted opgeslagen in database
- **Project Ownership**: Alle endpoints valideren project ownership
- **Session Validatie**: NextAuth sessie verificatie op alle routes
- **Rate Limiting**: Gelaten API heeft eigen rate limits
- **Error Handling**: Uitgebreide error logging en user feedback

## 💰 Kosten & Credits

### Per Post Credits
Zoals vermeld in de tabel hierboven, variëren de kosten per platform van 3-5 credits.

### Gratis Acties
- Post generatie (draft maken)
- Post bewerken
- Post verwijderen (voor publicatie)
- Configuratie wijzigen

### Credit Deductie Moment
Credits worden ALLEEN afgetrokken op moment van publicatie, niet bij:
- Genereren van content
- Opslaan als draft
- Inplannen voor later
- Preview bekijken

## 📊 Analytics & Engagement

**Huidige Versie**: Basic tracking
- Post status (draft, scheduled, published, failed)
- Publicatie timestamps
- Error logging voor mislukte posts

**Toekomstige Features**:
- Engagement data ophalen via Gelaten (likes, comments, shares)
- Performance analytics per platform
- Beste posting tijden analyse
- Content type performance vergelijking

## 🔧 Technische Details

### Gelaten.dev Integratie
**Library**: `/lib/gelaten-api.ts`

**Functies**:
- `getGelatenAccounts(apiKey)` - Haal connected accounts op
- `publishGelatenPost(apiKey, postData)` - Publiceer post
- `getGelatenPostEngagement(apiKey, postId)` - Haal engagement op
- `deleteGelatenPost(apiKey, postId)` - Verwijder scheduled post
- `validateGelatenApiKey(apiKey)` - Valideer API key

### AI Content Generator
**Library**: `/lib/social-media-content-generator.ts`

**Functies**:
- `generateBlogPromoPost(platform, blogData, projectContext)`
- `generateProductHighlightPost(platform, productData, projectContext)`
- `generateTipsPost(platform, topic, projectContext)`

**AI Model**: GPT-4o-mini (cost-efficient, fast)

## 🐛 Troubleshooting

### Verbinding Mislukt
**Probleem**: "Failed to connect to Gelaten API"
**Oplossing**:
1. Controleer of API key correct is
2. Verifieer op https://gelaten.dev/api dat key actief is
3. Controleer of social media accounts zijn gekoppeld in Gelaten dashboard

### Geen Accounts Gevonden
**Probleem**: Na test verbinding geen accounts zichtbaar
**Oplossing**:
1. Ga naar https://gelaten.dev/connections
2. Koppel gewenste social media accounts
3. Test opnieuw in WritgoAI

### Publicatie Mislukt
**Probleem**: Post status is "Failed"
**Oplossing**:
1. Bekijk error bericht in post details
2. Controleer of account nog gekoppeld is
3. Verifieer dat post voldoet aan platform requirements
4. Probeer opnieuw te publiceren

### Onvoldoende Credits
**Probleem**: "Insufficient credits"
**Oplossing**:
1. Ga naar Account pagina
2. Bekijk huidige credit saldo
3. Koop extra credits indien nodig
4. Probeer publicatie opnieuw

## 🎯 Best Practices

### Content Kwaliteit
1. **Review Altijd**: Bekijk AI gegenereerde posts voor publicatie
2. **Brand Voice**: Configureer duidelijke brand voice in project settings
3. **Target Audience**: Specificeer doelgroep voor relevante content
4. **Platform Specifiek**: Pas tone aan per platform (professioneel voor LinkedIn, casual voor Instagram)

### Planning
1. **Consistentie**: Gebruik autopilot voor regelmatige posts
2. **Timing**: Test verschillende posting tijden voor optimale reach
3. **Mix Content Types**: Varieer tussen blog promo, tips, en products
4. **Review Cycle**: Plan dagelijkse review van geplande posts

### Platform Strategy
- **LinkedIn**: Zakelijke insights, expertise delen, netwerken
- **Facebook**: Community building, engagement, langere verhalen
- **Instagram**: Visueel aantrekkelijk, lifestyle, inspirerend
- **Twitter**: Korte updates, nieuws, conversaties
- **YouTube**: Video promotie, tutorials, community interactie

## 🔮 Toekomstige Uitbreidingen

### Gepland voor v2.0
- [ ] Visual content generatie (images voor posts)
- [ ] Video upload support
- [ ] Engagement analytics dashboard
- [ ] A/B testing voor post variations
- [ ] Automatische hashtag research
- [ ] Best time to post AI recommendations
- [ ] Thread/carousel support (Twitter, Instagram)
- [ ] Competitor content analysis
- [ ] Content calendar view
- [ ] Bulk scheduling interface

### Lange Termijn Features
- [ ] Social listening & sentiment analysis
- [ ] Influencer collaboration tracking
- [ ] ROI tracking voor affiliate links in posts
- [ ] Multi-language support
- [ ] Custom brand templates
- [ ] Social media inbox (reply management)

## 📝 Changelog

### v1.0.0 (Initial Release)
- ✅ Gelaten.dev API integratie
- ✅ 5 platforms support (LinkedIn, Facebook, Instagram, Twitter, YouTube)
- ✅ AI content generatie voor 3 content types
- ✅ Per-project configuratie
- ✅ Credit tracking systeem
- ✅ Draft, scheduled, published workflows
- ✅ Autopilot "Nu Uitvoeren" functionaliteit
- ✅ Handmatige post creatie en bewerking
- ✅ Post preview en management UI

---

## 🆘 Support

Voor vragen of problemen met de Social Media Autopilot:
1. Bekijk deze documentatie eerst
2. Controleer Gelaten.dev status op https://status.gelaten.dev
3. Contact WritgoAI support via support@WritgoAI.nl

---

**Laatste Update**: November 2025  
**Versie**: 1.0.0  
**Auteur**: WritgoAI Development Team
