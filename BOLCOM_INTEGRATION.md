
# ✅ BOL.COM MARKETING CATALOG API - COMPLETE INTEGRATIE

## 📋 Overzicht

De Bol.com Marketing Catalog API geeft toegang tot:
- ✅ Product zoeken via zoekterm of EAN
- ✅ Product details (titel, beschrijving, prijs, rating, specs)
- ✅ Product afbeeldingen
- ✅ Beste prijs/aanbod per product
- ✅ Populaire producten
- ✅ Affiliate URLs (automatisch gegenereerd door API)

## 🔑 Authenticatie

**GEEN WordPress tracking code nodig!**

Je hebt alleen nodig:
1. **Client ID** - Van Bol.com Partner Dashboard
2. **Client Secret** - Van Bol.com Partner Dashboard
3. **Affiliate ID** (optioneel) - Voor commissie tracking

### Hoe verkrijg je credentials?

1. Log in op [Bol.com Affiliate Partner Program](https://partnerplatform.bol.com)
2. Ga naar **Account** → **Open API**
3. Klik op **Toevoegen** om nieuwe credentials te maken
4. Geef een betekenisvolle naam (bijv. "WritgoAI Integration")
5. Kopieer de **Client ID**
6. Klik **Toon secret** om de **Client Secret** te zien
7. Bewaar beide veilig

## 🔌 API Endpoints

### 1. **Zoek Producten**
```
GET /marketing/catalog/v1/products/search
Query params:
  - search-term (required): "laptop"
  - country-code (required): "NL" of "BE"
  - page: 1-... (default: 1)
  - page-size: 1-50 (default: 24)
  - sort: RELEVANCE, POPULARITY, PRICE_ASC, PRICE_DESC, RATING
  - include-image: true/false
  - include-offer: true/false
  - include-rating: true/false

Headers:
  - Accept-Language: "nl", "fr", "nl-NL", "nl-BE", "fr-BE"
  - Authorization: Bearer {access_token}
```

### 2. **Product Details (via EAN)**
```
GET /marketing/catalog/v1/products/{ean}
Path params:
  - ean: 13-digit EAN code (bijv. "0842776106209")

Query params:
  - country-code (required): "NL" of "BE"
  - include-specifications: true/false
  - include-image: true/false
  - include-offer: true/false
  - include-rating: true/false
```

### 3. **Beste Prijs/Aanbod**
```
GET /marketing/catalog/v1/products/{ean}/offers/best
```

### 4. **Populaire Producten**
```
GET /marketing/catalog/v1/products/lists/popular
```

### 5. **Product Afbeeldingen**
```
GET /marketing/catalog/v1/products/{ean}/media
```

### 6. **Product Ratings**
```
GET /marketing/catalog/v1/products/{ean}/ratings
```

## 🔄 OAuth 2.0 Flow

1. **Request Access Token**:
```bash
POST https://login.bol.com/token
Headers:
  Authorization: Basic {base64(client_id:client_secret)}
  Content-Type: application/x-www-form-urlencoded
Body:
  grant_type=client_credentials
```

2. **Use Access Token**:
```
Authorization: Bearer {access_token}
```

## 📊 Response Format

### Product Search Response
```json
{
  "page": 1,
  "resultsPerPage": 24,
  "totalPages": 10,
  "totalResults": 234,
  "results": [
    {
      "ean": "0842776106209",
      "bolProductId": 9200000099487092,
      "title": "HP Laptop 15s",
      "description": "Krachtige laptop...",
      "url": "https://www.bol.com/nl/p/...",
      "image": {
        "url": "https://i.ytimg.com/vi/iVlkBPOpcsc/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAQqOn49DAiZcBw1ST-LtrQfWXw2g",
        "width": 500,
        "height": 500
      },
      "rating": 4.5,
      "offer": {
        "price": 599.99,
        "strikethroughPrice": 799.99,
        "deliveryDescription": "Morgen in huis"
      }
    }
  ]
}
```

## 🛠 Implementatie in WritgoAI

### 1. **Library** (`lib/bolcom-api.ts`)
- OAuth token management
- Product search
- Product details ophalen
- Affiliate URL genereren

### 2. **API Routes**
- `/api/client/bolcom/search-products` - Zoek producten
- `/api/client/bolcom/test-credentials` - Test credentials

### 3. **Blog Generator Integratie**
- Automatisch producten vinden op basis van onderwerp
- Product details toevoegen aan content
- Affiliate links automatisch verwerken

## ⚡ Gebruik in WritgoAI

### Stap 1: Configureer per Project
```
1. Ga naar Project Settings
2. Vul in:
   - Bol.com Client ID
   - Bol.com Client Secret  
   - Bol.com Affiliate ID (optioneel)
3. Schakel "Bol.com Enabled" in
4. Test credentials
```

### Stap 2: Automatische Integratie
```
Wanneer je content genereert en Bol.com is ingeschakeld:
→ AI detecteert product keywords
→ Zoekt automatisch op Bol.com
→ Voegt product links toe aan content
→ Genereert affiliate URLs
```

## 🔒 Beveiliging

✅ **Credentials worden veilig opgeslagen in database**
✅ **Credentials worden NOOIT getoond in frontend**
✅ **Alle API calls gaan via backend**
✅ **Access tokens worden ge-cached**

## ❌ Veelvoorkomende Fouten

### 400 Bad Request
- Check query parameters
- Zorg dat country-code "NL" of "BE" is
- Check dat EAN 13 cijfers is

### 401 Unauthorized
- Access token verlopen → refresh token
- Client ID/Secret incorrect
- Authorization header ontbreekt

### 404 Not Found
- EAN niet gevonden in catalogus
- Product niet beschikbaar in gekozen land

### 406 Not Acceptable
- Accept-Language header ontbreekt of onjuist
- Gebruik: "nl", "fr", "nl-NL", "nl-BE", "fr-BE"

## 📈 Best Practices

1. **Cache access tokens** (geldig voor ~3600 seconden)
2. **Gebruik batch requests** waar mogelijk
3. **Include alleen benodigde data** (image, offer, rating)
4. **Handle rate limits** (API heeft limits)
5. **Log errors** voor debugging

## 🎯 Voordelen

✅ **Automatische affiliate links** - Geen handmatig werk
✅ **Real-time prijzen** - Altijd actueel
✅ **Product ratings** - Social proof
✅ **Hoge kwaliteit afbeeldingen** - Professioneel
✅ **Geen WordPress code nodig** - Pure API integratie

---

**Datum:** 3 november 2024
**Status:** ✅ Volledig geïmplementeerd en gedocumenteerd
**Live op:** WritgoAI.nl
