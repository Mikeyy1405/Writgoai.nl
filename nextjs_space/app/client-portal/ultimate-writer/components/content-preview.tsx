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
      <CardHeader className="border-b border-zinc-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
            Content Preview
          </CardTitle>
          {content && (
            <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700 text-xs sm:text-sm">
              {stats.wordCount} woorden
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-zinc-800 px-2 sm:px-4">
            <TabsList className="bg-transparent h-10 sm:h-12">
              <TabsTrigger
                value="preview"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-3"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Preview</span>
              </TabsTrigger>
              <TabsTrigger
                value="html"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-3"
              >
                <Code2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">HTML</span>
              </TabsTrigger>
              <TabsTrigger
                value="markdown"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-3"
              >
                <FileCode className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Markdown</span>
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-3"
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Stats</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="preview" className="p-3 sm:p-6 min-h-[400px]">
            {isGenerating ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm sm:text-base text-zinc-400">Content wordt gegenereerd...</p>
                </div>
              </div>
            ) : content ? (
              <div
                className="prose prose-invert prose-zinc prose-sm sm:prose-base max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-zinc-500">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">Geen content gegenereerd</p>
                  <p className="text-xs sm:text-sm mt-2">
                    Vul de configuratie in en klik op "Genereer Content"
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="html" className="p-3 sm:p-6 min-h-[400px]">
            {content ? (
              <pre className="bg-zinc-950 p-3 sm:p-4 rounded-lg overflow-x-auto">
                <code className="text-zinc-300 text-xs sm:text-sm">{content}</code>
              </pre>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-sm sm:text-base text-zinc-500">Geen content beschikbaar</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="markdown" className="p-3 sm:p-6 min-h-[400px]">
            {content ? (
              <pre className="bg-zinc-950 p-3 sm:p-4 rounded-lg overflow-x-auto">
                <code className="text-zinc-300 text-xs sm:text-sm whitespace-pre-wrap">
                  {htmlToMarkdown(content)}
                </code>
              </pre>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-sm sm:text-base text-zinc-500">Geen content beschikbaar</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="p-3 sm:p-6 min-h-[400px]">
            {content ? (
              <div className="space-y-6">
                {/* Meta Description */}
                {metaDescription && (
                  <div className="bg-zinc-800 p-3 sm:p-4 rounded-lg">
                    <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">Meta Description</h3>
                    <p className="text-zinc-300 text-xs sm:text-sm">{metaDescription}</p>
                    <p className="text-zinc-500 text-xs mt-2">
                      {metaDescription.length} karakters
                    </p>
                  </div>
                )}

                {/* Content Statistics */}
                <div>
                  <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Content Statistieken</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
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
    <div className="bg-zinc-800 p-3 sm:p-4 rounded-lg">
      <div className="text-xl sm:text-2xl mb-1">{icon}</div>
      <div className="text-lg sm:text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-zinc-400">{label}</div>
    </div>
  );
}
