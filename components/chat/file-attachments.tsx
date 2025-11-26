
'use client';

import { X, File, Image as ImageIcon, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
  cloudStoragePath: string;
}

interface FileAttachmentsProps {
  files: FileAttachment[];
  onRemove?: (index: number) => void;
  removable?: boolean;
}

export function FileAttachments({ files, onRemove, removable = false }: FileAttachmentsProps) {
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return ImageIcon;
    }
    if (type === 'application/pdf' || type.startsWith('text/')) {
      return FileText;
    }
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {files.map((file, index) => {
        const Icon = getFileIcon(file.type);
        const isImage = file.type.startsWith('image/');

        return (
          <Card key={index} className="relative group">
            {removable && onRemove && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            {isImage ? (
              <div className="relative w-32 h-32">
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 min-w-[200px]">
                <Icon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2"
                >
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
