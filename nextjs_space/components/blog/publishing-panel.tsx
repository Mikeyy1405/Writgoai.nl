'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  Tag,
  FolderOpen,
  Image as ImageIcon,
  User,
  Eye,
  Save,
  Send,
  FileText,
  Upload,
  Globe,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

interface PublishingPanelProps {
  status: string;
  category: string;
  tags: string[];
  featuredImage?: string;
  authorName: string;
  slug: string;
  scheduledFor?: Date;
  onStatusChange: (status: string) => void;
  onCategoryChange: (category: string) => void;
  onTagsChange: (tags: string[]) => void;
  onFeaturedImageChange: (url: string) => void;
  onAuthorChange: (author: string) => void;
  onSlugChange: (slug: string) => void;
  onScheduledChange: (date: Date | undefined) => void;
  onPreview?: () => void;
  onSave?: () => void;
  onPublish?: () => void;
  onPublishToWordPress?: () => void;
  saving?: boolean;
  publishing?: boolean;
}

const CATEGORIES = [
  'AI & Content Marketing',
  'SEO & Ranking',
  'WordPress Tips',
  'Automatisering',
  'Nieuws & Updates',
  'Tutorials',
  'Case Studies',
];

export function PublishingPanel({
  status,
  category,
  tags,
  featuredImage,
  authorName,
  slug,
  scheduledFor,
  onStatusChange,
  onCategoryChange,
  onTagsChange,
  onFeaturedImageChange,
  onAuthorChange,
  onSlugChange,
  onScheduledChange,
  onPreview,
  onSave,
  onPublish,
  onPublishToWordPress,
  saving,
  publishing,
}: PublishingPanelProps) {
  const [tagInput, setTagInput] = useState('');
  const [imageInput, setImageInput] = useState(featuredImage || '');
  const [uploading, setUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(
    scheduledFor ? new Date(scheduledFor).toISOString().slice(0, 16) : ''
  );

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      onTagsChange([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Alleen afbeeldingen zijn toegestaan');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload mislukt');
      }

      const data = await response.json();
      onFeaturedImageChange(data.url);
      setImageInput(data.url);
      toast.success('Afbeelding geüpload!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fout bij uploaden van afbeelding');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUrlSubmit = () => {
    if (imageInput.trim()) {
      onFeaturedImageChange(imageInput.trim());
      toast.success('Featured image ingesteld!');
    }
  };

  const handleScheduleChange = () => {
    if (scheduledDate) {
      onScheduledChange(new Date(scheduledDate));
      toast.success('Publicatie ingepland!');
    } else {
      onScheduledChange(undefined);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: 'Concept', className: 'bg-gray-500/20 text-gray-300 border-gray-500/50' },
      published: { label: 'Gepubliceerd', className: 'bg-green-500/20 text-green-400 border-green-500/50' },
      scheduled: { label: 'Ingepland', className: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            Status
          </h3>
          <Badge className={getStatusBadge(status).className}>
            {getStatusBadge(status).label}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-gray-300 text-sm mb-2">Status wijzigen</Label>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Concept</SelectItem>
                <SelectItem value="published">Gepubliceerd</SelectItem>
                <SelectItem value="scheduled">Ingepland</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === 'scheduled' && (
            <div>
              <Label className="text-gray-300 text-sm mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                Publicatie datum & tijd
              </Label>
              <Input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                onBlur={handleScheduleChange}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          {onPreview && (
            <Button
              onClick={onPreview}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Eye className="w-4 h-4 mr-2" />
              Voorbeeld
            </Button>
          )}
          {onSave && (
            <Button
              onClick={onSave}
              disabled={saving}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Opslaan
                </>
              )}
            </Button>
          )}
          {onPublish && (
            <Button
              onClick={onPublish}
              disabled={publishing}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {publishing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Publiceren...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {status === 'published' ? 'Bijwerken' : 'Publiceren'}
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* Category & Tags */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-orange-500" />
          Categorisatie
        </h3>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-300 text-sm mb-2">Categorie</Label>
            <Select value={category} onValueChange={onCategoryChange}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300 text-sm mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4 text-orange-500" />
              Tags
            </Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Voeg tag toe..."
                className="bg-gray-900 border-gray-700 text-white"
              />
              <Button
                onClick={handleAddTag}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600"
              >
                +
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-gray-700 text-gray-200 cursor-pointer hover:bg-gray-600"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Featured Image */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-orange-500" />
          Featured Image
        </h3>

        {featuredImage && (
          <div className="mb-3 rounded-lg overflow-hidden border border-gray-700">
            <img
              src={featuredImage}
              alt="Featured"
              className="w-full h-32 object-cover"
            />
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={() => document.getElementById('featured-image-upload')?.click()}
            variant="outline"
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Uploaden...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload afbeelding
              </>
            )}
          </Button>
          <input
            id="featured-image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-800 px-2 text-gray-500">of</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              placeholder="Afbeelding URL..."
              className="bg-gray-900 border-gray-700 text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleImageUrlSubmit();
                }
              }}
            />
            <Button
              onClick={handleImageUrlSubmit}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600"
            >
              OK
            </Button>
          </div>
        </div>
      </Card>

      {/* Author & Slug */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-orange-500" />
          Details
        </h3>

        <div className="space-y-3">
          <div>
            <Label className="text-gray-300 text-sm mb-2">Auteur</Label>
            <Input
              value={authorName}
              onChange={(e) => onAuthorChange(e.target.value)}
              placeholder="WritgoAI Team"
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300 text-sm mb-2">URL Slug</Label>
            <Input
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="url-slug"
              className="bg-gray-900 border-gray-700 text-white font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              writgo.nl/<span className="text-orange-400">{slug || 'slug'}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* WordPress Integration */}
      {onPublishToWordPress && status === 'published' && (
        <Card className="p-4 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-700/50">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            WordPress
          </h3>
          <Button
            onClick={onPublishToWordPress}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Publiceer naar WordPress
          </Button>
          <p className="text-xs text-gray-400 mt-2">
            Stuur dit artikel naar je WordPress website
          </p>
        </Card>
      )}
    </div>
  );
}
