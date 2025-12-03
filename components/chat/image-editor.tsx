
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, DownloadIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageEditorProps {
  imageUrl: string;
  onEdit: (prompt: string) => Promise<string>;
  onClose: () => void;
}

export function ImageEditor({ imageUrl, onEdit, onClose }: ImageEditorProps) {
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedUrl, setEditedUrl] = useState(imageUrl);

  const handleEdit = async () => {
    if (!editPrompt.trim()) return;
    
    setIsEditing(true);
    try {
      const newUrl = await onEdit(editPrompt);
      setEditedUrl(newUrl);
      setEditPrompt('');
    } catch (error) {
      console.error('Edit failed:', error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = editedUrl;
    a.download = `edited-image-${Date.now()}.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Afbeelding bewerken</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Sluiten
            </Button>
          </div>

          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <Image
              src={editedUrl}
              alt="Editing image"
              fill
              className="object-contain"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-prompt">Bewerkingsopdracht</Label>
            <Textarea
              id="edit-prompt"
              placeholder="Beschrijf wat je wilt aanpassen aan de afbeelding..."
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleEdit}
              disabled={!editPrompt.trim() || isEditing}
              className="flex-1"
            >
              {isEditing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Bewerken...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Afbeelding aanpassen
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <DownloadIcon className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
