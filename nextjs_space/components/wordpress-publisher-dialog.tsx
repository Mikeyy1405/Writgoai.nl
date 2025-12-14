
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useWordPressData } from '@/lib/contexts/WordPressDataContext';

interface WordPressPublisherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId?: string;
  title: string;
  content: string;
  excerpt?: string;
  featuredImageUrl?: string;
  onPublishSuccess?: (url: string) => void;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface WordPressProject {
  id: string;
  name: string;
  websiteUrl: string;
  wordpressUrl: string;
  hasCredentials: boolean;
  isPrimary: boolean;
}

// Helper function to extract first image from HTML content
function extractFirstImage(htmlContent: string): string | null {
  const imgRegex = /<img[^>]+src="([^">]+)"/i;
  const match = htmlContent.match(imgRegex);
  return match ? match[1] : null;
}

// Helper function to extract text from HTML
function extractTextFromHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to generate SEO-friendly excerpt
function generateExcerpt(htmlContent: string, maxLength: number = 160): string {
  const text = extractTextFromHTML(htmlContent);
  if (text.length <= maxLength) return text;
  
  // Find the last complete sentence within maxLength
  const truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclamation = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  
  const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
  
  if (lastSentenceEnd > maxLength * 0.6) {
    return text.substring(0, lastSentenceEnd + 1);
  }
  
  return truncated.trim() + '...';
}

