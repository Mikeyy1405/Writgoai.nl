# 📚 WritgoAI Gebruikershandleiding

**Versie:** 2.0  
**Laatst bijgewerkt:** December 2024

---

## 📖 Inhoudsopgave

1. [🚀 Quick Start Guide](#-quick-start-guide)
2. [🔐 Inloggen & Account](#-inloggen--account)
3. [📊 Dashboard Overzicht](#-dashboard-overzicht)
4. [🎯 Projecten Beheren](#-projecten-beheren)
5. [🗺️ Topical Authority Map](#️-topical-authority-map)
6. [📝 Content Genereren](#-content-genereren)
7. [✍️ Content Bewerken](#️-content-bewerken)
8. [🌐 WordPress Publicatie](#-wordpress-publicatie)
9. [📱 Social Media Posts](#-social-media-posts)
10. [🤖 Autopilot Instellen](#-autopilot-instellen)
11. [🛠️ Troubleshooting](#️-troubleshooting)
12. [❓ Veelgestelde Vragen](#-veelgestelde-vragen)

---

## 🚀 Quick Start Guide

**Begin binnen 5 minuten met content maken!**

### De 5 Belangrijkste Stappen:

#### **1️⃣ Login & Navigatie**
- Ga naar je WritgoAI app URL
- Log in met je credentials
- Je komt op het dashboard

#### **2️⃣ Maak een Project Aan**
- Klik op "Projecten" in het menu
- Klik op "+ Nieuw Project"
- Vul in:
  - **Naam**: Bijv. "Yoga Blog"
  - **Website URL**: Bijv. "https://yogablog.nl"
  - **Niche**: Bijv. "Yoga & Wellness"
  - **Doelgroep**: Bijv. "Vrouwen 25-45 jaar"
- Sla op

#### **3️⃣ Genereer een Topical Authority Map**
- Ga naar "Content" → "Topical Mapping"
- Klik op "+ Nieuwe Topical Map Genereren"
- Kies aantal topics (aanbevolen: 200-500)
- Klik op "Genereer Map"
- ⏱️ Wacht 4-6 minuten terwijl AI de map genereert

#### **4️⃣ Genereer Content**
- Open je Topical Map
- Klik op een topic die je interesseert
- Klik op "Schrijf Nu"
- Configureer opties:
  - ✅ Interne Links
  - ✅ Afbeeldingen (3x)
  - ✅ FAQ Sectie
- Klik op "Start Automatisch Schrijven"
- ⏱️ Wacht 3-5 minuten

#### **5️⃣ Publiceer naar WordPress**
- Content wordt automatisch opgeslagen
- Klik op "Publiceer naar WordPress"
- Of schakel **Autopilot** in voor automatische publicatie!

---

## 🔐 Inloggen & Account

### Eerste Keer Inloggen

1. **Navigeer naar je app URL**
   ```
   https://jouw-domein.vercel.app/client-login
   ```

2. **Vul je credentials in**
   - Email adres
   - Wachtwoord
   - Klik op "Inloggen"

3. **Eerste keer setup**
   - Als je voor het eerst inlogt, doorloop je de onboarding
   - Vul je bedrijfsgegevens in
   - Kies je voorkeursplan

### Account Instellingen

📍 **Locatie:** `/client/account` of `/admin/account`

**Wat kun je hier doen:**
- ✏️ Profiel bewerken
- 🔑 Wachtwoord wijzigen
- 👤 Avatar uploaden
- 📧 Email voorkeuren
- 🔔 Notificatie instellingen

---

## 📊 Dashboard Overzicht

### Admin Dashboard
📍 **Locatie:** `/admin/dashboard`

**Wat zie je hier:**

#### 🎯 KPI's (Key Performance Indicators)
- **Totaal Projecten**: Aantal actieve projecten
- **Content Gegenereerd Deze Maand**: Aantal artikelen
- **Publicaties**: WordPress + Social Media
- **Autopilot Status**: Actief/Inactief

#### 📈 Grafieken
- Content productie per week
- Publicatie trend
- Traffic statistieken (als gekoppeld met Analytics)

#### ⚡ Quick Actions
- 🚀 Nieuwe content genereren
- 📝 Concepten bekijken
- 📊 Rapporten inzien

### Client Dashboard
📍 **Locatie:** `/client/overzicht`

**Wat zie je hier:**
- Recent gegenereerde content
- Geplande publicaties
- Beschikbare credits
- Project overzicht

---

## 🎯 Projecten Beheren

### Een Nieuw Project Aanmaken

📍 **Locatie:** `/admin/projects/new`

**Stap-voor-stap:**

1. **Klik op "Projecten" in het hoofdmenu**

2. **Klik op "+ Nieuw Project"**

3. **Vul de Project Details in:**

   ```
   📝 Basis Informatie
   ├─ Projectnaam: "Yoga Blog Nederland"
   ├─ Website URL: "https://yogablog.nl"
   ├─ Niche: "Yoga & Mindfulness"
   └─ Doelgroep: "Vrouwen 25-45 jaar, beginnende yogabeoefenaars"
   ```

4. **WordPress Connectie (optioneel maar aanbevolen):**
   
   ```
   🌐 WordPress Instellingen
   ├─ WordPress URL: "https://yogablog.nl"
   ├─ Username: "admin"
   ├─ Application Password: "xxxx xxxx xxxx xxxx"
   └─ Test Connectie ← Klik hier om te testen
   ```

   **💡 Hoe krijg je een Application Password:**
   - Log in op je WordPress admin
   - Ga naar: Gebruikers → Profiel → Application Passwords
   - Vul een naam in: "WritgoAI"
   - Klik "Add New Application Password"
   - Kopieer het wachtwoord (bewaar het goed!)

5. **Social Media Connectie (optioneel):**
   
   ```
   📱 GetLate.dev Instellingen
   ├─ API Key: "jouw-getlate-api-key"
   ├─ Profile ID: "jouw-profile-id"
   └─ Test Connectie
   ```

   **💡 GetLate.dev API Key verkrijgen:**
   - Ga naar https://getlate.dev
   - Maak een account aan
   - Ga naar Settings → API
   - Genereer een nieuwe API key

6. **Klik op "Project Aanmaken"**

### Project Bewerken

📍 **Locatie:** `/admin/projects/[id]`

**Wat kun je aanpassen:**
- 📝 Project naam en beschrijving
- 🌐 WordPress credentials
- 📱 Social media koppelingen
- 🎨 Content instellingen (tone of voice, taal)
- 🤖 Autopilot instellingen

### Project Status

**Indicatoren:**
- ✅ **WordPress Verbonden**: Groene checkmark
- ❌ **WordPress Niet Verbonden**: Grijze cross
- ✅ **Socials Verbonden**: Groene checkmark
- ❌ **Socials Niet Verbonden**: Grijze cross

---

## 🗺️ Topical Authority Map

### Wat is een Topical Authority Map?

Een Topical Authority Map is een **strategische content structuur** die je helpt om:
- 📊 **Volledige niche dekking** te bereiken
- 🎯 **Topical authority** op te bouwen in zoekmachines
- 📈 **Organisch verkeer** significant te verhogen
- 🗺️ **Content planning** te automatiseren

**Resultaten:** +4.184% organische groei (bewezen case study)

### Een Topical Map Genereren

📍 **Locatie:** `/client-portal/topical-mapping` of `/admin/content`

**Stap-voor-stap:**

#### **Stap 1: Ga naar Topical Mapping**
- Klik op "Content" in het menu
- Selecteer "Topical Mapping"

#### **Stap 2: Selecteer een Project**
- Klik op de project dropdown
- Kies het project waarvoor je de map wilt maken

#### **Stap 3: Klik op "+ Nieuwe Topical Map Genereren"**

#### **Stap 4: Kies het Aantal Topics**

```
🚀 Aanbevolen Aantallen:
├─ 200 topics  → Snelle generatie (2-4 min) ⚡ Ideaal voor kleine niches
├─ 300 topics  → Aanbevolen (4-6 min) ⭐ Beste balans
├─ 500 topics  → Uitgebreid (6-8 min) 📊 Voor grote niches
└─ 1000 topics → Maximum (8-12 min) 🎯 Voor complete niche dominantie
```

**💡 Tip:** Begin met 300 topics. Je kunt later altijd een nieuwe map genereren met meer topics.

#### **Stap 5: Klik op "Genereer [aantal] Topics"**

**Wat gebeurt er nu:**
1. ⚙️ AI analyseert je website URL
2. 🔍 Onderzoekt de niche en concurrentie
3. 🧠 Genereert categorieën en subcategorieën
4. ✍️ Creëert 200-1000 unieke artikel ideeën
5. 📊 Balanceert commercial vs informational content (40/60)
6. 🎯 Prioriteert topics op basis van impact

**⏱️ Verwachte tijd:**
- 200 topics: 2-4 minuten
- 300 topics: 4-6 minuten
- 500 topics: 6-8 minuten
- 1000 topics: 8-12 minuten

#### **Stap 6: Bekijk je Topical Map**

**De map wordt automatisch geopend en toont:**

```
📊 Overview Dashboard
├─ 📈 Authority Score (0-100)
├─ 📝 Totaal Topics
├─ ✅ Voltooide Topics
├─ 📦 Aantal Categorieën
└─ 📊 Voortgangspercentage
```

### De Topical Map Gebruiken

#### **Categorieën & Topics Bekijken**

**Je ziet:**
- 📁 **Categorieën**: Bijv. "Yoga voor Beginners", "Yoga Poses", "Yoga Stijlen"
- 🎯 **Prioriteit**: Hoog (🔥), Gemiddeld (⭐), Laag (✓)
- 💰 **Commercial Ratio**: Percentage commercial vs informational
- 📊 **Topic Count**: Aantal artikelen in categorie

**Klik op een categorie om uit te klappen:**
- 📝 Alle topics in die categorie
- 🔍 Topic details (keywords, search volume, difficulty)
- ✅ Status (voltooid of niet)
- 🚀 "Schrijf Nu" knop

#### **Filteren & Zoeken**

**Beschikbare filters:**

```
🔍 Zoeken
├─ Zoek op topic titel
├─ Zoek op keywords
└─ Real-time resultaten

📁 Categorieën Filter
├─ Alle categorieën
└─ Specifieke categorie

💡 Type Filter
├─ Alle types
├─ Commercial (💰)
└─ Informational (💡)
```

**💡 Tip:** Gebruik filters om snel high-priority commercial topics te vinden!

#### **Content Genereren vanuit Topical Map**

**Methode 1: Handmatig per Topic**

1. **Vind een interessant topic**
2. **Klik op "Schrijf Nu"**
3. **Configureer opties:**
   ```
   ✅ Interne Links → Automatisch
   ✅ Afbeeldingen → 3 stuks
   ✅ FAQ Sectie → Ja
   ✅ Tabellen → Optioneel
   ✅ BOL Links → Optioneel (voor commercial content)
   ```
4. **Klik "Start Automatisch Schrijven"**
5. **Wacht 3-5 minuten**
6. **Content wordt automatisch opgeslagen en gepubliceerd!**

**Methode 2: Bulk met Autopilot (zie sectie Autopilot)**

### Google Search Console Integratie

**Detecteer duplicate content voordat je schrijft!**

#### **Stap 1: Koppel Google Search Console**

📍 **Locatie:** Project Settings → Google Search Console

1. Ga naar `/client-portal/projects/[id]`
2. Scroll naar "Google Search Console"
3. Klik "Verbind met Google Search Console"
4. Autoriseer de app
5. Selecteer je website property

#### **Stap 2: Check voor Duplicates**

In de Topical Map:
1. Klik op "Check Duplicates" knop (🔍)
2. Wacht terwijl het systeem checkt
3. **Resultaten:**
   - ✅ **Groen**: Geen duplicates gevonden
   - ⚠️ **Geel**: Vergelijkbare content gevonden (pas topic aan)
   - 🔴 **Rood**: Duplicate gevonden (skip dit topic!)

**💡 Voordelen:**
- Voorkom duplicate content
- Verbeter SEO
- Maximaliseer impact van nieuwe content

---

## 📝 Content Genereren

### Methode 1: Vanuit Topical Map (Aanbevolen)

📍 **Locatie:** `/client-portal/topical-mapping`

**Zie sectie [Topical Authority Map](#️-topical-authority-map)** hierboven voor gedetailleerde instructies.

### Methode 2: Handmatige Content Generator

📍 **Locatie:** `/client-portal/content-generator`

**Stap-voor-stap:**

#### **Stap 1: Navigeer naar Content Generator**
- Klik op "Content" in menu
- Selecteer "Content Generator"

#### **Stap 2: Vul Basis Informatie in**

```
📝 Content Details
├─ Titel: "10 Beste Yoga Poses voor Beginners"
├─ Project: Selecteer je project
├─ Taal: Nederlands / Engels / Duits / etc.
├─ Aantal Woorden: 1500 (standaard)
├─ Tone of Voice: Professioneel / Casual / Vriendelijk
└─ Keywords: "yoga poses, yoga beginners, yoga oefeningen"
```

#### **Stap 3: Configureer Content Elementen**

```
✅ Content Opties (selecteer wat je wilt)
├─ 🖼️ Afbeeldingen (aantal: 1-10)
├─ 🔗 Interne Links (automatisch)
├─ 🛒 BOL.com Product Links (voor commercial content)
├─ 📊 Tabellen (voor data/vergelijkingen)
├─ 💬 Quotes (voor authority)
├─ 📝 Lijsten (voor leesbaarheid)
├─ ❓ FAQ Sectie (voor SEO)
└─ ☑️ Checkboxes (voor tutorials)
```

**💡 Aanbevolen combinatie:**
- ✅ Afbeeldingen (3x)
- ✅ Interne Links
- ✅ FAQ Sectie
- ✅ Lijsten

#### **Stap 4: Start Generatie**

1. **Klik "Content Genereren"**
2. **Zie real-time progress:**
   ```
   📊 Generatie Progress
   ├─ [▓▓▓▓▓▓░░░░] 60%
   ├─ Huidige stap: "SEO metadata genereren..."
   └─ Geschatte tijd: 2 minuten
   ```

3. **Wacht terwijl AI:**
   - 🔍 Research doet
   - ✍️ Content schrijft
   - 🖼️ Afbeeldingen genereert
   - 🔗 Interne links vindt
   - 📊 SEO optimaliseert

#### **Stap 5: Review & Bewerken**

Na generatie word je doorgestuurd naar de editor.

### Wat Gebeurt er Tijdens Generatie?

**Achter de schermen:**

```
🤖 AI Workflow (3-5 minuten)
├─ 1️⃣ Topic Research (20%)
│   └─ Analyseert concurrent content, trends, zoekintentie
├─ 2️⃣ Outline Creëren (35%)
│   └─ Genereert gestructureerde outline met H2/H3 koppen
├─ 3️⃣ Content Schrijven (60%)
│   └─ Schrijft volledige artikel met jouw tone of voice
├─ 4️⃣ SEO Optimalisatie (75%)
│   └─ Title, meta description, keywords, internal links
├─ 5️⃣ Afbeeldingen Genereren (90%)
│   └─ Maakt unieke AI-gegenereerde afbeeldingen
└─ 6️⃣ Finaliseren & Opslaan (100%)
    └─ Slaat op in database, ready to publish!
```

---

## ✍️ Content Bewerken

### Content Editor Openen

📍 **Locatie:** `/client-portal/content-library/[id]/edit`

**Hoe kom je er:**
- Via "Content Library" → Klik op een artikel
- Direct na content generatie
- Vanuit Topical Map → "Bekijk" bij voltooide topics

### Editor Interface

**🖥️ Wat zie je:**

```
📝 Editor Layout
├─ 📊 Bovenbalk
│   ├─ Terug naar overzicht
│   ├─ Status (Concept / Gepland / Gepubliceerd)
│   └─ Laatst opgeslagen tijd
│
├─ ✍️ Content Editor (Links)
│   ├─ Titel bewerken
│   ├─ Rich text editor
│   ├─ Afbeeldingen
│   └─ HTML modus
│
└─ ⚙️ Instellingen Panel (Rechts)
    ├─ SEO Instellingen
    ├─ Publicatie Opties
    ├─ Categorieën & Tags
    └─ Featured Image
```

### Content Bewerken

#### **Titel Aanpassen**
```
📝 Titel Veld (bovenaan)
└─ Klik en typ om te bewerken
```

#### **Tekst Bewerken**

**Rich Text Editor Tools:**
```
🛠️ Formatting Toolbar
├─ **B** (Bold) - Vetgedrukt
├─ _I_ (Italic) - Cursief
├─ U (Underline) - Onderstreept
├─ H1, H2, H3 - Koppen
├─ 📝 Lijst (bullets)
├─ 🔢 Genummerde lijst
├─ 🔗 Link toevoegen
├─ 🖼️ Afbeelding invoegen
└─ 💻 HTML modus
```

**💡 Tips voor goede SEO:**
- Gebruik H2 koppen voor belangrijke secties
- Voeg interne links toe naar andere artikelen
- Houd paragrafen kort (3-4 zinnen)
- Gebruik bullet points voor leesbaarheid

#### **Afbeeldingen Beheren**

**Een afbeelding toevoegen:**
1. Klik waar je de afbeelding wilt
2. Klik op 🖼️ icoon in toolbar
3. Kies:
   - 📤 Upload eigen afbeelding
   - 🤖 Genereer AI afbeelding
   - 🔗 Gebruik URL

**Afbeelding bewerken:**
- Klik op afbeelding → Opties
- Pas Alt text aan (belangrijk voor SEO!)
- Wijzig uitlijning (links/center/rechts)
- Pas grootte aan

### SEO Instellingen

📍 **Locatie:** Rechter panel → "SEO" tab

```
🎯 SEO Instellingen
├─ 📝 SEO Title
│   └─ Max 60 karakters (toont preview)
├─ 📄 Meta Description
│   └─ Max 160 karakters (toont preview)
├─ 🔑 Focus Keyword
│   └─ Primair keyword voor dit artikel
├─ 🔗 Slug (URL)
│   └─ Bijv: /yoga-poses-beginners
└─ 📊 SEO Score
    └─ Groen (goed) / Oranje (ok) / Rood (slecht)
```

**💡 SEO Best Practices:**
- Title: Include focus keyword aan het begin
- Meta Description: Call-to-action + keyword
- Slug: Short, descriptive, met keyword
- Alt text: Beschrijvend + keyword waar relevant

### Publicatie Opties

📍 **Locatie:** Rechter panel → "Publiceren" tab

```
📅 Publicatie Instellingen
├─ 📊 Status
│   ├─ Concept (niet zichtbaar)
│   ├─ Gepland (publiceert op datum)
│   └─ Gepubliceerd (live)
│
├─ 📅 Publicatie Datum
│   └─ Kies datum & tijd (voor planning)
│
├─ 📂 Categorieën
│   └─ Selecteer WordPress categorieën
│
├─ 🏷️ Tags
│   └─ Voeg relevante tags toe
│
└─ 🖼️ Featured Image
    └─ Upload of selecteer
```

### Content Opslaan

**Automatisch opslaan:**
- ⚡ Content wordt elke 30 seconden automatisch opgeslagen
- Zie indicator rechts boven: "Laatst opgeslagen: 13:45"

**Handmatig opslaan:**
- Klik "Opslaan als Concept" (rechtsboven)
- Of gebruik sneltoets: `Ctrl + S` (Windows) / `Cmd + S` (Mac)

**Status:**
- 💾 "Opslaan..." - Bezig met opslaan
- ✅ "Opgeslagen" - Succesvol opgeslagen
- ❌ "Fout bij opslaan" - Probeer opnieuw

---

## 🌐 WordPress Publicatie

### Voordat Je Begint

**Vereisten checklist:**
- ✅ Project heeft WordPress URL ingesteld
- ✅ WordPress credentials zijn correct
- ✅ "Test Connectie" is succesvol
- ✅ Content is klaar in de editor

### Methode 1: Direct Publiceren

📍 **Locatie:** Content Editor → Rechter panel

**Stap-voor-stap:**

1. **Open je content in de editor**
2. **Controleer of alles klaar is:**
   ```
   ✅ Checklist
   ├─ Titel is aanwezig
   ├─ Content is compleet
   ├─ SEO instellingen zijn ingevuld
   ├─ Featured image is toegevoegd
   ├─ Categorieën zijn geselecteerd
   └─ Tags zijn toegevoegd
   ```

3. **Klik op "Publiceer naar WordPress"**
   - Knop bevindt zich rechtsboven

4. **Kies publicatie opties:**
   ```
   📊 Publicatie Instellingen
   ├─ Status: Direct / Gepland / Concept
   ├─ Categorieën: (geselecteerd uit WordPress)
   ├─ Tags: (automatisch of handmatig)
   └─ Publicatie datum: Nu / Later
   ```

5. **Klik "Bevestigen"**

6. **Wacht op bevestiging:**
   ```
   📤 Publishing...
   ├─ [▓▓▓▓▓▓░░░░] 60%
   ├─ Uploading featured image...
   ├─ Creating post...
   └─ Assigning categories...
   ```

7. **Succesvol! 🎉**
   ```
   ✅ Succesvol Gepubliceerd!
   ├─ WordPress Post ID: #1234
   ├─ Bekijk op WordPress →
   └─ Deel op social media →
   ```

### Methode 2: Geplande Publicatie

**Voor contentkalender & planning:**

1. **Open content in editor**
2. **Ga naar "Publiceren" panel (rechts)**
3. **Selecteer "Gepland"**
4. **Kies datum en tijd:**
   ```
   📅 Planning
   ├─ Datum: 15 december 2024
   ├─ Tijd: 09:00
   └─ Timezone: Europe/Amsterdam
   ```
5. **Klik "Plan Publicatie"**

**Wat gebeurt er:**
- 📋 Content krijgt status "Gepland"
- 📅 Op gekozen tijd wordt het automatisch gepubliceerd
- 📬 Je ontvangt een notificatie na publicatie

### Methode 3: Bulk Publicatie

📍 **Locatie:** `/admin/content/blog`

**Voor meerdere artikelen tegelijk:**

1. **Ga naar Content Library**
2. **Selecteer meerdere artikelen:**
   - ☑️ Check de checkboxes van artikelen
3. **Klik "Bulk Acties" dropdown**
4. **Selecteer "Publiceer naar WordPress"**
5. **Bevestig**

**Wat gebeurt er:**
- 📊 Alle geselecteerde artikelen worden in bulk gepubliceerd
- ⏱️ Dit kan enkele minuten duren
- 📬 Je krijgt een overzicht van successen/fouten

### WordPress Publicatie Instellingen

**Geavanceerde opties:**

#### **Featured Image Upload**
```
🖼️ Featured Image
├─ Automatisch: Eerste afbeelding uit artikel
├─ Handmatig: Upload specifieke afbeelding
└─ AI Generated: Laat WritgoAI een afbeelding genereren
```

#### **Categorieën & Tags**
```
📂 Categorieën (WordPress)
├─ Automatisch: Gebaseerd op content analyse
├─ Handmatig: Selecteer uit dropdown
└─ Nieuw: Maak nieuwe categorie aan

🏷️ Tags
├─ Automatisch: Uit keywords
├─ Handmatig: Typ tags, gescheiden met comma
└─ Suggesties: AI suggereert relevante tags
```

#### **SEO Plugin Integratie**
```
🎯 SEO Plugins (Yoast / Rank Math)
├─ Focus Keyword: Automatisch ingesteld
├─ Meta Title: Overgenomen van WritgoAI
├─ Meta Description: Overgenomen van WritgoAI
└─ Schema Markup: Automatisch toegevoegd
```

### Publicatie Troubleshooting

#### ❌ **"WordPress connectie mislukt"**

**Oplossing:**
1. Ga naar Project Settings
2. Test WordPress connectie opnieuw
3. Check:
   - ✅ WordPress URL is correct (met https://)
   - ✅ Application Password is geldig
   - ✅ Je WordPress heeft REST API enabled

#### ❌ **"Afbeelding upload mislukt"**

**Oplossing:**
1. Check WordPress upload limiet (meestal 2MB-10MB)
2. Comprimeer afbeeldingen indien te groot
3. Check WordPress media library permissions

#### ❌ **"Publicatie time-out"**

**Oplossing:**
1. Check je internet verbinding
2. WordPress kan traag zijn - probeer opnieuw
3. Publiceer handmatig via WordPress admin als backup

---

## 📱 Social Media Posts

### Social Media Strategie

WritgoAI integreert met **GetLate.dev** voor social media scheduling.

**Ondersteunde platformen:**
- 📘 Facebook
- 🐦 Twitter / X
- 📸 Instagram
- 💼 LinkedIn
- 📌 Pinterest

### GetLate.dev Koppelen

📍 **Locatie:** Project Settings → Social Media

**Stap-voor-stap:**

1. **Ga naar https://getlate.dev**
2. **Maak een account aan** (gratis trial beschikbaar)
3. **Connect je social media accounts:**
   - Login bij GetLate
   - Ga naar "Platforms"
   - Klik "Add Platform"
   - Selecteer platform en autoriseer

4. **Verkrijg API credentials:**
   - Ga naar GetLate Settings → API
   - Klik "Generate API Key"
   - Kopieer:
     - API Key
     - Profile ID

5. **Voer in bij WritgoAI:**
   ```
   📱 GetLate.dev Instellingen
   ├─ API Key: paste hier
   ├─ Profile ID: paste hier
   └─ Test Connectie → Klik om te verifiëren
   ```

6. **Test verbinding:**
   - Klik "Test Connectie"
   - ✅ "Verbonden met 3 platforms" = Succes!

### Social Posts Genereren

#### **Methode 1: Vanuit Blog Post**

📍 **Locatie:** Content Editor → Social Media Panel

**Automatische social posts bij elk artikel:**

1. **Open je blog post in editor**
2. **Scroll naar "Social Media" panel (rechts)**
3. **Klik "Genereer Social Posts"**

**Wat gebeurt er:**
```
🤖 AI Social Generator
├─ 📘 Facebook Post (250-300 karakters)
│   └─ Casual tone, engagement focus, emoji's
├─ 🐦 Twitter / X Post (280 karakters max)
│   └─ Punchy, hashtags, call-to-action
├─ 📸 Instagram Caption (2200 karakters max)
│   └─ Story-driven, emoji's, hashtags
├─ 💼 LinkedIn Post (1300 karakters)
│   └─ Professional, thought leadership
└─ 📌 Pinterest Description
    └─ SEO-optimized, keyword-rich
```

4. **Review gegenereerde posts:**
   - Bekijk preview voor elk platform
   - Pas tekst aan indien gewenst
   - Voeg media toe (afbeeldingen uit artikel)

5. **Plan of publiceer:**
   ```
   📅 Planning Opties
   ├─ Direct Publiceren (nu)
   ├─ Plannen (kies datum/tijd)
   └─ Opslaan als Concept
   ```

#### **Methode 2: Standalone Social Post**

📍 **Locatie:** `/admin/content/social`

**Voor social-only content:**

1. **Ga naar "Content" → "Social Media"**
2. **Klik "+ Nieuwe Social Post"**
3. **Selecteer platform(en):**
   - ☑️ Alle platforms
   - Of specifiek: Facebook / Twitter / LinkedIn / etc.

4. **Vul content in:**
   ```
   📝 Social Post Details
   ├─ Bericht Tekst (pas aan per platform)
   ├─ 🖼️ Media (afbeelding/video)
   ├─ 🔗 Link (optioneel)
   ├─ 🏷️ Hashtags (automatische suggesties)
   └─ 📅 Publicatie Datum/Tijd
   ```

5. **AI Verbeteringen (optioneel):**
   - Klik "AI Optimaliseren"
   - AI verbetert tekst voor engagement
   - Suggereert hashtags
   - Optimaliseert voor elk platform

6. **Publiceren:**
   - Direct → Klik "Publiceer Nu"
   - Later → Klik "Plan Publicatie"

### Social Media Planning

📍 **Locatie:** `/admin/distribution/calendar`

**Content Kalender Overview:**

```
📅 Maand Overzicht
├─ Ma 11 Dec
│   ├─ 09:00 - Facebook Post ✅
│   └─ 14:00 - LinkedIn Post 📋
├─ Di 12 Dec
│   ├─ 10:00 - Instagram Post 📋
│   └─ 15:00 - Twitter Post 📋
└─ Wo 13 Dec
    └─ 11:00 - Facebook Post 📋
```

**Acties:**
- 👀 Klik op post om te bewerken
- 📅 Drag & drop om te verplaatsen
- ❌ Delete om te annuleren
- 📊 Bekijk analytics (na publicatie)

### Social Media Autopilot

**Automatische social posts bij elke blog publicatie!**

📍 **Locatie:** Project Settings → Automation

**Instellen:**

1. **Ga naar Project Settings**
2. **Scroll naar "Automation"**
3. **Schakel in: "Auto Social Posts"**
4. **Configureer:**
   ```
   🤖 Social Autopilot Instellingen
   ├─ ✅ Genereer posts bij elke blog publicatie
   ├─ Selecteer platformen:
   │   ├─ ☑️ Facebook
   │   ├─ ☑️ Twitter
   │   ├─ ☑️ LinkedIn
   │   └─ ☐ Instagram (handmatig i.v.m. media)
   ├─ Publicatie timing:
   │   ├─ Direct (tegelijk met blog)
   │   └─ Vertraagd (1 uur later)
   └─ 💾 Opslaan
   ```

5. **Klaar!**
   - Vanaf nu: elke blog post → automatisch social posts
   - Posts worden direct of gepland gepubliceerd
   - Je krijgt notificatie bij publicatie

---

## 🤖 Autopilot Instellen

### Wat is Autopilot?

**Autopilot** = Volledig geautomatiseerde content productie & publicatie

**Wat doet het:**
```
🚀 Autopilot Workflow (dagelijks)
├─ 1️⃣ Selecteert volgende topic uit Topical Map
├─ 2️⃣ Genereert volledig artikel (3000+ woorden)
├─ 3️⃣ Optimaliseert voor SEO
├─ 4️⃣ Genereert afbeeldingen
├─ 5️⃣ Publiceert naar WordPress
├─ 6️⃣ Creëert & post social media content
└─ 7️⃣ Markeert topic als "voltooid" in map
```

**Resultaat:** Hands-free content machine! 🎉

### Autopilot Activeren

📍 **Locatie:** `/admin/autopilot-control` of Project Settings

**Methode 1: Via Autopilot Control Panel**

1. **Ga naar "Autopilot Control"**
2. **Zie huidige status:**
   ```
   📊 Autopilot Status
   ├─ Status: Inactief ❌
   ├─ Laatste run: Nooit
   ├─ Vandaag gegenereerd: 0 artikelen
   └─ Gepland: 0 artikelen
   ```

3. **Klik "Start Autopilot Nu"**
4. **Configureer (eerste keer):**
   ```
   ⚙️ Autopilot Configuratie
   ├─ Frequentie: Dagelijks / 2x per week / Wekelijks
   ├─ Tijd: 09:00 (aanbevolen)
   ├─ Artikelen per run: 1-5
   ├─ Direct publiceren: Ja/Nee
   └─ Social posts: Ja/Nee
   ```

5. **Klik "Activeer Autopilot"**

**Methode 2: Via Project Settings**

1. **Ga naar Project → Klik op project naam**
2. **Scroll naar "Automation" sectie**
3. **Toggle "Autopilot" schakelaar**
4. **Configureer instellingen (zie boven)**
5. **Klik "Opslaan"**

### Autopilot Instellingen

**Geavanceerde configuratie:**

#### **Frequentie & Timing**
```
📅 Planning
├─ Dagelijks (1 artikel per dag)
├─ 2x per week (Ma + Do)
├─ Wekelijks (Elke maandag)
└─ Custom (kies specifieke dagen)

⏰ Tijdstip
├─ 09:00 (aanbevolen - beste voor SEO crawling)
├─ 12:00 (middag)
└─ 18:00 (avond)
```

#### **Content Volume**
```
📊 Artikelen per Run
├─ 1 artikel (conservatief)
├─ 2-3 artikelen (aanbevolen)
└─ 5 artikelen (agressief)

💡 Tip: Start met 1-2 artikelen per dag
```

#### **Publicatie Settings**
```
🌐 WordPress
├─ ☑️ Direct publiceren (live)
└─ ☐ Opslaan als concept (manual review)

📱 Social Media
├─ ☑️ Automatische social posts
└─ ☐ Alleen WordPress (geen social)
```

#### **Content Prioriteit**
```
🎯 Topic Selectie
├─ Hoge prioriteit eerst (🔥)
├─ Commercial eerst (💰)
├─ Op volgorde (sequentieel)
└─ Random (diverse mix)

💡 Aanbevolen: "Hoge prioriteit eerst"
```

### Autopilot Monitoren

📍 **Locatie:** `/admin/autopilot-control`

**Dashboard toont:**

```
📊 Autopilot Dashboard
├─ Status: ✅ Actief / ❌ Inactief
├─ Laatste Run: 15 dec 2024, 09:00
├─ Volgende Run: 16 dec 2024, 09:00
│
├─ 📈 Statistieken (laatste 30 dagen)
│   ├─ Artikelen gegenereerd: 45
│   ├─ Succesvol gepubliceerd: 43 (95%)
│   ├─ Mislukt: 2 (5%)
│   └─ Social posts: 86
│
└─ 🔄 Recente Runs
    ├─ 15 dec, 09:00 - ✅ Success (2 artikelen)
    ├─ 14 dec, 09:00 - ✅ Success (2 artikelen)
    └─ 13 dec, 09:00 - ⚠️ Partial (1/2 artikelen)
```

### Handmatige Autopilot Run

**Voor directe content generatie:**

📍 **Locatie:** `/admin/autopilot-control`

1. **Klik "Start Autopilot Nu"**
2. **Zie real-time progress:**
   ```
   🔄 Autopilot Running...
   ├─ Project: Yoga Blog
   ├─ [▓▓▓▓▓▓░░░░] 60%
   ├─ Stap: Content genereren...
   └─ ETA: 3 minuten
   ```

3. **Resultaten:**
   ```
   ✅ Run Compleet!
   ├─ Verwerkte projecten: 3
   ├─ Gegenereerde artikelen: 5
   ├─ Gepubliceerd naar WordPress: 5
   ├─ Social posts gemaakt: 10
   └─ Mislukkingen: 0
   ```

### Autopilot Pauzeren/Stoppen

**Tijdelijk stoppen:**

1. **Ga naar Autopilot Control**
2. **Klik "Pauzeer Autopilot"**
3. **Autopilot stopt met nieuwe runs**
4. **Hervatten:** Klik "Hervat Autopilot"

**Permanent uitschakelen:**

1. **Ga naar Project Settings**
2. **Toggle "Autopilot" naar OFF**
3. **Bevestig**

### Autopilot Best Practices

**💡 Tips voor optimale resultaten:**

1. **Start Klein**
   - Begin met 1 artikel per dag
   - Schaal op naar 2-3 na 1 week
   - Monitor kwaliteit

2. **Check Topical Map**
   - Zorg dat je ≥50 topics hebt in je map
   - Prioriteer topics correct
   - Update map regelmatig

3. **Monitor WordPress**
   - Check wekelijks of artikelen correct gepubliceerd zijn
   - Bekijk indexering in Google Search Console
   - Pas aan indien nodig

4. **Review Kwaliteit**
   - Lees elke week 2-3 gegenereerde artikelen
   - Geef feedback (AI leert hiervan)
   - Pas tone of voice aan indien nodig

5. **Social Media Check**
   - Controleer of social posts goed aankomen
   - Monitor engagement
   - Pas timing aan voor beste resultaten

---

## 🛠️ Troubleshooting

### Veelvoorkomende Problemen & Oplossingen

#### **🔴 Kan niet inloggen**

**Symptomen:**
- "Invalid credentials" error
- Login pagina blijft reloaden
- "Session expired" melding

**Oplossingen:**

1. **Check credentials:**
   - Email correct gespeld?
   - Wachtwoord hoofdlettergevoelig
   - Probeer wachtwoord reset

2. **Browser problemen:**
   - Clear cookies en cache
   - Probeer incognito/private mode
   - Probeer andere browser

3. **Account issues:**
   - Is je account actief?
   - Subscription nog geldig?
   - Contact support

**Command:**
```bash
# Clear browser cache (Chrome):
Ctrl + Shift + Delete → Selecteer "Cookies" + "Cached images" → Clear Data
```

---

#### **🔴 WordPress publicatie mislukt**

**Symptomen:**
- "Failed to publish" error
- "Connection timeout"
- "Invalid credentials"

**Oplossingen:**

1. **Test WordPress connectie:**
   ```
   📍 Project Settings → WordPress
   └─ Klik "Test Connectie"
   ```

2. **Check WordPress URL:**
   ```
   ✅ Correct: https://jouwsite.nl
   ❌ Fout: http://jouwsite.nl (geen https)
   ❌ Fout: https://jouwsite.nl/ (trailing slash)
   ```

3. **Vernieuw Application Password:**
   - Login WordPress admin
   - Ga naar Users → Profile → Application Passwords
   - Revoke oude password
   - Maak nieuwe aan
   - Update in WritgoAI

4. **Check WordPress instellingen:**
   - REST API enabled? (meestal default aan)
   - Permalinks ingesteld? (bijv. "Post name")
   - Firewall/security plugin blokkeren? (whitelist WritgoAI IP)

5. **Manual fallback:**
   - Kopieer content vanuit WritgoAI
   - Plak in WordPress admin
   - Publiceer handmatig

---

#### **🔴 Topical Map generatie faalt**

**Symptomen:**
- "Generation timeout"
- "AI overbelast"
- Map blijft hangen op 50%

**Oplossingen:**

1. **Reduce aantal topics:**
   ```
   ❌ Probeerde: 1000 topics
   ✅ Probeer: 300 topics eerst
   ```

2. **Wacht en probeer opnieuw:**
   - AI kan druk zijn (peak hours)
   - Wacht 30-60 seconden
   - Probeer opnieuw

3. **Check project instellingen:**
   - Website URL correct?
   - Niche duidelijk omschreven?
   - Taal ingesteld?

4. **Kleinere batches:**
   - Genereer 200 topics
   - Controleer resultaat
   - Genereer daarna meer

---

#### **🔴 Content generatie duurt te lang**

**Symptomen:**
- Generatie stopt na 5+ minuten
- "Timeout" error
- Progress blijft hangen

**Oplossingen:**

1. **Check instellingen:**
   ```
   Verlaag complexiteit:
   ├─ Afbeeldingen: 3 → 1
   ├─ Woorden: 3000 → 1500
   └─ Elementen: Minder opties aanvinken
   ```

2. **Probeer opnieuw:**
   - Klik "Opnieuw proberen"
   - Of start nieuwe generatie

3. **Check internet:**
   - Stabiele verbinding?
   - Herlaad pagina niet tijdens generatie!

4. **Contact support:**
   - Als het blijft falen
   - Mogelijk technisch issue

---

#### **🔴 Afbeeldingen laden niet**

**Symptomen:**
- Afbeeldingen tonen niet in editor
- "Failed to generate image"
- Placeholder images

**Oplossingen:**

1. **Wacht even:**
   - Afbeeldingen kunnen 30-60 sec duren
   - Herlaad pagina na 1 minuut

2. **Regenerate afbeelding:**
   - Klik op afbeelding → "Regenerate"
   - Of upload eigen afbeelding

3. **Check bestandsgrootte:**
   - Max 10MB per afbeelding
   - Comprimeer grote bestanden

4. **Browser cache:**
   - Clear cache en herlaad
   - Probeer andere browser

---

#### **🔴 Social media posts falen**

**Symptomen:**
- "Failed to post"
- "GetLate connection error"
- Posts verschijnen niet

**Oplossingen:**

1. **Check GetLate verbinding:**
   ```
   📍 Project Settings → Social Media
   └─ Klik "Test Connectie"
   ```

2. **Vernieuw API credentials:**
   - Login GetLate.dev
   - Genereer nieuwe API key
   - Update in WritgoAI

3. **Check platform autorisatie:**
   - Login GetLate
   - Ga naar "Platforms"
   - Reconnect platforms indien nodig

4. **Manual post:**
   - Kopieer content
   - Post handmatig via GetLate dashboard
   - Of direct op platform

---

#### **🔴 Autopilot werkt niet**

**Symptomen:**
- Geen artikelen worden gegenereerd
- "No articles to process"
- Autopilot status blijft "Idle"

**Oplossingen:**

1. **Check Topical Map:**
   - Heb je een actieve Topical Map?
   - Zijn er nog "niet-voltooide" topics?
   - Map moet ≥10 topics hebben

2. **Check Autopilot settings:**
   ```
   📍 Autopilot Control
   ├─ Is Autopilot enabled? (toggle moet groen zijn)
   ├─ Volgende run tijd correct?
   └─ Project geselecteerd?
   ```

3. **Handmatige run:**
   - Ga naar Autopilot Control
   - Klik "Start Autopilot Nu"
   - Check of het dan werkt

4. **Check credits/limits:**
   - Zijn er nog credits beschikbaar?
   - Plan limiet bereikt?
   - Upgrade plan indien nodig

---

### Error Codes Uitleg

```
🔴 Error 401: Unauthorized
└─ Oplossing: Login opnieuw / Check API credentials

🔴 Error 403: Forbidden
└─ Oplossing: Je hebt geen toegang tot deze functie / Upgrade plan

🔴 Error 404: Not Found
└─ Oplossing: Content/project niet gevonden / Check URL

🔴 Error 429: Rate Limit
└─ Oplossing: Te veel verzoeken / Wacht 1 minuut

🔴 Error 500: Server Error
└─ Oplossing: Technisch probleem / Contact support

🔴 Error 503: Service Unavailable
└─ Oplossing: Tijdelijke storing / Probeer over 5-10 min
```

---

## ❓ Veelgestelde Vragen

### Algemeen

**Q: Hoeveel artikelen kan ik per maand genereren?**
A: Afhankelijk van je plan:
- Starter: 50 artikelen/maand
- Professional: 200 artikelen/maand
- Enterprise: Onbeperkt

**Q: In welke talen kan ik content genereren?**
A: Nederlands, Engels, Duits, Frans, Spaans, Italiaans, en meer. Selecteer taal bij content generatie.

**Q: Wordt de content gedetecteerd als AI?**
A: WritgoAI gebruikt geavanceerde models die mensachtige content schrijven. Gebruik eventueel een AI detector om te checken, maar onze content scoort meestal ≥95% menselijk.

**Q: Kan ik eigen templates/formats gebruiken?**
A: Ja! Via "Instellingen" → "Content Templates" kun je custom formats definiëren.

### Topical Maps

**Q: Hoeveel topics moet ik genereren?**
A: Aanbevolen:
- Kleine niche (bijv. "Glutenvrije recepten"): 200-300 topics
- Gemiddelde niche (bijv. "Yoga"): 300-500 topics
- Grote niche (bijv. "Gezondheid"): 500-1000+ topics

**Q: Hoe vaak moet ik een nieuwe map genereren?**
A: 
- 1x per kwartaal voor updates
- Of als je niche significant verandert
- Je kunt ook topics handmatig toevoegen

**Q: Kan ik topics handmatig aanpassen?**
A: Ja! Klik op een topic → "Bewerken" om titel/keywords aan te passen.

### Content Generatie

**Q: Hoe lang duurt content generatie?**
A:
- Artikel (1500 woorden): 2-3 minuten
- Artikel (3000 woorden): 4-5 minuten
- Met afbeeldingen: +1-2 minuten
- Total: gemiddeld 3-5 minuten per artikel

**Q: Kan ik de writing style aanpassen?**
A: Ja! In Project Settings → "Content Settings":
- Tone of Voice: Professioneel/Casual/Vriendelijk/etc.
- Complexity: Beginner/Advanced
- Formality: Informal/Formal

**Q: Worden afbeeldingen automatisch gegenereerd?**
A: Ja, als je "Include Images" aanzet. AI genereert unieke afbeeldingen passend bij de content.

### WordPress

**Q: Werkt het met alle WordPress versies?**
A: Ja, vanaf WordPress 5.0+. REST API moet enabled zijn (standaard aan).

**Q: Werkt het met page builders (Elementor/Divi)?**
A: Ja, content wordt als standaard WordPress post aangemaakt. Je kunt het daarna in je page builder bewerken.

**Q: Worden afbeeldingen ook naar WordPress geüpload?**
A: Ja! Featured image + in-content afbeeldingen worden automatisch geüpload naar je WordPress media library.

**Q: Kan ik autopublish uitschakelen?**
A: Ja, zet "Direct publiceren" op OFF. Artikelen worden dan als "Concept" opgeslagen in WordPress.

### Social Media

**Q: Welke platforms worden ondersteund?**
A: Via GetLate.dev: Facebook, Twitter/X, Instagram, LinkedIn, Pinterest, TikTok (in beta).

**Q: Kan ik posts aanpassen voordat ze live gaan?**
A: Ja! Posts worden eerst als concept opgeslagen. Review en bewerk ze voordat je publiceert.

**Q: Hoe vaak moet ik social posts plaatsen?**
A: Aanbevolen frequentie:
- Facebook: 1-2x per dag
- Twitter: 3-5x per dag
- LinkedIn: 1x per dag
- Instagram: 1-2x per dag

### Autopilot

**Q: Is Autopilot veilig?**
A: Ja! Autopilot:
- Genereert high-quality content
- Optimaliseert voor SEO
- Publiceert alleen naar jouw geselecteerde platforms
- Je kunt het altijd pauzeren/stoppen

**Q: Kan ik Autopilot per project instellen?**
A: Ja! Elke project heeft eigen Autopilot instellingen. Zet het aan/uit per project.

**Q: Wat als Autopilot een fout maakt?**
A: 
- Mislukte generaties worden gelogd
- Je krijgt notificatie bij fouten
- Content wordt nooit gepubliceerd als het incompleet is
- Je kunt altijd handmatig fixen

### Billing & Limits

**Q: Wat telt als "1 artikel"?**
A: Elke gegenereerde blog post, ongeacht lengte. Social posts tellen niet mee.

**Q: Wat gebeurt er als ik mijn limiet bereik?**
A: 
- Je krijgt notificatie bij 80% gebruik
- Bij 100%: Autopilot pauzeert
- Upgrade plan of wacht tot volgende maand

**Q: Kan ik mijn plan upgraden/downgraden?**
A: Ja, altijd mogelijk via "Settings" → "Subscription". Wijzigingen gaan in per direct.

---

## 📞 Support & Contact

### Hulp Nodig?

**📧 Email Support:**
- support@writgoai.com
- Response tijd: binnen 24 uur

**💬 Live Chat:**
- Klik op chat widget (rechtsonder in app)
- Beschikbaar: Ma-Vr, 09:00-17:00 CET

**📚 Knowledge Base:**
- https://help.writgoai.com
- Meer tutorials, video's, en guides

**🐛 Bug Rapporteren:**
- bugs@writgoai.com
- Include: screenshots, error messages, steps to reproduce

---

## 🎉 Success Tips

### Maximale Resultaten Behalen

**1. Consistentie is Key**
- Gebruik Autopilot voor dagelijkse publicatie
- 1-2 artikelen per dag = beste resultaten
- Bouw autoriteit op over tijd

**2. Topical Authority Strategie**
- Start met Topical Map
- Cover eerst high-priority topics
- Vul systematisch je niche in

**3. SEO Best Practices**
- Gebruik interne links (automated)
- Voeg FAQ secties toe (structured data)
- Optimaliseer meta descriptions

**4. Social Media Synergie**
- Deel elke blog post op social media
- Gebruik verschillende hooks per platform
- Schedule voor optimale tijden

**5. Monitor & Optimize**
- Check Google Search Console wekelijks
- Analyseer welke content het beste presteert
- Double-down op succesvolle topics

---

## 🚀 Volgende Stappen

**Nu je de basis kent:**

1. ✅ **Maak je eerste project aan**
2. ✅ **Genereer een Topical Map** (300 topics)
3. ✅ **Creëer 3-5 artikelen handmatig** (om kwaliteit te checken)
4. ✅ **Publiceer naar WordPress**
5. ✅ **Schakel Autopilot in** (1 artikel/dag)
6. ✅ **Monitor resultaten** (wekelijks)

**Over 30 dagen:**
- 30 nieuwe artikelen
- Topical authority opgebouwd
- Organisch verkeer groeit
- Minder tijd aan content besteed

**Over 90 dagen:**
- 90 nieuwe artikelen
- Top rankings voor long-tail keywords
- Significant meer verkeer
- Volledig geautomatiseerde workflow

---

## 📊 Cheatsheet

### Keyboard Shortcuts

```
⌨️ Editor Shortcuts
├─ Ctrl/Cmd + S → Opslaan
├─ Ctrl/Cmd + B → Bold
├─ Ctrl/Cmd + I → Italic
├─ Ctrl/Cmd + K → Link toevoegen
└─ Ctrl/Cmd + Shift + P → Preview

⌨️ Navigation
├─ Alt + 1 → Dashboard
├─ Alt + 2 → Content
├─ Alt + 3 → Projects
└─ Alt + 4 → Settings
```

### Quick Links

```
📍 Belangrijke URLs
├─ /admin/dashboard → Admin Dashboard
├─ /admin/projects → Projecten overzicht
├─ /admin/content → Content hub
├─ /admin/autopilot-control → Autopilot controle
├─ /client-portal/topical-mapping → Topical Maps
├─ /client-portal/content-generator → Content Generator
└─ /client-portal/content-library → Content Library
```

### Status Indicators

```
🎨 Kleuren Betekenis
├─ 🟢 Groen → Actief / Succes / Verbonden
├─ 🟡 Geel → Waarschuwing / In Progress
├─ 🔴 Rood → Fout / Niet Verbonden
└─ ⚪ Grijs → Inactief / Niet ingesteld
```

---

**🎉 Je bent nu klaar om te beginnen met WritgoAI!**

*Veel succes met het opbouwen van je content empire! 🚀*

---

**Versie:** 2.0  
**Laatst bijgewerkt:** December 15, 2024  
**Feedback:** support@writgoai.com
