# Niche Detection Improvements

## Problem Statement
The AI content plan generator was unable to correctly identify specific product niches from websites. For example, when analyzing https://purepflege.de/ (a German shampoo/haircare e-commerce site), the AI would fail to recognize that the site is about "Shampoo" or "Haarverzorging" (haircare), instead potentially categorizing it with generic terms.

## Root Cause Analysis
1. **Limited content extraction**: The website scraping only extracted basic elements (title, meta description, headings)
2. **Generic prompts**: The AI prompts didn't emphasize analyzing products and services
3. **Weak product signals**: E-commerce product information wasn't being extracted
4. **No keyword analysis**: Frequently occurring words that indicate niche weren't analyzed

## Solution Implemented

### 1. Enhanced Website Content Scraping
**File: `app/api/simple/generate-content-plan-background/route.ts`**

Added comprehensive content extraction:

```typescript
let contentSignals = {
  products: [] as string[],
  categories: [] as string[],
  keywords: [] as string[],
};
```

**New Extraction Features:**
- **Product titles**: Extracts product names using common e-commerce HTML patterns
  - Checks for class names containing "product"
  - Looks in h2, h3, div, a, and span elements
  - Filters out short/invalid entries
  
- **Category navigation**: Extracts category names from navigation menus
  - Searches nav, ul, and div elements with "category" classes
  - Extracts link text from category sections
  
- **Meta information**: Extracts additional metadata
  - Meta keywords tag
  - Open Graph title and description
  - H3 headings (in addition to H1/H2)
  
- **Word frequency analysis**: Identifies key topics
  - Analyzes main text content (8000 chars vs 5000 previously)
  - Counts word frequencies
  - Filters out stop words in multiple languages (Dutch, German, English)
  - Returns top 20 most frequent words

**Result**: Richer context with products, categories, and keywords explicitly listed for the AI to analyze.

### 2. Improved Perplexity AI Prompt
**File: `app/api/simple/generate-content-plan-background/route.ts`**

Enhanced the prompt to be more explicit about niche detection:

**Key Changes:**
```
KRITIEKE INSTRUCTIES: 
- Focus op WAT de website verkoopt of over schrijft (producten, diensten, hoofdonderwerpen)
- Als de website shampoo, haarverzorging of cosmetica verkoopt, is de niche "Haarverzorging"
- NOOIT generieke termen zoals "Content Marketing", "E-commerce" of "Online Shop"
- Bepaal de niche op basis van de PRODUCTEN/DIENSTEN/CONTENT, niet technologie
```

**Examples Added:**
- ✅ Good: "Natuurlijke Haarverzorging", "Biologische Cosmetica", "Yoga"
- ❌ Bad: "E-commerce", "Online Shop", "Content Marketing"

**Scraped Content Integration:**
```typescript
${websiteContent ? `\nHier is extra context die ik heb verzameld van de website:\n${websiteContent}\n` : ''}
```

The prompt now includes:
- Products list
- Categories list  
- Frequently occurring keywords
- More comprehensive text preview

### 3. Enhanced Perplexity System Prompt
**File: `lib/ai-client.ts`**

Updated the system prompt to focus on products/services:

**Before:**
```typescript
'Je bent een expert in het analyseren van websites en het bepalen van hun niche, doelgroep en branche.'
```

**After:**
```typescript
'Je bent een expert in het analyseren van websites en het identificeren van hun niche op basis van PRODUCTEN, DIENSTEN en CONTENT. Focus altijd op: (1) Welke producten worden verkocht, (2) Welke diensten worden aangeboden, (3) Waar gaat de content over. Geef specifieke niches zoals "Natuurlijke Haarverzorging" - NOOIT generieke termen zoals "E-commerce".'
```

### 4. Improved Fallback Detection (Claude)
**File: `app/api/simple/generate-content-plan-background/route.ts`**

When Perplexity fails, the fallback now uses the same improved prompting strategy:

- Same emphasis on products/services/content
- Same examples of good vs bad niches
- Same rich context from scraped content
- Lower temperature (0.3 vs 0.5) for more consistent results

**Updated System Prompt:**
```typescript
'Je bent een SEO expert die websites analyseert op basis van hun PRODUCTEN en DIENSTEN, niet op basis van technologie.'
```

## Expected Impact

### For https://purepflege.de/
The system should now:
1. Extract product names containing "Shampoo", "Haarpflege", etc.
2. Identify categories like "Haarpflege", "Shampoo"
3. Recognize frequent words: "haar", "pflege", "shampoo", "natürlich"
4. Correctly classify niche as "Natuurlijke Haarverzorging" or "Haarverzorging" or "Shampoo"

### For Other Sites
- **E-commerce sites**: Will correctly identify product niches instead of "E-commerce"
- **Service sites**: Will identify specific services (e.g., "Yoga Lessen" not "Online Services")
- **Content sites**: Will identify content topics (e.g., "Recepten" not "Blog")

## Testing Recommendations

To validate these changes:

1. **Test with original problem site**:
   - URL: https://purepflege.de/
   - Expected niche: "Haarverzorging", "Natuurlijke Shampoo", or similar
   - Should NOT return: "E-commerce", "Online Shop"

2. **Test with various site types**:
   - E-commerce with clear products
   - Service-based businesses
   - Content/blog sites
   - Multi-language sites (German, Dutch, English)

3. **Monitor logs**:
   ```
   console.log('Perplexity niche result:', nicheData.niche);
   console.log('Fallback niche result:', nicheData.niche);
   ```

## Technical Notes

### TypeScript Compatibility
Fixed iterator issues for better TypeScript compatibility:
```typescript
// Before (causes TS errors)
for (const match of html.matchAll(pattern)) { }

// After (compatible)
for (const match of Array.from(html.matchAll(pattern))) { }
```

### Performance Considerations
- Increased text content extraction from 5000 to 8000 chars
- Added word frequency analysis (minimal overhead)
- Product/category extraction uses regex (efficient)

### Backwards Compatibility
- All changes are additive - no breaking changes
- Fallback behavior maintained if scraping fails
- Default values preserved if detection fails

## Future Improvements

Potential enhancements:
1. **Machine learning**: Train a model to identify product types
2. **Structured data extraction**: Parse JSON-LD, Schema.org markup
3. **Multi-page analysis**: Check category and product pages, not just homepage
4. **Image analysis**: Analyze product images for additional context
5. **Language-specific patterns**: Add more language-specific stop words and patterns
6. **API integration**: Use e-commerce platform APIs where available

## Files Modified

1. `app/api/simple/generate-content-plan-background/route.ts` (146 lines added)
   - Enhanced website scraping
   - Improved Perplexity prompt
   - Improved fallback prompt
   - Fixed TypeScript iterator issues

2. `lib/ai-client.ts` (1 line changed)
   - Updated Perplexity system prompt

## Related Documentation

- [CONTENT_PLAN_STATUS_IMPLEMENTATION.md](CONTENT_PLAN_STATUS_IMPLEMENTATION.md) - Content plan system
- [TOPICAL_AUTHORITY_IMPLEMENTATION.md](TOPICAL_AUTHORITY_IMPLEMENTATION.md) - Topical authority strategy
- [AIML_MODELS_REFERENCE.txt](AIML_MODELS_REFERENCE.txt) - AI model configuration
