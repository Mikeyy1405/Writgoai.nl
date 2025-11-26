# Late.dev Profile & Invite Based Integration

## Overzicht

WritgoAI gebruikt nu een **profile-based workflow** met Late.dev voor social media integratie. Dit betekent:

- ✅ **Centrale API key van WritgoAI** wordt gebruikt voor alle operaties
- ✅ **Elke klant koppelt zijn eigen social media accounts** via invite links
- ✅ **Per project één Late.dev Profile** met bijbehorende accounts
- ✅ **Privacy en security**: klanten koppelen alleen hun eigen accounts

## Hoe het werkt

### 1. Profile aanmaken
Wanneer een client een project opent en naar "Social Media Koppeling" gaat:
- Klik op **"Late.dev Profile Aanmaken"**
- Dit creëert een uniek profile in Late.dev voor dit project
- De profileId wordt opgeslagen in de database

### 2. Invite Links genereren
Na het aanmaken van een profile kan de client voor elk platform een invite link genereren:
- **Instagram** 📸
- **Facebook** 👥
- **LinkedIn** 💼
- **X (Twitter)** 🐦
- **TikTok** 🎵
- **YouTube** 🎥

Klik op **"Invite Link"** naast het gewenste platform om een link te genereren.

### 3. Account koppelen
De client:
1. Kopieert de invite link (knop "Kopieer Link")
2. Opent de link in een browser
3. Logt in met zijn social media account
4. Geeft toestemming aan Late.dev
5. Het account wordt automatisch gekoppeld aan het profile

### 4. Accounts refreshen
Klik op het **refresh icoon** (↻) om de lijst met gekoppelde accounts bij te werken.

### 5. Publiceren
Wanneer content wordt gepubliceerd via Social Media Autopilot:
- WritgoAI gebruikt de centrale API key
- Late.dev publiceert naar de gekoppelde accounts van die specifieke client
- Credits worden afgeschreven volgens normaal tarief

## Technische Architectuur

### Database Schema
```prisma
model SocialMediaConfig {
  lateDevProfileId     String?  // Late.dev profile ID
  lateDevProfileName   String?  // Profile naam
  accountIds           String[] // Array van gekoppelde account IDs
  // ... andere velden
}
```

### API Endpoints

#### Profile Management
- `GET /api/client/social-media/profile` - Haal profile info op
- `POST /api/client/social-media/profile` - Maak nieuw profile aan

#### Invite Management
- `POST /api/client/social-media/invites` - Genereer invite link

### Workflow Diagram
```
Client
  ↓
1. Maak Profile aan → Late.dev Profile API
  ↓
2. Genereer Invite Link → Late.dev Platform Invites API
  ↓
3. Client klikt link → Late.dev OAuth Flow
  ↓
4. Account gekoppeld → Opgeslagen in profile
  ↓
5. Publiceer content → Late.dev Posts API (met profile accounts)
```

## Voordelen

### Privacy & Security
- Klanten hoeven hun credentials niet te delen
- Elke klant gebruikt zijn eigen accounts
- WritgoAI heeft geen toegang tot account credentials

### Eenvoud
- Geen API keys nodig van klanten
- Eenvoudige OAuth flow via invite links
- Centraal beheerd door WritgoAI

### Flexibiliteit
- Meerdere accounts per platform mogelijk
- Makkelijk accounts toevoegen/verwijderen
- Per project configureerbaar

## Migratie van oude workflow

De oude workflow waarbij klanten hun eigen Late.dev API keys invoerden is vervangen. Bestaande configuraties blijven werken, maar nieuwe projecten gebruiken automatisch de nieuwe profile-based workflow.

## API Referentie

### Late.dev Profile API
```typescript
// Create profile
POST https://getlate.dev/api/v1/profiles
{
  "name": "Project Name",
  "description": "WritgoAI Project",
  "color": "#FF9933"
}

// Response
{
  "profile": {
    "_id": "profile_id_123",
    "name": "Project Name",
    ...
  }
}
```

### Late.dev Platform Invites API
```typescript
// Create invite
POST https://getlate.dev/api/v1/platform-invites
{
  "profileId": "profile_id_123",
  "platform": "instagram"
}

// Response
{
  "invite": {
    "_id": "invite_id_456",
    "inviteUrl": "https://getlate.dev/api/v1/platform-invites/token_xyz/connect",
    "platform": "instagram",
    "expiresAt": "2025-01-15T00:00:00.000Z",
    ...
  }
}
```

### Late.dev Posts API (Updated)
```typescript
// Publish post
POST https://getlate.dev/api/v1/posts
{
  "content": "Post content here",
  "platforms": [
    {
      "platform": "instagram",
      "accountId": "account_id_789"
    },
    {
      "platform": "facebook",
      "accountId": "account_id_012"
    }
  ],
  "mediaItems": [
    {
      "type": "image",
      "url": "https://cdn.example.com/image.jpg"
    }
  ],
  "scheduledFor": "2025-01-15T12:00:00",
  "timezone": "Europe/Amsterdam",
  "publishNow": false
}
```

## Troubleshooting

### "Geen Late.dev profile gevonden"
→ Maak eerst een profile aan via de "Late.dev Profile Aanmaken" knop

### "Invite link niet werkt"
→ Invite links verlopen na 7 dagen. Genereer een nieuwe link.

### "Account wordt niet weergegeven"
→ Klik op het refresh icoon (↻) om de lijst bij te werken

### "Publiceren mislukt"
→ Controleer of het account nog steeds gekoppeld is via de refresh knop

## Ondersteuning

Voor vragen of problemen:
- Email: support@WritgoAI.nl
- Check de Late.dev documentatie: https://docs.getlate.dev/

---

**Versie**: 1.0  
**Laatste update**: 8 november 2025  
**Auteur**: WritgoAI Development Team
