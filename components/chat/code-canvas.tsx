
'use client';

import { useState } from 'react';
import { Copy, Download, Check, Code2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// @ts-ignore - Type compatibility with React 18
const CodeHighlighter = SyntaxHighlighter as any;

interface CodeBlock {
  language: string;
  code: string;
  title?: string;
}

interface CodeCanvasProps {
  codeBlocks: CodeBlock[];
  onEdit?: (index: number, code: string) => void;
  editable?: boolean;
}

export function CodeCanvas({ codeBlocks, onEdit, editable = false }: CodeCanvasProps) {
  const [copied, setCopied] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedCode, setEditedCode] = useState<string>('');

  const handleCopy = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(index);
      toast.success('Code gekopieerd!');
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast.error('Kon code niet kopiëren');
    }
  };

  const handleDownload = (code: string, title: string, language: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'code'}.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Code gedownload!');
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditedCode(codeBlocks[index].code);
  };

  const handleSaveEdit = (index: number) => {
    if (onEdit) {
      onEdit(index, editedCode);
    }
    setEditingIndex(null);
    toast.success('Wijzigingen opgeslagen!');
  };

  const getFileExtension = (language: string): string => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      csharp: 'cs',
      go: 'go',
      rust: 'rs',
      php: 'php',
      ruby: 'rb',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      sql: 'sql',
      bash: 'sh',
    };
    return extensions[language.toLowerCase()] || 'txt';
  };

  if (codeBlocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {codeBlocks.map((block, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="bg-muted/50 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">
                  {block.title || `Code blok ${index + 1}`}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  ({block.language})
                </span>
              </div>
              <div className="flex items-center gap-1">
                {editable && editingIndex !== index && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(index)}
                  >
                    Bewerk
                  </Button>
                )}
                {editingIndex === index && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveEdit(index)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Opslaan
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(block.code, index)}
                >
                  {copied === index ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleDownload(block.code, block.title || `code-${index}`, block.language)
                  }
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {editingIndex === index ? (
              <textarea
                value={editedCode}
                onChange={(e) => setEditedCode(e.target.value)}
                className="w-full min-h-[200px] p-4 font-mono text-sm bg-zinc-900 text-zinc-50 border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ resize: 'vertical' }}
              />
            ) : (
              <CodeHighlighter
                language={block.language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  fontSize: '0.875rem',
                }}
                showLineNumbers
              >
                {block.code}
              </CodeHighlighter>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
