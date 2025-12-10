
# Centrale Gelaten API Key - Project-Specifieke Account Selectie

## Overzicht

Het Social Media Autopilot systeem gebruikt nu een **gecentraliseerde Gelaten API key** die door WritgoAI wordt beheerd. Echter, **elke klant kan alleen de social media accounts gebruiken die zij expliciet aan hun project hebben gekoppeld**.

## Hoe het werkt

### 1. Centrale API Key Configuratie

- De `GELATEN_API_KEY` wordt centraal in de environment variables opgeslagen
- Deze key heeft toegang tot alle social media accounts die in Gelaten.dev zijn gekoppeld
- Klanten hoeven geen eigen Gelaten API key te hebben

### 2. Project-Specifieke Account Selectie

**Belangrijke wijziging:** Klanten kunnen nu kiezen welke accounts ze willen gebruiken:

```typescript
// In SocialMediaConfig model
model SocialMediaConfig {
  id                String   @id @default(cuid())
  projectId         String   @unique
  
  // Project-specifieke account selectie
  linkedinAccountId String?   // Alleen als klant LinkedIn selecteert
  facebookAccountId String?   // Alleen als klant Facebook selecteert
  instagramAccountId String?  // Alleen als klant Instagram selecteert
  twitterAccountId  String?   // Alleen als klant Twitter selecteert
  youtubeAccountId  String?   // Alleen als klant YouTube selecteert
  
  // ... andere velden
}
```

### 3. Account Selectie Flow

1. **Accounts ophalen**: Via "Test verbinding" knop worden alle beschikbare accounts opgehaald
2. **Selecteren**: Klant klikt op accounts om ze te selecteren/deselecteren
3. **Opslaan**: Alleen geselecteerde account IDs worden opgeslagen in de database
4. **Publiceren**: Bij publicatie worden alleen de geselecteerde accounts gebruikt

### 4. UI Componenten

#### Account Selectie Interface

De `ProjectSocialMediaConfig` component toont:
- Alle beschikbare accounts van de centrale API key
- Visuele indicatie welke accounts zijn geselecteerd voor dit project
- Clickable cards om accounts te selecteren/deselecteren
- Waarschuwing als geen accounts zijn geselecteerd

```tsx
// Voorbeeld state
const [selectedAccounts, setSelectedAccounts] = useState<{
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
}>({});

// Account selectie handler
onClick={() => {
  setSelectedAccounts(prev => ({
    ...prev,
    [platformKey]: isSelected ? undefined : account.id,
  }));
}}
```

## API Endpoints

### GET /api/client/social-media/config

**Respons:**
```json
{
  "config": {
    "projectId": "...",
    "linkedinAccountId": "account_123",  // Alleen als geselecteerd
    "facebookAccountId": null,           // Niet geselecteerd
    "instagramAccountId": "account_456", // Alleen als geselecteerd
    // ... andere instellingen
  },
  "connectedAccounts": [
    {
      "id": "account_123",
      "platform": "linkedin",
      "username": "writgoai",
      "displayName": "WritgoAI",
      "isConnected": true
    },
    // ... alle beschikbare accounts
  ],
  "hasApiKey": true
}
```

### POST /api/client/social-media/config

**Request body:**
```json
{
  "projectId": "...",
  "linkedinAccountId": "account_123",  // Expliciet geselecteerd
  "facebookAccountId": null,           // Expliciet niet geselecteerd
  "instagramAccountId": "account_456", // Expliciet geselecteerd
  "twitterAccountId": null,
  "youtubeAccountId": null,
  // ... andere instellingen
}
```

**Validatie:**
- Controleert of geselecteerde account IDs bestaan in de centrale API
- Retourneert fout als een account niet beschikbaar is
- Slaat alleen geselecteerde accounts op in de database

## Publicatie Flow

### Bij het publiceren van een post:

1. **Ophalen project config**: 
   ```typescript
   const config = await prisma.socialMediaConfig.findUnique({
     where: { projectId }
   });
   ```

