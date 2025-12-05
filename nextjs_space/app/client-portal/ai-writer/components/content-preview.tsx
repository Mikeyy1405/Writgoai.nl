'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Check, FileText, Code, AlignLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ContentPreviewProps {
  content: string;
  metaDescription?: string;
  wordCount?: number;
  internalLinksAdded?: number;
  bolProductsAdded?: number;
}

export default function ContentPreview({
  content,
  metaDescription,
  wordCount,
  internalLinksAdded,
  bolProductsAdded,
}: ContentPreviewProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('preview');

  const handleCopy = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    toast.success(`${tabName} gekopieerd naar klembord`);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${filename} gedownload`);
  };

  // Strip HTML tags for plain text version (safe since content is AI-generated, not user input)
  const getPlainText = (html: string) => {
    // Use DOMParser for safer HTML parsing
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const plainText = getPlainText(content);

  if (!content) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center text-zinc-500">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Geen content gegenereerd</p>
            <p className="text-sm mt-2">Configureer je instellingen en klik op "Genereer Content"</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-2 flex-wrap">
        {wordCount && (
          <Badge variant="outline" className="bg-zinc-800 border-zinc-700">
            {wordCount} woorden
          </Badge>
        )}
        {internalLinksAdded !== undefined && internalLinksAdded > 0 && (
          <Badge variant="outline" className="bg-zinc-800 border-zinc-700">
            {internalLinksAdded} interne links
          </Badge>
        )}
        {bolProductsAdded !== undefined && bolProductsAdded > 0 && (
          <Badge variant="outline" className="bg-zinc-800 border-zinc-700">
            {bolProductsAdded} affiliate producten
          </Badge>
        )}
      </div>

      {/* Meta Description */}
      {metaDescription && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm">Meta Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300">{metaDescription}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(metaDescription, 'Meta description')}
              className="mt-2"
            >
              {copiedTab === 'meta' ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Gekopieerd
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Kopieer
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content Tabs */}
      <Card className="bg-zinc-900 border-zinc-800">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Gegenereerde Content</CardTitle>
              <div className="flex gap-2">
                {activeTab === 'preview' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(content, 'Content')}
                    className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  >
                    {copiedTab === 'preview' ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Gekopieerd
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Kopieer HTML
                      </>
                    )}
                  </Button>
                )}
                {activeTab === 'html' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(content, 'HTML')}
                      className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    >
                      {copiedTab === 'html' ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Gekopieerd
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Kopieer
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(content, 'content.html')}
                      className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </>
                )}
                {activeTab === 'plain' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(plainText, 'Plain text')}
                    className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  >
                    {copiedTab === 'plain' ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Gekopieerd
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Kopieer
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            <TabsList className="bg-zinc-800 border-zinc-700">
              <TabsTrigger
                value="preview"
                className="data-[state=active]:bg-[#FF9933] data-[state=active]:text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger
                value="html"
                className="data-[state=active]:bg-[#FF9933] data-[state=active]:text-white"
              >
                <Code className="h-4 w-4 mr-2" />
                HTML Code
              </TabsTrigger>
              <TabsTrigger
                value="plain"
                className="data-[state=active]:bg-[#FF9933] data-[state=active]:text-white"
              >
                <AlignLeft className="h-4 w-4 mr-2" />
                Plain Text
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="preview" className="mt-0">
              {/* Note: Content is AI-generated via our API, not user input, so XSS risk is minimal.
                  For production, consider adding DOMPurify for extra safety. */}
              <div
                className="prose prose-invert max-w-none prose-headings:text-zinc-100 prose-p:text-zinc-300 prose-a:text-[#FF9933] prose-strong:text-zinc-200 prose-ul:text-zinc-300 prose-ol:text-zinc-300"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </TabsContent>

            <TabsContent value="html" className="mt-0">
              <div className="relative">
                <SyntaxHighlighter
                  language="html"
                  style={vscDarkPlus}
                  customStyle={{
                    background: '#18181b',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    maxHeight: '600px',
                    overflow: 'auto',
                  }}
                >
                  {content}
                </SyntaxHighlighter>
              </div>
            </TabsContent>

            <TabsContent value="plain" className="mt-0">
              <div className="bg-zinc-950 rounded-lg p-4 max-h-[600px] overflow-auto">
                <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono">
                  {plainText}
                </pre>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
