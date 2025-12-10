
# Late.dev Integration Documentatie

## Overzicht

WritgoAI gebruikt nu Late.dev als centrale API voor social media publicatie. Deze integratie maakt het mogelijk voor elke gebruiker om hun eigen social media accounts te koppelen per project, met volledige isolatie tussen projecten.

## Belangrijke Wijzigingen

### ✅ Voordelen van Late.dev

- **Multi-platform support**: Instagram, TikTok, LinkedIn, Facebook, YouTube, Threads, Reddit, Pinterest, Bluesky, X (Twitter)
- **Centrale API key**: Één API key voor de hele applicatie
- **Per-project account linking**: Elke gebruiker koppelt hun eigen accounts
- **Volledige isolatie**: Gebruikers zien alleen hun eigen gekoppelde accounts
- **Veilige authenticatie**: OAuth-based account linking via invite links

### 🔄 Migratie van Gelaten → Late.dev

| Aspect | Gelaten (Oud) | Late.dev (Nieuw) |
|--------|---------------|------------------|
| API Key | Per-project | Centraal |
| Account Linking | Handmatige invoer | OAuth invite links |
| Platforms | 5 platforms | 10+ platforms |
| Isolatie | Limited | Volledig |

---

## Technische Implementatie

### 1. Environment Variables

```bash
# .env file
LATE_DEV_API_KEY=sk_edbcebf2a104032028575659160d9b77f95c509b442b2ffda6c1e2d955e21f03
```

### 2. API Client (`lib/late-dev-api.ts`)

Nieuwe functies:
- `getLateDevAccounts()` - Haal alle verbonden accounts op
- `createPlatformInvite()` - Maak invite link voor account koppeling
- `publishToLateDevPlatforms()` - Publiceer naar één of meerdere platforms
- `getLateDevPostStatus()` - Check post status
- `getLateDevPlatformRequirements()` - Platform-specific limits en requirements

### 3. Database Schema

Bestaande `SocialMediaConfig` model gebruikt:
- `accountIds: String[]` - Array van gekoppelde account IDs (per project)
- Geen `gelatenApiKey` meer nodig

### 4. Nieuwe API Routes

#### `/api/client/social-media/create-invite` (POST)
Maak een invite link voor account koppeling:

```typescript
POST /api/client/social-media/create-invite
{
  "projectId": "clx...",
  "platform": "instagram"
}

Response:
{
  "success": true,
  "inviteUrl": "https://getlate.dev/invite/...",
  "expiresAt": "2025-11-15T...",
  "platform": "instagram",
  "instructions": "Open deze link om je instagram account te koppelen. De link is 7 dagen geldig."
}
```

#### `/api/client/social-media/link-account` (POST)
Koppel een account aan een project:

```typescript
POST /api/client/social-media/link-account
{
  "projectId": "clx...",
  "accountId": "late_acc_..."
}

Response:
{
  "success": true,
  "message": "Account successfully linked to project"
}
```

#### `/api/client/social-media/link-account` (DELETE)
Ontkoppel een account van een project:

```typescript
DELETE /api/client/social-media/link-account?projectId=clx...&accountId=late_acc_...

Response:
{
  "success": true,
  "message": "Account successfully unlinked from project"
}
```

#### `/api/client/social-media/config` (GET/POST)
**Geüpdatet** om Late.dev accounts te gebruiken:

```typescript
GET /api/client/social-media/config?projectId=clx...

Response:
{
  "config": { ... },
  "connectedAccounts": [ ... ], // Alleen project-specifieke accounts
  "allAvailableAccounts": [ ... ], // Voor account linking UI
  "hasApiConnection": true
}
```

#### `/api/client/social-media/publish` (POST)
**Geüpdatet** om Late.dev te gebruiken voor publicatie:
- Gebruikt centrale API key
- Geen project-specific key meer nodig
- Ondersteunt meer platforms

---

## User Flow: Account Koppelen

### Stap 1: Gebruiker Gaat naar Project Settings
```
Client Portal → Projects → [Project Name] → Social Media Tab
```

### Stap 2: Klik op "Koppel [Platform] Account"
```javascript
// UI laat zien:
- LinkedIn: [ Koppelen ]
- Facebook: [ Koppelen ]
- Instagram: [ Koppelen ]
- TikTok: [ Koppelen ]
- etc.
```

