
'use client';

import { useState, useEffect } from 'react';
import { Link as LinkIcon, Plus, Trash2, Loader2, Upload, ExternalLink, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface AffiliateLink {
  id: string;
  url: string;
  anchorText: string;
  category?: string;
  keywords: string[];
  usageCount: number;
}

interface ProjectAffiliateLinksProps {
  projectId: string;
}

export default function ProjectAffiliateLinks({ projectId }: ProjectAffiliateLinksProps) {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  
  // Feed import state
  const [showFeedImport, setShowFeedImport] = useState(false);
  const [feedMethod, setFeedMethod] = useState<'url' | 'content'>('url');
  const [feedUrl, setFeedUrl] = useState('');
  const [feedContent, setFeedContent] = useState('');
  const [feedFormat, setFeedFormat] = useState<string>('auto');
  const [feedCategory, setFeedCategory] = useState('');

  useEffect(() => {
    loadLinks();
  }, [projectId]);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/projects/${projectId}/affiliate-links`);
      const data = await response.json();
      
      if (response.ok) {
        setLinks(data.links || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('[Affiliate Links] Load error:', error);
      toast.error('Kon affiliate links niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) {
      toast.error('Voer eerst affiliate links in');
      return;
    }

    setSaving(true);
    try {
      // Extract URLs from text (split by whitespace and newlines)
      const urls = bulkText
        .split(/[\n\r\s]+/)
        .map(line => line.trim())
        .filter(line => {
          // Only keep lines that look like URLs
          return line.startsWith('http://') || line.startsWith('https://') || line.includes('www.');
        })
        .map(url => {
          // Ensure URL has protocol
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return 'https://' + url;
          }
          return url;
        });

      if (urls.length === 0) {
        toast.error('Geen geldige URLs gevonden. Plak URLs (één per regel of gescheiden door spaties)');
        return;
      }

      console.log(`[Bulk Add] Processing ${urls.length} URLs:`, urls);

      const response = await fetch(`/api/client/projects/${projectId}/affiliate-links/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      const successMsg = `${data.created} link${data.created !== 1 ? 's' : ''} toegevoegd! 🎉`;
      const errorMsg = data.errors > 0 ? ` (${data.errors} overgeslagen)` : '';
      
      toast.success(successMsg + errorMsg);
      setBulkText('');
      setShowBulkAdd(false);
      await loadLinks();
    } catch (error: any) {
      console.error('[Affiliate Links] Bulk add error:', error);
      toast.error(error.message || 'Kon links niet toevoegen');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm('Weet je zeker dat je deze affiliate link wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/client/projects/${projectId}/affiliate-links?id=${linkId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      toast.success('Affiliate link verwijderd');
      await loadLinks();
    } catch (error: any) {
      console.error('[Affiliate Links] Delete error:', error);
      toast.error(error.message || 'Kon link niet verwijderen');
    }
  };

  const handleFeedImport = async () => {
    if (feedMethod === 'url' && !feedUrl.trim()) {
      toast.error('Voer een feed URL in');
      return;
    }
    if (feedMethod === 'content' && !feedContent.trim()) {
      toast.error('Voer feed content in');
      return;
    }

    setSaving(true);
    try {
      // Gebruik specifieke TradeTracker endpoint als format tradetracker is
      const endpoint = feedFormat === 'tradetracker' 
        ? `/api/client/projects/${projectId}/tradetracker-feed`
        : `/api/client/projects/${projectId}/affiliate-feed`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedUrl: feedMethod === 'url' ? feedUrl : undefined,
          feedContent: feedMethod === 'content' ? feedContent : undefined,
          format: feedFormat,
          defaultCategory: feedCategory || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success(data.message || `${data.imported} producten geïmporteerd! 🎉`);
      setFeedUrl('');
      setFeedContent('');
      setFeedCategory('');
      setShowFeedImport(false);
      await loadLinks();
    } catch (error: any) {
      console.error('[Affiliate Links] Feed import error:', error);
      toast.error(error.message || 'Kon feed niet importeren');
    } finally {
      setSaving(false);
    }
  };

  // Group links by category
  const groupedLinks = links.reduce((acc, link) => {
    const category = link.category || 'Geen categorie';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(link);
    return acc;
  }, {} as Record<string, AffiliateLink[]>);

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#ff6b35]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-[#ff6b35] shrink-0" />
                <span className="truncate">Affiliate Links</span>
              </CardTitle>
              <CardDescription className="text-gray-300 mt-1 break-words">
                Beheer je affiliate links. De AI gebruikt deze automatisch in relevante content.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={() => {
                  setShowBulkAdd(!showBulkAdd);
                  setShowFeedImport(false);
                }}
                variant="outline"
                className="border-zinc-700 text-white hover:bg-zinc-800 w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Bulk Toevoegen
              </Button>
              <Button
                onClick={() => {
                  setShowFeedImport(!showFeedImport);
                  setShowBulkAdd(false);
                }}
                className="bg-[#ff6b35] hover:bg-[#ff8c42] text-white w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Feed Importeren
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Bulk Add Section */}
      {showBulkAdd && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-white">Plak je affiliate links</Label>
              <p className="text-sm text-gray-300 mt-1 mb-3">
                Plak gewoon de URLs - de AI analyseert elke link en genereert automatisch een 
                professionele titel, categorie en keywords. Elk adres op een nieuwe regel of 
                gescheiden door spaties. ✨
              </p>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`Plak hier je affiliate links (één per regel):

https://www.paypro.nl/producten/Maandabonnement_-_Practice_Happy_with_Yoga/57261/219298
https://www.paypro.nl/producten/Yoga_Nidra_-_Happy_with_Yoga/39703/219298
https://www.paypro.nl/producten/Boost_je_energie_met_eenvoudige_Qigong/102665/219298
https://example.com/product-1
https://example.com/product-2

De AI zorgt automatisch voor:
✓ Professionele titels
✓ Relevante categorieën
✓ SEO keywords
✓ Duplicate detectie`}
                rows={14}
                className="bg-zinc-800 border-zinc-700 text-white font-mono text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleBulkAdd}
                disabled={saving || !bulkText.trim()}
                className="bg-[#ff6b35] hover:bg-[#ff8c42] text-white w-full sm:w-auto justify-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verwerken...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Links Toevoegen
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowBulkAdd(false);
                  setBulkText('');
                }}
                variant="outline"
                className="border-zinc-700 text-white hover:bg-zinc-800 w-full sm:w-auto justify-center"
              >
                Annuleren
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feed Import Section */}
      {showFeedImport && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Productfeed Importeren</CardTitle>
            <CardDescription className="text-gray-300">
              Importeer producten uit affiliate feeds van Tradetracker, Bol.com, Daisycon, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={feedMethod} onValueChange={(v) => setFeedMethod(v as 'url' | 'content')}>
              <TabsList className="bg-zinc-800 border-zinc-700">
                <TabsTrigger value="url" className="data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white">
                  Feed URL
                </TabsTrigger>
                <TabsTrigger value="content" className="data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white">
                  Feed Content
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4 mt-4">
                <div>
                  <Label className="text-white">Feed URL</Label>
                  <p className="text-sm text-gray-300 mt-1 mb-3">
                    Voer de URL van je productfeed in (XML, CSV, of JSON)
                  </p>
                  <Input
                    value={feedUrl}
                    onChange={(e) => setFeedUrl(e.target.value)}
                    placeholder="https://example.com/productfeed.xml"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4 mt-4">
                <div>
                  <Label className="text-white">Feed Content</Label>
                  <p className="text-sm text-gray-300 mt-1 mb-3">
                    Plak de volledige inhoud van je productfeed (XML, CSV, of JSON)
                  </p>
                  <Textarea
                    value={feedContent}
                    onChange={(e) => setFeedContent(e.target.value)}
                    placeholder={`<?xml version="1.0"?>
<products>
  <product>
    <name>Product naam</name>
    <url>https://example.com/product</url>
    <price>19.99</price>
    <category>Categorie</category>
  </product>
</products>`}
                    rows={12}
                    className="bg-zinc-800 border-zinc-700 text-white font-mono text-sm"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Feed Format</Label>
                <p className="text-sm text-gray-300 mt-1 mb-2">
                  De AI detecteert automatisch het format
                </p>
                <Select value={feedFormat} onValueChange={setFeedFormat}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Selecteer format" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="auto" className="text-white">Auto-detecteren</SelectItem>
                    <SelectItem value="tradetracker" className="text-white">TradeTracker XML (met site_id tracking)</SelectItem>
                    <SelectItem value="bol" className="text-white">Bol.com</SelectItem>
                    <SelectItem value="daisycon" className="text-white">Daisycon</SelectItem>
                    <SelectItem value="xml" className="text-white">Generic XML</SelectItem>
                    <SelectItem value="csv" className="text-white">CSV</SelectItem>
                    <SelectItem value="json" className="text-white">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Standaard Categorie (optioneel)</Label>
                <p className="text-sm text-gray-300 mt-1 mb-2">
                  Voor producten zonder categorie
                </p>
                <Input
                  value={feedCategory}
                  onChange={(e) => setFeedCategory(e.target.value)}
                  placeholder="Bijv. Producten"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleFeedImport}
                disabled={saving || (feedMethod === 'url' ? !feedUrl.trim() : !feedContent.trim())}
                className="bg-[#ff6b35] hover:bg-[#ff8c42] text-white w-full sm:w-auto justify-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importeren...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Feed Importeren
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowFeedImport(false);
                  setFeedUrl('');
                  setFeedContent('');
                  setFeedCategory('');
                }}
                variant="outline"
                className="border-zinc-700 text-white hover:bg-zinc-800 w-full sm:w-auto justify-center"
              >
                Annuleren
              </Button>
            </div>

            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ff6b35]" />
                Ondersteunde Feed Formats
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• <strong>TradeTracker:</strong> XML productfeeds met automatische site_id tracking</li>
                <li>• <strong>Bol.com:</strong> XML of CSV productfeeds</li>
                <li>• <strong>Daisycon:</strong> XML of CSV productfeeds</li>
                <li>• <strong>Generic:</strong> Elk XML, CSV of JSON format</li>
              </ul>
              <div className="mt-3 pt-3 border-t border-zinc-700">
                <p className="text-xs text-gray-400">
                  💡 <strong>Tip:</strong> Bij TradeTracker feeds wordt je site_id automatisch toegevoegd aan alle links voor commissie tracking!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Links List */}
      {links.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 md:p-12 text-center">
            <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-300 mb-2">Nog geen affiliate links</p>
            <p className="text-sm text-gray-300 mb-4 break-words px-2">
              Voeg affiliate links toe zodat de AI ze automatisch gebruikt in relevante content
            </p>
            <Button
              onClick={() => setShowBulkAdd(true)}
              className="bg-[#ff6b35] hover:bg-[#ff8c42] text-white w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Eerste Links Toevoegen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedLinks).map(([category, categoryLinks]) => (
            <Card key={category} className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">{category}</CardTitle>
                <CardDescription className="text-gray-300">
                  {categoryLinks.length} link{categoryLinks.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 bg-zinc-800 rounded-lg border border-zinc-700"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h4 className="text-white font-medium break-words">{link.anchorText}</h4>
                          <Badge variant="outline" className="text-xs border-zinc-600 text-gray-300 w-fit">
                            {link.usageCount}x gebruikt
                          </Badge>
                        </div>
                        
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#ff6b35] hover:underline flex items-start gap-1 mb-2 break-all"
                        >
                          <span className="break-all">{link.url}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        </a>
                        
                        {link.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {link.keywords.map((keyword, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs bg-zinc-700 text-gray-300"
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => handleDelete(link.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 self-end sm:self-start sm:ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {links.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{links.length}</div>
                <div className="text-sm text-gray-300">Totaal Links</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {Object.keys(groupedLinks).length}
                </div>
                <div className="text-sm text-gray-300">Categorieën</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {links.reduce((sum, link) => sum + link.usageCount, 0)}
                </div>
                <div className="text-sm text-gray-300">Keer Gebruikt</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
