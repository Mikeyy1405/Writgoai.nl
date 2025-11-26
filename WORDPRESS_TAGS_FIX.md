
# WordPress Tags Publishing Fix

## Probleem

Bij het publiceren van artikelen naar WordPress kreeg je de volgende fout:

```
WordPress API error: 400 - {"code":"rest_invalid_param","message":"Ongeldige parameter(s): tags","data":{"status":400,"params":{"tags":"tags[0] is niet van het type integer."}}}
```

Deze fout trad op omdat de WordPress REST API **tag IDs** (integers) verwacht, maar de applicatie **tag namen** (strings) stuurde.

## Oplossing

### 1. Nieuwe functie: `convertTagNamesToIds`

Er is een nieuwe helper functie toegevoegd in `lib/wordpress-publisher.ts` die:

1. **Zoekt naar bestaande tags** via de WordPress API
2. **Maakt nieuwe tags aan** als ze nog niet bestaan
3. **Retourneert tag IDs** die door de WordPress API geaccepteerd worden

```typescript
async function convertTagNamesToIds(
  config: WordPressConfig,
  tagNames: string[]
): Promise<number[]>
```

### 2. Verbeterde `publishToWordPress` functie

De functie controleert nu automatisch of tags strings (namen) of numbers (IDs) zijn:

- **Strings (namen)**: Worden automatisch geconverteerd naar IDs
- **Numbers (IDs)**: Worden direct gebruikt
- **Mix van beide**: Beide worden correct verwerkt

```typescript
// Separate string tags from numeric tags
const stringTags = article.tags.filter(tag => typeof tag === 'string') as string[];
const numericTags = article.tags.filter(tag => typeof tag === 'number') as number[];

// Convert string tags to IDs
if (stringTags.length > 0) {
  const convertedIds = await convertTagNamesToIds(config, stringTags);
  tagIds.push(...convertedIds);
}

// Add numeric tags (already IDs)
if (numericTags.length > 0) {
  tagIds.push(...numericTags);
}
```

### 3. TypeScript interface update

Het `PublishArticleOptions` interface ondersteunt nu beide formaten:

```typescript
interface PublishArticleOptions {
  // ... andere velden
  tags?: (string | number)[]; // Kan tag namen (strings) of tag IDs (numbers) zijn
}
```

## Voordelen

✅ **Automatische conversie**: Tags worden automatisch geconverteerd van namen naar IDs  
✅ **Intelligente tag aanmaak**: Tags die nog niet bestaan worden automatisch aangemaakt  
✅ **Backwards compatible**: Ondersteunt zowel tag namen als IDs  
✅ **Betrouwbaar**: Uitgebreide error handling en logging  
✅ **Case-insensitive matching**: Tags worden correct gematcht ongeacht hoofdlettergebruik

## Gebruikersimpact

Gebruikers kunnen nu gewoon tag namen invoeren (bijvoorbeeld: "SEO", "Marketing", "Tips") en deze worden automatisch:
1. Opgezocht in WordPress
2. Aangemaakt als ze nog niet bestaan
3. Gekoppeld aan het artikel met de juiste IDs

## Technische details

### Tag lookup proces

1. **Search API call**: `GET /wp-json/wp/v2/tags?search={tagName}`
2. **Exact match check**: Case-insensitive vergelijking van tag namen
3. **Create if missing**: `POST /wp-json/wp/v2/tags` met tag naam
4. **Return ID**: De tag ID wordt toegevoegd aan de lijst

### Logging

De conversie wordt gelogd voor debugging:
```
Converting tag names to IDs: ["SEO", "Marketing", "Tips"]
Converted tag IDs: [42, 15, 8]
```

## Deployment

✅ **Live op WritgoAI.nl** sinds vandaag  
✅ **Tested & verified**: Alle WordPress publicaties werken nu correct  
✅ **Database compatible**: Geen database wijzigingen nodig

---

*Laatste update: 1 november 2025*
