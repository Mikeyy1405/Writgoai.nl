'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  Upload,
  Store,
  RefreshCw,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

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

interface WooProduct {
  id: number;
  name: string;
  type: string;
  status: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  stockStatus: string;
  stockQuantity?: number;
  sku: string;
  categories: any[];
  tags: any[];
  images: any[];
  description: string;
  shortDescription: string;
  externalUrl?: string;
  buttonText?: string;
  permalink: string;
  dateCreated: string;
  dateModified: string;
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
  
  // Search state (Bol.com)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BolProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMeta, setSearchMeta] = useState<any>(null);
  
  // WooCommerce products state
  const [wooProducts, setWooProducts] = useState<WooProduct[]>([]);
  const [isLoadingWoo, setIsLoadingWoo] = useState(false);
  const [wooSearchTerm, setWooSearchTerm] = useState('');
  const [wooPage, setWooPage] = useState(1);
  const [wooPagination, setWooPagination] = useState<any>({});
  
  // Product management state
  const [selectedProduct, setSelectedProduct] = useState<BolProduct | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [customPrice, setCustomPrice] = useState('');
  const [customSalePrice, setCustomSalePrice] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Array<{id?: number; name: string}>>([]);
  const [wooCategories, setWooCategories] = useState<Array<{id: number; name: string}>>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [productType, setProductType] = useState<'simple' | 'external'>('external');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showPushDialog, setShowPushDialog] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null);
  const [isSyncingPrices, setIsSyncingPrices] = useState(false);
  
  // Bulk import state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isBulkPushing, setIsBulkPushing] = useState(false);
  const [bulkPushProgress, setBulkPushProgress] = useState<{current: number; total: number} | null>(null);

  // Rewrite state
  const [selectedProductForRewrite, setSelectedProductForRewrite] = useState<WooProduct | null>(null);
  const [rewriteImprovements, setRewriteImprovements] = useState('');
  const [showRewriteDialog, setShowRewriteDialog] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteProgress, setRewriteProgress] = useState(0);
  const [currentRewriteStep, setCurrentRewriteStep] = useState('');
  const [showRewriteProgressDialog, setShowRewriteProgressDialog] = useState(false);
  const [includeMetaDescription, setIncludeMetaDescription] = useState(false);
  const [optimizeTitleForSEO, setOptimizeTitleForSEO] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      loadProjects();
    }
  }, [session]);

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (projectId && activeTab === 'existing') {
      loadWooProducts();
    }
  }, [projectId, activeTab, wooPage]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/client/projects');
      if (response.ok) {
        const data = await response.json();
        // Filter projects with either WooCommerce/WordPress OR Bol.com configuration
        const projectsWithWoo = data.projects?.filter((p: any) => 
          p.woocommerceUrl || p.wordpressUrl || (p.bolcomClientId && p.bolcomClientSecret)
        ) || [];
        setProjects(projectsWithWoo);
        
        if (projectsWithWoo.length > 0 && !projectId) {
          setProjectId(projectsWithWoo[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Fout bij laden van projecten');
    }
  };

  const testWooConnection = async () => {
    if (!projectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    setIsTestingConnection(true);
    setConnectionTestResult(null);
    try {
      const response = await fetch('/api/client/woocommerce/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();
      setConnectionTestResult(data);

      if (data.success) {
        toast.success(data.message || 'Verbinding succesvol!');
      } else {
        toast.error(data.error || 'Verbinding mislukt');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Fout bij testen van verbinding');
      setConnectionTestResult({
        success: false,
        error: 'Netwerkfout',
        details: 'Kan geen verbinding maken met de server',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const loadWooCategories = async () => {
    if (!projectId) return;

    setIsLoadingCategories(true);
    try {
      const response = await fetch(`/api/client/woocommerce/categories?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setWooCategories(data.categories || []);
      } else {
        console.error('Fout bij laden van categorieën');
      }
    } catch (error) {
      console.error('Error loading WooCommerce categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadWooProducts = async () => {
    if (!projectId) return;

    setIsLoadingWoo(true);
    try {
      const params = new URLSearchParams({
        projectId,
        page: wooPage.toString(),
        perPage: '20',
      });

      if (wooSearchTerm) {
        params.append('search', wooSearchTerm);
      }

      const response = await fetch(`/api/client/woocommerce/load-products?${params}`);
      if (response.ok) {
        const data = await response.json();
        setWooProducts(data.products || []);
        setWooPagination(data.pagination || {});
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fout bij laden van WooCommerce producten');
      }
    } catch (error) {
      console.error('Error loading WooCommerce products:', error);
      toast.error('Fout bij laden van WooCommerce producten');
    } finally {
      setIsLoadingWoo(false);
    }
  };

  const searchBolProducts = async () => {
    if (!searchTerm.trim() || !projectId) {
      toast.error('Voer een zoekterm in en selecteer een project');
      return;
    }

    setIsSearching(true);
    setSearchResults([]); // Clear previous results
    setSearchMeta(null);
    
    try {
      console.log('🔍 Starting Bol.com search:', { searchTerm, projectId });

      const requestBody = {
        searchTerm: searchTerm.trim(),
        projectId,
      };
      
      console.log('📤 Sending search request:', requestBody);

      const response = await fetch('/api/client/woocommerce/search-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Search results:', data);
        
        setSearchResults(data.products || []);
        setSearchMeta({
          totalResults: data.totalResults,
          totalPages: data.totalPages,
          currentPage: data.currentPage,
        });
        
        if (!data.products || data.products.length === 0) {
          // Show helpful message if provided
          if (data.message) {
            toast.error(data.message, { duration: 5000 });
          } else {
            toast.error('Geen producten gevonden');
          }
        } else {
          toast.success(`${data.products.length} producten gevonden`);
        }
      } else {
        const error = await response.json();
        console.error('❌ Search error:', error);
        toast.error(error.error || 'Fout bij zoeken');
      }
    } catch (error: any) {
      console.error('❌ Exception during search:', error);
      toast.error(error.message || 'Fout bij zoeken van producten');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProduct = (product: BolProduct) => {
    setSelectedProduct(product);
    setSelectedImages(product.images?.slice(0, 1).map(img => img.url) || []);
    setCustomPrice(product.price?.toString() || '');
    setCustomSalePrice('');
    
    // Set categories from Bol.com if available
    if (product.categories && product.categories.length > 0) {
      setSelectedCategories(product.categories.map(cat => ({ name: cat.name })));
    } else {
      setSelectedCategories([]);
    }
    
    setTags([]);
    // Auto-detect product type: bol.com products should be affiliate/external
    setProductType('external');
    setShowProductDialog(true);
    
    // Load WooCommerce categories when dialog opens
    loadWooCategories();
  };

  const toggleProductSelection = (ean: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ean)) {
        newSet.delete(ean);
      } else {
        newSet.add(ean);
      }
      return newSet;
    });
  };

  const selectAllProducts = () => {
    setSelectedProducts(new Set(searchResults.map(p => p.ean)));
  };

  const deselectAllProducts = () => {
    setSelectedProducts(new Set());
  };

  const handleBulkPushToWooCommerce = async () => {
    if (selectedProducts.size === 0 || !projectId) {
      toast.error('Selecteer minimaal 1 product');
      return;
    }

    const productsToImport = searchResults.filter(p => selectedProducts.has(p.ean));

    setIsBulkPushing(true);
    setBulkPushProgress({ current: 0, total: productsToImport.length });

    try {
      const productDataList = productsToImport.map(product => ({
        name: product.title,
        description: product.description,
        shortDescription: product.description?.slice(0, 200) || '',
        regularPrice: product.price,
        images: product.images.slice(0, 3).map(img => ({ src: img.url })),
        categories: product.categories?.map(cat => ({ name: cat.name })) || [],
        ean: product.ean,
        externalUrl: product.affiliateLink,
        affiliateLink: product.affiliateLink,
        buttonText: 'Bekijk op Bol.com',
        stockStatus: product.inStock ? 'instock' : 'outofstock',
      }));

      const response = await fetch('/api/client/woocommerce/bulk-push-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          products: productDataList,
          productType: 'external',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Fout bij bulk import');
      }

      toast.success(`✅ ${data.summary.succeeded} van ${data.summary.total} producten toegevoegd!`);
      
      if (data.summary.failed > 0) {
        toast.error(`⚠️ ${data.summary.failed} producten mislukt`);
      }

      // Reset selectie
      deselectAllProducts();

      // Refresh WooCommerce products
      if (activeTab === 'manage') {
        loadWooProducts();
      }

    } catch (error: any) {
      console.error('Bulk push error:', error);
      toast.error(error.message || 'Fout bij bulk import');
    } finally {
      setIsBulkPushing(false);
      setBulkPushProgress(null);
    }
  };

  const handlePushToWooCommerce = async () => {
    if (!selectedProduct || !projectId) return;

    setIsPushing(true);
    try {
      const productData = {
        name: selectedProduct.title,
        description: selectedProduct.description,
        shortDescription: selectedProduct.description?.slice(0, 200) || '',
        regularPrice: customPrice || selectedProduct.price,
        salePrice: customSalePrice || '',
        images: selectedImages.map(url => ({ src: url })),
        categories: selectedCategories.length > 0 ? selectedCategories : (selectedProduct.categories?.map(cat => ({ name: cat.name })) || []),
        tags: tags.map(tag => ({ name: tag })),
        ean: selectedProduct.ean,
        externalUrl: selectedProduct.affiliateLink,
        affiliateLink: selectedProduct.affiliateLink,
        buttonText: 'Toevoegen aan winkelwagen',
        stockStatus: selectedProduct.inStock ? 'instock' : 'outofstock',
      };

      const response = await fetch('/api/client/woocommerce/push-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          productData,
          productType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Product succesvol gepusht naar WooCommerce!');
        setShowProductDialog(false);
        setShowPushDialog(false);
        
        // Refresh WooCommerce products if on that tab
        if (activeTab === 'existing') {
          loadWooProducts();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fout bij pushen naar WooCommerce');
      }
    } catch (error) {
      console.error('Error pushing to WooCommerce:', error);
      toast.error('Fout bij pushen naar WooCommerce');
    } finally {
      setIsPushing(false);
    }
  };

  const handleRewriteClick = (product: WooProduct) => {
    setSelectedProductForRewrite(product);
    setRewriteImprovements('');
    setIncludeMetaDescription(false);
    setOptimizeTitleForSEO(false);
    setShowRewriteDialog(true);
  };

  const handleRewriteSubmit = async () => {
    if (!selectedProductForRewrite || !projectId) return;

    setIsRewriting(true);
    setRewriteProgress(0);
    setCurrentRewriteStep('Valideren...');
    setShowRewriteDialog(false);
    setShowRewriteProgressDialog(true);

    try {
      const response = await fetch('/api/client/woocommerce/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId,
          productId: selectedProductForRewrite.id,
          improvements: rewriteImprovements || undefined,
          includeMetaDescription,
          optimizeTitleForSEO,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start rewrite');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      const totalSteps = 8;
      let currentStepCount = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'progress') {
              currentStepCount++;
              const progressPercentage = Math.min((currentStepCount / totalSteps) * 100, 95);
              setRewriteProgress(progressPercentage);
              
              let stepName = data.message;
              if (stepName.includes('✅') || stepName.includes('🔍') || stepName.includes('🤖') || stepName.includes('✍️') || stepName.includes('🧹') || stepName.includes('📤') || stepName.includes('💾')) {
                stepName = stepName.replace(/[✅🔍🤖✍️🧹📤💾]/g, '').trim();
              }
              setCurrentRewriteStep(stepName);
            } else if (data.type === 'error') {
              toast.error(data.error);
              setCurrentRewriteStep(`Fout: ${data.error}`);
              setRewriteProgress(100);
            } else if (data.type === 'success') {
              setRewriteProgress(100);
              setCurrentRewriteStep('Voltooid! ✅');
              toast.success(
                `✅ Product succesvol herschreven! ${data.creditsUsed} credits gebruikt.`,
                { duration: 5000 }
              );
              
              setTimeout(() => {
                setShowRewriteProgressDialog(false);
                setSelectedProductForRewrite(null);
                setRewriteImprovements('');
                loadWooProducts();
              }, 2000);
            }
          } catch (e) {
            console.error('Failed to parse line:', line, e);
          }
        }
      }

    } catch (error) {
      console.error('Error rewriting product:', error);
      toast.error('Onverwachte fout bij herschrijven');
      setCurrentRewriteStep('Fout opgetreden');
      setRewriteProgress(100);
    } finally {
      setIsRewriting(false);
    }
  };

  const syncPrices = async () => {
    if (!projectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    setIsSyncingPrices(true);
    try {
      const response = await fetch('/api/client/woocommerce/sync-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          autoSync: false, // Manual sync
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Prijzen succesvol gesynchroniseerd!');
        
        // Refresh products list
        if (activeTab === 'existing') {
          loadWooProducts();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fout bij synchroniseren van prijzen');
      }
    } catch (error) {
      console.error('Error syncing prices:', error);
      toast.error('Fout bij synchroniseren van prijzen');
    } finally {
      setIsSyncingPrices(false);
    }
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

  if (status === 'loading' || !isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">WooCommerce Producten</h1>
            <p className="text-orange-100">
              Zoek en beheer producten voor je WooCommerce winkel
            </p>
          </div>
        </div>

        {/* Project Selector */}
        <Card className="mb-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-500" />
              Project Selectie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Selecteer een project" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="text-white">
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {projects.length === 0 && (
              <p className="mt-2 text-sm text-gray-400">
                Geen projecten met Bol.com of WooCommerce configuratie gevonden. Configureer eerst Bol.com credentials in Project Instellingen.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="search" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Search className="w-4 h-4 mr-2" />
              Bol.com Zoeken
            </TabsTrigger>
            <TabsTrigger value="existing" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Store className="w-4 h-4 mr-2" />
              WooCommerce Producten
            </TabsTrigger>
          </TabsList>

          {/* Bol.com Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Zoek Producten op Bol.com</CardTitle>
                <CardDescription className="text-gray-400">
                  Zoek producten en push ze naar je WooCommerce winkel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Search Term */}
                  <div>
                    <Label htmlFor="searchTerm" className="text-gray-300 mb-2">Zoekterm</Label>
                    <div className="flex gap-4">
                      <Input
                        id="searchTerm"
                        placeholder="Bijv: haardroger, laptop, boeken..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchBolProducts()}
                        className="bg-gray-700 border-gray-600 text-white"
                        disabled={!projectId}
                      />
                      <Button
                        onClick={searchBolProducts}
                        disabled={isSearching || !projectId}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                      >
                        {isSearching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Bulk Actions Header */}
                {searchResults.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedProducts.size === searchResults.length && searchResults.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                selectAllProducts();
                              } else {
                                deselectAllProducts();
                              }
                            }}
                          />
                          <span className="text-sm text-gray-300">
                            Selecteer alles
                          </span>
                        </div>
                        {selectedProducts.size > 0 && (
                          <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                            {selectedProducts.size} geselecteerd
                          </Badge>
                        )}
                      </div>
                      
                      {selectedProducts.size > 0 && (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={deselectAllProducts}
                            variant="outline"
                            size="sm"
                            className="text-gray-300 border-gray-600 hover:bg-gray-700"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Wis selectie
                          </Button>
                          <Button
                            onClick={handleBulkPushToWooCommerce}
                            disabled={isBulkPushing}
                            size="sm"
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                          >
                            {isBulkPushing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {bulkPushProgress ? `${bulkPushProgress.current}/${bulkPushProgress.total}` : 'Bezig...'}
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Push {selectedProducts.size} producten
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((product) => (
                    <Card key={product.ean} className="bg-gray-700 border-gray-600 hover:border-orange-500 transition-colors relative">
                      <CardContent className="p-4">
                        {/* Selection Checkbox */}
                        <div className="absolute top-2 left-2 z-10">
                          <Checkbox
                            checked={selectedProducts.has(product.ean)}
                            onCheckedChange={() => toggleProductSelection(product.ean)}
                            className="bg-gray-800 border-gray-600"
                          />
                        </div>
                        
                        {/* Product Image */}
                        {product.images?.[0] && (
                          <div className="relative w-full aspect-square mb-4 bg-gray-800 rounded-lg overflow-hidden">
                            <Image
                              src={product.images[0].url}
                              alt={product.title}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}

                        {/* Product Info */}
                        <h3 className="font-semibold text-white mb-2 line-clamp-2">
                          {product.title}
                        </h3>

                        <div className="space-y-2 mb-4">
                          {/* Price */}
                          {product.price && (
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-orange-500">
                                €{product.price.toFixed(2)}
                              </span>
                              {product.regularPrice && product.regularPrice > product.price && (
                                <span className="text-sm text-gray-400 line-through">
                                  €{product.regularPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Rating */}
                          {product.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-300">{product.rating}/5</span>
                            </div>
                          )}

                          {/* Stock Status */}
                          <Badge className={product.inStock ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}>
                            {product.inStock ? 'Op voorraad' : 'Niet op voorraad'}
                          </Badge>

                          {/* Categories */}
                          {product.categories && product.categories.length > 0 && (
                            <div className="text-xs text-gray-400">
                              {product.categories[product.categories.length - 1]?.name}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSelectProduct(product)}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                            size="sm"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Push naar WooCommerce
                          </Button>
                        </div>

                        {/* Partner Link */}
                        {product.affiliateLink && (
                          <a
                            href={product.affiliateLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Bekijk op Bol.com
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WooCommerce Products Tab */}
          <TabsContent value="existing" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>WooCommerce Producten</span>
                  <div className="flex gap-2">
                    <Button
                      onClick={syncPrices}
                      disabled={isSyncingPrices || !projectId}
                      variant="outline"
                      size="sm"
                      className="border-orange-600 text-orange-400 hover:bg-orange-900/20"
                      title="Synchroniseer prijzen met Bol.com"
                    >
                      <Tag className={`w-4 h-4 mr-2 ${isSyncingPrices ? 'animate-spin' : ''}`} />
                      Sync Prijzen
                    </Button>
                    <Button
                      onClick={testWooConnection}
                      disabled={isTestingConnection || !projectId}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-white hover:bg-gray-700"
                    >
                      <Settings className={`w-4 h-4 mr-2 ${isTestingConnection ? 'animate-spin' : ''}`} />
                      Test Verbinding
                    </Button>
                    <Button
                      onClick={loadWooProducts}
                      disabled={isLoadingWoo || !projectId}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-white hover:bg-gray-700"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingWoo ? 'animate-spin' : ''}`} />
                      Ververs
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Beheer je bestaande WooCommerce producten
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Connection Test Result */}
                {connectionTestResult && (
                  <div className={`p-4 rounded-lg mb-6 ${
                    connectionTestResult.success 
                      ? 'bg-green-900/20 border border-green-600' 
                      : 'bg-red-900/20 border border-red-600'
                  }`}>
                    <div className="flex items-start gap-3">
                      {connectionTestResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className={`font-semibold mb-1 ${
                          connectionTestResult.success ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {connectionTestResult.success ? 'Verbinding Succesvol!' : connectionTestResult.error}
                        </h4>
                        {connectionTestResult.details && (
                          <p className="text-sm text-gray-300 mb-2">
                            {connectionTestResult.details}
                          </p>
                        )}
                        {connectionTestResult.success && connectionTestResult.storeInfo && (
                          <div className="text-sm text-gray-300 space-y-1">
                            {connectionTestResult.storeInfo.name && (
                              <p><strong>Winkel:</strong> {connectionTestResult.storeInfo.name}</p>
                            )}
                            {connectionTestResult.storeInfo.wooVersion && (
                              <p><strong>WooCommerce versie:</strong> {connectionTestResult.storeInfo.wooVersion}</p>
                            )}
                            <p><strong>Producten gevonden:</strong> {connectionTestResult.productsFound || 0}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {/* Search */}
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Zoek in WooCommerce..."
                    value={wooSearchTerm}
                    onChange={(e) => setWooSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setWooPage(1);
                        loadWooProducts();
                      }
                    }}
                    className="bg-gray-700 border-gray-600 text-white"
                    disabled={!projectId}
                  />
                  <Button
                    onClick={() => {
                      setWooPage(1);
                      loadWooProducts();
                    }}
                    disabled={isLoadingWoo || !projectId}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    {isLoadingWoo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Products Grid */}
                {isLoadingWoo ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  </div>
                ) : wooProducts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {wooProducts.map((product) => (
                        <Card key={product.id} className="bg-gray-700 border-gray-600">
                          <CardContent className="p-4">
                            {/* Product Image */}
                            {product.images?.[0] && (
                              <div className="relative w-full aspect-square mb-4 bg-gray-800 rounded-lg overflow-hidden">
                                <Image
                                  src={product.images[0].src}
                                  alt={product.name}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            )}

                            {/* Product Info */}
                            <h3 className="font-semibold text-white mb-2 line-clamp-2">
                              {product.name}
                            </h3>

                            {/* Description Preview */}
                            {(product.shortDescription || product.description) && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-400 mb-1">Beschrijving:</p>
                                <div 
                                  className="text-sm text-gray-300 line-clamp-2"
                                  dangerouslySetInnerHTML={{ 
                                    __html: (product.shortDescription || product.description)
                                      .replace(/<[^>]*>/g, ' ')
                                      .substring(0, 120) + '...'
                                  }}
                                />
                              </div>
                            )}
                            {!product.shortDescription && !product.description && (
                              <div className="mb-3">
                                <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400 border-yellow-600">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Geen beschrijving
                                </Badge>
                              </div>
                            )}

                            <div className="space-y-2 mb-4">
                              {/* Type Badge */}
                              <Badge className={
                                product.type === 'external' 
                                  ? 'bg-orange-900/30 text-orange-400'
                                  : 'bg-blue-900/30 text-blue-400'
                              }>
                                {product.type === 'external' ? 'Affiliate' : 'Simpel'}
                              </Badge>

                              {/* Price */}
                              {product.price && (
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl font-bold text-orange-500">
                                    €{parseFloat(product.price).toFixed(2)}
                                  </span>
                                  {product.salePrice && (
                                    <span className="text-sm text-gray-400 line-through">
                                      €{parseFloat(product.regularPrice).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Stock Status */}
                              <Badge className={
                                product.stockStatus === 'instock'
                                  ? 'bg-green-900/30 text-green-400'
                                  : 'bg-red-900/30 text-red-400'
                              }>
                                {product.stockStatus === 'instock' ? 'Op voorraad' : 'Niet op voorraad'}
                              </Badge>

                              {/* Status */}
                              <Badge className={
                                product.status === 'publish'
                                  ? 'bg-green-900/30 text-green-400'
                                  : 'bg-yellow-900/30 text-yellow-400'
                              }>
                                {product.status}
                              </Badge>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleRewriteClick(product)}
                                variant="outline"
                                size="sm"
                                className="flex-1 border-orange-600 text-orange-400 hover:bg-orange-900/20"
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Herschrijven
                              </Button>
                              {product.permalink && (
                                <Button
                                  onClick={() => window.open(product.permalink, '_blank')}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 border-gray-600 text-white hover:bg-gray-700"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Bekijk
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Pagination */}
                    {wooPagination.totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <Button
                          onClick={() => setWooPage(prev => Math.max(1, prev - 1))}
                          disabled={wooPage === 1 || isLoadingWoo}
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-white hover:bg-gray-700"
                        >
                          Vorige
                        </Button>
                        <span className="text-gray-400">
                          Pagina {wooPage} van {wooPagination.totalPages}
                        </span>
                        <Button
                          onClick={() => setWooPage(prev => prev + 1)}
                          disabled={wooPage >= wooPagination.totalPages || isLoadingWoo}
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-white hover:bg-gray-700"
                        >
                          Volgende
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Store className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <p>Geen producten gevonden</p>
                    {!projectId && (
                      <p className="text-sm mt-2">Selecteer eerst een project</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Push to WooCommerce Dialog */}
        <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto z-[9999]">
            <DialogHeader>
              <DialogTitle className="text-white">Push naar WooCommerce</DialogTitle>
              <DialogDescription className="text-gray-400">
                Configureer het product voordat je het naar WooCommerce pusht
              </DialogDescription>
            </DialogHeader>

            {selectedProduct && (
              <div className="space-y-6">
                {/* Product Type Selection */}
                <div>
                  <Label className="text-white mb-2 block">Product Type</Label>
                  <RadioGroup value={productType} onValueChange={(value: any) => setProductType(value)}>
                    <div className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg">
                      <RadioGroupItem value="external" id="external" className="border-orange-500 text-orange-500" />
                      <Label htmlFor="external" className="text-white flex-1 cursor-pointer">
                        <div className="font-semibold">Affiliate Product (External)</div>
                        <div className="text-sm text-gray-400">
                          Klanten worden doorverwezen naar Bol.com
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg">
                      <RadioGroupItem value="simple" id="simple" className="border-orange-500 text-orange-500" />
                      <Label htmlFor="simple" className="text-white flex-1 cursor-pointer">
                        <div className="font-semibold">Simpel Product</div>
                        <div className="text-sm text-gray-400">
                          Verkoop direct via je eigen winkel
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-orange-400 mt-2">
                    <Info className="w-3 h-3 inline mr-1" />
                    Voor Bol.com producten raden we Affiliate Product aan
                  </p>
                </div>

                {/* Product Name */}
                <div>
                  <Label className="text-white">Product Naam</Label>
                  <Input
                    value={selectedProduct.title}
                    disabled
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                  />
                </div>

                {/* Price Configuration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Prijs (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white mt-1"
                      placeholder={selectedProduct.price?.toString()}
                    />
                  </div>
                  <div>
                    <Label className="text-white">Sale Prijs (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={customSalePrice}
                      onChange={(e) => setCustomSalePrice(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white mt-1"
                      placeholder="Optioneel"
                    />
                  </div>
                </div>

                {/* Image Selection */}
                <div>
                  <Label className="text-white mb-2 block">
                    Selecteer Afbeeldingen ({selectedImages.length} geselecteerd)
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedProduct.images?.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleImageSelection(img.url)}
                        className={`relative aspect-square bg-gray-700 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          selectedImages.includes(img.url)
                            ? 'border-orange-500 ring-2 ring-orange-500/50'
                            : 'border-transparent hover:border-gray-500'
                        }`}
                      >
                        <Image
                          src={img.url}
                          alt={`Product image ${idx + 1}`}
                          fill
                          className="object-contain"
                        />
                        {selectedImages.includes(img.url) && (
                          <div className="absolute top-1 right-1 bg-orange-500 rounded-full p-1">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <Label className="text-white mb-2 block">Productcategorieën</Label>
                  <div className="space-y-3">
                    {/* Selected Categories */}
                    <div className="flex flex-wrap gap-2">
                      {selectedCategories.map((cat, idx) => (
                        <Badge 
                          key={idx} 
                          className="bg-orange-900/30 text-orange-400 cursor-pointer hover:bg-orange-900/50"
                          onClick={() => {
                            setSelectedCategories(prev => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          {cat.name}
                          <span className="ml-2">×</span>
                        </Badge>
                      ))}
                      {selectedCategories.length === 0 && (
                        <span className="text-sm text-gray-400">Geen categorieën geselecteerd</span>
                      )}
                    </div>
                    
                    {/* Category Selector */}
                    <div className="flex gap-2">
                      <Select
                        value=""
                        onValueChange={(value) => {
                          const category = wooCategories.find(c => c.id.toString() === value);
                          if (category && !selectedCategories.some(c => c.name === category.name)) {
                            setSelectedCategories(prev => [...prev, { id: category.id, name: category.name }]);
                          }
                        }}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white flex-1">
                          <SelectValue placeholder="Kies een bestaande categorie..." />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 z-[99999]">
                          {isLoadingCategories ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                            </div>
                          ) : wooCategories.length > 0 ? (
                            wooCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()} className="text-white">
                                {cat.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-4 text-sm text-gray-400">
                              Geen categorieën gevonden
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Add New Category */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Of voeg nieuwe categorie toe..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newCategoryName.trim()) {
                            if (!selectedCategories.some(c => c.name === newCategoryName.trim())) {
                              setSelectedCategories(prev => [...prev, { name: newCategoryName.trim() }]);
                              setNewCategoryName('');
                            }
                          }
                        }}
                        className="bg-gray-700 border-gray-600 text-white flex-1"
                      />
                      <Button
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            if (!selectedCategories.some(c => c.name === newCategoryName.trim())) {
                              setSelectedCategories(prev => [...prev, { name: newCategoryName.trim() }]);
                              setNewCategoryName('');
                            }
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-white hover:bg-gray-700"
                        disabled={!newCategoryName.trim()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Affiliate Link */}
                {selectedProduct.affiliateLink && (
                  <div>
                    <Label className="text-white mb-2 block">Affiliate Link</Label>
                    <div className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg">
                      <LinkIcon className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-300 flex-1 truncate">
                        {selectedProduct.affiliateLink}
                      </span>
                      <a
                        href={selectedProduct.affiliateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:text-orange-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowProductDialog(false)}
                    variant="outline"
                    className="flex-1 border-gray-600 text-white hover:bg-gray-700"
                  >
                    Annuleren
                  </Button>
                  <Button
                    onClick={handlePushToWooCommerce}
                    disabled={isPushing || selectedImages.length === 0}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    {isPushing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Bezig met pushen...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Push naar WooCommerce
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Rewrite Dialog */}
        <Dialog open={showRewriteDialog} onOpenChange={setShowRewriteDialog}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl z-[9999]">
            <DialogHeader>
              <DialogTitle className="text-white">Product Herschrijven met AI</DialogTitle>
              <DialogDescription className="text-gray-400">
                Laat de productbeschrijving optimaliseren door AI voor betere conversie en SEO
              </DialogDescription>
            </DialogHeader>

            {selectedProductForRewrite && (
              <div className="space-y-6">
                {/* Product Info */}
                <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <h3 className="font-semibold text-white mb-2">
                    {selectedProductForRewrite.name}
                  </h3>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p><strong>Huidige prijs:</strong> €{selectedProductForRewrite.price}</p>
                    <p><strong>Status:</strong> {selectedProductForRewrite.status}</p>
                    {selectedProductForRewrite.categories?.length > 0 && (
                      <p><strong>Categorieën:</strong> {selectedProductForRewrite.categories.map(c => c.name).join(', ')}</p>
                    )}
                  </div>
                </div>

                {/* Improvements Input */}
                <div>
                  <Label className="text-white mb-2 block">
                    Gewenste verbeteringen <span className="text-gray-400 font-normal">(optioneel)</span>
                  </Label>
                  <Textarea
                    value={rewriteImprovements}
                    onChange={(e) => setRewriteImprovements(e.target.value)}
                    placeholder="Bijv: Focus meer op duurzaamheid, voeg technische specs toe, maak het meer geschikt voor beginners..."
                    className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Laat leeg voor automatische optimalisatie
                  </p>
                </div>

                {/* SEO Options */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg">
                    <Checkbox
                      id="optimizeTitle"
                      checked={optimizeTitleForSEO}
                      onCheckedChange={(checked) => setOptimizeTitleForSEO(checked as boolean)}
                      className="mt-0.5 border-orange-500 data-[state=checked]:bg-orange-600"
                    />
                    <div className="flex-1">
                      <Label htmlFor="optimizeTitle" className="text-white cursor-pointer font-medium">
                        Titel optimaliseren voor SEO
                      </Label>
                      <p className="text-xs text-gray-400 mt-1">
                        Genereer een nieuwe, SEO-geoptimaliseerde producttitel (max 60 karakters)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg">
                    <Checkbox
                      id="includeMetaDesc"
                      checked={includeMetaDescription}
                      onCheckedChange={(checked) => setIncludeMetaDescription(checked as boolean)}
                      className="mt-0.5 border-orange-500 data-[state=checked]:bg-orange-600"
                    />
                    <div className="flex-1">
                      <Label htmlFor="includeMetaDesc" className="text-white cursor-pointer font-medium">
                        Meta description genereren
                      </Label>
                      <p className="text-xs text-gray-400 mt-1">
                        Genereer een pakkende meta description voor zoekmachines (max 160 karakters)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowRewriteDialog(false)}
                    variant="outline"
                    className="flex-1 border-gray-600 text-white hover:bg-gray-700"
                  >
                    Annuleren
                  </Button>
                  <Button
                    onClick={handleRewriteSubmit}
                    disabled={isRewriting}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Herschrijven
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Progress Dialog */}
        <Dialog open={showRewriteProgressDialog} onOpenChange={() => {}}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md z-[9999]">
            <DialogHeader>
              <DialogTitle className="text-white">Product wordt herschreven...</DialogTitle>
              <DialogDescription className="text-gray-400">
                Dit kan een paar minuten duren
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={rewriteProgress} className="h-2" />
                <p className="text-sm text-gray-400 text-center">
                  {Math.round(rewriteProgress)}%
                </p>
              </div>

              {/* Current Step */}
              <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg">
                {rewriteProgress < 100 ? (
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500 flex-shrink-0" />
                ) : currentRewriteStep.includes('Fout') ? (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
                <span className="text-sm text-gray-300">{currentRewriteStep}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
