'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search,
  Facebook, 
  Twitter,
  Linkedin,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';

interface SocialPreviewProps {
  title: string;
  metaDescription: string;
  slug: string;
  featuredImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  onOgChange?: (field: 'ogTitle' | 'ogDescription', value: string) => void;
  onTwitterChange?: (field: 'twitterTitle' | 'twitterDescription', value: string) => void;
}

export function SocialPreview({
  title,
  metaDescription,
  slug,
  featuredImage,
  ogTitle,
  ogDescription,
  twitterTitle,
  twitterDescription,
  onOgChange,
  onTwitterChange,
}: SocialPreviewProps) {
  const [activeTab, setActiveTab] = useState('google');
  
  const finalOgTitle = ogTitle || title;
  const finalOgDescription = ogDescription || metaDescription;
  const finalTwitterTitle = twitterTitle || title;
  const finalTwitterDescription = twitterDescription || metaDescription;
  const url = `https://writgo.nl/${slug}`;

  // Truncate text for display
  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className="p-4 bg-gray-800/50 border-gray-700">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <ExternalLink className="w-5 h-5 text-orange-500" />
        Social Media Preview
      </h3>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-900 mb-4">
          <TabsTrigger value="google" className="text-xs">
            <Search className="w-3 h-3 mr-1" />
            Google
          </TabsTrigger>
          <TabsTrigger value="facebook" className="text-xs">
            <Facebook className="w-3 h-3 mr-1" />
            Facebook
          </TabsTrigger>
          <TabsTrigger value="twitter" className="text-xs">
            <Twitter className="w-3 h-3 mr-1" />
            X/Twitter
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="text-xs">
            <Linkedin className="w-3 h-3 mr-1" />
            LinkedIn
          </TabsTrigger>
        </TabsList>

        {/* Google Preview */}
        <TabsContent value="google" className="space-y-4">
          <div className="bg-slate-900 p-4 rounded border border-slate-600">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                W
              </div>
              <div>
                <div className="text-xs text-gray-600">WritgoAI</div>
                <div className="text-xs text-gray-500">{url}</div>
              </div>
            </div>
            <div className="text-blue-600 text-lg hover:underline cursor-pointer mb-1">
              {truncate(title, 60)}
            </div>
            <div className="text-sm text-gray-600">
              {truncate(metaDescription, 160)}
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Zo verschijnt je artikel in Google zoekresultaten
          </p>
        </TabsContent>

        {/* Facebook Preview */}
        <TabsContent value="facebook" className="space-y-4">
          <div className="bg-slate-900 rounded border border-slate-600 overflow-hidden">
            {featuredImage ? (
              <div className="aspect-video bg-slate-700 relative overflow-hidden">
                <img 
                  src={featuredImage} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-slate-700 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <div className="p-3 bg-slate-800">
              <div className="text-xs text-gray-500 uppercase mb-1">WRITGO.NL</div>
              <div className="text-base font-semibold text-slate-300 mb-1">
                {truncate(finalOgTitle, 70)}
              </div>
              <div className="text-sm text-gray-600">
                {truncate(finalOgDescription, 200)}
              </div>
            </div>
          </div>

          {onOgChange && (
            <div className="space-y-3 pt-3 border-t border-gray-700">
              <div>
                <Label className="text-xs text-gray-400 mb-1">Custom OG Title (optioneel)</Label>
                <Input
                  value={ogTitle || ''}
                  onChange={(e) => onOgChange('ogTitle', e.target.value)}
                  placeholder={title}
                  maxLength={70}
                  className="bg-gray-900 border-gray-700 text-white text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400 mb-1">Custom OG Description (optioneel)</Label>
                <Textarea
                  value={ogDescription || ''}
                  onChange={(e) => onOgChange('ogDescription', e.target.value)}
                  placeholder={metaDescription}
                  rows={2}
                  maxLength={200}
                  className="bg-gray-900 border-gray-700 text-white text-sm"
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Twitter Preview */}
        <TabsContent value="twitter" className="space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-600 overflow-hidden">
            {featuredImage ? (
              <div className="aspect-video bg-slate-700 relative overflow-hidden">
                <img 
                  src={featuredImage} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-slate-700 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <div className="p-3 border-t border-slate-700">
              <div className="text-sm font-semibold text-slate-300 mb-1">
                {truncate(finalTwitterTitle, 70)}
              </div>
              <div className="text-xs text-gray-600 mb-2">
                {truncate(finalTwitterDescription, 200)}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <ExternalLink className="w-3 h-3" />
                <span>writgo.nl</span>
              </div>
            </div>
          </div>

          {onTwitterChange && (
            <div className="space-y-3 pt-3 border-t border-gray-700">
              <div>
                <Label className="text-xs text-gray-400 mb-1">Custom Twitter Title (optioneel)</Label>
                <Input
                  value={twitterTitle || ''}
                  onChange={(e) => onTwitterChange('twitterTitle', e.target.value)}
                  placeholder={title}
                  maxLength={70}
                  className="bg-gray-900 border-gray-700 text-white text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400 mb-1">Custom Twitter Description (optioneel)</Label>
                <Textarea
                  value={twitterDescription || ''}
                  onChange={(e) => onTwitterChange('twitterDescription', e.target.value)}
                  placeholder={metaDescription}
                  rows={2}
                  maxLength={200}
                  className="bg-gray-900 border-gray-700 text-white text-sm"
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* LinkedIn Preview */}
        <TabsContent value="linkedin" className="space-y-4">
          <div className="bg-slate-900 rounded border border-slate-600 overflow-hidden">
            {featuredImage ? (
              <div className="aspect-video bg-slate-700 relative overflow-hidden">
                <img 
                  src={featuredImage} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-slate-700 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <div className="p-3">
              <div className="text-base font-semibold text-slate-300 mb-1">
                {truncate(finalOgTitle, 70)}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {truncate(finalOgDescription, 150)}
              </div>
              <div className="text-xs text-gray-500">
                writgo.nl
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            LinkedIn gebruikt dezelfde OG tags als Facebook
          </p>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
