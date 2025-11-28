'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  MoreVertical,
  Calendar,
  Trash2,
  Edit,
  Zap,
  Clock,
  TrendingUp,
  Target,
} from 'lucide-react';
import type { ArticleIdea, ArticleStatus, Priority, ContentType } from '@/types/database';

interface IdeaCardProps {
  idea: ArticleIdea;
  onEdit?: (idea: ArticleIdea) => void;
  onDelete?: (id: string) => void;
  onSchedule?: (idea: ArticleIdea) => void;
  onGenerate?: (idea: ArticleIdea) => void;
  onStatusChange?: (id: string, status: ArticleStatus) => void;
}

const priorityColors: Record<Priority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const contentTypeColors: Record<ContentType, string> = {
  homepage: 'bg-purple-100 text-purple-700',
  pillar: 'bg-indigo-100 text-indigo-700',
  cluster: 'bg-cyan-100 text-cyan-700',
  blog: 'bg-green-100 text-green-700',
  landing: 'bg-pink-100 text-pink-700',
};

const contentTypeLabels: Record<ContentType, string> = {
  homepage: 'Homepage',
  pillar: 'Pillar',
  cluster: 'Cluster',
  blog: 'Blog',
  landing: 'Landing',
};

export function IdeaCard({
  idea,
  onEdit,
  onDelete,
  onSchedule,
  onGenerate,
  onStatusChange,
}: IdeaCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (onGenerate) {
      setIsLoading(true);
      try {
        await onGenerate(idea);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        {/* Header with type and priority */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex gap-2 flex-wrap">
            {idea.contentType && (
              <Badge 
                variant="secondary" 
                className={contentTypeColors[idea.contentType as ContentType] || 'bg-gray-100'}
              >
                {contentTypeLabels[idea.contentType as ContentType] || idea.contentType}
              </Badge>
            )}
            <Badge 
              variant="secondary" 
              className={priorityColors[idea.priority as Priority] || 'bg-gray-100'}
            >
              {idea.priority}
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(idea)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Bewerken
                </DropdownMenuItem>
              )}
              {onSchedule && !idea.scheduledFor && (
                <DropdownMenuItem onClick={() => onSchedule(idea)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Inplannen
                </DropdownMenuItem>
              )}
              {onGenerate && !idea.hasContent && (
                <DropdownMenuItem onClick={handleGenerate} disabled={isLoading}>
                  <Zap className="mr-2 h-4 w-4" />
                  Content Genereren
                </DropdownMenuItem>
              )}
              {onStatusChange && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onStatusChange(idea.id, 'idea')}>
                    Naar Ideeën
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(idea.id, 'planned')}>
                    Naar Gepland
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(idea.id, 'writing')}>
                    Naar Schrijven
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(idea.id, 'review')}>
                    Naar Review
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(idea.id, 'published')}>
                    Naar Gepubliceerd
                  </DropdownMenuItem>
                </>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(idea.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Verwijderen
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <h3 className="font-medium text-sm mb-2 line-clamp-2">
          {idea.title}
        </h3>

        {/* Focus keyword */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <Target className="h-3 w-3" />
          <span className="truncate">{idea.focusKeyword}</span>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {idea.searchVolume && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{idea.searchVolume}</span>
            </div>
          )}
          {idea.targetWordCount && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{idea.targetWordCount} woorden</span>
            </div>
          )}
          {idea.scheduledFor && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{new Date(idea.scheduledFor).toLocaleDateString('nl-NL')}</span>
            </div>
          )}
        </div>

        {/* Content status indicator */}
        {idea.hasContent && (
          <div className="mt-2 pt-2 border-t">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <FileText className="mr-1 h-3 w-3" />
              Content gereed
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
