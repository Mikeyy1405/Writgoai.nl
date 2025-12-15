'use client';

/**
 * Site Manager - Unified WordPress/WooCommerce Content Management
 * 🌐 Beheer alle content met AI herschrijven en SEO optimalisatie
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  ShoppingCart,
  FileCode,
  FolderOpen,
  Search,
  RefreshCw,
  Sparkles,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ContentItem {
  id: number;
  type: 'post' | 'product' | 'page';
  title: string;
  content: string;
  excerpt: string;
  status: string;
  modified: string;
  categories: string[];
  seoScore: number;
  seoTitle?: string;
  seoDescription?: string;
  wordCount?: number;
  price?: string;
  stockStatus?: string;
}

export default function SiteManagerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [contentType, setContentType] = useState<'posts' | 'products' | 'pages' | 'categories'>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projects, setProjects] = useState<any[]>([]);
  
  // Modal states
  const [rewriteModalOpen, setRewriteModalOpen] = useState(false);
  const [rewriteItem, setRewriteItem] = useState<ContentItem | null>(null);
  const [rewriteInstructions, setRewriteInstructions] = useState('');
  const [rewriteFields, setRewriteFields] = useState<string[]>(['title', 'content']);
  const [rewriteProgress, setRewriteProgress] = useState<string>('');
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
      return;
    }

    if (status === 'authenticated') {
      fetchProjects();
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedProject) {
      fetchContent();
    }
  }, [selectedProject, contentType, currentPage, searchQuery]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/client/projects');
      const data = await response.json();
      setProjects(data.projects || []);
      
      // Select first project by default
      if (data.projects && data.projects.length > 0) {
        setSelectedProject(data.projects[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchContent = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        projectId: selectedProject,
        type: contentType,
        page: currentPage.toString(),
        limit: '20',
      });

      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(`/api/client/site-manager?${params}`);
      const data = await response.json();

      if (response.ok) {
        setItems(data.items || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        console.error('Error fetching content:', data.error);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      const response = await fetch('/api/client/site-manager/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject, type: contentType }),
      });

      if (response.ok) {
        await fetchContent();
      }
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setLoading(false);
    }
  };

  const openRewriteModal = (item: ContentItem) => {
    setRewriteItem(item);
    setRewriteModalOpen(true);
    setRewriteInstructions('');
    setRewriteFields(['title', 'content']);
    setRewriteResult(null);
    setRewriteProgress('');
  };

  const handleRewrite = async () => {
    if (!rewriteItem || !selectedProject) return;

    try {
      setRewriteLoading(true);
      setRewriteProgress('🚀 Start herschrijven...');

      const response = await fetch('/api/client/site-manager/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          items: [{
            type: rewriteItem.type,
            id: rewriteItem.id,
            fields: rewriteFields,
            currentTitle: rewriteItem.title,
            currentContent: rewriteItem.content,
            currentExcerpt: rewriteItem.excerpt,
          }],
          instructions: rewriteInstructions,
          autoSave: false, // Don't auto-save, show preview first
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'progress') {
              setRewriteProgress(data.message);
            } else if (data.type === 'complete') {
              setRewriteProgress('✅ Klaar!');
              if (data.results && data.results[0]) {
                setRewriteResult(data.results[0].newData);
              }
            } else if (data.type === 'error') {
              setRewriteProgress(`❌ Fout: ${data.error}`);
            }
          } catch (e) {
            console.error('Error parsing stream data:', e);
          }
        }
      }
    } catch (error: any) {
      console.error('Error rewriting:', error);
      setRewriteProgress(`❌ Fout: ${error.message}`);
    } finally {
      setRewriteLoading(false);
    }
  };

  const handleSaveRewrite = async () => {
    if (!rewriteItem || !rewriteResult || !selectedProject) return;

    try {
      setRewriteLoading(true);
      setRewriteProgress('💾 Opslaan naar WordPress...');

      const response = await fetch(`/api/client/site-manager/${rewriteItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          type: rewriteItem.type,
          data: rewriteResult,
        }),
      });

      if (response.ok) {
        setRewriteProgress('✅ Opgeslagen!');
        setRewriteModalOpen(false);
        await fetchContent();
      } else {
        const data = await response.json();
        setRewriteProgress(`❌ Fout: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error saving:', error);
      setRewriteProgress(`❌ Fout: ${error.message}`);
    } finally {
      setRewriteLoading(false);
    }
  };

  const handleBulkRewrite = async () => {
    if (selectedItems.size === 0 || !selectedProject) return;

    const itemsToRewrite = items.filter(item => selectedItems.has(item.id));
    
    try {
      setRewriteLoading(true);
      setRewriteProgress(`🚀 Start bulk herschrijven van ${itemsToRewrite.length} items...`);

      const response = await fetch('/api/client/site-manager/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          items: itemsToRewrite.map(item => ({
            type: item.type,
            id: item.id,
            fields: ['title', 'content', 'excerpt'],
            currentTitle: item.title,
            currentContent: item.content,
            currentExcerpt: item.excerpt,
          })),
          instructions: rewriteInstructions || 'Verbeter en optimaliseer de content voor SEO',
          autoSave: true,
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'progress') {
              setRewriteProgress(data.message);
            } else if (data.type === 'complete') {
              setRewriteProgress('✅ Bulk herschrijven voltooid!');
              await fetchContent();
              setSelectedItems(new Set());
            } else if (data.type === 'error') {
              setRewriteProgress(`❌ Fout: ${data.error}`);
            }
          } catch (e) {
            console.error('Error parsing stream data:', e);
          }
        }
      }
    } catch (error: any) {
      console.error('Error bulk rewriting:', error);
      setRewriteProgress(`❌ Fout: ${error.message}`);
    } finally {
      setRewriteLoading(false);
    }
  };

  const toggleSelectItem = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const getSeoScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSeoScoreBadge = (score: number) => {
    if (score >= 70) return '🟢';
    if (score >= 40) return '🟡';
    return '🔴';
  };

  if (status === 'loading' || loading && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-[#FF9933] animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Content laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            🌐 Site Manager
          </h1>
          <p className="text-zinc-400 mt-1">
            Beheer en optimaliseer je WordPress/WooCommerce content met AI
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecteer project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content Type Tabs */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
        <Button
          variant={contentType === 'posts' ? 'default' : 'ghost'}
          onClick={() => setContentType('posts')}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Posts
        </Button>
        <Button
          variant={contentType === 'products' ? 'default' : 'ghost'}
          onClick={() => setContentType('products')}
          className="flex items-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Products
        </Button>
        <Button
          variant={contentType === 'pages' ? 'default' : 'ghost'}
          onClick={() => setContentType('pages')}
          className="flex items-center gap-2"
        >
          <FileCode className="w-4 h-4" />
          Pages
        </Button>
        <Button
          variant={contentType === 'categories' ? 'default' : 'ghost'}
          onClick={() => setContentType('categories')}
          className="flex items-center gap-2"
        >
          <FolderOpen className="w-4 h-4" />
          Categories
        </Button>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Zoeken..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={handleSync}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Sync
        </Button>

        {selectedItems.size > 0 && (
          <Button
            onClick={() => {
              setRewriteModalOpen(true);
              setRewriteItem(null);
            }}
            className="flex items-center gap-2 bg-[#FF9933] hover:bg-[#FF9933]/90"
          >
            <Sparkles className="w-4 h-4" />
            Herschrijf Selectie ({selectedItems.size})
          </Button>
        )}
      </div>

      {/* Content Table */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={selectedItems.size === items.length && items.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">
                Titel
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">
                SEO
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">
                Categorie
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">
                Acties
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-800/50">
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => toggleSelectItem(item.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white font-medium">{item.title}</p>
                    <p className="text-sm text-zinc-400 truncate max-w-md">
                      {item.excerpt?.substring(0, 100)}...
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={item.status === 'publish' ? 'default' : 'secondary'}>
                    {item.status === 'publish' ? '✅ Live' : '📝 Draft'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-lg ${getSeoScoreColor(item.seoScore)}`}>
                    {getSeoScoreBadge(item.seoScore)} {item.seoScore}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {item.categories?.slice(0, 2).map((cat, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openRewriteModal(item)}
                      className="text-[#FF9933] hover:text-[#FF9933]/80"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-zinc-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && !loading && (
          <div className="py-12 text-center text-zinc-400">
            Geen items gevonden
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Vorige
          </Button>
          <span className="text-zinc-400">
            Pagina {currentPage} van {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Volgende
          </Button>
        </div>
      )}

      {/* AI Rewrite Modal */}
      <Dialog open={rewriteModalOpen} onOpenChange={setRewriteModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF9933]" />
              Herschrijf met AI
            </DialogTitle>
            <DialogDescription>
              {rewriteItem 
                ? `Item: "${rewriteItem.title}"`
                : `${selectedItems.size} items geselecteerd`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {rewriteItem && (
              <div>
                <Label>Wat wil je herschrijven?</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['title', 'content', 'excerpt', 'meta_description'].map((field) => (
                    <label key={field} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={rewriteFields.includes(field)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setRewriteFields([...rewriteFields, field]);
                          } else {
                            setRewriteFields(rewriteFields.filter(f => f !== field));
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{field.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Instructies</Label>
              <Textarea
                value={rewriteInstructions}
                onChange={(e) => setRewriteInstructions(e.target.value)}
                placeholder="Bijv: Maak de content SEO vriendelijker, focus op het keyword 'AI tools' en maak het korter en bondiger."
                rows={4}
                className="mt-2"
              />
            </div>

            {rewriteProgress && (
              <div className="bg-zinc-800 rounded-lg p-4">
                <p className="text-sm text-zinc-300">{rewriteProgress}</p>
              </div>
            )}

            {rewriteResult && (
              <div className="space-y-3">
                <Label>📝 Preview:</Label>
                <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
                  {rewriteResult.title && (
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Nieuwe Titel:</p>
                      <p className="text-white font-medium">{rewriteResult.title}</p>
                    </div>
                  )}
                  {rewriteResult.content && (
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Nieuwe Content:</p>
                      <div 
                        className="text-sm text-zinc-300 max-h-48 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: rewriteResult.content.substring(0, 500) + '...' }}
                      />
                    </div>
                  )}
                  {rewriteResult.meta_description && (
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Meta Description:</p>
                      <p className="text-sm text-zinc-300">{rewriteResult.meta_description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setRewriteModalOpen(false)}
                disabled={rewriteLoading}
              >
                Annuleren
              </Button>
              
              {!rewriteResult ? (
                <Button
                  onClick={rewriteItem ? handleRewrite : handleBulkRewrite}
                  disabled={rewriteLoading || (!rewriteInstructions && rewriteItem)}
                  className="bg-[#FF9933] hover:bg-[#FF9933]/90"
                >
                  {rewriteLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Genereren...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Genereer Nieuwe Versie
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSaveRewrite}
                  disabled={rewriteLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {rewriteLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opslaan...
                    </>
                  ) : (
                    <>
                      💾 Opslaan naar WordPress
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