### Stap 3: Invite Link Wordt Gegenereerd
```
POST /api/client/social-media/create-invite
→ Late.dev genereert OAuth invite link
→ Link is 7 dagen geldig
```

### Stap 4: Gebruiker Autoriseert Account via Late.dev
```
1. Gebruiker klikt op invite link
2. Late.dev opent OAuth flow
3. Gebruiker logt in op social platform
4. Platform geeft toestemming
5. Late.dev stuurt gebruiker terug naar WritgoAI
```

### Stap 5: Account Wordt Gekoppeld aan Project
```
POST /api/client/social-media/link-account
→ AccountId wordt toegevoegd aan project.accountIds
→ Account is nu beschikbaar voor dit project
```

### Stap 6: Gebruiker Kan Publiceren
```
UI laat nu gekoppelde accounts zien in dropdown:
- LinkedIn: [ John Doe - @johndoe ] ✓
- Facebook: [ John's Page ] ✓
- Instagram: [ @john_insta ] ✓
```

---

## Account Isolatie & Security

### Hoe Werkt de Isolatie?

1. **Centrale API Key**: Eén key voor alle users, maar...
2. **Per-Project Account IDs**: Elk project slaat alleen zijn eigen account IDs op
3. **API Filtering**: GET endpoints filteren alleen project-specific accounts
4. **Validatie bij Publishing**: Check of accountId in project.accountIds zit

### Voorbeeld Isolatie

**Project A** (Client 1):
```javascript
accountIds: ["late_acc_instagram_123", "late_acc_linkedin_456"]
```

**Project B** (Client 2):
```javascript
accountIds: ["late_acc_facebook_789", "late_acc_tiktok_101"]
```

**Result**:
- Client 1 ziet ALLEEN Instagram & LinkedIn accounts
- Client 2 ziet ALLEEN Facebook & TikTok accounts
- Volledige isolatie, geen cross-project access

---

## Platform-Specific Requirements

Late.dev heeft verschillende requirements per platform:

```typescript
const requirements = getLateDevPlatformRequirements('instagram');
// Returns:
{
  maxLength: 2200,
  supportsMedia: true,
  supportsVideo: true,
  supportsLinks: false, // Only in bio
  requiresHashtags: true
}
```

### Limits per Platform

| Platform | Max Length | Media | Video | Links | Hashtags |
|----------|-----------|-------|-------|-------|----------|
| Instagram | 2,200 | ✅ | ✅ | ❌ | ✅ |
| TikTok | 2,200 | ❌ | ✅ | ✅ | ✅ |
| LinkedIn | 3,000 | ✅ | ✅ | ✅ | ❌ |
| Facebook | 63,206 | ✅ | ✅ | ✅ | ❌ |
| YouTube | 5,000 | ❌ | ✅ | ✅ | ✅ |
| Threads | 500 | ✅ | ✅ | ✅ | ❌ |
| Reddit | 40,000 | ✅ | ✅ | ✅ | ❌ |
| Pinterest | 500 | ✅ | ✅ | ✅ | ❌ |
| Bluesky | 300 | ✅ | ❌ | ✅ | ❌ |
| X (Twitter) | 280 | ✅ | ✅ | ✅ | ✅ |

---

## UI Updates

### Project Social Media Config Component

**Nieuwe Features**:
1. **Account Linking Section**
   - Knoppen voor elk platform
   - "Koppelen" of "Gekoppeld ✓" status
   - Ontkoppel functionaliteit

2. **Invite Link Display**
   - Modal met invite URL
   - Copy-to-clipboard functie
   - Expiry countdown timer

3. **Connected Accounts Overview**
   - Lijst van gekoppelde accounts per platform
   - Account naam en username
   - Ontkoppel knop

4. **No More API Key Input**
   - Geen handmatige API key invoer meer
   - Centrale configuratie via .env

### Voorbeeld UI Flow

```
┌─────────────────────────────────────────────────────────┐
│ Social Media Accounts                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ✓ Gekoppelde Accounts                                  │
│                                                         │
│  📱 Instagram: @john_insta                             │
│      [Ontkoppel]                                       │
│                                                         │
│  💼 LinkedIn: John Doe                                 │
│      [Ontkoppel]                                       │
│                                                         │
│ ➕ Nieuwe Accounts Koppelen                            │
│                                                         │
│  [ Koppel Facebook ]                                   │
│  [ Koppel TikTok ]                                     │
│  [ Koppel YouTube ]                                    │
│  [ Koppel Twitter/X ]                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Testing & Troubleshooting

### Test de Integratie

1. **Test API Connection**:
```bash
curl -H "Authorization: Bearer sk_edbce..." \
     https://getlate.dev/api/v1/accounts
