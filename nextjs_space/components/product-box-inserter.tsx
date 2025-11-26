
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Loader2, Package, Search } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { Card } from '@/components/ui/card';

interface ProductBoxInserterProps {
  open: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
  projectId: string | null;
}

interface BolProduct {
  ean: string;
  title: string;
  url: string;
  image?: string;
  price: number;
  rating?: number;
}

export default function ProductBoxInserter({ open, onClose, onInsert, projectId }: ProductBoxInserterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState<BolProduct[]>([]);

  const searchProducts = async () => {
    if (!searchQuery.trim()) {
      toast.error('Voer een zoekterm in');
      return;
    }

    if (!projectId) {
      toast.error('Geen project geselecteerd');
      return;
    }

    setSearching(true);
    try {
      const response = await fetch('/api/client/bolcom/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          searchQuery,
          maxResults: 10,
        }),
      });

      if (!response.ok) {
        throw new Error('Fout bij zoeken');
      }

      const data = await response.json();
      const results = data.products || [];

      setProducts(results.map((p: any) => ({
        ean: p.ean,
        title: p.title,
        url: p.url,
        image: p.image?.url,
        price: p.offer?.price || 0,
        rating: p.rating,
      })));

      if (results.length === 0) {
        toast.info('Geen producten gevonden');
      }
    } catch (error: any) {
      console.error('Error searching:', error);
      toast.error(error.message || 'Fout bij zoeken');
    } finally {
      setSearching(false);
    }
  };

  const insertProduct = async (product: BolProduct) => {
    try {
      // Genereer affiliate link
      const affiliateResponse = await fetch('/api/client/bolcom/generate-affiliate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          productUrl: product.url,
        }),
      });

      if (!affiliateResponse.ok) {
        throw new Error('Fout bij genereren affiliate link');
      }

      const { affiliateUrl } = await affiliateResponse.json();

      // Genereer een korte beschrijving (eerste 120 karakters van de titel)
      const shortDescription = product.title.length > 80 
        ? `${product.title.substring(0, 80)}...` 
        : product.title;

      // Genereer mooie HTML product box (WordPress-friendly met volledige inline styles)
      const productBoxHTML = `
<!-- Affiliate Product Box: ${product.title} -->
<div class="writgo-product-box" style="all: initial !important; display: flex !important; flex-direction: column !important; max-width: 900px !important; width: 100% !important; background: linear-gradient(to bottom, #ffffff 0%, #fafafa 100%) !important; border-radius: 20px !important; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04) !important; overflow: hidden !important; margin: 50px auto !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important; border: 2px solid #f0f0f0 !important; box-sizing: border-box !important; position: relative !important;" onmouseover="this.style.boxShadow='0 20px 60px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)'; this.style.transform='translateY(-4px)'" onmouseout="this.style.boxShadow='0 10px 40px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'; this.style.transform='translateY(0)'">
  
  <style>
    @media (min-width: 768px) {
      .writgo-product-box { flex-direction: row !important; }
      .writgo-product-img-container { width: 45% !important; }
      .writgo-product-content { width: 55% !important; padding: 40px !important; }
    }
  </style>
  
  ${product.image ? `
  <div class="writgo-product-img-container" style="all: initial !important; display: flex !important; align-items: center !important; justify-content: center !important; position: relative !important; width: 100% !important; min-height: 320px !important; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%) !important; padding: 30px !important; box-sizing: border-box !important; border-right: 2px solid #f0f0f0 !important;">
    <img src="${product.image}" alt="${product.title}" style="all: initial !important; display: block !important; max-width: 100% !important; max-height: 280px !important; width: auto !important; height: auto !important; object-fit: contain !important; border-radius: 12px !important; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important; filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08)) !important;" loading="lazy" onerror="this.style.opacity='0.6'" onmouseover="this.style.transform='scale(1.06)'; this.style.filter='drop-shadow(0 8px 20px rgba(0, 0, 0, 0.12))'" onmouseout="this.style.transform='scale(1)'; this.style.filter='drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))'" />
    <span style="all: initial !important; display: inline-block !important; position: absolute !important; top: 20px !important; left: 20px !important; background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important; color: #ffffff !important; font-size: 11px !important; font-weight: 700 !important; padding: 8px 16px !important; border-radius: 20px !important; text-transform: uppercase !important; letter-spacing: 0.8px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1 !important; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4) !important;">✓ Top Product</span>
  </div>
  ` : ''}
  
  <div class="writgo-product-content" style="all: initial !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; padding: 32px !important; width: 100% !important; box-sizing: border-box !important; background: #ffffff !important;">
    
    <div style="all: initial !important; display: block !important;">
      <h2 style="all: initial !important; display: block !important; margin: 12px 0 16px 0 !important; padding: 0 !important; font-size: 28px !important; font-weight: 800 !important; color: #111827 !important; line-height: 1.3 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; letter-spacing: -0.5px !important;">${product.title}</h2>
      
      ${product.rating ? `<div style="all: initial !important; display: flex !important; align-items: center !important; margin-bottom: 16px !important;">
        <span style="all: initial !important; display: inline-block !important; color: #fbbf24 !important; font-size: 20px !important; margin-right: 8px !important; line-height: 1 !important;">★★★★★</span>
        <span style="all: initial !important; display: inline-block !important; font-weight: 700 !important; color: #111827 !important; font-size: 16px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1 !important;">${product.rating}/5</span>
      </div>` : ''}
      
      <p style="all: initial !important; display: block !important; margin: 0 0 20px 0 !important; padding: 0 !important; font-size: 15px !important; line-height: 1.7 !important; color: #4b5563 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; font-weight: 400 !important;">${shortDescription}</p>
    </div>
    
    <div style="all: initial !important; display: block !important; margin-top: 20px !important; padding-top: 20px !important; border-top: 2px solid #f0f0f0 !important;">
      
      <div style="all: initial !important; display: flex !important; align-items: center !important; justify-content: space-between !important; margin-bottom: 18px !important;">
        <div style="all: initial !important; display: inline-block !important;">
          <span style="all: initial !important; display: block !important; font-size: 13px !important; color: #6b7280 !important; font-weight: 500 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; margin-bottom: 4px !important;">Prijs</span>
          <span style="all: initial !important; display: inline-block !important; font-size: 36px !important; font-weight: 900 !important; color: #10b981 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1 !important; letter-spacing: -1px !important;">€${product.price.toFixed(2)}</span>
        </div>
        
        <div style="all: initial !important; display: flex !important; flex-direction: column !important; align-items: flex-end !important; gap: 4px !important;">
          <span style="all: initial !important; display: inline-block !important; font-size: 12px !important; color: #10b981 !important; font-weight: 600 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;">✓ Gratis verzending</span>
          <span style="all: initial !important; display: inline-block !important; font-size: 12px !important; color: #6b7280 !important; font-weight: 500 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;">Morgen in huis</span>
        </div>
      </div>

      <a href="${affiliateUrl}" target="_blank" rel="noopener noreferrer nofollow sponsored" style="all: initial !important; display: flex !important; align-items: center !important; justify-content: center !important; width: 100% !important; padding: 16px 24px !important; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%) !important; color: #ffffff !important; font-size: 17px !important; font-weight: 700 !important; border-radius: 12px !important; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.35) !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; cursor: pointer !important; text-decoration: none !important; box-sizing: border-box !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1 !important; gap: 10px !important;" onmouseover="this.style.background='linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 12px 28px rgba(79, 70, 229, 0.45)'" onmouseout="this.style.background='linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'; this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 20px rgba(79, 70, 229, 0.35)'">
        <svg style="all: initial !important; display: inline-block !important; width: 22px !important; height: 22px !important; stroke: currentColor !important; fill: none !important; flex-shrink: 0 !important;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
        <span style="all: initial !important; display: inline-block !important; color: #ffffff !important; font-size: 17px !important; font-weight: 700 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1 !important;">Bekijk op Bol.com</span>
      </a>
      
      <p style="all: initial !important; display: block !important; text-align: center !important; margin: 12px 0 0 0 !important; font-size: 11px !important; color: #9ca3af !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1.4 !important;">🔒 Veilig betalen • 30 dagen retour</p>
    </div>
  </div>
</div>
<!-- End Affiliate Product Box -->
      `.trim();

      onInsert(productBoxHTML);
      onClose();
      toast.success('Productbox toegevoegd!');
      
      // Reset
      setSearchQuery('');
      setProducts([]);
    } catch (error: any) {
      console.error('Error inserting product:', error);
      toast.error(error.message || 'Fout bij toevoegen product');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Package className="w-6 h-6 text-orange-500" />
            Productbox Toevoegen
          </DialogTitle>
          <DialogDescription>
            Zoek een product op Bol.com en voeg een mooie productbox toe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Zoeken */}
          <div>
            <Label>Zoek Product op Bol.com</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Bijv: laptop, boek, speelgoed..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    searchProducts();
                  }
                }}
              />
              <Button
                onClick={searchProducts}
                disabled={searching || !searchQuery.trim()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Zoekresultaten */}
          {products.length > 0 && (
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Zoekresultaten ({products.length})
              </Label>
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                {products.map((product) => (
                  <Card
                    key={product.ean}
                    className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => insertProduct(product)}
                  >
                    <div className="flex gap-4 items-start">
                      {product.image && (
                        <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg">
                          <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm line-clamp-2 mb-2">
                          {product.title}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-orange-500">
                            €{product.price.toFixed(2)}
                          </span>
                          {product.rating && (
                            <span className="text-xs text-gray-500">
                              ⭐ {product.rating}/5
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="flex-shrink-0 bg-orange-500 hover:bg-orange-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          insertProduct(product);
                        }}
                      >
                        Invoegen
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {products.length === 0 && !searching && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Zoek een product om te beginnen</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
