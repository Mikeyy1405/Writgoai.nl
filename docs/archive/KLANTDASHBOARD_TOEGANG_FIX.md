
# Klantdashboard Toegang - Volledige Fix & Implementatie

## 🎯 Probleem

De gebruiker kon geen klanten toegang geven tot een klantendashboard voor een project om te delen.

## ✅ Oplossing

De functionaliteit bestond al, maar had twee problemen:
1. **Client accounts zagen hun gedeelde projecten niet** - De API liet alleen projecten zien die ze bezaten, niet projecten waar ze collaborator van waren
2. **Onduideiljke gebruikerservaring** - Het was niet duidelijk hoe de functionaliteit te gebruiken en wat de login gegevens waren

## 🔧 Wat is er gefixed?

### 1. API Fix - Collaborator Projecten Zichtbaar
**Bestand:** `/app/api/client/projects/route.ts`

**Voor:**
```typescript
// Alleen projecten die de client bezit
const client = await prisma.client.findUnique({
  where: { email: session.user.email },
  include: { projects: {...} }
});
```

**Na:**
```typescript
// Projecten die de client bezit + projecten waar client collaborator van is
const ownedProjects = client.projects.map(...);
const collaboratorProjects = await prisma.projectCollaborator.findMany({
  where: {
    email: session.user.email,
    status: 'active',
    revokedAt: null,
  },
  include: { project: {...} }
});

// Combineer beide
const allProjects = [...ownedProjects, ...collaboratorProjects];
```

**Impact:**
- ✅ Clients zien nu ALLE projecten waar ze toegang toe hebben
- ✅ Duidelijk onderscheid tussen eigenaar en collaborator
- ✅ Role-based access control werkt correct

### 2. UI Verbetering - Duidelijke Badges
**Bestand:** `/app/client-portal/projects/page.tsx`

**Toegevoegd:**
```typescript
{project.isCollaborator && (
  <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
    {project.collaboratorRole === 'client' ? '👤 Gedeeld' : '👔 Medewerker'}
  </Badge>
)}
```

**Impact:**
- ✅ Klanten zien direct welke projecten gedeeld zijn
- ✅ Onderscheid tussen client en medewerker rol
- ✅ Visuele indicatie van toegangstype

### 3. Login URL Fix
**Bestand:** `/app/api/client/create-project-client/route.ts`

**Voor:**
```typescript
loginUrl: `${process.env.NEXTAUTH_URL}/client-login`
```

**Na:**
```typescript
loginUrl: `${process.env.NEXTAUTH_URL || 'https://WritgoAI.nl'}/inloggen`
```

**Impact:**
- ✅ Correcte login URL wordt getoond
- ✅ Werkt ook zonder environment variable
- ✅ Direct naar juiste login pagina

### 4. Verbeterde Success Messages
**Bestand:** `/components/project-collaborators.tsx`

**Toegevoegd:**
```typescript
// Toast notification met alle details
toast.success(
  <div>
    <div>✅ Client succesvol aangemaakt!</div>
    <div>📧 Email: {email}</div>
    <div>🔑 Wachtwoord: {password}</div>
    <div>🔗 Login URL: {loginUrl}</div>
  </div>,
  { duration: 15000 }
);

// Extra persistent alert
alert(`✅ Client aangemaakt!\n\n📧 Email: ${email}\n🔑 Wachtwoord: ${password}\n\n🔗 Login URL:\n${loginUrl}`);
```

**Impact:**
- ✅ Gebruiker krijgt alle informatie om te delen
- ✅ Informatie blijft 15 seconden zichtbaar
- ✅ Extra alert voor het bewaren van gegevens

## 📖 Hoe te gebruiken

### Voor Project Eigenaren (Jij):

1. **Ga naar je project**
   - Client Portal → Projecten
   - Klik op een project

2. **Scroll naar "Project Collaborators"**
   - Klik op "Uitnodigen"

3. **Kies "Direct Aanmaken"** (aanbevolen)
   - Vul in:
     - Email: `klant@voorbeeld.nl`
     - Naam: `Jan Jansen`
     - Wachtwoord: `MinimaalVeiligWachtwoord123`
     - Rol: **"Klant (Beperkte weergave)"**
   - Klik "Client Aanmaken"

4. **Delen met klant**
   ```
   📧 Email: klant@voorbeeld.nl
   🔑 Wachtwoord: MinimaalVeiligWachtwoord123
   🔗 Login: https://WritgoAI.nl/inloggen
   ```

### Voor Klanten:

1. **Inloggen**
   - Ga naar https://WritgoAI.nl/inloggen
   - Vul email en wachtwoord in
   - Klik "Inloggen"

2. **Projecten bekijken**
   - Word automatisch doorgestuurd naar dashboard
   - Klik op "Projecten"
   - Zie je gedeelde project met badge "👤 Gedeeld"

3. **Wat zie je?**
   - ✅ Contentplanning van het project
   - ✅ Gepubliceerde artikelen
   - ✅ Project statistieken
   - ❌ GEEN admin functies
   - ❌ GEEN API keys
   - ❌ GEEN WordPress credentials

## 🎨 Visuele Verbeteringen

### Projecten Lijst (voor klanten)
```
┌──────────────────────────────────────────┐
│  🌐 Website Naam                         │
│  https://voorbeeld.nl    [👤 Gedeeld]   │
│                                          │
│  [Project bekijken]  [Instellingen]     │
└──────────────────────────────────────────┘
```

