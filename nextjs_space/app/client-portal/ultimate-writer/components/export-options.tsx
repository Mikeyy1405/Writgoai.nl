'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  Copy,
  Save,
  Upload,
  FileCode,
  Code2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { UltimateWriterConfig } from '../page';

interface ExportOptionsProps {
  content: string;
  metaDescription: string;
  config: UltimateWriterConfig;
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
}

export default function ExportOptions({
  content,
  metaDescription,
  config,
  stats,
}: ExportOptionsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} gekopieerd naar klembord`);
    } catch (error) {
      toast.error('Kon niet kopiëren naar klembord');
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Bestand gedownload: ${filename}`);
  };

  const handleSaveToLibrary = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/client/ultimate-writer/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          metaDescription,
          config,
          stats,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      const data = await response.json();
      toast.success('Content opgeslagen in bibliotheek!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Fout bij opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToWordPress = async () => {
    if (!config.projectId) {
      toast.error('Selecteer eerst een project');
      return;
    }

    setIsPublishing(true);
    try {
      const response = await fetch('/api/client/publish-to-wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: config.projectId,
          content,
          metaDescription,
          keywords: [config.primaryKeyword, ...config.secondaryKeywords.split(',').map(k => k.trim()).filter(Boolean)],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish');
      }

      const data = await response.json();
      toast.success('Content gepubliceerd naar WordPress!');
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Fout bij publiceren');
    } finally {
      setIsPublishing(false);
    }
  };

  const htmlToMarkdown = (html: string): string => {
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
    
    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]+>/g, '');
    
    // Clean up extra newlines
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    
    return markdown.trim();
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="border-b border-zinc-800">
        <CardTitle className="text-white flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export & Opslaan
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Save to Library */}
          <Button
            onClick={handleSaveToLibrary}
            disabled={isSaving}
            className="bg-zinc-800 hover:bg-zinc-700 text-white h-auto py-4 flex-col gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span className="text-sm">Opslaan in Bibliotheek</span>
          </Button>

          {/* Copy HTML */}
          <Button
            onClick={() => copyToClipboard(content, 'HTML')}
            className="bg-zinc-800 hover:bg-zinc-700 text-white h-auto py-4 flex-col gap-2"
          >
            <Code2 className="w-5 h-5" />
            <span className="text-sm">Kopieer HTML</span>
          </Button>

          {/* Copy Markdown */}
          <Button
            onClick={() => copyToClipboard(htmlToMarkdown(content), 'Markdown')}
            className="bg-zinc-800 hover:bg-zinc-700 text-white h-auto py-4 flex-col gap-2"
          >
            <FileCode className="w-5 h-5" />
            <span className="text-sm">Kopieer Markdown</span>
          </Button>

          {/* Download HTML */}
          <Button
            onClick={() => {
              const sanitizedTopic = config.topic
                .slice(0, 30)
                .replace(/[^a-z0-9]+/gi, '-')
                .replace(/^-+|-+$/g, '')
                .toLowerCase() || 'content';
              const filename = `${sanitizedTopic}.html`;
              downloadFile(content, filename, 'text/html');
            }}
            className="bg-zinc-800 hover:bg-zinc-700 text-white h-auto py-4 flex-col gap-2"
          >
            <Download className="w-5 h-5" />
            <span className="text-sm">Download HTML</span>
          </Button>

          {/* Download Markdown */}
          <Button
            onClick={() => {
              const sanitizedTopic = config.topic
                .slice(0, 30)
                .replace(/[^a-z0-9]+/gi, '-')
                .replace(/^-+|-+$/g, '')
                .toLowerCase() || 'content';
              const filename = `${sanitizedTopic}.md`;
              downloadFile(htmlToMarkdown(content), filename, 'text/markdown');
            }}
            className="bg-zinc-800 hover:bg-zinc-700 text-white h-auto py-4 flex-col gap-2"
          >
            <Download className="w-5 h-5" />
            <span className="text-sm">Download Markdown</span>
          </Button>

          {/* Publish to WordPress */}
          <Button
            onClick={handlePublishToWordPress}
            disabled={isPublishing || !config.projectId}
            className="bg-gradient-to-r from-[#ff6b35] to-[#ff8c5a] hover:from-[#ff5520] hover:to-[#ff7740] text-white h-auto py-4 flex-col gap-2"
          >
            {isPublishing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <span className="text-sm">
              {config.projectId ? 'Publiceer naar WordPress' : 'Selecteer Project'}
            </span>
          </Button>
        </div>

        {/* Info Text */}
        <div className="mt-4 p-3 bg-zinc-800 rounded-lg">
          <p className="text-xs text-zinc-400">
            💡 <strong className="text-zinc-300">Tip:</strong> Content wordt automatisch opgeslagen in je bibliotheek. 
            Van daaruit kun je het later bewerken of opnieuw gebruiken.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
