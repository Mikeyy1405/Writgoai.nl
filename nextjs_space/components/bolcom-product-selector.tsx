
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Loader2, 
  Plus, 
  X, 
  Check, 
  Star,
  ShoppingBag,
  ChevronUp,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export interface SelectedProduct {
  id: string; // EAN
  title: string;
  url: string;
  affiliateUrl: string;
  price: number;
  image?: string;
  rating?: number;
  notes?: string; // Extra notities die gebruiker kan toevoegen
}

interface BolcomProductSelectorProps {
  projectId: string | null;
  selectedProducts: SelectedProduct[];
  onProductsChange: (products: SelectedProduct[]) => void;
  maxProducts?: number;
}

interface SearchResult {
  ean: string;
  bolProductId: number;
  title: string;
  url: string;
  image?: {
    url: string;
    width: number;
    height: number;
  };
  offer?: {
    price: number;
    strikethroughPrice?: number;
  };
  rating?: number;
}

export default function BolcomProductSelector({
  projectId,
  selectedProducts,
  onProductsChange,
  maxProducts = 10,
}: BolcomProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Zoek producten op Bol.com
  const searchProducts = async () => {
    if (!searchQuery.trim()) {
      toast.error('Voer een zoekterm in');
      return;
    }

    if (!projectId) {
      toast.error('Selecteer eerst een project met Bol.com instellingen');
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
        const error = await response.json();
        throw new Error(error.error || 'Fout bij zoeken');
      }

      const data = await response.json();
      setSearchResults(data.products || []);
      setShowResults(true);
      
      if (data.products.length === 0) {
        toast.info('Geen producten gevonden. Probeer een andere zoekterm.');
      }
    } catch (error: any) {
      console.error('Product search error:', error);
      toast.error(error.message || 'Fout bij zoeken naar producten');
    } finally {
      setSearching(false);
    }
  };

  // Voeg product toe aan selectie
  const addProduct = (product: SearchResult) => {
    if (selectedProducts.length >= maxProducts) {
      toast.error(`Je kunt maximaal ${maxProducts} producten selecteren`);
      return;
    }

    // Check if already selected
    if (selectedProducts.some(p => p.id === product.ean)) {
      toast.info('Dit product is al geselecteerd');
      return;
    }

    const newProduct: SelectedProduct = {
      id: product.ean,
      title: product.title,
      url: product.url,
      affiliateUrl: product.url, // Will be converted on backend
      price: product.offer?.price || 0,
      image: product.image?.url,
      rating: product.rating,
      notes: '',
    };

    onProductsChange([...selectedProducts, newProduct]);
    toast.success('Product toegevoegd!');
  };

  // Verwijder product uit selectie
  const removeProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter(p => p.id !== productId));
  };

  // Verplaats product omhoog in de lijst
  const moveProductUp = (index: number) => {
    if (index === 0) return;
    const newProducts = [...selectedProducts];
    [newProducts[index - 1], newProducts[index]] = [newProducts[index], newProducts[index - 1]];
    onProductsChange(newProducts);
  };

  // Verplaats product omlaag in de lijst
  const moveProductDown = (index: number) => {
    if (index === selectedProducts.length - 1) return;
    const newProducts = [...selectedProducts];
    [newProducts[index], newProducts[index + 1]] = [newProducts[index + 1], newProducts[index]];
    onProductsChange(newProducts);
  };

  // Update notities voor een product
  const updateNotes = (productId: string, notes: string) => {
    onProductsChange(
      selectedProducts.map(p => 
        p.id === productId ? { ...p, notes } : p
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="space-y-2">
        <Label>🔍 Zoek Producten op Bol.com</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Bijv. 'beste laptop 2024' of 'noise cancelling koptelefoon'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchProducts()}
            disabled={!projectId || searching}
          />
          <Button
            onClick={searchProducts}
            disabled={!projectId || searching}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        {!projectId && (
          <p className="text-sm text-muted-foreground">
            💡 Selecteer eerst een project met Bol.com instellingen
          </p>
        )}
      </div>

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Zoekresultaten ({searchResults.length})</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResults(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((product) => {
                const isSelected = selectedProducts.some(p => p.id === product.ean);
                
                return (
                  <div
                    key={product.ean}
                    className={`flex gap-3 p-3 rounded-lg border transition-colors ${
                      isSelected 
                        ? 'bg-orange-50 border-orange-300' 
                        : 'bg-card hover:bg-muted/50'
                    }`}
                  >
                    {/* Product Image */}
                    {product.image?.url && (
                      <div className="relative w-16 h-16 flex-shrink-0 bg-muted rounded">
                        <Image
                          src={product.image.url}
                          alt={product.title}
                          fill
                          className="object-contain rounded"
                        />
                      </div>
                    )}
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {product.title}
                      </h4>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-semibold text-orange-600">
                          €{product.offer?.price.toFixed(2) || 'N/A'}
                        </span>
                        {product.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-muted-foreground">
                              {product.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Add Button */}
                    <Button
                      size="sm"
                      variant={isSelected ? "secondary" : "default"}
                      onClick={() => addProduct(product)}
                      disabled={isSelected || selectedProducts.length >= maxProducts}
                      className={isSelected ? '' : 'bg-orange-500 hover:bg-orange-600'}
                    >
                      {isSelected ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Geselecteerde Producten ({selectedProducts.length}/{maxProducts})
              </h3>
            </div>
            <div className="space-y-3">
              {selectedProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex gap-3 p-3 rounded-lg border bg-card"
                >
                  {/* Position Badge */}
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Badge variant="secondary" className="w-8 h-8 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveProductUp(index)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveProductDown(index)}
                        disabled={index === selectedProducts.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Product Image */}
                  {product.image && (
                    <div className="relative w-16 h-16 flex-shrink-0 bg-muted rounded">
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        className="object-contain rounded"
                      />
                    </div>
                  )}
                  
                  {/* Product Info */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="font-medium text-sm line-clamp-1 mb-1">
                        {product.title}
                      </h4>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-semibold text-orange-600">
                          €{product.price.toFixed(2)}
                        </span>
                        {product.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-muted-foreground">
                              {product.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    
                    {/* Notes Input */}
                    <Input
                      placeholder="Extra notities (optioneel)..."
                      value={product.notes || ''}
                      onChange={(e) => updateNotes(product.id, e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  
                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProduct(product.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {selectedProducts.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-1">Geen producten geselecteerd</h3>
            <p className="text-sm text-muted-foreground">
              Zoek producten op Bol.com en voeg ze toe aan je content
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