### Success Message (bij aanmaken)
```
┌────────────────────────────────────────┐
│  ✅ Client succesvol aangemaakt!       │
│                                        │
│  📧 Email: klant@voorbeeld.nl         │
│  🔑 Wachtwoord: VeiligWachtwoord123   │
│  🔗 Login URL:                        │
│     https://WritgoAI.nl/inloggen      │
│                                        │
│  💡 Deel deze inloggegevens met je     │
│     client                             │
└────────────────────────────────────────┘
```

## 🔐 Toegangsniveaus

### 👤 Klant (Beperkte weergave)
**Kan zien:**
- ✅ Contentplanning
- ✅ Gepubliceerde content
- ✅ Project statistieken

**Kan NIET zien:**
- ❌ WordPress instellingen
- ❌ API credentials
- ❌ Andere projecten
- ❌ Admin functies
- ❌ Content generator tools

### 👔 Medewerker (Volledige toegang)
**Kan zien:**
- ✅ Alles wat een klant ziet
- ✅ Project instellingen
- ✅ WordPress configuratie
- ✅ Affiliate links
- ✅ Content generator tools

## 🧪 Testing Checklist

- [x] Client account aanmaken via "Direct Aanmaken"
- [x] Login URL is correct (https://WritgoAI.nl/inloggen)
- [x] Client ziet gedeelde project in "Projecten" lijst
- [x] Badge "👤 Gedeeld" wordt getoond
- [x] Client ziet alleen toegestane informatie
- [x] Client kan NIET naar instellingen
- [x] Success message toont alle credentials
- [x] Toegang intrekken werkt correct
- [x] Project-view link werkt (via token)

## 📱 API Endpoints

### GET `/api/client/projects`
**Response:**
```json
{
  "projects": [
    {
      "id": "...",
      "name": "Mijn Website",
      "isOwner": true,
      "isCollaborator": false
    },
    {
      "id": "...",
      "name": "Gedeeld Project",
      "isOwner": false,
      "isCollaborator": true,
      "collaboratorRole": "client"
    }
  ],
  "ownedCount": 1,
  "collaboratorCount": 1
}
```

### POST `/api/client/create-project-client`
**Request:**
```json
{
  "projectId": "...",
  "email": "klant@voorbeeld.nl",
  "name": "Jan Jansen",
  "password": "VeiligWachtwoord123",
  "role": "client"
}
```

**Response:**
```json
{
  "success": true,
  "credentials": {
    "email": "klant@voorbeeld.nl",
    "password": "VeiligWachtwoord123"
  },
  "loginUrl": "https://WritgoAI.nl/inloggen"
}
```

### GET `/api/project-view?token=xxx`
**Response:**
```json
{
  "project": {
    "name": "Project Naam",
    "websiteUrl": "https://voorbeeld.nl"
  },
  "collaborator": {
    "email": "klant@voorbeeld.nl",
    "role": "client"
  },
  "content": [...],
  "planning": [...]
}
```

## 🎓 Gebruikershandleiding

Zie: `KLANTDASHBOARD_TOEGANG_HANDLEIDING.md` voor volledige instructies

## 🚀 Deployment Status

- ✅ **Deployed**: 7 november 2024
- ✅ **Build**: Successful
- ✅ **Tests**: All passing
- ✅ **Live**: https://WritgoAI.nl

## 💡 Tips voor Agencies

1. **Gebruik unieke wachtwoorden** per klant
2. **Bewaar credentials veilig** (password manager)
3. **Communiceer duidelijk** met deze template:
   ```
   Beste [Naam],
   
   Je hebt nu toegang tot je WritgoAI project dashboard!
   
   📧 Email: [email]
   🔑 Wachtwoord: [wachtwoord]
   🔗 Login: https://WritgoAI.nl/inloggen
   
   Hier kun je je contentplanning en artikelen bekijken.
   ```

4. **Trek toegang in** van voormalige klanten
5. **Gebruik "Klant" rol** voor clients, "Medewerker" voor team

## 🛠️ Technische Details

### Database Schema
```prisma
model ProjectCollaborator {
  id              String    @id @default(cuid())
  projectId       String
  email           String
  name            String?
  role            String    @default("employee")  // employee, client
  status          String    @default("pending")  // pending, active, revoked
  accessToken     String    @unique
  notifyOnPublish Boolean   @default(true)
  invitedAt       DateTime  @default(now())
  lastAccessAt    DateTime?
  acceptedAt      DateTime?
  revokedAt       DateTime?
  
  project         Project   @relation(...)
  
  @@unique([projectId, email])
}
```

### Bestandswijzigingen
1. `/app/api/client/projects/route.ts` - Collaborator projecten toevoegen
2. `/app/client-portal/projects/page.tsx` - UI badges
3. `/app/api/client/create-project-client/route.ts` - Login URL fix
4. `/components/project-collaborators.tsx` - Verbeterde messages

### Security Features
- ✅ Token-based authentication voor project views
- ✅ Role-based access control
- ✅ Session validation
- ✅ Bcrypt password hashing
- ✅ Email verification
- ✅ Access revocation support

## 📞 Support

Vragen? Check:
- **Handleiding**: `KLANTDASHBOARD_TOEGANG_HANDLEIDING.md`
- **Troubleshooting**: Zie handleiding sectie "Troubleshooting"

---

**Laatst bijgewerkt:** 7 november 2024
**Versie:** 2.0.0
**Status:** ✅ Volledig werkend en getest

