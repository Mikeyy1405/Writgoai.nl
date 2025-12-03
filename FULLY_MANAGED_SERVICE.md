
# Fully Managed Service - Implementatie

## Overzicht

De **Fully Managed Service** is een nieuwe functionaliteit waarbij klanten hun project kunnen overdragen aan Writgo voor volledig beheer tegen €199 per maand.

## Features

### Voor Klanten

1. **Project Overdracht**
   - Klanten kunnen via `/client-portal/projects` hun project(en) overdragen
   - Keuze per project: zelf beheren of fully managed
   - Transparant proces met duidelijke uitleg van wat ze krijgen

2. **Wat is Inbegrepen**
   - Content strategie & planning
   - Automatische content creatie
   - SEO optimalisatie
   - WordPress publicatie
   - Volledige transparantie & inzage
   - Maandelijks opzegbaar

3. **Kosten**
   - €199 per maand per project
   - Aparte Stripe subscription van reguliere abonnementen
   - Credits blijven apart (subscription + top-up credits)

### Voor Writgo (info@WritgoAI.nl)

1. **Admin Dashboard** 
   - Toegang via `/admin/managed-projects`
   - Overzicht van alle beheerde projecten
   - Klantinformatie per project
   - Directe links naar content en instellingen

2. **Project Beheer**
   - Alle beheerde projecten in één overzicht
   - Zoekfunctie op klant, project, website
   - Status tracking (actief/pending)
   - Omzet overzicht

3. **Content Toegang**
   - Volledige toegang tot alle content van beheerde projecten
   - Content genereren namens klanten
   - Publicatie beheer

## Database Schema

### Project Model Updates

```prisma
model Project {
  // ... bestaande velden
  
  // Fully Managed Service
  isFullyManaged        Boolean     @default(false)
  managedByEmail        String?     // info@WritgoAI.nl
  managedSince          DateTime?
  managedServiceActive  Boolean     @default(false)
}
```

### Client Model Updates

```prisma
model Client {
  // ... bestaande velden
  
  // Fully Managed Service subscription
  managedServiceSubscriptionId String?
  hasFullyManagedService       Boolean      @default(false)
  managedServiceStartDate      DateTime?
}
```

## API Routes

### POST /api/client/projects/transfer-management

**Request Body:**
```json
{
  "projectId": "string",
  "action": "request" | "activate" | "cancel"
}
```

**Actions:**
- `request`: Klant vraagt overdracht aan (redirect naar betaling)
- `activate`: Activeer na succesvolle betaling (webhook)
- `cancel`: Annuleer managed service

### GET /api/client/projects/transfer-management

- Voor klanten: eigen fully managed projecten
- Voor admins (info@WritgoAI.nl): alle beheerde projecten

## User Flow

### 1. Klant Vraagt Overdracht Aan

```
Client Portal → Projecten → "Schakel Fully Managed Service in"
↓
Bevestigingsscherm met prijs en voorwaarden
↓
Redirect naar betaalpagina (€199/maand)
↓
Na betaling: project wordt geactiveerd
```

### 2. Writgo Beheert Project

```
info@WritgoAI.nl account → Admin → Managed Projects
↓
Overzicht van alle beheerde projecten
↓
Klant selecteren → Content genereren/beheren
↓
Automatische publicatie naar WordPress
```

### 3. Klant Opzeggen

```
Client Portal → Projecten → "Service opzeggen"
↓
Bevestiging vragen
↓
Stripe subscription annuleren
↓
Project terug naar zelfbeheer
```

## Stripe Integratie

### Nieuw Product

- **Naam**: "Fully Managed by Writgo"
- **Prijs**: €199/maand
- **Type**: Recurring subscription
- **Interval**: Monthly

### Webhook Handling

Bij `checkout.session.completed`:
```javascript
if (product === 'fully_managed_service') {
  // Activeer managed service
  await activateManagedService(projectId);
}
```

Bij `subscription.deleted`:
```javascript
// Deactiveer managed service
await deactivateManagedService(projectId);
```

## Toegangscontrole

### Client Permissions (Fully Managed Projects)

- ✅ Read-only toegang tot content
- ✅ Inzage in statistics
- ✅ Content kalender bekijken
- ❌ Content genereren (beheerd door Writgo)
- ❌ WordPress instellingen wijzigen

### Admin Permissions (info@WritgoAI.nl)

- ✅ Volledige toegang tot alle managed projects
- ✅ Content genereren namens klant
- ✅ WordPress instellingen beheren
- ✅ Project settings aanpassen
- ✅ Content publiceren/depubliceren

## Security

1. **Authenticatie Check**
   - Alleen ingelogde users kunnen projecten overdragen
   - Admin verificatie voor managed projects dashboard

2. **Ownership Verificatie**
   - Client kan alleen eigen projecten overdragen
   - Admin kan alle managed projects zien

3. **Payment Verificatie**
   - Service pas actief na bevestigde betaling
   - Stripe webhooks voor automatische activering

## UI Components

### ProjectsPage (`/client-portal/projects`)
- Grid view van alle projecten
- Status badge (Zelf beheerd / Fully Managed)
- "Schakel in" button voor niet-beheerde projecten
- "Opzeggen" button voor beheerde projecten

### ManagedProjectsPage (`/admin/managed-projects`)
- Dashboard voor Writgo team
- Search & filter functionaliteit
- Klantinformatie kaarten
- Quick actions (content, instellingen, klant profiel)

## Testing Checklist

- [ ] Klant kan project overdragen
- [ ] Betaling proces werkt
- [ ] Project wordt geactiveerd na betaling
- [ ] Admin kan alle managed projects zien
- [ ] Admin heeft volledige toegang tot content
- [ ] Klant heeft read-only toegang
- [ ] Opzeggen werkt correct
- [ ] Stripe subscription sync werkt
- [ ] Email notificaties worden verstuurd

## Volgende Stappen

1. ✅ Database schema updates
2. ✅ API routes implementeren
3. ✅ Client UI (projects page)
4. ✅ Admin UI (managed projects dashboard)
5. ⏳ Stripe product aanmaken
6. ⏳ Webhook handlers toevoegen
7. ⏳ Payment flow implementeren
8. ⏳ Email notificaties
9. ⏳ Testing & deployment

---

**Implementatie Datum**: 3 november 2025
**Status**: In Progress
**Contact**: info@WritgoAI.nl