// Helper function to extract focus keyword from title
function extractFocusKeyword(title: string): string {
  // Remove common words and get the most important words
  const commonWords = ['de', 'het', 'een', 'en', 'van', 'voor', 'in', 'op', 'met', 'aan', 'bij', 'tot', 'als', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
  const words = title.toLowerCase().split(/\s+/).filter(word => 
    word.length > 3 && !commonWords.includes(word)
  );
  
  return words.slice(0, 3).join(' ');
}

// Helper function to suggest tags from content
function suggestTags(htmlContent: string, title: string): string[] {
  const text = extractTextFromHTML(htmlContent + ' ' + title).toLowerCase();
  const words = text.split(/\s+/);
  
  // Count word frequency (excluding common words)
  const commonWords = ['de', 'het', 'een', 'en', 'van', 'voor', 'in', 'op', 'met', 'aan', 'bij', 'tot', 'als', 'dat', 'is', 'zijn', 'te', 'je', 'wordt', 'deze', 'dit', 'ook', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'from', 'this', 'that', 'is', 'are', 'was', 'were', 'be'];
  const wordCount: Record<string, number> = {};
  
  words.forEach(word => {
    const cleaned = word.replace(/[^a-z]/g, '');
    if (cleaned.length > 4 && !commonWords.includes(cleaned)) {
      wordCount[cleaned] = (wordCount[cleaned] || 0) + 1;
    }
  });
  
  // Get top 5 most frequent words as tags
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

export default function WordPressPublisherDialog({
  open,
  onOpenChange,
  contentId,
  title: initialTitle,
  content,
  excerpt: initialExcerpt,
  featuredImageUrl: initialFeaturedImage,
  onPublishSuccess,
}: WordPressPublisherDialogProps) {
  // Use WordPress data from context
  const { data: wpData, loading: wpLoading } = useWordPressData();
  
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [wordpressProjects, setWordpressProjects] = useState<WordPressProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [wordpressUrl, setWordpressUrl] = useState('');
  
  // Form state
  const [title, setTitle] = useState(initialTitle);
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState<'publish' | 'draft'>('publish');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [tags, setTags] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [useGutenberg, setUseGutenberg] = useState(true); // Default to Gutenberg blocks

  // Load WordPress projects when dialog opens
  useEffect(() => {
    if (open) {
      loadWordPressProjects();
    }
  }, [open]);

  // Load categories when a project is selected
  useEffect(() => {
    if (selectedProjectId) {
      loadCategories();
      
      // Update WordPress URL display
      const selectedProject = wordpressProjects.find(p => p.id === selectedProjectId);
      if (selectedProject) {
        setWordpressUrl(selectedProject.wordpressUrl);
      }
    }
  }, [selectedProjectId, wordpressProjects]);

  // Auto-fill all fields when dialog opens
  useEffect(() => {
    if (open && content) {
      
      // Set title
      setTitle(initialTitle);
      
      // Auto-extract or set featured image
      const autoFeaturedImage = initialFeaturedImage || extractFirstImage(content);
      setFeaturedImageUrl(autoFeaturedImage || '');
      
      // Auto-generate excerpt if not provided
      const autoExcerpt = initialExcerpt || generateExcerpt(content, 160);
      setExcerpt(autoExcerpt);
      
      // Auto-fill SEO fields
      setSeoTitle(initialTitle); // Can be customized
      setSeoDescription(autoExcerpt);
      
      // Extract focus keyword from title
      const keyword = extractFocusKeyword(initialTitle);
      setFocusKeyword(keyword);
      
      // Auto-suggest tags
      const suggestedTags = suggestTags(content, initialTitle);
      setTags(suggestedTags.join(', '));
      
      // Reset published state
      setPublished(false);
      
      toast.success('Velden automatisch ingevuld', {
        description: 'Je kunt alle velden nog aanpassen voordat je publiceert',
        icon: <Sparkles className="w-4 h-4" />,
      });
    }
  }, [open, content, initialTitle, initialExcerpt, initialFeaturedImage]);

  const loadWordPressProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch('/api/client/wordpress/projects');
      if (response.ok) {
        const data = await response.json();
        const allProjects = data.legacyConfig 
          ? [data.legacyConfig, ...data.projects]
          : data.projects;
        
        setWordpressProjects(allProjects);
        
        // Auto-select primary project or first available
        if (allProjects.length > 0) {
          const primaryProject = allProjects.find((p: WordPressProject) => p.isPrimary);
          setSelectedProjectId(primaryProject?.id || allProjects[0].id);
        }
      } else {
        const error = await response.json();
        console.error('Error loading WordPress projects:', error);
      }
    } catch (error) {
      console.error('Error loading WordPress projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadCategories = async () => {
    if (!selectedProjectId) return;
    
    // First, try to use categories from WordPress data context
    // Use context data even if empty (empty array is still valid WordPress data)
    if (wpData?.categories !== undefined) {
      console.log('[WordPressPublisher] Using categories from context:', wpData.categories.length);
      setCategories(wpData.categories);
      return;
    }
    
    // Fallback to API call if context data is not available
    setLoadingCategories(true);
    try {
      // Load categories for the selected project
      const response = await fetch(`/api/client/wordpress/categories?projectId=${selectedProjectId}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Kon categorieën niet laden');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Fout bij laden van categorieën');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Titel is verplicht');
      return;
    }

    if (!selectedProjectId) {
      toast.error('Selecteer een WordPress site');
      return;
    }

    setPublishing(true);
    try {
      const response = await fetch('/api/client/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          projectId: selectedProjectId,
          title,
          content,
          excerpt,
          status,
          categories: selectedCategories,
          tags: tags.split(',').map(t => t.trim()).filter(t => t),
          featuredImageUrl,
          seoTitle,
          seoDescription,
          focusKeyword,
          useGutenberg,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPublished(true);
        toast.success('Succesvol gepubliceerd naar WordPress!');
        
        if (onPublishSuccess) {
          onPublishSuccess(data.postUrl);
        }

        // Close dialog after 2 seconds
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Publicatie mislukt');
      }
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error('Fout bij publiceren');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {published ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Gepubliceerd!
              </>
            ) : (
              <>
                <Globe className="w-5 h-5 text-[#ff6b35]" />
                Publiceren naar WordPress
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {published 
              ? 'Je artikel is succesvol gepubliceerd naar je WordPress site.'
              : wordpressUrl 
                ? `Vul de details in om te publiceren naar: ${wordpressUrl}`
                : 'Vul de details in om je artikel te publiceren.'}
          </DialogDescription>
          {!published && loadingProjects && (
            <div className="mt-2 p-2 bg-zinc-800 border border-zinc-700 rounded text-xs text-gray-400">
              WordPress sites laden...
            </div>
          )}
          {!published && !loadingProjects && wordpressProjects.length === 0 && (
            <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-xs text-yellow-200">
              ⚠️ Geen WordPress sites geconfigureerd. Ga naar je project instellingen om WordPress te koppelen.
            </div>
          )}
        </DialogHeader>

        {!published && (
          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            {/* WordPress Site Selector */}
            {wordpressProjects.length > 0 && (
              <div>
                <Label htmlFor="wp-site" className="text-gray-200 text-sm">
                  WordPress Site *
                </Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Kies een WordPress site..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {wordpressProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id} className="text-white">
                        <div className="flex flex-col">
                          <span className="font-medium">{project.name}</span>
                          <span className="text-xs text-gray-400">{project.wordpressUrl}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProjectId && wordpressUrl && (
                  <div className="mt-2 p-2 bg-blue-900/20 border border-blue-700/50 rounded text-xs text-blue-200">
                    <span className="font-semibold">Publiceert naar:</span>{' '}
                    <span className="font-mono">{wordpressUrl}</span>
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <Label htmlFor="wp-title" className="text-gray-200 text-sm">
                Titel *
              </Label>
              <Input
                id="wp-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="Blog titel..."
              />
            </div>

            {/* Excerpt */}
            <div>
              <Label htmlFor="wp-excerpt" className="text-gray-200 text-sm">
                Uittreksel
              </Label>
              <Textarea
                id="wp-excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
                placeholder="Korte samenvatting voor in lijsten..."
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="wp-status" className="text-gray-200 text-sm">
                Status
              </Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="publish" className="text-white">
                    Direct publiceren
                  </SelectItem>
                  <SelectItem value="draft" className="text-white">
                    Opslaan als concept
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Categories */}
            <div>
              <Label htmlFor="wp-categories" className="text-gray-200 text-sm">
                Categorieën
              </Label>
              {loadingCategories ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Laden...
                </div>
              ) : categories.length > 0 ? (
                <Select 
                  value={selectedCategories[0]?.toString() || ''} 
                  onValueChange={(value) => setSelectedCategories([parseInt(value)])}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Selecteer categorie..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()} className="text-white">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-400">
                  Geen categorieën gevonden. Configureer eerst je WordPress instellingen.
                </p>
              )}
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="wp-tags" className="text-gray-200 text-sm">
                Tags (gescheiden door komma's)
              </Label>
              <Input
                id="wp-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="tag1, tag2, tag3"
              />
            </div>

            {/* Featured Image */}
            <div>
              <Label htmlFor="wp-featured-image" className="text-gray-200 text-sm">
                Uitgelichte afbeelding URL
              </Label>
              <Input
                id="wp-featured-image"
                value={featuredImageUrl}
                onChange={(e) => setFeaturedImageUrl(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="https://..."
              />
              {featuredImageUrl && (
                <img 
                  src={featuredImageUrl} 
                  alt="Preview" 
                  className="mt-2 w-full h-32 object-cover rounded border border-zinc-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>

            {/* SEO Section */}
            <div className="border-t border-zinc-800 pt-4 mt-6">
              <h3 className="text-sm font-semibold text-gray-200 mb-3">
                SEO Instellingen (Yoast/RankMath)
              </h3>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="wp-seo-title" className="text-gray-200 text-sm">
                    SEO Titel
                  </Label>
                  <Input
                    id="wp-seo-title"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="Laat leeg voor standaard titel"
                  />
                </div>

                <div>
                  <Label htmlFor="wp-seo-desc" className="text-gray-200 text-sm">
                    Meta Description
                  </Label>
                  <Textarea
                    id="wp-seo-desc"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white min-h-[60px]"
                    placeholder="SEO meta description..."
                  />
                </div>

                <div>
                  <Label htmlFor="wp-focus-keyword" className="text-gray-200 text-sm">
                    Focus Keyword
                  </Label>
                  <Input
                    id="wp-focus-keyword"
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="Hoofd zoekwoord..."
                  />
                </div>
              </div>
            </div>

            {/* Gutenberg Blocks Option */}
            <div className="border-t border-zinc-800 pt-4 mt-6">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="use-gutenberg"
                  checked={useGutenberg}
                  onChange={(e) => setUseGutenberg(e.target.checked)}
                  className="w-4 h-4 text-[#ff6b35] bg-zinc-800 border-zinc-700 rounded focus:ring-[#ff6b35] focus:ring-2"
                />
                <div>
                  <Label htmlFor="use-gutenberg" className="text-gray-200 text-sm font-medium cursor-pointer">
                    Content als Gutenberg Blocks publiceren
                  </Label>
                  <p className="text-xs text-gray-400 mt-1">
                    Aanbevolen: Content wordt geconverteerd naar WordPress blokken voor betere bewerkbaarheid
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!published && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-zinc-700 text-white hover:bg-zinc-800"
                disabled={publishing}
              >
                Annuleren
              </Button>
              <Button
                onClick={handlePublish}
                disabled={publishing || !title.trim() || !selectedProjectId}
                className="bg-[#ff6b35] hover:bg-[#ff8c42] text-white"
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publiceren...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Publiceren
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
