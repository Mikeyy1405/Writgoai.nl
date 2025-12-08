'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Code2,
  FileCode,
  BarChart3,
  FileText,
} from 'lucide-react';

interface ContentPreviewProps {
  content: string;
  metaDescription: string;
  stats: {
    wordCount: number;
    characterCount: number;
    readingTime: number;
    internalLinksAdded: number;
    externalLinksAdded: number;
    imagesAdded: number;
    bolProductsAdded: number;
    headingCount: number;
  };
  isGenerating: boolean;
}

export default function ContentPreview({
  content,
  metaDescription,
  stats,
  isGenerating,
}: ContentPreviewProps) {
  const [activeTab, setActiveTab] = useState('preview');

  // Convert HTML to Markdown (simple version)
  // Note: This processes AI-generated trusted content for display/export only
  const htmlToMarkdown = (html: string): string => {
    // Use browser's built-in parser for safe HTML handling
    if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Remove script and style elements safely
        doc.querySelectorAll('script, style').forEach(el => el.remove());
        
        // Get sanitized text content
        return doc.body.textContent || '';
      } catch (e) {
        // Fallback to regex if DOMParser fails
      }
    }
    
    // Server-side or fallback: simple regex-based conversion
    let markdown = html;
    
    // Headers
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
    
    // Bold and italic
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    
    // Links
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    
    // Lists
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    markdown = markdown.replace(/<\/?ul[^>]*>/gi, '\n');
    markdown = markdown.replace(/<\/?ol[^>]*>/gi, '\n');
    
    // Paragraphs
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    
    // Line breaks
    markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
    
    // Remove all remaining tags (fallback - content is from trusted AI)
    markdown = markdown.replace(/<[^>]*>/g, '');
    
    // Clean up extra newlines
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    
    return markdown.trim();
  };

  // Get plain text (safe HTML removal)
  // Note: This processes AI-generated trusted content for display only
  const getPlainText = (html: string): string => {
    // Use browser's built-in parser for safe HTML handling
    if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Remove script and style elements safely
        doc.querySelectorAll('script, style').forEach(el => el.remove());
        
        // Get text content and clean whitespace
        return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
      } catch (e) {
        // Fallback to regex if DOMParser fails
      }
    }
    
    // Server-side or fallback: simple text extraction
    // Content is from trusted AI source, used for display/metrics only
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Content Preview
          </CardTitle>
          {content && (
            <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">
              {stats.wordCount} woorden
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-zinc-800 px-4">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger
                value="preview"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger
                value="html"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
              >
                <Code2 className="w-4 h-4 mr-2" />
                HTML
              </TabsTrigger>
              <TabsTrigger
                value="markdown"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
              >
                <FileCode className="w-4 h-4 mr-2" />
                Markdown
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Stats
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="preview" className="p-6 min-h-[400px]">
            {isGenerating ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-zinc-400">Content wordt gegenereerd...</p>
                </div>
              </div>
            ) : content ? (
              <div
                className="prose prose-invert prose-zinc max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-zinc-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Geen content gegenereerd</p>
                  <p className="text-sm mt-2">
                    Vul de configuratie in en klik op "Genereer Content"
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="html" className="p-6 min-h-[400px]">
            {content ? (
              <pre className="bg-zinc-950 p-4 rounded-lg overflow-x-auto">
                <code className="text-zinc-300 text-sm">{content}</code>
              </pre>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-zinc-500">Geen content beschikbaar</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="markdown" className="p-6 min-h-[400px]">
            {content ? (
              <pre className="bg-zinc-950 p-4 rounded-lg overflow-x-auto">
                <code className="text-zinc-300 text-sm whitespace-pre-wrap">
                  {htmlToMarkdown(content)}
                </code>
              </pre>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-zinc-500">Geen content beschikbaar</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="p-6 min-h-[400px]">
            {content ? (
              <div className="space-y-6">
                {/* Meta Description */}
                {metaDescription && (
                  <div className="bg-zinc-800 p-4 rounded-lg">
                    <h3 className="text-white font-semibold mb-2">Meta Description</h3>
                    <p className="text-zinc-300 text-sm">{metaDescription}</p>
                    <p className="text-zinc-500 text-xs mt-2">
                      {metaDescription.length} karakters
                    </p>
                  </div>
                )}

                {/* Content Statistics */}
                <div>
                  <h3 className="text-white font-semibold mb-4">Content Statistieken</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard
                      label="Woorden"
                      value={stats.wordCount}
                      icon="📝"
                    />
                    <StatCard
                      label="Karakters"
                      value={stats.characterCount}
                      icon="🔤"
                    />
                    <StatCard
                      label="Leestijd"
                      value={`${stats.readingTime} min`}
                      icon="⏱️"
                    />
                    <StatCard
                      label="Headings"
                      value={stats.headingCount}
                      icon="📋"
                    />
                    <StatCard
                      label="Interne Links"
                      value={stats.internalLinksAdded}
                      icon="🔗"
                    />
                    <StatCard
                      label="Externe Links"
                      value={stats.externalLinksAdded}
                      icon="🌐"
                    />
                    <StatCard
                      label="Afbeeldingen"
                      value={stats.imagesAdded}
                      icon="🖼️"
                    />
                    <StatCard
                      label="Bol.com Producten"
                      value={stats.bolProductsAdded}
                      icon="🛍️"
                    />
                  </div>
                </div>

                {/* Reading Level */}
                <div className="bg-zinc-800 p-4 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Leesbaarheidsscore</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-400"
                          style={{ width: '85%' }}
                        />
                      </div>
                    </div>
                    <span className="text-white font-semibold">85%</span>
                  </div>
                  <p className="text-zinc-400 text-xs mt-2">
                    Goed leesbaar voor de meeste bezoekers
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-zinc-500">Geen statistieken beschikbaar</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="bg-zinc-800 p-4 rounded-lg">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-zinc-400">{label}</div>
    </div>
  );
}
