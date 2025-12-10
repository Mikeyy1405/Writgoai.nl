# Autopilot - Volledig Automatische Content Generatie

## Overzicht
De Autopilot is nu volledig geautomatiseerd en blijft doorlopen zonder tussenkomst van de gebruiker. Deze update voegt krachtige nieuwe functies toe voor affiliate links en flexibele planning.

## Nieuwe Features

### 1. **Automatische Affiliate Links Integratie**
- **AI-gestuurde selectie**: De AI analyseert automatisch welke affiliate links uit je project instellingen het beste passen bij de content
- **Natuurlijke plaatsing**: Links worden op een natuurlijke manier in de tekst verwerkt, nooit geforceerd
- **Context-bewust**: Alleen relevante links die waarde toevoegen voor de lezer worden gebruikt
- **Tracking**: Bijhouden welke links wanneer gebruikt zijn

#### Hoe het werkt:
1. Voeg affiliate links toe aan je project instellingen (bij Affiliate Links)
2. Voeg metadata toe: anchor text, categorie, beschrijving, keywords
3. Bij het aanmaken van een Autopilot planning kun je de optie "Affiliate links uit project" aanzetten
4. De AI selecteert automatisch de beste 3-5 links per artikel op basis van relevantie

### 2. **Flexibele Frequentie Opties**
Kies uit 5 voorgedefinieerde frequenties voor volledige hands-off operatie:

- **1x per dag**: Dagelijks op een vast tijdstip (bijv. 09:00)
- **2x per dag**: Twee keer per dag (bijv. 09:00 en 15:00)
- **3x per week**: Drie keer per week (maandag, woensdag, vrijdag)
- **1x per week**: Wekelijks op een gekozen dag
- **1x per maand**: Maandelijks op een gekozen datum

### 3. **Content Type Selectie**
Bepaal wat er gegenereerd moet worden:
- **Alleen blog posts**: Volledige SEO-geoptimaliseerde artikelen
- **Alleen social media**: Social media posts voor je kanalen
- **Blog + social media**: Beide content types samen

### 4. **Volledige Content Instellingen**
- ✅ **Affiliate links uit project**: AI zoekt automatisch relevante links
- ✅ **Bol.com producten**: Automatisch zoeken en toevoegen van relevante producten
- ✅ **Afbeeldingen genereren**: AI genereert passende afbeeldingen
- ✅ **Automatisch publiceren**: Direct naar WordPress publiceren

## Workflow

### Stap 1: Project Voorbereiden
1. Ga naar je project instellingen
2. Voeg affiliate links toe met goede metadata:
   - Anchor text (hoe de link genoemd wordt)
   - Categorie (bijv. "Yoga producten", "Reizen", etc.)
   - Beschrijving (waarom deze link nuttig is)
   - Keywords (relevante zoektermen)

### Stap 2: Autopilot Inplannen
1. Ga naar **Autopilot** in het client portaal
2. Selecteer een project
3. Selecteer de artikelen die je wilt laten genereren
4. Klik op **Plan Autopilot**
5. Kies een frequentie (bijv. "1x per dag")
6. Stel de tijd in (bijv. 09:00)
7. Kies het content type
8. Schakel gewenste opties in/uit
9. Klik op **Planning aanmaken**

### Stap 3: Laat het Lopen!
- De Autopilot draait nu volledig automatisch
- Elke dag/week/maand wordt er content gegenereerd
- Affiliate links worden automatisch intelligent toegevoegd
- Content wordt gepubliceerd naar WordPress
- Je hoeft niets meer te doen! 🚀

## Technische Details

### Affiliate Link Selectie AI
De AI gebruikt de volgende criteria om links te selecteren:
1. **Content matching**: Vergelijkt link keywords met artikel onderwerp
2. **Context analyse**: Analyseert of de link past bij de content flow
3. **Waarde beoordeling**: Bepaalt of de link waarde toevoegt voor de lezer
4. **Natuurlijke integratie**: Zorgt dat links niet geforceerd aanvoelen

