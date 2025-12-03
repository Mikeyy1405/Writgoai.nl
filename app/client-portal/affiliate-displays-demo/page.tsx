
'use client';

import { useState } from 'react';
import { 
  AffiliateTextLink,
  AffiliateProductCard,
  AffiliateProductGrid,
  AffiliateProductCarousel,
  AffiliateCTABox,
  AffiliateComparisonTable,
  type ProductCardData,
  type ComparisonProduct,
} from '@/components/affiliate-displays';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Grid3x3, LayoutGrid, Repeat, Megaphone, Table } from 'lucide-react';

export default function AffiliateDisplaysDemo() {
  // Demo data
  const demoProducts: ProductCardData[] = [
    {
      title: 'Sony WH-1000XM5 Draadloze Noise Cancelling Koptelefoon',
      price: '€349,99',
      oldPrice: '€419,99',
      rating: 4.5,
      ratingCount: 1247,
      imageUrl: 'https://i.ytimg.com/vi/TUgajitHAg0/sddefault.jpg',
      url: '#',
      badge: 'Bestseller',
      description: 'Premium noise cancelling koptelefoon met 30 uur batterijduur',
      features: [
        'Industrieleidende noise cancelling',
        '30 uur batterijduur',
        'Kristalhelder gesprekskwaliteit',
        'Meerdere apparaten verbinden'
      ]
    },
    {
      title: 'Bose QuietComfort 45 Wireless Headphones',
      price: '€299,99',
      oldPrice: '€349,99',
      rating: 4.3,
      ratingCount: 892,
      imageUrl: 'https://i.ytimg.com/vi/nlwV7GU1CdI/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD52NEijPnDmbZ4tBVzNXwq5k7wFg',
      url: '#',
      description: 'Comfortabele noise cancelling koptelefoon',
      features: [
        'Uitstekende noise cancelling',
        '24 uur batterijduur',
        'Lightweight design',
        'Eenvoudige bediening'
      ]
    },
    {
      title: 'Apple AirPods Max',
      price: '€549,99',
      rating: 4.7,
      ratingCount: 2103,
      imageUrl: 'https://content.abt.com/media/images/products/BDP_Images/apple-noise-cancelling-over-ear-MWW63AMA-front-angled.jpg',
      url: '#',
      badge: 'Premium',
      description: 'Luxe over-ear koptelefoon met spatial audio',
      features: [
        'Adaptive EQ',
        'Spatial audio',
        '20 uur batterijduur',
        'Aluminium design'
      ]
    }
  ];

  const comparisonProducts: ComparisonProduct[] = [
    {
      title: 'Sony WH-1000XM5',
      price: '€349,99',
      imageUrl: 'https://i.ytimg.com/vi/v6EjmbMgv80/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBdIiPYnTZkjoHSQ-74F3B9UpYKJQ',
      url: '#',
      rating: 4.5,
      badge: '🏆 Top Keuze',
      isRecommended: true,
      features: [
        { label: 'Noise Cancelling', value: true },
        { label: 'Batterijduur', value: '30 uur' },
        { label: 'Bluetooth', value: '5.2' },
        { label: 'Waterbestendig', value: false },
        { label: 'Multipoint', value: true },
        { label: 'App controle', value: true },
      ]
    },
    {
      title: 'Bose QC45',
      price: '€299,99',
      imageUrl: 'https://i.ytimg.com/vi/nlwV7GU1CdI/maxresdefault.jpg',
      url: '#',
      rating: 4.3,
      features: [
        { label: 'Noise Cancelling', value: true },
        { label: 'Batterijduur', value: '24 uur' },
        { label: 'Bluetooth', value: '5.1' },
        { label: 'Waterbestendig', value: false },
        { label: 'Multipoint', value: true },
        { label: 'App controle', value: false },
      ]
    },
    {
      title: 'Apple AirPods Max',
      price: '€549,99',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Apple_airpods_max_1.jpg',
      url: '#',
      rating: 4.7,
      badge: '💎 Premium',
      features: [
        { label: 'Noise Cancelling', value: true },
        { label: 'Batterijduur', value: '20 uur' },
        { label: 'Bluetooth', value: '5.0' },
        { label: 'Waterbestendig', value: false },
        { label: 'Multipoint', value: false },
        { label: 'App controle', value: true },
      ]
    }
  ];

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Affiliate Display Opties
        </h1>
        <p className="text-gray-600">
          Verschillende manieren om affiliate producten te tonen in je blog content
        </p>
      </div>

      <Tabs defaultValue="text-link" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-8">
          <TabsTrigger value="text-link" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Tekstlink</span>
          </TabsTrigger>
          <TabsTrigger value="product-card" className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Product Card</span>
          </TabsTrigger>
          <TabsTrigger value="grid" className="flex items-center gap-2">
            <Grid3x3 className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </TabsTrigger>
          <TabsTrigger value="carousel" className="flex items-center gap-2">
            <Repeat className="w-4 h-4" />
            <span className="hidden sm:inline">Carrousel</span>
          </TabsTrigger>
          <TabsTrigger value="cta" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            <span className="hidden sm:inline">CTA Box</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <Table className="w-4 h-4" />
            <span className="hidden sm:inline">Vergelijking</span>
          </TabsTrigger>
        </TabsList>

        {/* Text Link */}
        <TabsContent value="text-link">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Tekstlink</h2>
            <p className="text-gray-600 mb-6">
              Simpele inline link die naadloos in je tekst past. Perfect voor natuurlijke productverwijzingen.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-gray-800 leading-relaxed">
                Op zoek naar de beste noise cancelling koptelefoon? Kijk dan eens naar de{' '}
                <AffiliateTextLink 
                  text="Sony WH-1000XM5"
                  url="#"
                />{' '}
                of de{' '}
                <AffiliateTextLink 
                  text="Bose QuietComfort 45"
                  url="#"
                />. Voor Apple fans zijn de{' '}
                <AffiliateTextLink 
                  text="AirPods Max"
                  url="#"
                />{' '}
                een uitstekende keuze.
              </p>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Wanneer gebruiken?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• In lopende tekst waar je producten noemt</li>
                <li>• Voor subtiele affiliate verwijzingen</li>
                <li>• Als je niet te "salesy" wilt overkomen</li>
              </ul>
            </div>
          </Card>
        </TabsContent>

        {/* Product Card */}
        <TabsContent value="product-card">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Product Card</h2>
            <p className="text-gray-600 mb-6">
              Professionele product display met alle belangrijke informatie. Beschikbaar in 3 varianten.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Compact</h3>
                <AffiliateProductCard product={demoProducts[0]} variant="compact" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Default</h3>
                <AffiliateProductCard product={demoProducts[0]} variant="default" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Detailed</h3>
                <AffiliateProductCard product={demoProducts[0]} variant="detailed" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Wanneer gebruiken?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Voor individuele product reviews</li>
                <li>• Als featured/aanbevolen product</li>
                <li>• In product roundups en vergelijkingen</li>
              </ul>
            </div>
          </Card>
        </TabsContent>

        {/* Grid */}
        <TabsContent value="grid">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Product Grid</h2>
            <p className="text-gray-600 mb-6">
              Toon meerdere producten naast elkaar in een responsive grid. Kies uit 2, 3 of 4 kolommen.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="font-semibold mb-4">2 Kolommen</h3>
                <AffiliateProductGrid 
                  products={demoProducts.slice(0, 2)}
                  columns={2}
                  title="Top 2 Noise Cancelling Koptelefoons"
                  description="Onze favoriet koptelefoons voor 2024"
                />
              </div>

              <div>
                <h3 className="font-semibold mb-4">3 Kolommen</h3>
                <AffiliateProductGrid 
                  products={demoProducts}
                  columns={3}
                  variant="compact"
                />
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Wanneer gebruiken?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Voor "Top 5" of "Best of" lijsten</li>
                <li>• Product categorieën overzichtelijk tonen</li>
                <li>• Meerdere alternatieven naast elkaar</li>
              </ul>
            </div>
          </Card>
        </TabsContent>

        {/* Carousel */}
        <TabsContent value="carousel">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Product Carrousel</h2>
            <p className="text-gray-600 mb-6">
              Sliding carousel met auto-play optie. Ideaal voor veel producten zonder scrollen.
            </p>

            <AffiliateProductCarousel 
              products={demoProducts}
              itemsPerView={3}
              autoPlay={true}
              autoPlayInterval={5000}
              title="Aanbevolen Producten"
              description="Onze top keuzes voor jou"
            />

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Wanneer gebruiken?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Als je veel producten wilt tonen</li>
                <li>• Voor dynamische, eye-catching displays</li>
                <li>• In de sidebar of onder artikelen</li>
              </ul>
            </div>
          </Card>
        </TabsContent>

        {/* CTA Box */}
        <TabsContent value="cta">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">CTA Box</h2>
            <p className="text-gray-600 mb-6">
              Opvallende call-to-action box voor je top aanbeveling. Beschikbaar in 3 stijlen.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Default</h3>
                <AffiliateCTABox 
                  title={demoProducts[0].title}
                  description={demoProducts[0].description || ''}
                  price={demoProducts[0].price}
                  oldPrice={demoProducts[0].oldPrice}
                  imageUrl={demoProducts[0].imageUrl}
                  url={demoProducts[0].url}
                  features={demoProducts[0].features}
                  rating={demoProducts[0].rating}
                  badge="Onze Top Keuze"
                  variant="default"
                />
              </div>

              <div>
                <h3 className="font-semibold mb-3">Gradient</h3>
                <AffiliateCTABox 
                  title={demoProducts[0].title}
                  description={demoProducts[0].description || ''}
                  price={demoProducts[0].price}
                  oldPrice={demoProducts[0].oldPrice}
                  imageUrl={demoProducts[0].imageUrl}
                  url={demoProducts[0].url}
                  ctaText="Nu Kopen →"
                  variant="gradient"
                />
              </div>

              <div>
                <h3 className="font-semibold mb-3">Bordered</h3>
                <AffiliateCTABox 
                  title={demoProducts[0].title}
                  description={demoProducts[0].description || ''}
                  price={demoProducts[0].price}
                  url={demoProducts[0].url}
                  variant="bordered"
                />
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Wanneer gebruiken?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Voor je #1 aanbeveling</li>
                <li>• Aan het einde van een review artikel</li>
                <li>• Bij speciale aanbiedingen of deals</li>
              </ul>
            </div>
          </Card>
        </TabsContent>

        {/* Comparison Table */}
        <TabsContent value="comparison">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Vergelijkingstabel</h2>
            <p className="text-gray-600 mb-6">
              Professionele side-by-side vergelijking met alle specs. Perfect voor beslissingshulp.
            </p>

            <AffiliateComparisonTable 
              products={comparisonProducts}
              title="Koptelefoon Vergelijking 2024"
              description="Alle belangrijke specs op een rij"
            />

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Wanneer gebruiken?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Voor uitgebreide product vergelijkingen</li>
                <li>• Als specs belangrijk zijn voor de beslissing</li>
                <li>• In "X vs Y" vergelijkingsartikelen</li>
              </ul>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
