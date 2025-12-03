
'use client';

import { Button } from '@/components/ui/button';
import { Image, Package, Link2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlogToolbarProps {
  onAddImage: () => void;
  onAddProduct: () => void;
  onAddLink: () => void;
  onInsertBlogTemplate: () => void;
  disabled?: boolean;
  className?: string;
}

export function BlogToolbar({
  onAddImage,
  onAddProduct,
  onAddLink,
  onInsertBlogTemplate,
  disabled = false,
  className
}: BlogToolbarProps) {
  return (
    <div className={cn(
      "flex flex-wrap items-center gap-2 p-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30",
      className
    )}>
      <div className="flex items-center gap-2 text-sm text-gray-400 mr-2">
        <FileText className="h-4 w-4" />
        <span className="hidden sm:inline">Blog Tools:</span>
      </div>
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAddImage}
        disabled={disabled}
        className="bg-purple-900/30 hover:bg-purple-800/40 border-purple-500/50 text-purple-200"
      >
        <Image className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">Afbeelding</span>
      </Button>
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAddProduct}
        disabled={disabled}
        className="bg-blue-900/30 hover:bg-blue-800/40 border-blue-500/50 text-blue-200"
      >
        <Package className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">Bol.com Product</span>
      </Button>
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAddLink}
        disabled={disabled}
        className="bg-green-900/30 hover:bg-green-800/40 border-green-500/50 text-green-200"
      >
        <Link2 className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">Interne Link</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onInsertBlogTemplate}
        disabled={disabled}
        className="bg-orange-900/30 hover:bg-orange-800/40 border-orange-500/50 text-orange-200"
      >
        <FileText className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">Blog Template</span>
      </Button>
    </div>
  );
}
