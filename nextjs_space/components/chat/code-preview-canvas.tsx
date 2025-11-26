
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  SaveIcon, 
  CopyIcon, 
  RefreshCwIcon, 
  XIcon, 
  PlayIcon, 
  CodeIcon,
  EyeIcon,
  MaximizeIcon,
  MinimizeIcon,
  DownloadIcon,
  SparklesIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// @ts-ignore - Type compatibility with React 18
const CodeHighlighter = SyntaxHighlighter as any;

interface CodePreviewCanvasProps {
  initialHtml?: string;
  initialCss?: string;
  initialJs?: string;
  onSave: (html: string, css: string, js: string) => void;
  onRefine?: (code: string, instruction: string, language: string) => Promise<string>;
  onClose: () => void;
}

export function CodePreviewCanvas({ 
  initialHtml = '', 
  initialCss = '', 
  initialJs = '', 
  onSave, 
  onRefine,
  onClose 
}: CodePreviewCanvasProps) {
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [instruction, setInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('split');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update preview iframe
  useEffect(() => {
    if (!iframeRef.current) return;

    const document = iframeRef.current.contentDocument;
    if (!document) return;

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: system-ui, -apple-system, sans-serif;
            }
            ${css}
          </style>
        </head>
        <body>
          ${html}
          <script>
            try {
              ${js}
            } catch (error) {
              console.error('Script error:', error);
              document.body.insertAdjacentHTML('beforeend', '<div style="background: #fee; border: 1px solid #fcc; padding: 10px; margin: 10px 0; border-radius: 4px; color: #c00;"><strong>JavaScript Error:</strong> ' + error.message + '</div>');
            }
          </script>
        </body>
      </html>
    `;

    document.open();
    document.write(content);
    document.close();
  }, [html, css, js]);

  const handleRefine = async () => {
    if (!instruction.trim()) return;
    
    setIsRefining(true);
    try {
      let refined = '';
      let currentCode = '';
      
      switch (activeTab) {
        case 'html':
          currentCode = html;
          break;
        case 'css':
          currentCode = css;
          break;
        case 'js':
          currentCode = js;
          break;
      }

      if (onRefine) {
        refined = await onRefine(currentCode, instruction, activeTab);
        
        switch (activeTab) {
          case 'html':
            setHtml(refined);
            break;
          case 'css':
            setCss(refined);
            break;
          case 'js':
            setJs(refined);
            break;
        }
      }

      setInstruction('');
      toast.success(`${activeTab.toUpperCase()} code verfijnd!`);
    } catch (error) {
      console.error('Refine failed:', error);
      toast.error('Verfijning mislukt');
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopy = () => {
    let code = '';
    switch (activeTab) {
      case 'html':
        code = html;
        break;
      case 'css':
        code = css;
        break;
      case 'js':
        code = js;
        break;
    }
    navigator.clipboard.writeText(code);
    toast.success('Code gekopieerd!');
  };

  const handleCopyAll = () => {
    const fullCode = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
    navigator.clipboard.writeText(fullCode);
    toast.success('Volledige code gekopieerd!');
  };

  const handleDownload = () => {
    const fullCode = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
    
    const blob = new Blob([fullCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code-preview.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Code gedownload!');
  };

  const handleSave = () => {
    onSave(html, css, js);
    toast.success('Code opgeslagen!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-background rounded-xl shadow-2xl border border-border transition-all duration-300 ${
          isMaximized ? 'w-full h-full' : 'max-w-[95vw] w-full max-h-[90vh]'
        } flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <CodeIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Code Canvas</h3>
              <p className="text-xs text-muted-foreground">Maak en preview HTML, CSS & JavaScript</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'code' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('code')}
              title="Alleen code"
            >
              <CodeIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'split' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('split')}
              title="Split view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
              </svg>
            </Button>
            <Button
              variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('preview')}
              title="Alleen preview"
            >
              <EyeIcon className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsMaximized(!isMaximized)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isMaximized ? <MinimizeIcon className="w-4 h-4" /> : <MaximizeIcon className="w-4 h-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Code Editor Side */}
          {(viewMode === 'code' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'flex-1' : 'w-full'} flex flex-col border-r border-border`}>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
                <div className="px-4 py-2 bg-muted/20 border-b border-border">
                  <TabsList className="h-9">
                    <TabsTrigger value="html" className="text-xs">
                      <span className="text-orange-500 font-mono mr-1.5">&lt;/&gt;</span>
                      HTML
                    </TabsTrigger>
                    <TabsTrigger value="css" className="text-xs">
                      <span className="text-blue-500 font-mono mr-1.5">{'{}'}</span>
                      CSS
                    </TabsTrigger>
                    <TabsTrigger value="js" className="text-xs">
                      <span className="text-yellow-500 font-mono mr-1.5">ƒ</span>
                      JavaScript
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="html" className="flex-1 overflow-hidden m-0">
                  <Textarea
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    className="h-full font-mono text-sm resize-none border-0 focus-visible:ring-0 bg-zinc-950 text-zinc-50 rounded-none"
                    placeholder="<!-- HTML code hier -->"
                  />
                </TabsContent>

                <TabsContent value="css" className="flex-1 overflow-hidden m-0">
                  <Textarea
                    value={css}
                    onChange={(e) => setCss(e.target.value)}
                    className="h-full font-mono text-sm resize-none border-0 focus-visible:ring-0 bg-zinc-950 text-zinc-50 rounded-none"
                    placeholder="/* CSS styles hier */"
                  />
                </TabsContent>

                <TabsContent value="js" className="flex-1 overflow-hidden m-0">
                  <Textarea
                    value={js}
                    onChange={(e) => setJs(e.target.value)}
                    className="h-full font-mono text-sm resize-none border-0 focus-visible:ring-0 bg-zinc-950 text-zinc-50 rounded-none"
                    placeholder="// JavaScript code hier"
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Preview Side */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'flex-1' : 'w-full'} flex flex-col bg-white`}>
              <div className="px-4 py-3 bg-muted/20 border-b border-border flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">Live Preview</Label>
                <PlayIcon className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe
                  ref={iframeRef}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                  title="Code Preview"
                />
              </div>
            </div>
          )}
        </div>

        {/* Refinement & Actions Bar */}
        <div className="border-t border-border bg-muted/30 px-6 py-4">
          {onRefine && (
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <Textarea
                  placeholder={`Verfijn ${activeTab.toUpperCase()} code... (bijv: 'Maak de buttons groter', 'Voeg animaties toe')`}
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <Button
                onClick={handleRefine}
                disabled={!instruction.trim() || isRefining}
                variant="secondary"
                className="self-start"
              >
                {isRefining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verfijnen...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Verfijn
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <CopyIcon className="w-4 h-4 mr-2" />
                Kopieer {activeTab.toUpperCase()}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyAll}>
                <CopyIcon className="w-4 h-4 mr-2" />
                Kopieer Alles
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <DownloadIcon className="w-4 h-4 mr-2" />
                Download HTML
              </Button>
            </div>
            
            <Button 
              onClick={handleSave} 
              size="sm" 
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <SaveIcon className="w-4 h-4 mr-2" />
              Opslaan & Sluiten
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
