
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Share2, Video, Loader2, ExternalLink, Download, Edit, Trash2 } from 'lucide-react';

interface ContentPiece {
  id: string;
  theme: string;
  dayNumber: number;
  
  // Blog
  blogTitle?: string | null;
  blogContent?: string | null;
  blogImages?: string[];
  blogPublished: boolean;
  blogUrl?: string | null;
  
  // Social
  socialCaption?: string | null;
  socialImageUrl?: string | null;
  socialHashtags?: string[];
  socialPublished: boolean;
  
  // Video
  reelTitle?: string | null;
  reelScript?: string | null;
  reelVideoUrl?: string | null;
  reelThumbnailUrl?: string | null;
  reelVideoStatus?: string | null;
  reelPublished: boolean;
  
  status: string;
}

interface Props {
  content: ContentPiece;
  onEdit: (content: ContentPiece) => void;
  onPreview: (content: ContentPiece) => void;
  onPublish: (contentId: string, type: 'blog' | 'social' | 'reel' | 'all') => void;
  onDelete: (contentId: string) => void;
  publishing: boolean;
}

export function ProfessionalContentCard({ content, onEdit, onPreview, onPublish, onDelete, publishing }: Props) {
  return (
    <Card className="p-6 bg-gradient-to-br from-orange-50 to-purple-50 border-2 border-orange-200 hover:border-orange-300 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Dag {content.dayNumber}</h3>
          <p className="text-sm text-gray-300">{content.theme}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={
            content.status === 'published' ? 'bg-green-500' :
            content.status === 'draft' ? 'bg-blue-500' :
            content.status === 'generating' ? 'bg-yellow-500' :
            'bg-gray-500'
          }>
            {content.status === 'draft' ? 'Klaar' :
             content.status === 'generating' ? 'Bezig...' :
             content.status === 'published' ? 'Live' :
             content.status}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(content.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
            title="Verwijder deze content"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content Types Grid */}
      <div className="space-y-3">
        
        {/* Blog Article */}
        {content.blogTitle && (
          <div className="bg-zinc-900 rounded-lg p-4 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-700">Blog Artikel (HTML)</h4>
              </div>
              {content.blogPublished ? (
                <Badge className="bg-green-500 text-white">
                  ✅ Gepubliceerd
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onPublish(content.id, 'blog')}
                  disabled={publishing}
                  className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {publishing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Publiceer'}
                </Button>
              )}
            </div>
            
            <p className="font-medium text-white mb-2">{content.blogTitle}</p>
            
            {content.blogImages && content.blogImages.length > 0 && (
              <div className="flex gap-2 mb-2">
                {content.blogImages.slice(0, 3).map((img, i) => (
                  <img 
                    key={i}
                    src={img} 
                    alt={`Blog image ${i + 1}`}
                    className="w-16 h-16 object-cover rounded border"
                  />
                ))}
              </div>
            )}
            
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPreview(content)}
                className="flex-1 text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Preview HTML
              </Button>
              {content.blogUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(content.blogUrl!, '_blank')}
                  className="flex-1 text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Bekijk Live
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Social Media Post */}
        {content.socialCaption && (
          <div className="bg-zinc-900 rounded-lg p-4 border-2 border-pink-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-pink-600" />
                <h4 className="font-semibold text-pink-900">Social Media Post</h4>
              </div>
              {content.socialPublished ? (
                <Badge className="bg-green-500 text-white">
                  ✅ Gepubliceerd
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onPublish(content.id, 'social')}
                  disabled={publishing}
                  className="h-7 px-3 text-xs bg-pink-600 hover:bg-pink-700 text-white"
                >
                  {publishing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Publiceer'}
                </Button>
              )}
            </div>
            
            <p className="text-sm text-gray-700 line-clamp-3 mb-3">
              {content.socialCaption}
            </p>
            
            {content.socialImageUrl && (
              <div className="rounded-lg overflow-hidden mb-3">
                <img 
                  src={content.socialImageUrl} 
                  alt="Social media post"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
            
            {content.socialHashtags && content.socialHashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {content.socialHashtags.slice(0, 5).map((tag, i) => (
                  <span key={i} className="text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Video/Reel */}
        {content.reelScript && (
          <div className="bg-zinc-900 rounded-lg p-4 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-purple-900">Video (Vadoo)</h4>
              </div>
              <div className="flex items-center gap-2">
                {content.reelVideoStatus === 'completed' && !content.reelPublished && (
                  <Button
                    size="sm"
                    onClick={() => onPublish(content.id, 'reel')}
                    disabled={publishing}
                    className="h-7 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {publishing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Publiceer'}
                  </Button>
                )}
                {content.reelPublished && (
                  <Badge className="bg-green-500 text-white">
                    ✅ Gepubliceerd
                  </Badge>
                )}
                {content.reelVideoStatus === 'generating' && (
                  <Badge className="bg-yellow-500 text-white animate-pulse">
                    🎬 Genereren...
                  </Badge>
                )}
                {content.reelVideoStatus === 'failed' && (
                  <Badge className="bg-red-500 text-white">
                    ❌ Mislukt
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="font-medium text-white mb-2">{content.reelTitle}</p>
            
            {/* Video Player */}
            {content.reelVideoUrl && content.reelVideoStatus === 'completed' ? (
              <div className="rounded-lg overflow-hidden mb-3 bg-black">
                <video 
                  src={content.reelVideoUrl}
                  poster={content.reelThumbnailUrl || undefined}
                  controls
                  className="w-full max-h-96 object-contain"
                >
                  Je browser ondersteunt geen video playback.
                </video>
              </div>
            ) : content.reelThumbnailUrl ? (
              <div className="rounded-lg overflow-hidden mb-3">
                <img 
                  src={content.reelThumbnailUrl} 
                  alt="Video thumbnail"
                  className="w-full h-48 object-cover"
                />
              </div>
            ) : (
              <div className="bg-zinc-800 rounded-lg p-4 mb-3 text-center">
                <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">
                  {content.reelVideoStatus === 'generating' ? 
                    'Video wordt gegenereerd...' : 
                    'Video wordt binnenkort gegenereerd'}
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPreview(content)}
                className="flex-1 text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Bekijk Script
              </Button>
              {content.reelVideoUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(content.reelVideoUrl!, '_blank')}
                  className="flex-1 text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-4 border-t border-zinc-800 flex gap-2">
        <Button
          onClick={() => onEdit(content)}
          variant="outline"
          className="flex-1"
        >
          <Edit className="w-4 h-4 mr-2" />
          Bewerk
        </Button>
        
        {(!content.blogPublished || !content.socialPublished || (content.reelVideoStatus === 'completed' && !content.reelPublished)) && (
          <Button
            onClick={() => onPublish(content.id, 'all')}
            disabled={publishing}
            className="flex-1 bg-gradient-to-r from-orange-500 to-purple-500 hover:opacity-90 text-white"
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publiceren...
              </>
            ) : (
              'Publiceer Alles'
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}
