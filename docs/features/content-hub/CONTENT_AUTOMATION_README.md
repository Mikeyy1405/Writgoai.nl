
# 🤖 Content Automation Systeem - Handleiding

## Overzicht

Het Content Automation systeem maakt het mogelijk om **automatisch SEO-geoptimaliseerde blogs te genereren en publiceren** op basis van een planning die je één keer instelt.

### ✨ Wat doet het systeem?

1. **Automatische Content Generatie**: Genereert complete, SEO-geoptimaliseerde blogs met:
   - Website & SERP analyse
   - Keyword research
   - 12 hoogwaardige AI-gegenereerde afbeeldingen
   - Bol.com product integratie (optioneel)
   - Content structuur optimalisatie

2. **Opslag in Content Library**: Alle gegenereerde content wordt opgeslagen in de Content Library waar je het kunt bewerken.

3. **Automatische WordPress Publicatie** (optioneel): Content kan automatisch naar WordPress gepubliceerd worden als concept of direct live.

---

## 📍 Waar vind je het?

Ga naar: **https://WritgoAI.nl/client-portal/deep-research-writer**

Scroll naar beneden naar de sectie **"Content Automation"**

---

## 🎯 Nieuwe Automation Maken

Klik op **"Nieuwe Automation"** en configureer:

### 1. Project Selectie (optioneel)
- Selecteer een project om project-specifieke instellingen te gebruiken
- Project affiliate links worden automatisch toegepast
- Als geen project: algemene instellingen worden gebruikt

### 2. Frequentie *
Kies hoe vaak content gegenereerd moet worden:
- **Dagelijks**: Elke dag om het ingestelde tijdstip
- **3x per week**: Maandag, woensdag, vrijdag
- **Wekelijks**: Elke week op een specifieke dag
- **Maandelijks**: Elke maand op een specifieke datum

### 3. Planning Details
- **Dag van de week** (bij wekelijks): Kies maandag t/m zondag
- **Dag van de maand** (bij maandelijks): Kies 1-31
- **Tijdstip**: Stel in wanneer content gegenereerd moet worden (HH:MM formaat)

### 4. Content Instellingen
- **Website URL** (optioneel): URL voor website analyse
- **Custom Instructies** (optioneel): Extra instructies voor content generatie
- **Afbeeldingen toevoegen**: Schakel hoogwaardige AI afbeeldingen in/uit
- **Aantal afbeeldingen**: 1-20 afbeeldingen per blog (standaard 12)
- **Bol.com producten**: Voeg automatisch relevante bol.com producten toe

### 5. WordPress Publicatie (optioneel)
- **Automatisch publiceren naar WordPress**: Schakel in om direct naar WP te publiceren
- **WordPress status**: 
  - **Concept**: Opslaan als draft
  - **Direct publiceren**: Meteen live
  - **Privé**: Als concept behandeld
- **Tags**: Komma-gescheiden lijst van tags

---

## ⚙️ Automation Beheer

### Automation Status
Elke automation toont:
- **Status**: Actief of Gepauzeerd
- **Frequentie**: Hoe vaak het draait
- **Laatste run**: Wanneer laatst content gegenereerd is
- **Volgende run**: Wanneer de volgende generatie plaats vindt
- **Statistieken**: Aantal succesvolle vs gefaalde runs

### Acties
- **▶️ Play/⏸️ Pause**: Activeer of pauzeer een automation
- **🗑️ Verwijderen**: Verwijder de automation permanent

---

## 🔄 Hoe werkt het technisch?

### Workflow per Run:
1. **Topic Generatie**: AI genereert een relevant onderwerp
2. **Website Analyse**: Analyseert de website stijl en tone of voice
3. **SERP Analyse**: Bekijkt top 10 concurrenten voor het onderwerp
4. **Keyword Research**: Vindt focus keywords en LSI keywords
5. **Afbeelding Generatie**: Genereert 12 hoogwaardige, specifieke AI afbeeldingen
6. **Content Structuur**: Maakt een SEO-geoptimaliseerde outline
7. **Blog Generatie**: Schrijft de complete blog met afbeeldingen
8. **Opslaan**: Slaat op in Content Library met type "BLOG_AUTO"
9. **WordPress Publicatie** (indien ingeschakeld): Publiceert naar WordPress

### Cron Job
- De cron job draait elk uur: `/api/cron/run-content-automations`
- Checkt welke automations klaar zijn om te draaien
- Voert alle geplande automations uit
- Berekent automatisch de volgende run time

---

