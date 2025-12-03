
'use client';

import { useRef, useState } from 'react';
import { Paperclip, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { validateFile } from '@/lib/chat-file-upload';

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
  cloudStoragePath: string;
}

interface FileUploadButtonProps {
  conversationId: string;
  onFileUploaded: (file: UploadedFile) => void;
  disabled?: boolean;
}

export function FileUploadButton({
  conversationId,
  onFileUploaded,
  disabled,
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Bestand is niet geldig');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);

      const response = await fetch('/api/client/chat/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload mislukt');
      }

      const data = await response.json();
      onFileUploaded(data.file);
      toast.success('Bestand geüpload!');

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('File upload error:', error);
      toast.error(error.message || 'Kon bestand niet uploaden');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>
    </>
  );
}
