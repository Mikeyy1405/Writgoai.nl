'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { IdeaCard } from './IdeaCard';
import type { ArticleIdea, ArticleStatus } from '@/types/database';

interface StatusColumnProps {
  id: ArticleStatus;
  title: string;
  color: string;
  ideas: ArticleIdea[];
  onEdit?: (idea: ArticleIdea) => void;
  onDelete?: (id: string) => void;
  onSchedule?: (idea: ArticleIdea) => void;
  onGenerate?: (idea: ArticleIdea) => void;
  onStatusChange?: (id: string, status: ArticleStatus) => void;
}

export function StatusColumn({
  id,
  title,
  color,
  ideas,
  onEdit,
  onDelete,
  onSchedule,
  onGenerate,
  onStatusChange,
}: StatusColumnProps) {
  return (
    <div className={`flex flex-col min-w-[300px] max-w-[350px] rounded-lg ${color}`}>
      {/* Column Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="bg-white/50">
            {ideas.length}
          </Badge>
        </div>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onEdit={onEdit}
              onDelete={onDelete}
              onSchedule={onSchedule}
              onGenerate={onGenerate}
              onStatusChange={onStatusChange}
            />
          ))}
          
          {ideas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Geen items
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
