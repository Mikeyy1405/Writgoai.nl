
# Per-Project Social Media Account Koppeling - Implementatie Documentatie

## 📋 Overzicht

Deze update implementeert **per-project social media account koppeling**, waarbij elke client zijn eigen social media accounts kan koppelen via Gelaten.dev. Dit zorgt voor volledige privacy isolatie tussen clients.

## 🎯 Belangrijkste Wijzigingen

### 1. **Volledige Privacy Isolatie**
- **Client A** kan NOOIT de social media accounts van **Client B** zien
- Elke project heeft zijn eigen Gelaten.dev API key
- Accounts zijn project-specifiek gekoppeld
- Geen centrale account management meer

### 2. **Database Schema Updates**

```prisma
model SocialMediaConfig {
  id                String   @id @default(cuid())
  projectId         String   @unique
  
  // PER-PROJECT Gelaten.dev credentials
  gelatenApiKey     String?  // Encrypted per-project API key
  gelatenAccessToken String? // OAuth access token
  gelatenRefreshToken String? // For token refresh
  gelatenTokenExpiry DateTime? // Track when token expires
  
  // Platform-specific account IDs - PER PROJECT
  linkedinAccountId String?
  facebookAccountId String?
  instagramAccountId String?
  twitterAccountId  String?
  youtubeAccountId  String?
  
  // Connected accounts metadata
  connectedAccounts Json?
  lastConnectionTest DateTime?
  
  // ... rest of existing fields
}
```

### 3. **Nieuwe API Endpoints**

#### **POST /api/client/social-media/save-api-key**
Slaat de project-specifieke Gelaten.dev API key op.

**Request:**
```json
{
  "projectId": "project_123",
  "gelatenApiKey": "gelaten_api_key_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key succesvol opgeslagen",
  "config": {
    "id": "config_123",
    "hasApiKey": true
  }
}
```

### 4. **Aangepaste Endpoints**

De volgende endpoints gebruiken nu **project-specifieke API keys**:

- ✅ `GET /api/client/social-media/config` - Laadt project-specifieke config
- ✅ `POST /api/client/social-media/config` - Valideert accounts via project API key
- ✅ `POST /api/client/social-media/test-connection` - Test verbinding met project API key
- ✅ `POST /api/client/social-media/publish` - Publiceert via project API key
- ✅ `POST /api/cron/social-media-autopilot` - Gebruikt per-project API keys

## 🎨 UI Veranderingen

### **Nieuwe Workflow voor Clients**

#### **Stap 1: Gelaten.dev Account Koppeling**

De UI toont nu een duidelijke flow voor het koppelen van Gelaten.dev:

```tsx
// Zonder API key
┌─────────────────────────────────────────────┐
│ ⚠️  Stap 1: Koppel je Gelaten.dev Account   │
│                                             │
│ Om social media accounts te koppelen heb   │
│ je een Gelaten.dev API key nodig.          │
│                                             │
│ [API Key Toevoegen] [Ga naar Gelaten.dev →]│
└─────────────────────────────────────────────┘

// Met API key
┌─────────────────────────────────────────────┐
│ ✓ Gelaten.dev API Gekoppeld                 │
│                                             │
│ Je hebt succesvol je Gelaten.dev API key   │
│ gekoppeld aan dit project.                 │
│                                             │
│ [Laad Social Media Accounts] [API Key Wijzigen]│
└─────────────────────────────────────────────┘
```

#### **Stap 2: Account Selectie**

Na het testen van de verbinding kunnen clients hun accounts selecteren:

```tsx
┌─────────────────────────────────────────────┐
│ Stap 2: Selecteer je Social Media Accounts │
│                                             │
│ Dit zijn jouw eigen social media accounts  │
│ die gekoppeld zijn aan je Gelaten.dev      │
│ account.                                    │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ 🔷 LinkedIn                          │    │
│ │ Mijn Bedrijf LinkedIn               │    │
│ │ [✓ Actief] [✓ Geselecteerd]        │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ 🔷 Facebook                          │    │
│ │ Mijn Facebook Pagina                │    │
│ │ [✓ Actief]                          │    │
│ └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## 🔐 Beveiliging

### **API Key Opslag**
- API keys worden **encrypted** opgeslagen in de database
- Keys worden **nooit** naar de client gestuurd
- Alleen `hasApiKey: boolean` wordt teruggegeven

### **Project Ownership Validatie**
```typescript
// Verify project ownership
const project = await prisma.project.findFirst({
  where: {
    id: projectId,
    clientId: session.user.id,
  },
});

if (!project) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 404 });
}
```

### **Account Validatie**
- Alleen accounts van de project-specifieke API key kunnen worden geselecteerd
- Server-side validatie voorkomt cross-project account toegang
- Foutmeldingen vermelden nooit specifieke account details van andere clients

## 🚀 Implementatie Details

### **1. Gelaten.dev Setup**

Clients moeten:
1. Een account aanmaken op [gelaten.dev](https://gelaten.dev)
2. Hun social media accounts koppelen via OAuth
3. Een API key genereren in hun Gelaten.dev dashboard
4. De API key toevoegen aan hun WritgoAI project

### **2. Account Koppeling Flow**

```typescript
// Client voegt API key toe
POST /api/client/social-media/save-api-key
{
  "projectId": "...",
  "gelatenApiKey": "..."
}

