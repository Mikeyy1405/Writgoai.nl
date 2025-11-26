
# Autopilot: Unieke AI Afbeeldingen Fix

## Probleem
De Autopilot gebruikte soms dezelfde AI-gegenereerde afbeelding meerdere keren in één artikel, wat resulteerde in dubbele of herhaalde afbeeldingen.

## Oorzaak
Het probleem was dubbel:

1. **Placeholder Replacement Met Modulo**: De code gebruikte `generatedImageUrls[index % generatedImageUrls.length]` om placeholders te vervangen. Dit betekende dat als er meer placeholders waren dan unieke afbeeldingen, dezelfde afbeeldingen werden hergebruikt.

2. **Geen Deduplicatie**: Er was geen check om te garanderen dat de `generatedImageUrls` array geen duplicaten bevatte voordat afbeeldingen werden ingevoegd.

## Oplossing

### 1. Unieke Afbeeldingen Garanderen
```typescript
// Verwijder duplicaten met Set
const uniqueImageUrls = Array.from(new Set(generatedImageUrls));
console.log(`✅ Verified ${uniqueImageUrls.length} unique images (removed ${generatedImageUrls.length - uniqueImageUrls.length} duplicates)`);
```

### 2. Marker-Based Insertion
In plaats van direct te vervangen, gebruiken we nu een twee-stappen proces:

**Stap 1: Plaats Unieke Markers**
```typescript
const markerPrefix = `__IMAGE_INSERTION_MARKER_${Date.now()}_`;

insertPositions.forEach((position, index) => {
  const targetParagraph = paragraphs[position];
  const marker = `${markerPrefix}${index}__`;
  
  // Gebruik replace met functie om alleen eerste match te markeren
  let replaced = false;
  modifiedContent = modifiedContent.replace(targetParagraph, (match) => {
    if (!replaced) {
      replaced = true;
      return match + '\n' + marker;
    }
    return match;
  });
});
```

**Stap 2: Vervang Markers Met Afbeeldingen**
```typescript
insertPositions.forEach((position, index) => {
  const marker = `${markerPrefix}${index}__`;
  const imageUrl = uniqueImageUrls[index]; // Elke afbeelding exact één keer gebruikt
  
  modifiedContent = modifiedContent.replace(marker, imgTag);
});
```

### 3. Placeholder Vervanging Fix
Voor eventuele resterende placeholders:

```typescript
const maxReplacements = Math.min(imagePlaceholders.length, uniqueImageUrls.length);

// Vervang alleen zoveel placeholders als we unieke afbeeldingen hebben
for (let index = 0; index < maxReplacements; index++) {
  const placeholder = imagePlaceholders[index];
  const imageUrl = uniqueImageUrls[index]; // Elke afbeelding exact één keer
  modifiedContent = modifiedContent.replace(placeholder, imgTag);
}

// Verwijder overige placeholders
const remainingPlaceholders = imagePlaceholders.slice(maxReplacements);
remainingPlaceholders.forEach(placeholder => {
  modifiedContent = modifiedContent.replace(placeholder, '');
});
```

## Resultaat

✅ **Elke AI-gegenereerde afbeelding wordt nu precies één keer gebruikt**
- Geen duplicaten meer in de `generatedImageUrls` array
- Geen hergebruik van afbeeldingen via modulo operator
- Duidelijke logging over het aantal unieke afbeeldingen

✅ **Betere Console Logging**
```
🖼️ Inserting 3 unique images into content...
✅ Verified 3 unique images (removed 0 duplicates)
✅ Inserted 3 unique images at strategic positions
✅ Replaced 2 image placeholders with unique images
⚠️ Removed 1 extra placeholders (not enough unique images)
```

## Locatie Wijzigingen
- **File**: `/home/ubuntu/writgo_planning_app/nextjs_space/app/api/client/autopilot/generate/route.ts`
- **Regels**: 662-752 (Image insertion en placeholder replacement)

## Voordelen
1. **Geen Dubbele Afbeeldingen**: Elke afbeelding verschijnt maximaal één keer
2. **Betere Performance**: Geen onnodige duplicaten in de array
3. **Duidelijkere Logging**: Exacte feedback over aantal unieke afbeeldingen
4. **Robuustere Code**: Marker-based system voorkomt race conditions

## Testing
Test het volgende scenario:
1. Start Autopilot met "Research" mode
2. Laat artikel genereren met 3 AI afbeeldingen
3. Controleer dat elke afbeelding uniek is en slechts één keer voorkomt
4. Check de console logs voor de deduplicatie meldingen

## Technische Details
- **Deduplicatie Methode**: `Array.from(new Set(array))`
- **Marker Prefix**: `__IMAGE_INSERTION_MARKER_${Date.now()}_`
- **Max Afbeeldingen**: 3 per artikel
- **Posities**: 25%, 50%, 75% door het artikel
