
# Product Lijst Layout Fix - Gestructureerde Product Weergave

## Probleem
Bij "beste [product]" artikelen werden producten gegenereerd als doorlopende tekst in plaats van een gestructureerde lijst met duidelijke layout. 

**Voor (fout):**
```
1. Inventum VWM5001W: de compacte alleskunner
De Inventum VWM5001W is een uitstekend voorbeeld van een wasmachine die klein van 
stuk is, maar groots in prestaties. Met een breedte van slechts 51 cm... [lange tekst]
Voordelen: Goede capaciteit voor zijn formaat, veel wasprogramma's...
```

**Na (correct):**
```html
<h2>1. Inventum VWM5001W</h2>
<img src="..." alt="..." style="..." />
<p>Korte beschrijving van 2-3 zinnen</p>
<h3>Voordelen</h3>
<ul>
  <li>Voordeel 1</li>
  <li>Voordeel 2</li>
  <li>Voordeel 3</li>
</ul>
<h3>Nadelen</h3>
<ul>
  <li>Nadeel 1</li>
  <li>Nadeel 2</li>
</ul>
<p><a href="..." style="...">Bekijk beste prijs →</a></p>
```

## Oplossing

### Exacte HTML Template
Iedere product in een "beste [product]" artikel moet exact deze structuur volgen:

```html
<h2>[NUMMER]. [PRODUCTNAAM]</h2>

<img src="[PRODUCT_IMAGE_URL]" alt="[PRODUCTNAAM]" 
     style="width: 100%; max-width: 550px; height: auto; border-radius: 8px; margin: 24px 0;" />

<p>[KORTE BESCHRIJVING - Maximaal 2-3 zinnen over waarom dit product goed is]</p>

<h3>Voordelen</h3>
<ul>
  <li>[Voordeel 1]</li>
  <li>[Voordeel 2]</li>
  <li>[Voordeel 3]</li>
</ul>

<h3>Nadelen</h3>
<ul>
  <li>[Nadeel 1]</li>
  <li>[Nadeel 2]</li>
</ul>

<p style="margin: 24px 0;">
  <a href="[AFFILIATE_URL]" target="_blank" rel="noopener noreferrer sponsored" 
     style="display: inline-block; background: #3b82f6; color: white; 
            padding: 12px 24px; border-radius: 6px; text-decoration: none; 
            font-weight: 600;">Bekijk beste prijs →</a>
</p>
```

### Volgorde van Elementen

**Correcte structuur voor ELK product:**
1. ✅ **H2** - Genummerde titel (bijv. "1. Inventum VWM5001W")
2. ✅ **IMG** - Product afbeelding direct na titel
3. ✅ **P** - Korte beschrijving (2-3 zinnen max)
4. ✅ **H3** - "Voordelen" heading
5. ✅ **UL** - Bullet lijst met voordelen
6. ✅ **H3** - "Nadelen" heading
7. ✅ **UL** - Bullet lijst met nadelen
8. ✅ **P + A** - Styled button met affiliate link

**Verboden:**
- ❌ Doorlopende tekst zonder structuur
- ❌ Product boxes met fancy styling
- ❌ Complexe div containers
- ❌ Afbeeldingen in de tekst zelf
- ❌ "Prijs:" labels
- ❌ Voordelen/nadelen als gewone tekst

## Implementatie

### Bestand: `/lib/aiml-agent.ts`

**Locatie:** Regel 817-948 (productListSection)

**Wat is aangepast:**

1. **Visual Separators toegevoegd:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**EXACTE HTML TEMPLATE - KOPIEER DIT LETTERLIJK VOOR ELK PRODUCT:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

2. **Volledig voorbeeld toegevoegd:**
- Concreet voorbeeld met Inventum VWM5001W
- Laat exact zien hoe de HTML eruit moet zien
- Inclusief alle styling en attributen

3. **Verboden lijst toegevoegd:**
```
🚫 VERBODEN:
❌ GEEN doorlopende tekst zoals: "De Inventum VWM5001W is..."
❌ GEEN <div> containers met fancy styling
❌ GEEN product boxes met gradient backgrounds
❌ GEEN afbeeldingen in de tekst zelf
❌ GEEN "Prijs:" labels
```

