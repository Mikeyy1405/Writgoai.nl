# Media Bibliotheek

Een complete media library voor het uploaden, beheren en hergebruiken van afbeeldingen en video's in Writgo.ai.

## Functies

### ✅ Geïmplementeerd

- **Upload Media**: Upload afbeeldingen (JPG, PNG, WebP, GIF) en video's (MP4, WebM, MOV)
- **Media Beheer**: Bekijk, zoek, filter en verwijder media
- **Metadata**: Voeg titels, beschrijvingen, alt-text en tags toe
- **URL Kopiëren**: Kopieer direct de permanente URL van geüploade media
- **Preview**: Bekijk afbeeldingen en video's met een gedetailleerde modal
- **Zoeken & Filteren**: Zoek op titel, beschrijving of bestandsnaam, filter op type (afbeelding/video)
- **Media Picker**: Herbruikbare component om media te selecteren uit de bibliotheek

## Database Schema

De media library gebruikt de bestaande `media` tabel met uitbreidingen:

```sql
-- Nieuwe velden voor user uploads
user_id UUID              -- Eigenaar van de media
filename VARCHAR(255)     -- Originele bestandsnaam
mime_type VARCHAR(100)    -- MIME type (image/png, video/mp4, etc.)
storage_path TEXT         -- Pad in Supabase Storage
uploaded_at TIMESTAMP     -- Upload datum
title VARCHAR(255)        -- Media titel
description TEXT          -- Beschrijving
tags TEXT[]              -- Tags voor organisatie
```

## API Endpoints

### Upload Media
```
POST /api/media-library/upload
Content-Type: multipart/form-data

Body:
- file: File (required)
- title: string
- description: string
- altText: string
- tags: string (comma-separated)

Response:
{
  "success": true,
  "media": { ... }
}
```

### Lijst Ophalen
```
GET /api/media-library?type=image&search=logo&limit=50&offset=0

Response:
{
  "media": [...],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

### Media Ophalen
```
GET /api/media-library/[id]

Response:
{
  "media": { ... }
}
```

### Media Updaten
```
PATCH /api/media-library/[id]

Body:
{
  "title": "Nieuwe titel",
  "description": "Nieuwe beschrijving",
  "alt_text": "Alt text",
  "tags": ["tag1", "tag2"]
}
```

### Media Verwijderen
```
DELETE /api/media-library/[id]

Response:
{
  "success": true,
  "message": "Media deleted successfully"
}
```

## Components

### MediaLibrary
Volledig dashboard component voor media beheer.

```tsx
import MediaLibrary from '@/components/MediaLibrary';

<MediaLibrary />
```

### MediaUpload
Upload component met preview en metadata velden.

```tsx
import MediaUpload from '@/components/MediaUpload';

<MediaUpload onUploadComplete={() => console.log('Upload complete!')} />
```

### MediaPicker
Modal component voor het selecteren van media uit de bibliotheek.

```tsx
import MediaPicker from '@/components/MediaPicker';

<MediaPicker
  type="image"  // 'image', 'video', of 'all'
  onSelect={(url) => console.log('Selected:', url)}
  onClose={() => setShowPicker(false)}
/>
```

## Storage

Media wordt opgeslagen in Supabase Storage bucket: `media-library`

- **Afbeeldingen**: Max 10MB
- **Video's**: Max 50MB
- **Structuur**: `{type}/{year}/{month}/{user_id}/{timestamp}_{filename}`

Voorbeeld: `images/2024/12/user-id-123/1703001234567_logo.png`

## Toegang

De media library is toegankelijk voor alle ingelogde gebruikers via:

```
/dashboard/media-library
```

## Row Level Security (RLS)

- Users kunnen alleen hun eigen media bekijken, bewerken en verwijderen
- Service role heeft volledige toegang voor systeem operaties

## Database Migratie

Voer de volgende migratie uit om de media library te activeren:

```bash
psql -U postgres -d writgo -f supabase_media_library_migration.sql
```

Of via de Supabase dashboard SQL editor.

## Gebruik Voorbeelden

### Logo Uploaden
1. Ga naar `/dashboard/media-library`
2. Klik op "+ Upload Media"
3. Selecteer je logo bestand
4. Voeg een titel toe (bijv. "Bedrijfslogo")
5. Voeg alt-text toe voor toegankelijkheid
6. Klik "Upload"
7. Kopieer de URL uit de detail modal

### Media Selecteren in BrandingSettings
Update `components/BrandingSettings.tsx` om MediaPicker te gebruiken:

```tsx
import MediaPicker from './MediaPicker';

const [showMediaPicker, setShowMediaPicker] = useState(false);

// In JSX:
<button onClick={() => setShowMediaPicker(true)}>
  Selecteer uit Bibliotheek
</button>

{showMediaPicker && (
  <MediaPicker
    type="image"
    onSelect={(url) => {
      setLogoUrl(url);
      setShowMediaPicker(false);
    }}
    onClose={() => setShowMediaPicker(false)}
  />
)}
```

## Toekomstige Uitbreidingen

- [ ] Bulk upload
- [ ] Image editing (crop, resize)
- [ ] Folders/collecties voor organisatie
- [ ] Delen tussen gebruikers
- [ ] CDN integratie
- [ ] Automatische image optimization
- [ ] Video thumbnails
- [ ] Drag & drop upload
