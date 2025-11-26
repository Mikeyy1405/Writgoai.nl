
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Loader2, Package, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface BolProduct {
  ean: string;
  title: string;
  description: string;
  price?: number;
  image?: string;
  affiliateLink?: string;
}

interface ProductBoxSelectorProps {
  open: boolean;
  onClose: () => void;
  onInsert: (shortcode: string) => void;
  projectId: string;
}

export function ProductBoxSelector({ open, onClose, onInsert, projectId }: ProductBoxSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState<BolProduct[]>([]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Voer een zoekterm in');
      return;
    }

    setSearching(true);
    try {
      const response = await fetch('/api/client/woocommerce/search-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchTerm,
          projectId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        if (!data.products || data.products.length === 0) {
          toast.error('Geen producten gevonden');
        }
      } else {
        toast.error('Fout bij zoeken');
      }
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Fout bij zoeken');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectProduct = async (product: BolProduct) => {
    try {
      // Generate affiliate link if available
      let finalLink = product.affiliateLink || '';
      
      if (!finalLink && projectId) {
        try {
          const affiliateResponse = await fetch('/api/client/bolcom/generate-affiliate-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              productUrl: product.affiliateLink || '',
            }),
          });
          
          if (affiliateResponse.ok) {
            const { affiliateUrl } = await affiliateResponse.json();
            finalLink = affiliateUrl;
          }
        } catch (e) {
          console.warn('Could not generate affiliate link:', e);
        }
      }

      // Create short description from product description or title
      let shortDescription = '';
      if (product.description && product.description.length > 10) {
        shortDescription = product.description.length > 150 
          ? `${product.description.substring(0, 147)}...` 
          : product.description;
      } else {
        shortDescription = `${product.title} - Een uitstekende keuze voor wie op zoek is naar kwaliteit en betrouwbaarheid.`;
      }

      // Escape HTML entities for safe insertion
      const escapeHtml = (text: string) => {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };

      // Generate standalone HTML product box with inline CSS (for WordPress "Eigen HTML")
      const productBoxHTML = `<div class="writgo-product-box-v2" style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); overflow: hidden; text-align: center;">
    <!-- Afbeelding & Badge -->
    <div style="width: 100%; height: 300px; padding: 20px; box-sizing: border-box; display: flex; justify-content: center; align-items: center; position: relative;">
        <div style="position: absolute; top: 20px; left: 20px; background-color: #27A967; color: white; padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 600;">TOP PRODUCT</div>
        <img src="${product.image || 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5YNRPU4910yPsW1yobc1J7of1kMM-pww1Qf5lkpKePvG1-3GeRFJPh0U9w0FLoeojueyp4HtPxcqWkGJOudVgEv3tpEnJQM9-Ia-eemENMJTFpTFm6WeZiiB2nBRDIwl9PeRGvsjEJTI/s1600/placeholder-image.jpg'}" alt="${escapeHtml(product.title)}" style="width: 100%; height: 100%; object-fit: contain;">
    </div>
    
    <!-- Productinformatie -->
    <div style="padding: 0 24px 24px 24px;">
        <h1 style="font-size: 1.6rem; font-weight: 700; color: #1E2022; margin: 0 0 12px 0; line-height: 1.3;">${escapeHtml(product.title)}</h1>
        <p style="font-size: 0.95rem; color: #5F6368; line-height: 1.6; margin: 0 0 24px 0;">${escapeHtml(shortDescription)}</p>

        <!-- Voordelen/Nadelen -->
        <div style="background-color: #F8F9FA; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; gap: 20px; text-align: left;">
            <div style="flex: 1;">
                <h3 style="font-size: 1rem; font-weight: 600; margin: 0 0 12px 0; display: flex; align-items: center; color: #1E2022;">
                    <svg style="width: 16px; height: 16px; margin-right: 8px; color: #27A967;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Voordelen
                </h3>
                <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9rem; color: #333;">
                    <li style="margin-bottom: 8px;">Hoogwaardige kwaliteit</li>
                    <li style="margin-bottom: 8px;">Snel geleverd</li>
                    <li style="margin-bottom: 0;">Goede prijs-kwaliteit</li>
                </ul>
            </div>
            <div style="flex: 1;">
                <h3 style="font-size: 1rem; font-weight: 600; margin: 0 0 12px 0; display: flex; align-items: center; color: #1E2022;">
                    <svg style="width: 16px; height: 16px; margin-right: 8px; color: #E53E3E;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Nadelen
                </h3>
                <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9rem; color: #333;">
                    <li style="margin-bottom: 0;">Alleen online verkrijgbaar</li>
                </ul>
            </div>
        </div>
    </div>

    <!-- Footer met prijs en knop -->
    <div style="border-top: 1px solid #EAECEE; padding: 20px 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; text-align: left;">
            <div>
                <span style="font-size: 0.9rem; color: #5F6368;">Prijs</span>
                <div style="font-size: 2rem; font-weight: 700; color: #27A967; line-height: 1;">€${(product.price || 0).toFixed(2)}</div>
            </div>
            <div style="font-size: 0.85rem; color: #5F6368; text-align: right;">
                <span style="color: #27A967; font-weight: 500;">✓ Gratis verzending</span>
                <div>Morgen in huis</div>
            </div>
        </div>
        
        <a href="${finalLink}" target="_blank" rel="noopener noreferrer nofollow sponsored" style="background-color: #F97316; color: white; border: none; padding: 14px 24px; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px; text-decoration: none; box-sizing: border-box; transition: background-color 0.3s ease;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.343 1.087-.835l.383-1.437M19.5 7.125l-1.087 4.148M4.5 14.25h15.75M15 14.25l1.087 4.148m-11.218 0h11.218" />
            </svg>
            Toevoegen aan winkelwagen
        </a>
        <div style="font-size: 0.8rem; color: #5F6368; text-align: center; margin-top: 12px;">🔒 Veilig betalen - 30 dagen retour</div>
    </div>
</div>`;

      onInsert(productBoxHTML);
      onClose();
      toast.success('Product box toegevoegd');
    } catch (error: any) {
      console.error('Error inserting product:', error);
      toast.error(error.message || 'Fout bij toevoegen product');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Product Box Toevoegen</DialogTitle>
          <DialogDescription className="text-gray-400">
            Zoek een product op Bol.com en voeg het toe als product box
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Zoek product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-gray-800 border-gray-700 text-white"
            />
            <Button
              onClick={handleSearch}
              disabled={searching}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Results */}
          {products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div
                  key={product.ean}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-orange-500 transition-colors cursor-pointer"
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="flex gap-3">
                    {product.image && (
                      <div className="relative w-20 h-20 flex-shrink-0 bg-gray-700 rounded">
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-sm line-clamp-2 mb-1">
                        {product.title}
                      </h4>
                      {product.price && (
                        <p className="text-orange-400 font-bold">€ {product.price.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-gray-700 text-gray-300">
            Annuleren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
