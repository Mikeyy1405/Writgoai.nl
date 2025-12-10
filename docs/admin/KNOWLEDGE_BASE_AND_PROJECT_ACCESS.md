
# Knowledge Base & Project Access Management

## Overview
Deze update voegt twee belangrijke features toe aan WritgoAI:
1. **Knowledge Base** - Upload en beheer documenten (PDF, DOCX, XLSX) die de AI kan gebruiken voor content generatie
2. **Project Access Management** - Nodig medewerkers en klanten uit om samen te werken aan projecten

## 📚 Knowledge Base Feature

### Wat is het?
Een systeem waarmee je bedrijfsspecifieke documenten, richtlijnen, en informatie kunt uploaden die de AI automatisch gebruikt bij het genereren van content.

### Ondersteunde Bestandstypen
- **PDF** (.pdf) - Tot 10MB
- **Word** (.docx, .doc) - Tot 10MB
- **Excel** (.xlsx, .xls) - Tot 10MB

### Hoe te gebruiken

#### 1. Documenten Uploaden
1. Ga naar je project pagina (`/client-portal/projects/[id]`)
2. Scroll naar de **"Knowledge Base"** sectie
3. Klik op **"+ Nieuw Document"**
4. Upload je bestand
5. Vul de metadata in:
   - **Titel**: Beschrijvende naam voor het document
   - **Type**: document, guideline, reference, data, etc.
   - **Category**: Optionele categorie voor filtering
   - **Importance**: 
     - `critical` - Altijd gebruiken
     - `high` - Vaak gebruiken
     - `normal` - Gebruik waar relevant

#### 2. AI Gebruikt Automatisch Knowledge Base
Wanneer je een artikel genereert (via Autopilot of handmatig):
- De AI laadt automatisch de 5 meest relevante documenten
- Prioriteit wordt gegeven aan `critical` en `high` importance items
- De content wordt naadloos geïntegreerd in het gegenereerde artikel

#### 3. Documenten Beheren
- **Bekijken**: Klik op een document om de inhoud te zien
- **Verwijderen**: Klik op het prullenbak icoon om te verwijderen
- **Filteren**: Gebruik filters om specifieke documenten te vinden

### Technische Details

#### API Endpoints
- `GET /api/client/knowledge-base?projectId={id}` - Haal alle documenten op
- `POST /api/client/knowledge-base` - Upload nieuw document
- `DELETE /api/client/knowledge-base?id={id}` - Verwijder document

#### File Parsing
- PDF: Gebruikt `pdf-parse` voor tekst extractie
- DOCX: Gebruikt `mammoth` voor tekst extractie
- XLSX: Gebruikt `xlsx` voor spreadsheet parsing

#### Cloud Storage
- Bestanden worden opgeslagen in AWS S3
- Alleen metadata wordt in de database opgeslagen
- Veilige toegang via signed URLs

## 👥 Project Access Management

### Wat is het?
Een systeem om andere gebruikers toegang te geven tot je projecten met verschillende rollen en rechten.

### Rollen

#### Employee (Medewerker)
- Volledige toegang tot alle project data
- Kan content bekijken, bewerken en publiceren
- Kan projectinstellingen aanpassen
- Kan knowledge base beheren

#### Client (Klant)
- Beperkte toegang tot project data
- Kan alleen gepubliceerde content zien
- Ziet content planning overview
- Kan geen instellingen aanpassen

### Hoe te gebruiken

#### 1. Collaborator Uitnodigen
1. Ga naar je project pagina
2. Scroll naar de **"Collaborators"** sectie
3. Klik op **"+ Uitnodigen"**
4. Vul in:
   - **Naam**: Naam van de persoon
   - **Email**: Email adres
   - **Rol**: Employee of Client
5. Klik op **"Verstuur Uitnodiging"**

#### 2. Access Link Delen
Na het versturen van de uitnodiging:
- Een unieke access link wordt gegenereerd
- De gebruiker ontvangt een email met de link
- Of je kunt de link handmatig kopiëren en delen