4. **Strikter instructies:**
```
**ALLERLAATSTE WAARSCHUWING:**
Als je NIET exact deze structuur volgt, is het artikel ONBRUIKBAAR.
Kopieer letterlijk de HTML template en vul alleen de [PLACEHOLDERS] in.
GEEN creatieve vrijheid - EXACT deze layout!
```

5. **Visuele product data:**
```
━━━ PRODUCT 1 ━━━
Naam: Inventum VWM5001W
Afbeelding URL: https://www.polytronicacuracao.com/wp-content/uploads/2024/09/VWM9010W.png
Prijs: €349.00
Affiliate Link: https://media.s-bol.com/mMZ1Dj5nOLLA/jqQkX1Y/860x1200.jpg

✅ Voordelen:
  • Compact formaat
  • 15 wasprogramma's
  
❌ Nadelen:
  • Gemiddeld geluid
```

## Artikel Structuur

Voor een "beste [product]" artikel:

```
1️⃣ Introductie (2-3 paragrafen)

2️⃣ H2: "De beste [product] van 2025"

3️⃣ Product 1:
   - H2: "1. [Productnaam]"
   - IMG: Product afbeelding
   - P: Korte beschrijving
   - H3: Voordelen
   - UL: Voordelen lijst
   - H3: Nadelen
   - UL: Nadelen lijst
   - P + A: Affiliate link button

4️⃣ Product 2:
   [Herhaal dezelfde structuur]

5️⃣ Product 3:
   [Herhaal dezelfde structuur]

...

6️⃣ Extra secties:
   - Koopgids
   - FAQ
   - Conclusie
```

## Styled Button voor Affiliate Links

Elke product krijgt een mooie call-to-action button:

```html
<p style="margin: 24px 0;">
  <a href="[AFFILIATE_URL]" 
     target="_blank" 
     rel="noopener noreferrer sponsored" 
     style="display: inline-block; 
            background: #3b82f6; 
            color: white; 
            padding: 12px 24px; 
            border-radius: 6px; 
            text-decoration: none; 
            font-weight: 600;">
    Bekijk beste prijs →
  </a>
</p>
```

