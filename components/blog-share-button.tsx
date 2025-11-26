
'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface BlogShareButtonProps {
  title: string;
  excerpt: string;
}

export default function BlogShareButton({ title, excerpt }: BlogShareButtonProps) {
  const handleShare = async () => {
    const shareData = {
      title,
      text: excerpt,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link gekopieerd naar klembord!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="ml-auto border-gray-700 hover:border-orange-500 hover:text-orange-400 text-gray-300"
    >
      <Share2 className="w-4 h-4 mr-2" />
      Delen
    </Button>
  );
}