### Database Schema
Nieuwe velden toegevoegd aan `AutopilotSchedule`:
- `contentType`: blog | social-media | both
- `includeAffiliateLinks`: boolean
- `includeBolcomProducts`: boolean
- `includeImages`: boolean
- `secondTimeOfDay`: voor 2x per dag frequentie

### API Endpoints
- `POST /api/client/autopilot/schedule` - Aanmaken van planning
- `GET /api/client/autopilot/schedule?projectId=...` - Ophalen planningen
- `PATCH /api/client/autopilot/schedule/[id]` - Aanpassen planning
- `DELETE /api/client/autopilot/schedule/[id]` - Verwijderen planning
- `POST /api/client/autopilot/generate` - Genereren van content (met affiliate links)

## Voordelen

✅ **Volledig hands-off**: Eenmaal ingesteld blijft alles automatisch draaien
✅ **Slimme affiliate integratie**: Maximaliseer inkomsten zonder spam
✅ **Flexibele planning**: Van dagelijks tot maandelijks
✅ **SEO geoptimaliseerd**: Alle content geoptimaliseerd voor Google
✅ **Consistent**: Regelmatige content updates voor betere rankings

## Tips voor Beste Resultaten

1. **Goede metadata**: Vul altijd description en keywords in bij affiliate links
2. **Relevante links**: Voeg alleen links toe die echt passen bij je niche
3. **Mix content**: Gebruik verschillende frequenties voor verschillende content types
4. **Monitor resultaten**: Check regelmatig je WordPress om te zien hoe het gaat
5. **Optimaliseer keywords**: Bij affiliate links die niet geselecteerd worden: verbeter de keywords

## Voorbeeld Scenario

**Yoga Blog met Affiliate Marketing:**

1. **Project setup**:
   - 20 affiliate links toegevoegd (yogamatten, kleding, cursussen)
   - Per link: categorie, beschrijving, keywords ingevuld

2. **Autopilot planning**:
   - Frequentie: 1x per dag om 09:00
   - Content type: Blog + social media
   - Affiliate links: ✅ Aan
   - Bol.com producten: ✅ Aan
   - Afbeeldingen: ✅ Aan
   - Auto publiceren: ✅ Aan

3. **Resultaat**:
   - Elke dag om 09:00: nieuw yoga artikel gegenereerd
   - 3-5 relevante affiliate links automatisch toegevoegd
   - Relevante producten van bol.com erbij
   - Mooie afbeeldingen automatisch gegenereerd
   - Direct gepubliceerd op WordPress
   - Social media post voor Facebook/Instagram

**Zonder ook maar 1 keer iets te hoeven doen!** 🎯

## Troubleshooting

**Affiliate links worden niet toegevoegd?**
- Check of je affiliate links hebt toegevoegd aan het project
- Controleer of de "Affiliate links uit project" optie aan staat
- Verbeter de keywords en beschrijving van je links voor betere matching

**Planning draait niet?**
- Check of de planning actief is (groene toggle)
- Controleer of er genoeg credits zijn
- Kijk of WordPress correct geconfigureerd is

**Te veel/te weinig affiliate links?**
- De AI selecteert automatisch 3-5 links per artikel
- Verbeter de metadata van je links voor betere selectie
- Voeg meer diverse links toe voor betere keuze

## Credits Gebruik
- **Blog post**: 50 credits per artikel
- **Affiliate link selectie**: Gebruikt AI (inbegrepen in blog credits)
- **Bol.com producten**: Gratis (geen extra credits)
- **Afbeeldingen**: Inbegrepen in blog credits

---

**Belangrijk**: De Autopilot blijft automatisch doorlopen totdat je deze pauzeer of verwijdert. Perfect voor hands-off content marketing! 🚀
