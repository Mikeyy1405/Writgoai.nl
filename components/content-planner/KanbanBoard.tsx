'use client';

import { useState, useCallback } from 'react';
import { StatusColumn } from './StatusColumn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, RefreshCw } from 'lucide-react';
import type { ArticleIdea, ArticleStatus, ContentType, Priority, KanbanColumn } from '@/types/database';
import { KANBAN_COLUMNS } from '@/types/database';
import { toast } from 'sonner';

interface KanbanBoardProps {
  projectId: string;
  ideas: Record<ArticleStatus, ArticleIdea[]>;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function KanbanBoard({
  projectId,
  ideas,
  onRefresh,
  isLoading = false,
}: KanbanBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

  // Filter ideas based on search and filters
  const filterIdeas = useCallback((ideasList: ArticleIdea[]): ArticleIdea[] => {
    return ideasList.filter((idea) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          idea.title.toLowerCase().includes(query) ||
          idea.focusKeyword.toLowerCase().includes(query) ||
          (idea.topic && idea.topic.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Content type filter
      if (contentTypeFilter !== 'all' && idea.contentType !== contentTypeFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && idea.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [searchQuery, contentTypeFilter, priorityFilter]);

  // Handle status change
  const handleStatusChange = async (id: string, newStatus: ArticleStatus) => {
    try {
      const response = await fetch(`/api/ideas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success('Status bijgewerkt');
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Fout bij bijwerken status');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit idee wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/ideas/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete idea');
      }

      toast.success('Idee verwijderd');
      onRefresh();
    } catch (error) {
      console.error('Error deleting idea:', error);
      toast.error('Fout bij verwijderen idee');
    }
  };

  // Handle generate content
  const handleGenerate = async (idea: ArticleIdea) => {
    try {
      toast.info(`Content genereren voor: ${idea.title}...`);
      
      const response = await fetch(`/api/ideas/${idea.id}/generate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          toast.error(`Niet genoeg credits. Benodigd: ${data.required}`);
          return;
        }
        throw new Error(data.error || 'Failed to generate content');
      }

      toast.success(`Content gegenereerd! ${data.creditsUsed} credits gebruikt.`);
      onRefresh();
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Fout bij genereren content');
    }
  };

  // Handle schedule
  const handleSchedule = async (idea: ArticleIdea) => {
    const dateStr = prompt('Voer een datum in (YYYY-MM-DD):');
    if (!dateStr) return;

    try {
      const response = await fetch(`/api/ideas/${idea.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor: new Date(dateStr).toISOString() }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule');
      }

      toast.success('Artikel ingepland');
      onRefresh();
    } catch (error) {
      console.error('Error scheduling:', error);
      toast.error('Fout bij inplannen');
    }
  };

  // Calculate total count
  const totalCount = Object.values(ideas).reduce((acc, list) => acc + list.length, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoeken op titel of keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={contentTypeFilter}
            onValueChange={(value) => setContentTypeFilter(value as ContentType | 'all')}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle types</SelectItem>
              <SelectItem value="pillar">Pillar</SelectItem>
              <SelectItem value="cluster">Cluster</SelectItem>
              <SelectItem value="blog">Blog</SelectItem>
              <SelectItem value="homepage">Homepage</SelectItem>
              <SelectItem value="landing">Landing</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={(value) => setPriorityFilter(value as Priority | 'all')}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioriteit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle prioriteiten</SelectItem>
              <SelectItem value="critical">Kritiek</SelectItem>
              <SelectItem value="high">Hoog</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Laag</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>

        <div className="text-sm text-muted-foreground flex items-center">
          {totalCount} artikel ideeën
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 min-h-[500px] pb-4">
          {KANBAN_COLUMNS.map((column) => (
            <StatusColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              ideas={filterIdeas(ideas[column.id] || [])}
              onDelete={handleDelete}
              onSchedule={handleSchedule}
              onGenerate={handleGenerate}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
