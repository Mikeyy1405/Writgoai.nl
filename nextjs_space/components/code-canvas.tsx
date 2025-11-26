
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Code2, 
  Eye, 
  Download, 
  Copy, 
  RotateCcw,
  Maximize2,
  Minimize2,
  RefreshCw,
  FileCode,
  Palette,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface CodeCanvasProps {
  initialHtml?: string;
  initialCss?: string;
  initialJs?: string;
  title?: string;
  description?: string;
}

export default function CodeCanvas({ 
  initialHtml = '', 
  initialCss = '', 
  initialJs = '',
  title = 'Code Preview',
  description = 'Interactieve code editor met live preview'
}: CodeCanvasProps) {
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update preview when code changes (with debounce for performance)
  useEffect(() => {
    if (!autoRefresh) return;

    const timeoutId = setTimeout(() => {
      updatePreview();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [html, css, js, autoRefresh]);

  // Update preview on mount
  useEffect(() => {
    updatePreview();
  }, []);

  const updatePreview = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const document = iframe.contentDocument;
    if (!document) return;

    const content = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      padding: 1rem;
      background: #ffffff;
    }
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    // Error handling
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      console.error('Error: ' + msg + '\\nLine: ' + lineNo);
      return false;
    };
    
    // User script
    try {
      ${js}
    } catch (error) {
      console.error('JavaScript Error:', error);
    }
  </script>
</body>
</html>
    `;

    document.open();
    document.write(content);
    document.close();
  };

  const handleCopy = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`${type} gekopieerd!`);
  };

  const handleDownload = () => {
    const content = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
  <script>
${js}
  </script>
</body>
</html>`;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'preview.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('HTML bestand gedownload!');
  };

  const handleReset = () => {
    setHtml(initialHtml);
    setCss(initialCss);
    setJs(initialJs);
    toast.success('Code gereset naar origineel!');
  };

  const handleManualRefresh = () => {
    updatePreview();
    toast.success('Preview vernieuwd!');
  };

  return (
    <Card className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">✨ Live Preview - Code wordt automatisch getoond</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Auto-refresh aan' : 'Auto-refresh uit'}
            >
              <Zap className={`w-4 h-4 ${autoRefresh ? 'text-green-600' : 'text-gray-400'}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              title="Handmatig verversen"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Minimaliseren' : 'Volledig scherm'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={`p-0 ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[600px]'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
          {/* Code Editor */}
          <div className="border-r flex flex-col h-full bg-slate-50">
            <div className="border-b bg-white p-2">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="html" className="flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    HTML
                  </TabsTrigger>
                  <TabsTrigger value="css" className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    CSS
                  </TabsTrigger>
                  <TabsTrigger value="js" className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    JavaScript
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex-1 overflow-auto">
              <TabsContent value="html" className="m-0 h-full">
                <div className="relative h-full">
                  <textarea
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    className="w-full h-full p-4 font-mono text-sm bg-slate-900 text-green-400 resize-none focus:outline-none overflow-x-auto whitespace-pre-wrap break-words"
                    placeholder="<!-- Schrijf je HTML hier -->"
                    spellCheck={false}
                    style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700"
                    onClick={() => handleCopy(html, 'HTML')}
                  >
                    <Copy className="w-4 h-4 text-green-400" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="css" className="m-0 h-full">
                <div className="relative h-full">
                  <textarea
                    value={css}
                    onChange={(e) => setCss(e.target.value)}
                    className="w-full h-full p-4 font-mono text-sm bg-slate-900 text-blue-400 resize-none focus:outline-none overflow-x-auto whitespace-pre-wrap break-words"
                    placeholder="/* Schrijf je CSS hier */"
                    spellCheck={false}
                    style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700"
                    onClick={() => handleCopy(css, 'CSS')}
                  >
                    <Copy className="w-4 h-4 text-blue-400" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="js" className="m-0 h-full">
                <div className="relative h-full">
                  <textarea
                    value={js}
                    onChange={(e) => setJs(e.target.value)}
                    className="w-full h-full p-4 font-mono text-sm bg-slate-900 text-yellow-400 resize-none focus:outline-none overflow-x-auto whitespace-pre-wrap break-words"
                    placeholder="// Schrijf je JavaScript hier"
                    spellCheck={false}
                    style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700"
                    onClick={() => handleCopy(js, 'JavaScript')}
                  >
                    <Copy className="w-4 h-4 text-yellow-400" />
                  </Button>
                </div>
              </TabsContent>
            </div>

            {/* Actions */}
            <div className="border-t bg-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download HTML
                </Button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col h-full bg-white">
            <div className="border-b bg-gradient-to-r from-blue-50 to-purple-50 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-sm">Live Preview</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {autoRefresh && (
                  <span className="flex items-center gap-1 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                    Auto-refresh
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-white">
              <iframe
                ref={iframeRef}
                title="Preview"
                sandbox="allow-scripts allow-same-origin allow-modals"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
