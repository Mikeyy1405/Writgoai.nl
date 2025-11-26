
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Link2, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import toast from 'react-hot-toast';

interface InternalLink {
  url: string;
  title?: string;
}

interface BlogLinkSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectLink: (link: InternalLink) => void;
  projectId?: string;
}

export function BlogLinkSelector({
  open,
  onClose,
  onSelectLink,
  projectId
}: BlogLinkSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<InternalLink[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<InternalLink[]>([]);

  useEffect(() => {
    if (open && projectId) {
      loadSitemap();
    }
  }, [open, projectId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = links.filter(link =>
        link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (link.title && link.title.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredLinks(filtered);
    } else {
      setFilteredLinks(links);
    }
  }, [searchQuery, links]);

  const loadSitemap = async () => {
    if (!projectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/client/projects/${projectId}/sitemap`);
      if (!response.ok) throw new Error('Sitemap laden mislukt');

      const data = await response.json();
      const sitemapLinks: InternalLink[] = (data.urls || []).map((url: string) => ({
        url,
        title: extractTitleFromUrl(url)
      }));

      setLinks(sitemapLinks);
      setFilteredLinks(sitemapLinks);
    } catch (error) {
      console.error('Sitemap load error:', error);
      toast.error('Kon sitemap niet laden');
    } finally {
      setLoading(false);
    }
  };

  const extractTitleFromUrl = (url: string): string => {
    try {
      const pathname = new URL(url).pathname;
      const slug = pathname.split('/').filter(Boolean).pop() || '';
      return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } catch {
      return url;
    }
  };

  const handleSelect = (link: InternalLink) => {
    onSelectLink(link);
    onClose();
    toast.success('Link toegevoegd!');
  };

  const handleManualLink = () => {
    if (!searchQuery.trim()) {
      toast.error('Voer een URL in');
      return;
    }

    const link: InternalLink = {
      url: searchQuery,
      title: extractTitleFromUrl(searchQuery)
    };

    handleSelect(link);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-gray-900 border-green-500/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Interne Link Selecteren
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search/Manual Entry */}
          <div className="flex gap-2">
            <Input
              placeholder="Zoek in sitemap of voer URL in..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualLink()}
              className="flex-1 bg-gray-800 border-gray-700"
            />
            <Button
              onClick={handleManualLink}
              variant="outline"
              className="bg-green-900/30 border-green-500/50 hover:bg-green-800/40"
            >
              <Link2 className="h-4 w-4 mr-1" />
              Toevoegen
            </Button>
          </div>

          {!projectId && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-500/50 rounded-lg text-yellow-300 text-sm">
              ℹ️ Selecteer een project om sitemap links te laden, of voer handmatig een URL in.
            </div>
          )}

          {/* Links List */}
          <ScrollArea className="h-[400px] pr-4">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-green-400" />
              </div>
            )}

            {!loading && filteredLinks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Link2 className="h-12 w-12 mb-2 opacity-50" />
                <p>Geen links gevonden</p>
                <p className="text-sm mt-1">Voer een URL in om handmatig toe te voegen</p>
              </div>
            )}

            <div className="space-y-2">
              {filteredLinks.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-green-500/50 transition-colors cursor-pointer"
                  onClick={() => handleSelect(link)}
                >
                  <Link2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">
                      {link.title}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {link.url}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 bg-green-900/30 border-green-500/50 hover:bg-green-800/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(link);
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