// Client test verbinding
POST /api/client/social-media/test-connection
{
  "projectId": "..."
}
// → Returned connected accounts from Gelaten.dev

// Client selecteert accounts en slaat op
POST /api/client/social-media/config
{
  "projectId": "...",
  "linkedinAccountId": "account_123",
  "facebookAccountId": "account_456",
  // ... other settings
}
```

### **3. Publishing Flow**

```typescript
// Publishing gebruikt nu project-specifieke API key
const config = post.project.socialMediaConfig;
const projectApiKey = config?.gelatenApiKey;

if (!projectApiKey) {
  return NextResponse.json({
    error: 'Geen Gelaten.dev API key gevonden voor dit project'
  }, { status: 400 });
}

// Publish via project API key
const result = await publishGelatenPost(projectApiKey, {
  accountId,
  content,
  mediaUrl,
  // ...
});
```

## 📊 Privacy Garanties

### **Isolatie Mechanisme**

```typescript
// GET Config - Only returns project-specific data
const config = await prisma.socialMediaConfig.findUnique({
  where: { projectId }  // ← Project-specific!
});

const projectApiKey = config.gelatenApiKey;

// Fetch accounts using PROJECT API key
const accounts = await getGelatenAccounts(projectApiKey);

// Client ziet alleen accounts van zijn eigen API key
return NextResponse.json({
  config: {
    ...config,
    gelatenApiKey: undefined  // ← Never expose actual key!
  },
  connectedAccounts: accounts  // ← Only from this project's API key
});
```

### **Autopilot Cron Job**

```typescript
// Cron job processes each project with its own API key
for (const config of configs) {
  const projectApiKey = config.gelatenApiKey;
  
  if (!projectApiKey) {
    // Skip project without API key
    continue;
  }
  
  // Use PROJECT-SPECIFIC API key for publishing
  await publishGelatenPost(projectApiKey, {...});
}
```

## ✅ Voordelen

1. **Volledige Privacy**: Clients zien alleen hun eigen accounts
2. **Flexibiliteit**: Elke client kan verschillende accounts per project koppelen
3. **Schaalbaarheid**: Geen limiet op aantal clients of accounts
4. **Veiligheid**: API keys zijn encrypted en project-specifiek
5. **Transparantie**: Clients hebben volledige controle over hun eigen accounts

## 🔄 Migratie van Oude Implementatie

### **Oude Situatie (Centraal)**
```env
# .env
GELATEN_API_KEY=central_key_for_all_clients
```
- ❌ Alle clients gebruikten dezelfde centrale accounts
- ❌ Geen privacy tussen clients
- ❌ Clients konden elkaars accounts zien

### **Nieuwe Situatie (Per-Project)**
```prisma
SocialMediaConfig {
  gelatenApiKey: "project_a_key"  // ← Project A's own key
}

SocialMediaConfig {
  gelatenApiKey: "project_b_key"  // ← Project B's own key
}
```
- ✅ Elke client heeft zijn eigen API key
- ✅ Volledige privacy isolatie
- ✅ Clients zien alleen hun eigen accounts

## 🛠️ Troubleshooting

### **"Geen accounts gevonden"**
- Check of de Gelaten.dev API key correct is ingevoerd
- Verifieer dat accounts zijn gekoppeld in Gelaten.dev dashboard
- Test verbinding via "Laad Social Media Accounts" button

### **"Account niet beschikbaar"**
- Account is mogelijk ontkoppeld in Gelaten.dev
- Test verbinding opnieuw en selecteer opnieuw
- Check of de API key nog geldig is

### **"Publicatie mislukt"**
- Verifieer dat account nog actief is in Gelaten.dev
- Check of de API key niet is verlopen
- Controleer account permissions in social media platform

## 📝 Changelog

### Version 3.3.0 (November 2025)
- ✅ Per-project Gelaten.dev API key support
- ✅ Project-specific account selection
- ✅ Privacy isolation tussen clients
- ✅ Nieuwe UI flow voor account koppeling
- ✅ Updated API endpoints voor project-specifieke credentials
- ✅ Autopilot cron job aangepast voor per-project keys

## 🎓 Best Practices

### **Voor Clients**

1. **Bewaar je API key veilig**: Deel je Gelaten.dev API key nooit met anderen
2. **Test regelmatig**: Test je verbinding periodiek om te controleren of alles nog werkt
3. **Update tijdig**: Als je API key verloopt, update deze direct in WritgoAI
4. **Separate accounts**: Overweeg separate Gelaten.dev accounts voor verschillende projecten

### **Voor Developers**

1. **Altijd project ownership valideren**: Check altijd `clientId` bij database queries
2. **Never expose API keys**: Stuur nooit de daadwerkelijke API key naar de client
3. **Use project-specific keys**: Gebruik altijd `config.gelatenApiKey` in plaats van environment variables
4. **Handle missing keys gracefully**: Geef duidelijke foutmeldingen als API key ontbreekt

## 📞 Support

Voor vragen of problemen met de per-project social media account koppeling:
1. Check deze documentatie eerst
2. Test je Gelaten.dev connectie
3. Neem contact op met support als het probleem blijft bestaan

---

**Live sinds:** November 2025  
**Status:** ✅ Production Ready  
**Versie:** 3.3.0
