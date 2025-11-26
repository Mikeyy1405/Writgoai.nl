
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Search, 
  Plus, 
  ShoppingCart, 
  Image as ImageIcon, 
  CheckCircle, 
  Loader2, 
  Settings,
  ExternalLink,
  Package,
  Sparkles,
  Star,
  Info,
  ChevronRight,
  Link as LinkIcon,
  TruckIcon,
  Tag,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BolProduct {
  ean: string;
  bolProductId: number;
  title: string;
  description: string;
  url: string;
  price?: number;
  regularPrice?: number;
  rating?: number;
  image?: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  categories?: Array<{
    id: number;
    name: string;
    level: number;
  }>;
  affiliateLink?: string;
  specifications?: Array<{
    name: string;
    specifications: Array<{ name: string; value: string }>;
  }>;
  deliveryDescription?: string;
  inStock?: boolean;
}

interface WooCommerceProduct {
  id: string;
  name: string;
  price?: string;
  status: string;
  permalink?: string;
  createdAt: string;
  aiOptimized: boolean;
}

export default function WooCommerceProductsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);

  const [activeTab, setActiveTab] = useState('search');
  const [projectId, setProjectId] = useState<string>('');
  const [projects, setProjects] = useState<any[]>([]);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BolProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMeta, setSearchMeta] = useState<any>(null);
  
  // Product generation state
  const [selectedProduct, setSelectedProduct] = useState<BolProduct | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [customPrice, setCustomPrice] = useState('');
  const [customSalePrice, setCustomSalePrice] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  
  // Product list state
  const [wooProducts, setWooProducts] = useState<WooCommerceProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  // Load existing products state
  const [existingProducts, setExistingProducts] = useState<any[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [isRewritingProduct, setIsRewritingProduct] = useState<string | null>(null);
  
  // Auto-update state
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [autoUpdateSchedule, setAutoUpdateSchedule] = useState('weekly');
  const [isTogglingAutoUpdate, setIsTogglingAutoUpdate] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadProjects();
    }
  }, [status]);

  useEffect(() => {
    const paramProjectId = searchParams?.get('projectId');
    if (paramProjectId && projects.length > 0) {
      setProjectId(paramProjectId);
    } else if (projects.length > 0 && !projectId) {
      const primaryProject = projects.find(p => p.isPrimary);
      setProjectId(primaryProject?.id || projects[0].id);
    }
  }, [searchParams, projects]);

  useEffect(() => {
    if (projectId) {
      loadWooProducts();
      loadAutoUpdateStatus();
    }
  }, [projectId]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/client/projects');
      const data = await response.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Fout bij laden projecten:', error);
    }
  };

  const loadWooProducts = async () => {
    if (!projectId) return;
    
    setIsLoadingProducts(true);
    try {
      const response = await fetch(`/api/client/woocommerce/products?projectId=${projectId}`);
      const data = await response.json();
      
      if (response.ok) {
        setWooProducts(data.products || []);
      } else {
        toast.error(data.error || 'Fout bij laden producten');
      }
    } catch (error) {
      console.error('Fout bij laden WooCommerce producten:', error);
      toast.error('Fout bij laden producten');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const searchBolProducts = async () => {
    if (!searchTerm.trim() || !projectId) {
      toast.error('Voer een zoekterm in');
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/client/woocommerce/search-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          searchTerm: searchTerm.trim(),
          page: 1,
          resultsPerPage: 20,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data.products || []);
        setSearchMeta({
          totalResults: data.totalResults,
          totalPages: data.totalPages,
          currentPage: data.currentPage,
        });
        
        if (data.products.length === 0) {
          toast('Geen producten gevonden');
        }
      } else {
        toast.error(data.error || 'Fout bij zoeken');
      }
    } catch (error) {
      console.error('Fout bij zoeken Bol.com producten:', error);
      toast.error('Fout bij zoeken');
    } finally {
      setIsSearching(false);
    }
  };

  const selectProduct = (product: BolProduct) => {
    setSelectedProduct(product);
    setSelectedImages(product.images.slice(0, 3).map(img => img.url));
    setCustomPrice(product.price?.toString() || '');
    setCustomSalePrice('');
    setCategories([]);
    setTags([]);
    setShowProductDialog(true);
  };

  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages(prev => {
      if (prev.includes(imageUrl)) {
        return prev.filter(url => url !== imageUrl);
      } else {
        return [...prev, imageUrl];
      }
    });
  };

  const generateWooProduct = async () => {
    if (!selectedProduct || selectedImages.length === 0) {
      toast.error('Selecteer minimaal 1 afbeelding');
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/client/woocommerce/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ean: selectedProduct.ean,
          selectedImages,
          customPrice,
          customSalePrice,
          categories,
          tags,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Product succesvol aangemaakt! 🎉');
        setShowProductDialog(false);
        setSelectedProduct(null);
        setActiveTab('products');
        loadWooProducts();
      } else {
        toast.error(data.error || 'Fout bij aanmaken product');
      }
    } catch (error) {
      console.error('Fout bij genereren WooCommerce product:', error);
      toast.error('Fout bij aanmaken product');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExistingProducts = async () => {
    if (!projectId) return;
    
    setIsLoadingExisting(true);
    try {
      const response = await fetch('/api/client/woocommerce/load-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          page: 1,
          perPage: 50,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setExistingProducts(data.products || []);
      } else {
        toast.error(data.error || 'Fout bij laden producten');
      }
    } catch (error) {
      console.error('Fout bij laden bestaande producten:', error);
      toast.error('Fout bij laden producten');
    } finally {
      setIsLoadingExisting(false);
    }
  };

  const rewriteProduct = async (productId: string) => {
    if (!projectId) return;
    
    setIsRewritingProduct(productId);
    try {
      const response = await fetch('/api/client/woocommerce/rewrite-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          productId,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || 'Product succesvol herschreven! 🎉');
        // Reload products to show updated data
        loadExistingProducts();
      } else {
        toast.error(data.error || 'Fout bij herschrijven product');
      }
    } catch (error) {
      console.error('Fout bij herschrijven product:', error);
      toast.error('Fout bij herschrijven product');
    } finally {
      setIsRewritingProduct(null);
    }
  };

  const loadAutoUpdateStatus = async () => {
    if (!projectId) return;
    
    try {
      const response = await fetch(`/api/client/woocommerce/schedule-updates?projectId=${projectId}`);
      const data = await response.json();
      
      if (response.ok) {
        setAutoUpdateEnabled(data.enabled || false);
        setAutoUpdateSchedule(data.schedule || 'weekly');
      }
    } catch (error) {
      console.error('Fout bij laden auto-update status:', error);
    }
  };

  const toggleAutoUpdate = async () => {
    if (!projectId) return;
    
    setIsTogglingAutoUpdate(true);
    try {
      const response = await fetch('/api/client/woocommerce/schedule-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          enabled: !autoUpdateEnabled,
          schedule: autoUpdateSchedule,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAutoUpdateEnabled(!autoUpdateEnabled);
        toast.success(data.message || 'Update instellingen opgeslagen! ✅');
      } else {
        toast.error(data.error || 'Fout bij opslaan instellingen');
      }
    } catch (error) {
      console.error('Fout bij toggle auto-update:', error);
      toast.error('Fout bij opslaan instellingen');
    } finally {
      setIsTogglingAutoUpdate(false);
    }
  };

  if (status === 'loading' || !isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const currentProject = projects.find(p => p.id === projectId);
  
  // Check both WooCommerce credentials AND WordPress credentials (WooCommerce is a WordPress plugin)
  const hasWooCommerceCredentials = currentProject?.wooCommerceUrl && 
                                    currentProject?.wooCommerceConsumerKey &&
                                    currentProject?.wooCommerceConsumerSecret;
  
  const hasWordPressCredentials = currentProject?.wordpressUrl && 
                                  currentProject?.wordpressUsername && 
                                  currentProject?.wordpressPassword;
  
  const isConfigured = hasWooCommerceCredentials || hasWordPressCredentials;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
                  <Package className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    WooCommerce Producten
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    Zoek nieuwe producten, laad bestaande producten en herschrijf met AI
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Project selector & Status */}
          <div className="flex items-center gap-4">
            {projects.length > 1 && (
              <div className="flex-1 max-w-xs">
                <Label className="text-sm text-gray-400 mb-2">Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id} className="text-white">
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {isConfigured && (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-700/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium text-green-300">
                    {hasWooCommerceCredentials ? 'WooCommerce' : 'WordPress'} Geconfigureerd
                  </span>
                </div>
                
                {/* Auto-Update Toggle */}
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-6 rounded-full transition-colors ${autoUpdateEnabled ? 'bg-green-500' : 'bg-gray-600'} relative cursor-pointer`}
                         onClick={toggleAutoUpdate}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${autoUpdateEnabled ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">Auto-Update</span>
                      <span className="text-xs text-gray-400">Wekelijkse prijs/voorraad check</span>
                    </div>
                  </div>
                  {isTogglingAutoUpdate && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
                </div>
              </>
            )}
          </div>
        </div>
        
        {!isConfigured && (
          <div className="mt-6 p-5 bg-gray-800/50 border-2 border-orange-500/30 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="bg-orange-500/20 p-2 rounded-lg">
                <Info className="h-6 w-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">
                  WordPress of WooCommerce Configuratie Vereist
                </h3>
                <p className="text-sm text-gray-300 mb-3">
                  WooCommerce is een WordPress plugin. Als je al WordPress credentials hebt ingesteld, 
                  werken die automatisch voor WooCommerce producten! Geen aparte configuratie nodig. 🎉
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/client-portal/project-settings?projectId=${projectId}`)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    Ga naar Project Instellingen
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <span className="text-xs text-gray-400">
                    Stel WordPress of WooCommerce in
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6 h-12 bg-gray-800 border border-gray-700">
          <TabsTrigger 
            value="search" 
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400"
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Zoeken</span>
            <span className="sm:hidden">Zoeken</span>
          </TabsTrigger>
          <TabsTrigger 
            value="existing"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400"
            onClick={() => isConfigured && loadExistingProducts()}
          >
            <Package className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Bestaande</span>
            <span className="sm:hidden">Bestaand</span>
          </TabsTrigger>
          <TabsTrigger 
            value="products"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Database</span>
            <span className="sm:hidden">DB</span>
            <Badge className="ml-2 bg-orange-600 text-white text-xs">{wooProducts.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card className="border-2 border-gray-700 shadow-sm bg-gray-800">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-800 border-b border-gray-700">
              <CardTitle className="flex items-center gap-2 text-white">
                <Search className="h-5 w-5 text-orange-500" />
                Zoek Bol.com Producten
              </CardTitle>
              <CardDescription className="text-gray-400">
                Zoek producten op Bol.com en voeg ze toe aan je webshop met AI-gegenereerde beschrijvingen
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="bijv. 'bluetooth speaker' of 'koffiezetapparaat'"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && isConfigured && searchBolProducts()}
                    disabled={!isConfigured}
                    className="h-11 text-base bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <Button 
                  onClick={searchBolProducts} 
                  disabled={isSearching || !isConfigured}
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Zoeken...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Zoeken
                    </>
                  )}
                </Button>
              </div>
              
              {searchMeta && (
                <div className="mt-4 flex items-center gap-2 text-sm text-white bg-orange-500/20 px-4 py-2 rounded-lg border border-orange-500/30">
                  <CheckCircle className="h-4 w-4 text-orange-400" />
                  <span className="font-medium">{searchMeta.totalResults} resultaten gevonden</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {searchResults.map((product) => (
                <Card 
                  key={product.ean} 
                  className="group hover:shadow-xl transition-all duration-200 border-2 border-gray-700 hover:border-orange-500 cursor-pointer bg-gray-800"
                  onClick={() => selectProduct(product)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="h-16 w-16 text-gray-600" />
                        </div>
                      )}
                      {product.rating && (
                        <div className="absolute top-3 right-3 bg-gray-900/95 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-md border border-gray-700">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-semibold text-white">{product.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem] text-white group-hover:text-orange-400 transition-colors">
                        {product.title}
                      </h3>
                      
                      {/* Category */}
                      {product.categories && product.categories.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Tag className="h-3.5 w-3.5" />
                          <span className="line-clamp-1">
                            {product.categories.map(c => c.name).join(' > ')}
                          </span>
                        </div>
                      )}
                      
                      {/* Price & Stock Status */}
                      <div className="flex items-center justify-between">
                        {product.price ? (
                          <div className="flex flex-col">
                            <span className="text-2xl font-bold text-orange-500">
                              €{product.price.toFixed(2)}
                            </span>
                            {product.regularPrice && product.regularPrice > product.price && (
                              <span className="text-xs text-gray-500 line-through">
                                €{product.regularPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Prijs niet beschikbaar</span>
                        )}
                        
                        {product.inStock !== undefined && (
                          <Badge 
                            variant={product.inStock ? 'default' : 'secondary'}
                            className={product.inStock ? 'bg-green-900/30 text-green-400 border-green-700/50' : 'bg-red-900/30 text-red-400 border-red-700/50'}
                          >
                            {product.inStock ? 'Op voorraad' : 'Uitverkocht'}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Delivery Info */}
                      {product.deliveryDescription && (
                        <div className="flex items-start gap-1.5 text-xs text-gray-400 bg-gray-900/50 px-2 py-1.5 rounded">
                          <TruckIcon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{product.deliveryDescription}</span>
                        </div>
                      )}
                      
                      {/* Affiliate Link */}
                      {product.affiliateLink && (
                        <a
                          href={product.affiliateLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          <span className="font-medium">Bekijk op Bol.com</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectProduct(product);
                        }}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                        size="sm"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Toevoegen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Existing Products Tab */}
        <TabsContent value="existing">
          {isLoadingExisting ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
              <p className="text-gray-400 font-medium">Producten laden uit WooCommerce...</p>
            </div>
          ) : !isConfigured ? (
            <Card className="border-2 border-dashed border-gray-700 bg-gray-800">
              <CardContent className="py-16 text-center">
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <Settings className="h-10 w-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Configuratie Vereist</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Configureer eerst je WordPress of WooCommerce credentials om bestaande producten te kunnen laden.
                </p>
              </CardContent>
            </Card>
          ) : existingProducts.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-700 bg-gray-800">
              <CardContent className="py-16 text-center">
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <Package className="h-10 w-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Geen producten gevonden</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Er zijn nog geen producten in je WooCommerce webshop, of ze konden niet worden geladen.
                </p>
                <Button 
                  onClick={loadExistingProducts}
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  <Package className="mr-2 h-5 w-5" />
                  Opnieuw Laden
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">
                  {existingProducts.length} {existingProducts.length === 1 ? 'product' : 'producten'} in je webshop
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadExistingProducts}
                  disabled={isLoadingExisting}
                  className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
                >
                  {isLoadingExisting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Package className="mr-2 h-4 w-4" />
                      Vernieuwen
                    </>
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {existingProducts.map((product) => (
                  <Card 
                    key={product.id}
                    className="group hover:shadow-xl transition-all duration-200 border-2 border-gray-700 hover:border-orange-500 bg-gray-800"
                  >
                    <CardContent className="p-0">
                      {product.images && product.images.length > 0 && (
                        <div className="aspect-square bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
                          <img
                            src={product.images[0].src}
                            alt={product.name}
                            className="w-full h-full object-contain p-4"
                          />
                        </div>
                      )}
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-sm mb-3 line-clamp-2 min-h-[2.5rem] text-white group-hover:text-orange-400 transition-colors">
                          {product.name}
                        </h3>
                        
                        {product.shortDescription && (
                          <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                            {product.shortDescription.replace(/<[^>]*>/g, '')}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mb-4">
                          {product.price && (
                            <div className="flex flex-col">
                              <span className="text-2xl font-bold text-orange-500">
                                €{parseFloat(product.price).toFixed(2)}
                              </span>
                              {product.salePrice && parseFloat(product.salePrice) < parseFloat(product.regularPrice) && (
                                <span className="text-xs text-gray-500 line-through">
                                  €{parseFloat(product.regularPrice).toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                          <Badge 
                            variant={product.status === 'publish' ? 'default' : 'secondary'}
                            className={product.status === 'publish' ? 'bg-green-900/30 text-green-400 border-green-700/50' : 'bg-gray-700 text-gray-300'}
                          >
                            {product.status === 'publish' ? 'Live' : product.status}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => rewriteProduct(product.id.toString())}
                            disabled={isRewritingProduct === product.id.toString()}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                            size="sm"
                          >
                            {isRewritingProduct === product.id.toString() ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Herschrijven...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Herschrijven
                              </>
                            )}
                          </Button>
                          {product.permalink && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-transparent border-gray-700 text-white hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500"
                              onClick={() => window.open(product.permalink, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          {isLoadingProducts ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
              <p className="text-gray-400 font-medium">Producten laden...</p>
            </div>
          ) : wooProducts.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-700 bg-gray-800">
              <CardContent className="py-16 text-center">
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <Package className="h-10 w-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Nog geen producten</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Begin met zoeken naar producten om toe te voegen aan je webshop. 
                  AI genereert automatisch professionele beschrijvingen.
                </p>
                <Button 
                  onClick={() => setActiveTab('search')}
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Product Zoeken
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">
                  {wooProducts.length} {wooProducts.length === 1 ? 'product' : 'producten'} in je webshop
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {wooProducts.map((product) => (
                  <Card 
                    key={product.id}
                    className="group hover:shadow-xl transition-all duration-200 border-2 border-gray-700 hover:border-orange-500 bg-gray-800"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-sm line-clamp-2 flex-1 text-white group-hover:text-orange-400 transition-colors min-h-[2.5rem]">
                          {product.name}
                        </h3>
                        {product.aiOptimized && (
                          <Badge className="ml-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                      
                      {product.price && (
                        <div className="mb-4">
                          <span className="text-2xl font-bold text-orange-500">
                            €{parseFloat(product.price).toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b border-gray-700">
                        <Badge 
                          variant={product.status === 'publish' ? 'default' : 'secondary'}
                          className={product.status === 'publish' ? 'bg-green-900/30 text-green-400 border-green-700/50' : 'bg-gray-700 text-gray-300'}
                        >
                          {product.status === 'publish' ? 'Gepubliceerd' : product.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(product.createdAt).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      {product.permalink && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full group-hover:bg-orange-500/10 group-hover:text-orange-400 group-hover:border-orange-500 transition-colors bg-transparent border-gray-700 text-white"
                          onClick={() => window.open(product.permalink, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Bekijk in Webshop
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Product Generation Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Product Toevoegen aan WooCommerce</DialogTitle>
            <DialogDescription className="text-gray-400">
              Selecteer afbeeldingen en configureer het product. AI genereert automatisch optimale beschrijvingen.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4 mt-4">
              {/* Product Info */}
              <div>
                <h3 className="font-semibold mb-2 text-white">{selectedProduct.title}</h3>
                {selectedProduct.description && (
                  <p className="text-sm text-gray-400 line-clamp-3">
                    {selectedProduct.description}
                  </p>
                )}
              </div>
              
              {/* Image Selection */}
              <div>
                <Label className="mb-2 block text-white">
                  Selecteer Afbeeldingen ({selectedImages.length} geselecteerd)
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {selectedProduct.images.map((image, index) => (
                    <div
                      key={index}
                      onClick={() => toggleImageSelection(image.url)}
                      className={`aspect-square bg-gray-800 rounded-lg cursor-pointer relative overflow-hidden border-2 ${
                        selectedImages.includes(image.url)
                          ? 'border-orange-500'
                          : 'border-gray-700'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`Product afbeelding ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                      {selectedImages.includes(image.url) && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-6 w-6 text-orange-500 bg-gray-900 rounded-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Prijs (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="29.99"
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label className="text-white">Aanbiedingsprijs (€) (optioneel)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={customSalePrice}
                    onChange={(e) => setCustomSalePrice(e.target.value)}
                    placeholder="24.99"
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
              
              {/* Categories */}
              <div>
                <Label className="text-white">Categorieën (comma-separated)</Label>
                <Input
                  value={categories.join(', ')}
                  onChange={(e) => setCategories(e.target.value.split(',').map(c => c.trim()).filter(Boolean))}
                  placeholder="Elektronica, Audio, Speakers"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              
              {/* Tags */}
              <div>
                <Label className="text-white">Tags (comma-separated)</Label>
                <Input
                  value={tags.join(', ')}
                  onChange={(e) => setTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  placeholder="bluetooth, wireless, muziek"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              
              {/* Info */}
              <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg">
                <p className="text-sm text-orange-300 flex items-start">
                  <Sparkles className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-orange-400" />
                  <span>
                    AI genereert automatisch een korte en lange productbeschrijving in het {currentProject?.language === 'NL' ? 'Nederlands' : 'Engels'}.
                    Het product wordt aangemaakt met een affiliate link naar Bol.com.
                  </span>
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowProductDialog(false)}
                  disabled={isGenerating}
                  className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
                >
                  Annuleren
                </Button>
                <Button
                  onClick={generateWooProduct}
                  disabled={isGenerating || selectedImages.length === 0}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Product Aanmaken...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Product Aanmaken met AI
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