```

2. **Test Account Linking**:
   - Ga naar project settings
   - Klik "Koppel Instagram"
   - Volg OAuth flow
   - Controleer of account verschijnt in lijst

3. **Test Publishing**:
   - Maak een post in Content Library
   - Selecteer gekoppeld account
   - Publiceer
   - Check op social platform

### Veelvoorkomende Problemen

**Probleem**: "Account niet beschikbaar"
- **Oplossing**: Koppel account eerst via "Koppel [Platform]" knop

**Probleem**: "API key ongeldig"
- **Oplossing**: Check .env file voor correcte `LATE_DEV_API_KEY`

**Probleem**: "Invite link expired"
- **Oplossing**: Genereer nieuwe invite link (7 dagen geldig)

**Probleem**: "Account al gekoppeld aan ander project"
- **Oplossing**: Late.dev accounts kunnen aan meerdere projecten gekoppeld zijn

---

## Migration Guide (Gelaten → Late.dev)

### Voor Bestaande Projecten

1. **Update .env**:
```bash
# Verwijder oude keys (optioneel)
# GELATEN_API_KEY=...

# Voeg nieuwe key toe
LATE_DEV_API_KEY=sk_edbcebf2a104032028575659160d9b77f95c509b442b2ffda6c1e2d955e21f03
```

2. **Database Cleanup** (optioneel):
```sql
-- Verwijder oude Gelaten API keys uit database
UPDATE "SocialMediaConfig"
SET "gelatenApiKey" = NULL;
```

3. **Users Moeten Accounts Opnieuw Koppelen**:
   - Oude Gelaten accounts werken niet meer
   - Gebruikers moeten via Late.dev OAuth flow hun accounts koppelen
   - Eenmalige setup per project

---

## API Endpoints Reference

### Base URL
```
https://getlate.dev/api/v1
```

### Authentication
```
Authorization: Bearer sk_edbcebf2a104032028575659160d9b77f95c509b442b2ffda6c1e2d955e21f03
```

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/accounts` | GET | List all connected accounts |
| `/invite/tokens` | POST | Create platform invite |
| `/posts` | POST | Publish to platforms |
| `/posts/:id` | GET | Get post status |
| `/posts/:id` | DELETE | Delete scheduled post |

---

## Credits & Pricing

Onveranderd ten opzichte van Gelaten:

| Platform | Credits per Post |
|----------|------------------|
| LinkedIn | 5 |
| Facebook | 4 |
| Instagram | 4 |
| Twitter/X | 3 |
| YouTube | 5 |
| TikTok | 4 |
| Threads | 3 |
| Reddit | 3 |
| Pinterest | 3 |
| Bluesky | 3 |

---

## Deployment Checklist

- [x] `.env` bestand geüpdatet met `LATE_DEV_API_KEY`
- [x] `lib/late-dev-api.ts` toegevoegd
- [x] API routes geüpdatet:
  - [x] `/api/client/social-media/config`
  - [x] `/api/client/social-media/publish`
  - [x] `/api/client/social-media/create-invite` (nieuw)
  - [x] `/api/client/social-media/link-account` (nieuw)
- [ ] UI component geüpdatet: `components/project-social-media-config.tsx`
- [ ] Database migratie uitgevoerd (indien nodig)
- [ ] Gebruikers geïnformeerd over nieuwe account linking flow
- [ ] Documentatie geüpdatet
- [ ] Tests uitgevoerd

---

## Support & Documentation

- **Late.dev Docs**: https://getlate.dev/docs
- **Platform Support**: Instagram, TikTok, LinkedIn, Facebook, YouTube, Threads, Reddit, Pinterest, Bluesky, X
- **OAuth Flow**: Automatic via Late.dev
- **API Status**: https://status.late.dev

---

## Changelog

### v3.4.0 - November 8, 2025
- ✅ Migratie van Gelaten naar Late.dev
- ✅ Centrale API key implementatie
- ✅ Per-project account linking via OAuth
- ✅ Volledige account isolatie tussen projecten
- ✅ Ondersteuning voor 10+ platforms
- ✅ Nieuwe invite-based workflow
- ✅ Verbeterde security & privacy
