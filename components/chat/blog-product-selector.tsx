
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Package, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface BolProduct {
  id: string;
  title: string;
  summary?: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  rating?: number;
  inStock?: boolean;
}

interface BlogProductSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectProduct: (product: BolProduct) => void;
}

export function BlogProductSelector({
  open,
  onClose,
  onSelectProduct
}: BlogProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState<BolProduct[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Voer een zoekterm in');
      return;
    }

    setSearching(true);
    try {
      const response = await fetch('/api/client/bolcom/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });

      if (!response.ok) throw new Error('Zoeken mislukt');

      const data = await response.json();
      setProducts(data.products || []);

      if (data.products.length === 0) {
        toast('Geen producten gevonden', { icon: '🔍' });
      }
    } catch (error) {
      console.error('Product search error:', error);
      toast.error('Fout bij zoeken van producten');
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (product: BolProduct) => {
    onSelectProduct(product);
    onClose();
    toast.success('Product toegevoegd!');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] bg-gray-900 border-purple-500/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Bol.com Product Zoeken
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <Input
              placeholder="Zoek naar producten... (bijv. 'laptop', 'boeken')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-gray-800 border-gray-700"
            />
            <Button
              onClick={handleSearch}
              disabled={searching}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Products List */}
          <ScrollArea className="h-[400px] pr-4">
            {products.length === 0 && !searching && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Package className="h-12 w-12 mb-2 opacity-50" />
                <p>Zoek naar producten om te beginnen</p>
              </div>
            )}

            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer"
                  onClick={() => handleSelect(product)}
                >
                  {/* Product Image */}
                  <div className="relative w-20 h-20 flex-shrink-0 bg-gray-700 rounded overflow-hidden">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-8 w-8 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white line-clamp-2 mb-1">
                      {product.title}
                    </h4>
                    {product.summary && (
                      <p className="text-sm text-gray-400 line-clamp-1 mb-2">
                        {product.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-green-400 font-semibold">
                        {product.price}
                      </span>
                      {product.rating && (
                        <span className="text-yellow-400">
                          ⭐ {product.rating}
                        </span>
                      )}
                      {product.inStock !== false && (
                        <span className="text-green-400 text-xs">Op voorraad</span>
                      )}
                    </div>
                  </div>

                  {/* Select Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="self-center bg-purple-900/30 border-purple-500/50 hover:bg-purple-800/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(product);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