## 📊 Content Library Integratie

Alle automatisch gegenereerde content wordt opgeslagen met:
- **Type**: `BLOG_AUTO`
- **Category**: `Auto-Generated`
- **Title**: AI-gegenereerde SEO titel
- **Content**: Volledige HTML blog
- **Metadata**: Meta description, keywords, word count
- **Images**: URLs van alle gegenereerde afbeeldingen

Je kunt deze content vinden en bewerken in:
**https://WritgoAI.nl/client-portal/content-library**

---

## 🔗 WordPress Integratie

### Vereisten
Om WordPress publicatie te gebruiken heb je nodig:
- WordPress URL (bijv. https://example.com)
- WordPress Username
- WordPress Application Password

Deze kun je instellen:
1. **Per project**: In project instellingen
2. **Algemeen**: In client instellingen

### Wat wordt gepubliceerd?
- **Titel**: SEO-geoptimaliseerde titel
- **Content**: Volledige HTML blog met afbeeldingen
- **Excerpt**: Meta description
- **Status**: Draft of Publish (zoals ingesteld)
- **Tags**: De tags die je hebt opgegeven

---

## 💡 Best Practices

### Voor Dagelijkse Content
- Gebruik een breed onderwerp om variatie te waarborgen
- Schakel afbeeldingen in voor visuele aantrekkingskracht
- Publiceer als concept eerst om te reviewen

### Voor Wekelijkse Content
- Kies een vaste dag (bijv. maandag voor week start)
- Gebruik project-specifieke settings voor consistentie
- Schakel WordPress auto-publicatie in als je vertrouwen hebt

### Voor SEO Optimalisatie
- Gebruik website URL voor goede tone of voice matching
- Schakel Bol.com producten in voor affiliate revenue
- Laat minimaal 12 afbeeldingen genereren

---

## 🐛 Troubleshooting

### Automation draait niet
- Check of de automation **actief** staat (niet gepauzeerd)
- Bekijk "Volgende run" tijd - is deze in de toekomst?
- Check de laatste fout (als er gefaalde runs zijn)

### WordPress publicatie faalt
- Controleer of WordPress credentials correct zijn
- Check of WordPress REST API enabled is
- Bekijk error logs in de automation details

### Content kwaliteit niet goed
- Voeg custom instructies toe voor specifieke wensen
- Selecteer het juiste project voor project-specifieke stijl
- Verhoog aantal afbeeldingen voor meer visuele content

---

## 🎓 Voorbeelden

### Voorbeeld 1: Dagelijkse Blog voor E-commerce
```
Frequentie: Dagelijks
Tijdstip: 09:00
Website URL: https://example-shop.com
Afbeeldingen: 12
Bol.com producten: Ja
WordPress auto-publish: Ja (als Concept)
Tags: ecommerce, tips, producten
```

### Voorbeeld 2: Wekelijkse SEO Blog
```
Frequentie: Wekelijks (Maandag)
Tijdstip: 08:00
Project: Mijn SEO Blog
Afbeeldingen: 15
WordPress auto-publish: Ja (Direct Publiceren)
Tags: seo, marketing, tips
```

### Voorbeeld 3: Maandelijkse Industry Update
```
Frequentie: Maandelijks (dag 1)
Tijdstip: 10:00
Custom Instructies: "Focus op industry trends en nieuws"
Afbeeldingen: 10
WordPress auto-publish: Nee (Handmatige review)
```

---

## 🚀 Nieuwe Features

### Hoogwaardige AI Afbeeldingen
De AI genereert nu **specifieke, relevante afbeeldingen** in plaats van stock foto's:
- Voor "robotstofzuigers": Echte robot vacuum beelden
- Voor "smoothies": Professionele food photography
- Fotorealistische kwaliteit met 8K detail

### Directe Content Library Redirect
Na generatie word je direct naar de Content Library gebracht waar je:
- Content kunt bewerken
- Metadata kunt aanpassen  
- Handmatig naar WordPress kunt publiceren
- Content kunt archiveren of verwijderen

---

## 📞 Support

Vragen of problemen? De automation logs bevatten gedetailleerde informatie over:
- Welke stap gefaald is
- Foutmeldingen
- Tijdstippen van runs
- Gegenereerde content IDs

Deze informatie kan gebruikt worden voor debugging en support.

---

**🎉 Je bent nu klaar om automatisch content te laten genereren!**

Ga naar https://WritgoAI.nl/client-portal/deep-research-writer en begin met het instellen van je eerste automation.