2. **Check geselecteerde accounts**:
   ```typescript
   const platforms = post.platforms; // ['linkedin', 'instagram']
   
   for (const platform of platforms) {
     let accountId: string | null = null;
     
     switch (platform) {
       case 'linkedin':
         accountId = config.linkedinAccountId; // Project-specifiek!
         break;
       case 'instagram':
         accountId = config.instagramAccountId;
         break;
       // ...
     }
     
     if (!accountId) {
       // Account niet geselecteerd voor dit project
       platformStatuses[platform] = 'failed';
       platformErrors[platform] = 'Account niet gekoppeld aan dit project';
       continue;
     }
     
     // Publiceer alleen als account is geselecteerd
     await publishGelatenPost(centralApiKey, {
       accountId,  // Project-specifiek account ID
       content: post.content,
       // ...
     });
   }
   ```

## Beveiliging & Privacy

### Data Isolatie

✅ **Elke klant ziet alleen zijn eigen geselecteerde accounts**
- Project A selecteert LinkedIn account "account_123"
- Project B kan account "account_123" NIET zien of gebruiken (tenzij ook geselecteerd)
- Geen cross-project data leakage

### Account Bescherming

✅ **Validatie bij opslaan**
- Server controleert of geselecteerde accounts bestaan
- Voorkomt dat klanten niet-bestaande account IDs opslaan
- Voorkomt injectie van malafide account IDs

### Audit Trail

- Alle publicaties worden gelogd met `projectId` en `accountId`
- Per project te traceren welke accounts zijn gebruikt
- Historische data behouden bij account wijzigingen

## Best Practices

### Voor Klanten

1. **Test verbinding eerst**: Klik op "Test verbinding" om beschikbare accounts te zien
2. **Selecteer bewust**: Kies alleen accounts die je echt wilt gebruiken voor dit project
3. **Controleer selectie**: Geselecteerde accounts hebben een blauwe achtergrond en checkmark
4. **Sla op**: Vergeet niet om wijzigingen op te slaan

### Voor Admins

1. **Centrale key beheren**: Zorg dat `GELATEN_API_KEY` actueel is in environment variables
2. **Monitor gebruik**: Check welke projecten welke accounts gebruiken
3. **Account toegang**: Als een account wordt verwijderd uit Gelaten, fail gracefully

## Troubleshooting

### "Geen accounts geselecteerd" waarschuwing

**Oorzaak**: Klant heeft nog geen accounts gekozen
**Oplossing**: 
1. Klik "Test verbinding"
2. Selecteer gewenste accounts (klik op cards)
3. Klik "Opslaan"

### "Account niet beschikbaar" error bij opslaan

**Oorzaak**: Geselecteerd account bestaat niet meer in Gelaten
**Oplossing**:
1. Klik "Test verbinding" om lijst te verversen
2. Selecteer opnieuw de juiste accounts
3. Probeer opnieuw op te slaan

### Publicatie faalt: "Account not connected"

**Oorzaak**: Account is niet geselecteerd voor dit project
**Oplossing**:
1. Ga naar project instellingen → Social Media Autopilot
2. Selecteer het ontbrekende platform account
3. Sla op en probeer opnieuw te publiceren

## Migratie van Oude Systeem

### Oude systeem (❌ verwijderd):
```typescript
// Elke klant had eigen API key
gelatenApiKey: String?  // Per project
```

### Nieuwe systeem (✅ huidige):
```typescript
// Centrale API key in environment
process.env.GELATEN_API_KEY

// Project-specifieke account selectie
linkedinAccountId: String?
facebookAccountId: String?
instagramAccountId: String?
twitterAccountId: String?
youtubeAccountId: String?
```

### Impact:
- **Klanten**: Geen eigen API key meer nodig, maar moeten accounts selecteren
- **Beveiliging**: Betere control over welke accounts worden gebruikt
- **Privacy**: Elke klant ziet alleen zijn eigen geselecteerde accounts
- **Onderhoud**: Eenvoudiger key management (één centrale key)

## Changelog

### v2.0.0 (2025-11-08)
- ✅ Toegevoegd: Project-specifieke account selectie
- ✅ Aangepast: UI toont nu clickable account cards
- ✅ Toegevoegd: Validatie van geselecteerde accounts bij opslaan
- ✅ Verwijderd: Per-project API key invoer
- ✅ Verbeterd: Data isolatie tussen projecten

---

**Documentatie versie:** 2.0.0  
**Laatst bijgewerkt:** 8 november 2025  
**Contact:** support@WritgoAI.nl