**Styling:**
- Blauwe achtergrond (#3b82f6)
- Witte tekst
- 12px padding verticaal, 24px horizontaal
- 6px border-radius voor afgeronde hoeken
- Display inline-block voor button effect
- Font-weight 600 voor bold tekst
- 24px margin voor ruimte rondom

## Product Afbeeldingen

**Vereisten:**
- ✅ Gebruik ECHTE Bol.com product afbeeldingen
- ✅ Maximale breedte: 550px
- ✅ Width: 100% (responsive)
- ✅ Height: auto (behoud aspect ratio)
- ✅ Border-radius: 8px (afgeronde hoeken)
- ✅ Margin: 24px boven en onder
- ✅ Alt tekst met productnaam

**Voorbeeld:**
```html
<img src="https://i.ytimg.com/vi/VKq3U9dcVmY/maxresdefault.jpg" 
     alt="Inventum VWM5001W compacte wasmachine" 
     style="width: 100%; max-width: 550px; height: auto; 
            border-radius: 8px; margin: 24px 0;" />
```

## Voor/Nadelen Lijsten

**Format:**
- Gebruik `<ul>` voor unordered lists
- Elk voor/nadeel is een `<li>` element
- Geen nummering (bullets zijn automatisch)
- Kort en krachtig per punt

**Voorbeeld:**
```html
<h3>Voordelen</h3>
<ul>
  <li>Compact formaat past overal</li>
  <li>15 verschillende wasprogramma's</li>
  <li>Energielabel D (redelijk zuinig)</li>
  <li>Snel 15-minuten programma</li>
</ul>

<h3>Nadelen</h3>
<ul>
  <li>Gemiddeld geluidsniveau (76 dB)</li>
  <li>Beperkte capaciteit van 5 kg</li>
</ul>
```

## Waar Werkt Dit

Deze fix is automatisch actief in:
- ✅ **Manual Writer** (Blog Generator)
- ✅ **Writgo Writer** (Manual + Autopilot modes)
- ✅ **Autopilot Content Generation** (beide modes)
- ✅ Alle artikelen met "beste [product]" in de titel

**Detectie:**
De AI detecteert automatisch wanneer een artikel een productlijst nodig heeft en past de correcte template toe.

## SEO & UX Voordelen

### SEO:
✅ **Gestructureerde data** - Zoekmachines zien duidelijke product informatie  
✅ **Schema markup ready** - Makkelijk om later structured data toe te voegen  
✅ **Clean HTML** - Snelle laadtijden, geen overbodige code  
✅ **Heading hierarchy** - Goede H2/H3 structuur voor SEO  

### UX:
✅ **Scannable** - Gebruikers zien direct voor/nadelen  
✅ **Visueel aantrekkelijk** - Afbeeldingen en buttons trekken aandacht  
✅ **Consistent** - Elk product heeft dezelfde layout  
✅ **Actionable** - Duidelijke call-to-action buttons  
✅ **Mobile-friendly** - Responsive afbeeldingen en layout  

## Testing

Test de fix met deze stappen:

1. **Maak nieuw artikel:**
   - Titel: "7 beste compacte wasmachines voor kleine ruimtes onder €500"
   - Keywords: "compacte wasmachine, kleine wasmachine"
   - Start generatie

2. **Check de output:**
   - ✅ Elk product heeft een H2 met nummer
   - ✅ Afbeelding direct na H2
   - ✅ Korte beschrijving (max 3 zinnen)
   - ✅ H3 "Voordelen" met UL lijst
   - ✅ H3 "Nadelen" met UL lijst
   - ✅ Styled button "Bekijk beste prijs"

3. **Valideer HTML:**
   - Geen doorlopende tekst
   - Geen fancy boxes
   - Clean, simpele structuur
   - Alle afbeeldingen zichtbaar

4. **Test affiliate links:**
   - ✅ Elke product heeft werkende affiliate link
   - ✅ Links openen in nieuw tabblad
   - ✅ rel="sponsored" attributen aanwezig

## Voorbeelden

### ✅ CORRECT:
```html
<h2>1. Inventum VWM5001W</h2>
<img src="..." style="..." />
<p>Compacte wasmachine met 5 kg capaciteit. Ideaal voor kleine huishoudens.</p>
<h3>Voordelen</h3>
<ul>
  <li>Compact formaat (51 cm)</li>
  <li>15 wasprogramma's</li>
</ul>
<h3>Nadelen</h3>
<ul>
  <li>Geluidsniveau 76 dB</li>
</ul>
<p><a href="..." style="...">Bekijk beste prijs →</a></p>
```

### ❌ FOUT (zoals voorheen):
```
1. Inventum VWM5001W: de compacte alleskunner
De Inventum VWM5001W is een uitstekend voorbeeld van een wasmachine 
die klein van stuk is, maar groots in prestaties. Met een breedte 
van slechts 51 cm... [lange doorlopende tekst]
Voordelen: Goede capaciteit, veel programma's
```

## Troubleshooting

### Probleem: AI maakt nog steeds doorlopende tekst
**Oplossing:** 
- Check of `productList` correct wordt doorgegeven
- Verifieer dat de titel "beste" of "top" bevat
- Kijk of de product data volledig is (pros, cons, image)

### Probleem: Afbeeldingen worden niet getoond
**Oplossing:**
- Controleer of Bol.com image URL's geldig zijn
- Check of er geen CORS issues zijn
- Verifieer dat `product.image.url` bestaat

### Probleem: Buttons zien er niet goed uit
**Oplossing:**
- Check of de inline CSS correct is toegepast
- Verifieer dat er geen conflicterende WordPress CSS is
- Test in verschillende browsers

## Conclusie

Met deze fix krijgen "beste [product]" artikelen een **consistente, professionele en gebruiksvriendelijke layout** die:
- ✅ Makkelijk te scannen is voor bezoekers
- ✅ Duidelijk voor/nadelen toont per product
- ✅ Call-to-action buttons heeft voor conversie
- ✅ SEO-vriendelijk is met goede heading structuur
- ✅ Mobile-responsive is
- ✅ Affiliate links correct integreert

De AI volgt nu **strikte instructies** en krijgt een **exact template** die letterlijk gekopieerd moet worden, zonder creatieve vrijheid.

🎯 **Status: Geïmplementeerd en getest**  
📅 **Datum: 7 november 2025**  
✅ **Werkend voor alle "beste [product]" artikelen**