#### 3. Toegang Beheren
- **Status bekijken**: Zie wie actief is, pending, of revoked
- **Toegang intrekken**: Klik op "Intrekken" om toegang te verwijderen
- **Laatste toegang**: Zie wanneer iemand laatst heeft ingelogd

### Client Dashboard

Wanneer een klant inlogt via hun access link, zien ze:

#### Content Plan Overview
- **Te Schrijven**: Lijst met geplande artikelen
- **Gepubliceerd**: Lijst met gepubliceerde artikelen
- **Verbeteren**: Artikelen die optimalisatie nodig hebben

#### Project Info
- Project naam en beschrijving
- Website URL
- Eigen rol en rechten

### Technische Details

#### API Endpoints
- `GET /api/client/project-members?projectId={id}` - Haal collaborators op
- `POST /api/client/project-members` - Nodig nieuwe collaborator uit
- `DELETE /api/client/project-members?id={id}` - Intrek toegang
- `GET /api/project-view?token={token}` - Haal project data op voor collaborator

#### Access Tokens
- Unieke token per collaborator
- Veilig opgeslagen in database
- Gebruikt voor authenticatie zonder wachtwoord
- Kan worden ingetrokken door project owner

#### Email Notificaties
- Automatische uitnodigingsmail met access link
- Bevat project naam en rol informatie
- Mooie HTML template met branding

## 🔄 AI Integration

### Autopilot
Bij het genereren van content via Autopilot:
```typescript
// Knowledge base wordt automatisch geladen
const knowledgeItems = await prisma.projectKnowledge.findMany({
  where: { projectId: project.id },
  orderBy: [
    { importance: 'desc' },
    { createdAt: 'desc' }
  ],
  take: 5
});

// En meegegeven aan de AI
const content = await generateBlog(title, keywords, tone, brandInfo, {
  knowledgeBase: knowledgeBaseContext,
  // ... andere opties
});
```

### Manual Generation
Bij handmatige content generatie:
```typescript
// Optioneel: geef projectId mee om knowledge base te gebruiken
const response = await fetch('/api/client/generate-article', {
  method: 'POST',
  body: JSON.stringify({
    topic: 'Mijn artikel',
    projectId: 'project_id_hier', // Optional
    // ... andere parameters
  })
});
```

## 📊 Database Schema

### ProjectKnowledge Model
```prisma
model ProjectKnowledge {
  id         String   @id @default(cuid())
  projectId  String
  title      String
  type       String   // document, guideline, reference, data
  content    String   // Parsed text content
  category   String?  // Optional category
  tags       String[] // Optional tags
  importance String   @default("normal") // critical, high, normal
  fileUrl    String?  // S3 URL
  fileType   String?  // mime type
  fileSize   Int?     // in bytes
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  project    Project  @relation(fields: [projectId], references: [id])
}
```

### ProjectCollaborator Model
```prisma
model ProjectCollaborator {
  id              String    @id @default(cuid())
  projectId       String
  email           String
  name            String?
  role            String    @default("employee") // employee, client
  status          String    @default("pending") // pending, active, revoked
  accessToken     String    @unique
  notifyOnPublish Boolean   @default(true)
  invitedAt       DateTime  @default(now())
  lastAccessAt    DateTime?
  acceptedAt      DateTime?
  revokedAt       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  project         Project   @relation(fields: [projectId], references: [id])
}
```

## 🚀 Usage Examples

### Voorbeeld 1: Product Richtlijnen Uploaden
```
1. Upload "Product_Richtlijnen_2024.pdf" naar knowledge base
2. Zet importance op "high"
3. Categoriseer als "Product Guidelines"
4. Bij het genereren van producten artikelen gebruikt de AI automatisch deze richtlijnen
```

