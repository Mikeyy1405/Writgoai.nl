# DataForSEO API Notes

## Authentication
- Basic Auth met login en password
- Credentials van https://app.dataforseo.com/api-access

## Keywords For Keywords API
- Endpoint: `POST https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live`
- Max 20 keywords per request
- Max 12 requests per minute
- Returns up to 20,000 keyword suggestions per request

### Request Parameters
- `keywords`: array (required, max 20)
- `location_code`: integer (optional, e.g., 2528 for Netherlands)
- `language_code`: string (optional, e.g., "nl" for Dutch)
- `sort_by`: relevance, search_volume, competition_index, low_top_of_page_bid, high_top_of_page_bid

### Response Fields
- `keyword`: the keyword
- `search_volume`: monthly average searches
- `competition`: LOW, MEDIUM, HIGH
- `competition_index`: 0-100
- `cpc`: cost per click in USD
- `low_top_of_page_bid`: min bid for top ad
- `high_top_of_page_bid`: max bid for top ad
- `monthly_searches`: array with year, month, search_volume

## Environment Variables Needed
```
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password
```

## Location Codes
- Netherlands: 2528
- Belgium: 2056
- Germany: 2276
- United Kingdom: 2826
- United States: 2840

## Language Codes
- Dutch: nl
- English: en
- German: de
- French: fr
