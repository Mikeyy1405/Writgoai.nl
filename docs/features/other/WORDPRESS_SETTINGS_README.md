# WordPress Koppeling Update

## 📋 Overzicht

Er is nu een complete WordPress instellingenpagina toegevoegd aan WritgoAI, zodat gebruikers precies weten naar welke WordPress site hun content wordt gepubliceerd.

## ✨ Wat is er toegevoegd?

### 1. WordPress Instellingen Pagina (Account → WordPress Koppeling)

**Locatie**: `/client-portal/account` (scroll naar beneden)

**Functionaliteit**:
- **WordPress URL instellen**: Vul het volledige adres van je WordPress site in (bijv. `https://jouwsite.nl`)
- **Gebruikersnaam instellen**: Je WordPress gebruikersnaam
- **Application Password instellen**: Het gegenereerde Application Password vanuit WordPress
- **Test & Opslaan knop**: Test de verbinding én sla de instellingen op in één keer
- **Opslaan zonder testen**: Sla credentials op zonder verbinding te testen
- **Verwijder koppeling**: Verwijder de WordPress koppeling volledig

**Visuele feedback**:
- ✅ Groen succesbericht wanneer WordPress gekoppeld is
- Toont de gekoppelde WordPress URL prominent
- Toont de gebruikersnaam
- Blauwe instructiebox met stap-voor-stap uitleg hoe je een Application Password aanmaakt
- Link naar officiële WordPress documentatie

### 2. WordPress Publisher Dialog Update

**Nieuw**:
- Toont nu **duidelijk** naar welke WordPress site er gepubliceerd wordt
- Blauw informatieblok met `"Publiceren naar: https://jouwsite.nl"`
- Als geen WordPress site geconfigureerd is, verschijnt er een geel waarschuwingsbericht met instructie om naar Account → WordPress Koppeling te gaan

### 3. API Routes

**Nieuwe endpoints**:

```typescript
// GET - Haal WordPress instellingen op
GET /api/client/wordpress/settings

Response:
{
  wordpressUrl: string;
  wordpressUsername: string;
  hasPassword: boolean; // Security: nooit het echte wachtwoord sturen
}

// POST - Update WordPress instellingen (met optionele test)
POST /api/client/wordpress/settings
Body: {
  wordpressUrl: string;
  wordpressUsername: string;
  wordpressPassword?: string;
  testConnection?: boolean; // Indien true, test eerst de verbinding
}

Response bij testConnection=true:
{
  success: true;
  message: "WordPress verbinding succesvol getest en opgeslagen! ✓";
  wordpressUrl: string;
}

// DELETE - Verwijder WordPress koppeling
DELETE /api/client/wordpress/settings

Response:
{
  success: true;
  message: "WordPress koppeling verwijderd";
}
```

## 🔒 Security

- **Application Password nooit zichtbaar**: Het wachtwoord wordt alleen teruggestuurd als `hasPassword: boolean`
- **Validatie**: URL wordt gevalideerd voordat het wordt opgeslagen
- **Connection Test**: Optionele verbindingstest voordat credentials worden opgeslagen
- **Error handling**: Duidelijke foutmeldingen bij ongeldige credentials

## 📖 Hoe te gebruiken

### Voor gebruikers:

1. **WordPress instellingen configureren**:
   - Ga naar **Client Portal → Account** (of klik op je profiel)
   - Scroll naar de sectie **"WordPress Koppeling"**
   - Vul in:
     - WordPress URL (bijv. `https://jouwsite.nl`)
     - Gebruikersnaam (bijv. `admin`)
     - Application Password (zie instructies op de pagina)
   - Klik op **"Test & Opslaan"** om de verbinding te testen
   
2. **Application Password aanmaken** (eerste keer):
   - Log in op je WordPress admin (`jouwsite.nl/wp-admin`)
   - Ga naar **Gebruikers → Profiel**
   - Scroll naar **"Application Passwords"**
   - Geef een naam (bijv. "WritgoAI")
   - Klik op **"Add New Application Password"**
   - Kopieer het gegenereerde wachtwoord (zonder spaties)
   - Plak in WritgoAI en test de verbinding

3. **Publiceren naar WordPress**:
   - Genereer een blog in de Blogschrijver of Content Library
   - Klik op **"Naar WordPress"** of **WordPress icoon**
   - De dialog toont nu **duidelijk** naar welke site er gepubliceerd wordt
   - Vul eventuele extra details in (categorie, tags, SEO, etc.)
   - Klik op **"Publiceren"**

## 🎨 UI/UX Verbeteringen

- **Duidelijke status indicatoren**:
  - ✅ Groen: WordPress gekoppeld
  - ⚠️ Geel: Niet geconfigureerd
  - 🔵 Blauw: Informatieve berichten
  
- **Inline hulp**:
  - Stap-voor-stap instructies voor Application Password
  - Link naar WordPress documentatie
  - Tooltips en hints bij elk veld

- **Responsive design**:
  - Werkt perfect op desktop, tablet en mobiel
  - WritgoAI kleurenschema (zwart, oranje, wit)

## 🔄 Data Flow

```
User → Account pagina → WordPress settings form
                              ↓
                    Test verbinding (optioneel)
                              ↓
                    Opslaan in database (Client model)
                              ↓
                    Bevestiging aan gebruiker

Later...

User → Blogschrijver/Content Library → "Naar WordPress" knop
                                              ↓
                              WordPress Publisher Dialog opent
                                              ↓
                              Laadt WordPress URL uit database
                                              ↓
                              Toont: "Publiceren naar: [URL]"
                                              ↓
                              User vult details in
                                              ↓
                              Publiceert naar geconfigureerde site
```

## 📝 Database Schema

Bestaande velden in `Client` model:
```prisma
model Client {
  // ... andere velden
  
  wordpressUrl          String?     // WordPress site URL
  wordpressUsername     String?     // WordPress gebruikersnaam
  wordpressPassword     String?     // Application Password (encrypted in DB)
  
  // ... andere velden
}
```

## 🚀 Deployment

De update is succesvol gedeployed naar **WritgoAI.nl**

## ✅ Checklist

- [x] WordPress instellingen sectie in Account pagina
- [x] Formulier met URL, username, password
- [x] Test verbinding functionaliteit
- [x] Opslaan functionaliteit
- [x] Verwijder functionaliteit
- [x] API routes voor GET/POST/DELETE
- [x] WordPress Publisher Dialog update met URL display
- [x] Visuele feedback en status indicatoren
- [x] Instructies voor Application Password
- [x] Error handling en validatie
- [x] Security (wachtwoord nooit in response)
- [x] Mobile responsive design
- [x] WritgoAI styling en kleurenschema
- [x] Documentatie
- [x] Testing en deployment

## 🎯 Resultaat

Gebruikers weten nu **exact** naar welke WordPress site hun content wordt gepubliceerd, en kunnen deze eenvoudig configureren, testen en beheren vanuit de Account pagina.

---

**Versie**: 1.0  
**Datum**: 1 november 2025  
**Status**: ✅ Live op WritgoAI.nl