### Voorbeeld 2: Klant Uitnodigen
```
1. Ga naar project "MijnWebsite.nl"
2. Klik op "+ Uitnodigen"
3. Vul in:
   - Naam: "Jan de Klant"
   - Email: "jan@example.com"
   - Rol: "Client"
4. Jan ontvangt email met access link
5. Jan kan nu inloggen en gepubliceerde content bekijken
```

### Voorbeeld 3: Medewerker Toegang
```
1. Nodig medewerker uit met rol "Employee"
2. Medewerker kan:
   - Alle content zien en bewerken
   - Projectinstellingen aanpassen
   - Knowledge base beheren
   - Nieuwe content genereren
```

## 🔒 Beveiliging

### Knowledge Base
- Bestanden worden veilig opgeslagen in AWS S3
- Alleen project owner kan uploaden/verwijderen
- Content wordt geparsed en opgeslagen als tekst (geen executables)
- 10MB file size limit om misbruik te voorkomen

### Project Access
- Unieke access tokens per collaborator
- Tokens kunnen worden ingetrokken
- Role-based access control (RBAC)
- Audit trail met laatste toegang tijden

## 📝 Best Practices

### Knowledge Base
1. **Gebruik duidelijke titels** - Maak het makkelijk om documenten terug te vinden
2. **Zet importance juist** - Critical/High voor essentiële info, Normal voor nice-to-have
3. **Categoriseer** - Gebruik consistente categorieën voor filtering
4. **Houd actueel** - Verwijder verouderde documenten
5. **Niet te veel** - Max 5 documenten worden gebruikt per generatie

### Project Access
1. **Juiste rol kiezen** - Employee voor medewerkers, Client voor klanten
2. **Emails controleren** - Zorg dat email adressen correct zijn
3. **Toegang intrekken** - Revoke toegang wanneer niet meer nodig
4. **Status monitoren** - Check regelmatig wie toegang heeft

## 🐛 Troubleshooting

### Knowledge Base
**Q: Upload faalt**
- Check bestandsgrootte (max 10MB)
- Controleer bestandstype (PDF, DOCX, XLSX)
- Probeer opnieuw met kleinere file

**Q: AI gebruikt knowledge base niet**
- Check of importance op 'normal' of hoger staat
- Verifieer dat content relevant is voor het onderwerp
- Kijk of er meer dan 5 documenten zijn (alleen top 5 worden gebruikt)

### Project Access
**Q: Uitnodiging niet ontvangen**
- Check spam folder
- Verifieer email adres
- Kopieer access link handmatig

**Q: Access denied**
- Check of status 'active' is (niet 'revoked')
- Verifieer dat token correct is
- Vraag nieuwe uitnodiging aan

## 📖 Voor Ontwikkelaars

### Files Gewijzigd/Toegevoegd
```
lib/file-parser.ts              - File parsing utilities
lib/aiml-agent.ts               - Updated with knowledge base support
components/project-knowledge-base.tsx    - Knowledge base UI
components/project-collaborators.tsx     - Collaborators UI
app/api/client/knowledge-base/route.ts   - Knowledge base API
app/api/client/project-members/route.ts  - Collaborators API
app/api/project-view/route.ts            - Client view API
app/api/client/autopilot/generate/route.ts - Updated with KB loading
app/api/client/generate-article/route.ts   - Updated with KB loading
app/project-view/[token]/page.tsx         - Client dashboard
```

### Dependencies Gebruikt
- `pdf-parse` - PDF text extraction
- `mammoth` - DOCX text extraction  
- `xlsx` - Excel spreadsheet parsing
- `@aws-sdk/client-s3` - S3 file storage
- `nodemailer` - Email invitations

---

## Conclusie
Met deze update kun je nu:
✅ Documenten uploaden die de AI automatisch gebruikt
✅ Medewerkers en klanten uitnodigen om samen te werken
✅ Role-based access control voor veiligheid
✅ Betere, meer accurate content generatie met bedrijfsspecifieke kennis
