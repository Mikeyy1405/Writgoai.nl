
# Affiliate Display Opties

## 📦 Overzicht

WritgoAI biedt nu 6 verschillende manieren om affiliate producten te tonen in blog content, geïnspireerd door ContentEgg en Affiliate Held.

### Display Types

1. **Tekstlink** - Inline affiliate link in tekst
2. **Product Card** - Moderne product display (compact/default/detailed)
3. **Product Grid** - Meerdere producten in grid (2-4 kolommen)
4. **Carrousel** - Sliding carousel met auto-play
5. **CTA Box** - Opvallende call-to-action box
6. **Vergelijkingstabel** - Side-by-side comparison table

## 🎨 Design Features

- **Modern & Professioneel** - Clean, aantrekkelijk design
- **Responsive** - Perfect op mobile, tablet en desktop
- **Hover Effects** - Smooth animaties en transitions
- **SEO Vriendelijk** - Correct gebruik van nofollow, sponsored tags
- **Customizable** - Verschillende varianten en stijlen

## 🚀 Gebruik

### 1. Tekstlink

Simpele inline link voor natuurlijke productverwijzingen:

```tsx
import { AffiliateTextLink } from '@/components/affiliate-displays';

<AffiliateTextLink 
  text="Sony WH-1000XM5"
  url="https://partner.bol.com/..."
/>
```

**Wanneer gebruiken:**
- In lopende tekst
- Voor subtiele verwijzingen
- Niet te "salesy" overkomen

### 2. Product Card

Professionele product display met alle info:

```tsx
import { AffiliateProductCard } from '@/components/affiliate-displays';

<AffiliateProductCard 
  product={{
    title: "Product Naam",
    price: "€99,99",
    oldPrice: "€129,99",
    rating: 4.5,
    ratingCount: 1247,
    imageUrl: "...",
    url: "...",
    badge: "Bestseller",
    description: "...",
    features: ["Feature 1", "Feature 2"]
  }}
  variant="default" // compact | default | detailed
/>
```

**Wanneer gebruiken:**
- Individuele product reviews
- Featured product
- Product roundups

### 3. Product Grid

Meerdere producten naast elkaar:

```tsx
import { AffiliateProductGrid } from '@/components/affiliate-displays';

<AffiliateProductGrid 
  products={[...]}
  columns={3} // 2 | 3 | 4
  title="Top 5 Producten 2024"
  description="Onze favorieten"
  variant="default" // compact | default | detailed
/>
```

**Wanneer gebruiken:**
- "Top 5" lijsten
- Product categorieën
- Alternatieven naast elkaar

### 4. Carrousel

Sliding carousel met navigatie:

```tsx
import { AffiliateProductCarousel } from '@/components/affiliate-displays';

<AffiliateProductCarousel 
  products={[...]}
  itemsPerView={3}
  autoPlay={true}
  autoPlayInterval={5000}
  title="Aanbevolen Producten"
/>
```

**Wanneer gebruiken:**
- Veel producten tonen
- Eye-catching displays
- Sidebar of onder artikelen

### 5. CTA Box

Opvallende call-to-action:

```tsx
import { AffiliateCTABox } from '@/components/affiliate-displays';

<AffiliateCTABox 
  title="Product Naam"
  description="..."
  price="€349,99"
  oldPrice="€419,99"
  imageUrl="..."
  url="..."
  features={["Feature 1", "Feature 2"]}
  badge="Onze Top Keuze"
  variant="default" // default | gradient | bordered
  ctaText="Nu Kopen →"
/>
```

**Wanneer gebruiken:**
- #1 aanbeveling
- Einde van review artikel
- Speciale aanbiedingen

### 6. Vergelijkingstabel

Professionele comparison table:

```tsx
import { AffiliateComparisonTable } from '@/components/affiliate-displays';

<AffiliateComparisonTable 
  products={[
    {
      title: "Product 1",
      price: "€299",
      imageUrl: "...",
      url: "...",
      rating: 4.5,
      badge: "Top Keuze",
      isRecommended: true,
      features: [
        { label: "Feature 1", value: true },
        { label: "Batterij", value: "30 uur" },
        { label: "Feature 3", value: false }
      ]
    },
    // meer producten...
  ]}
  title="Vergelijking 2024"
/>
```

**Wanneer gebruiken:**
- Uitgebreide vergelijkingen
- Specs zijn belangrijk
- "X vs Y" artikelen

