
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, SaveIcon, CopyIcon, RefreshCwIcon, XIcon, MaximizeIcon, MinimizeIcon } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CanvasEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onRefine: (content: string, instruction: string) => Promise<string>;
  onClose: () => void;
}

export function CanvasEditor({ initialContent, onSave, onRefine, onClose }: CanvasEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [instruction, setInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleRefine = async () => {
    if (!instruction.trim()) return;
    
    setIsRefining(true);
    try {
      const refined = await onRefine(content, instruction);
      setContent(refined);
      setInstruction('');
      toast.success('Content verfijnd!');
    } catch (error) {
      console.error('Refine failed:', error);
      toast.error('Verfijning mislukt');
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Gekopieerd naar klembord!');
  };

  const handleSave = () => {
    onSave(content);
    toast.success('Content opgeslagen!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-background rounded-xl shadow-2xl border border-border transition-all duration-300 ${
          isMaximized ? 'w-full h-full' : 'max-w-7xl w-full max-h-[90vh]'
        } flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Canvas Editor</h3>
              <p className="text-xs text-muted-foreground">Bewerk en verfijn je content</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Content Area - Split View */}
        <div className="flex-1 overflow-hidden flex">
          {/* Editor Side */}
          <div className="flex-1 flex flex-col border-r border-border">
            <div className="px-4 py-3 bg-muted/20 border-b border-border">
              <Label htmlFor="canvas-content" className="text-sm font-medium">
                Editor
              </Label>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <Textarea
                id="canvas-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-full font-mono text-sm resize-none border-0 focus-visible:ring-0 bg-transparent"
                placeholder="Begin met typen..."
              />
            </div>
          </div>

          {/* Preview Side */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-3 bg-muted/20 border-b border-border">
              <Label className="text-sm font-medium">Preview</Label>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || '*Geen content*'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Refinement Bar */}
        <div className="border-t border-border bg-muted/30 px-6 py-4">
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <Textarea
                id="refine-instruction"
                placeholder="Geef een verfijningsopdracht... (bijv: 'Maak het professioneler', 'Voeg meer details toe')"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={handleRefine}
                disabled={!instruction.trim() || isRefining}
                variant="secondary"
                size="sm"
              >
                {isRefining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verfijnen...
                  </>
                ) : (
                  <>
                    <RefreshCwIcon className="w-4 h-4 mr-2" />
                    Verfijn content
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <CopyIcon className="w-4 h-4 mr-2" />
                Kopieer
              </Button>
            </div>
            
            <Button onClick={handleSave} size="sm" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
              <SaveIcon className="w-4 h-4 mr-2" />
              Opslaan & Sluiten
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