## 🎯 Demo Pagina

Bekijk alle opties live op:
`/client-portal/affiliate-displays-demo`

Deze pagina toont alle display types met voorbeelden en gebruik tips.

## 🔧 Componenten Locatie

Alle componenten staan in:
```
/components/affiliate-displays/
  ├── affiliate-text-link.tsx
  ├── affiliate-product-card.tsx
  ├── affiliate-product-grid.tsx
  ├── affiliate-product-carousel.tsx
  ├── affiliate-cta-box.tsx
  ├── affiliate-comparison-table.tsx
  └── index.ts
```

## 📝 Types

```typescript
// Product data
interface ProductCardData {
  title: string;
  price: string;
  oldPrice?: string;
  rating?: number;
  ratingCount?: number;
  imageUrl?: string;
  description?: string;
  url: string;
  badge?: string;
  features?: string[];
}

// Comparison product
interface ComparisonProduct {
  title: string;
  price: string;
  imageUrl?: string;
  url: string;
  rating?: number;
  features: {
    label: string;
    value: boolean | string | number;
  }[];
  badge?: string;
  isRecommended?: boolean;
}

// Display types
type AffiliateDisplayType = 
  | 'text_link'
  | 'product_card'
  | 'product_grid'
  | 'carousel'
  | 'cta_box'
  | 'comparison_table';
```

## 🎨 Styling

Alle componenten gebruiken:
- **Tailwind CSS** voor styling
- **Orange (500-600)** als primary color
- **Hover effects** voor interactiviteit
- **Responsive breakpoints** (sm, md, lg)
- **Smooth transitions** (200-300ms)

## ✨ Features per Component

### Tekstlink
- ✅ External link icon
- ✅ Hover underline effect
- ✅ Nofollow + sponsored tags

### Product Card
- ✅ 3 varianten (compact/default/detailed)
- ✅ Rating met sterren
- ✅ Badge support
- ✅ Features lijst
- ✅ Price + oldPrice
- ✅ Hover effects

### Product Grid
- ✅ Responsive (1-4 kolommen)
- ✅ Title + description
- ✅ Alle product card features
- ✅ Gap spacing

### Carrousel
- ✅ Navigation arrows
- ✅ Dots pagination
- ✅ Auto-play optie
- ✅ Responsive items
- ✅ Hover pause

### CTA Box
- ✅ 3 varianten
- ✅ Large CTA button
- ✅ Features checklist
- ✅ Decorative elements
- ✅ Image + content layout

### Vergelijkingstabel
- ✅ Horizontal scroll op mobile
- ✅ Feature comparison
- ✅ Recommended highlight
- ✅ Boolean/string/number support
- ✅ Sticky header (optional)

## 🚀 Toekomstige Integratie

**Volgende stappen:**
1. ✅ Display componenten gemaakt
2. ⏳ Database schema update (affiliateDisplayType field)
3. ⏳ UI in blog generator voor display type selectie
4. ⏳ AI integratie voor automatisch juiste display type kiezen
5. ⏳ Server-side rendering in blog content

## 📊 Best Practices

1. **Tekstlink**: Voor natuurlijke flow in content
2. **Product Card**: Voor featured product of single review
3. **Product Grid**: Voor top 3-5 lijsten
4. **Carrousel**: Voor 5+ producten, sidebar content
5. **CTA Box**: Voor conversie-gerichte call-to-actions
6. **Comparison**: Voor detailed spec vergelijkingen

## 🎯 SEO & Compliance

Alle componenten gebruiken:
- ✅ `rel="nofollow noopener noreferrer sponsored"`
- ✅ `target="_blank"` voor externe links
- ✅ Alt text voor images
- ✅ Semantic HTML
- ✅ Accessible navigation (aria labels)

## 💡 Tips

1. **Mix & Match**: Combineer verschillende types in één artikel
2. **Responsive**: Test altijd op mobile/tablet/desktop
3. **Performance**: Gebruik lazy loading voor images
4. **Conversion**: CTA Box werkt best aan het einde van artikel
5. **Trust**: Vergelijkingstabel bouwt vertrouwen op

---

**Gemaakt voor WritgoAI** - Professional affiliate marketing displays
**Geïnspireerd door:** ContentEgg & Affiliate Held
**Datum:** November 2024
