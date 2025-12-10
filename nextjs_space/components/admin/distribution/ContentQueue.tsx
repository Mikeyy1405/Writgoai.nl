'use client';

import { useState } from 'react';
import { QueueItem as QueueItemType, QueueFilters, QueueSortBy, SortDirection } from '@/lib/types/distribution';
import { QueueItem } from './QueueItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface ContentQueueProps {
  items: QueueItemType[];
  loading?: boolean;
  onEdit?: (item: QueueItemType) => void;
  onReschedule?: (item: QueueItemType) => void;
  onDelete?: (item: QueueItemType) => void;
  onPublishNow?: (item: QueueItemType) => void;
  onFilterChange?: (filters: QueueFilters) => void;
  onSortChange?: (sortBy: QueueSortBy, direction: SortDirection) => void;
}

export function ContentQueue({
  items,
  loading,
  onEdit,
  onReschedule,
  onDelete,
  onPublishNow,
  onFilterChange,
  onSortChange,
}: ContentQueueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<QueueSortBy>('scheduled_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    if (onFilterChange) {
      onFilterChange({
        status: value === 'all' ? undefined : value as any,
      });
    }
  };

  const handleSortChange = (value: QueueSortBy) => {
    setSortBy(value);
    if (onSortChange) {
      onSortChange(value, sortDirection);
    }
  };

  const toggleSortDirection = () => {
    const newDirection: SortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    if (onSortChange) {
      onSortChange(sortBy, newDirection);
    }
  };

  // Filter items by search query
  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.content.title.toLowerCase().includes(query) ||
      item.client.name.toLowerCase().includes(query) ||
      item.client.company.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Zoek op titel, klant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
          />
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="pending">In behandeling</SelectItem>
              <SelectItem value="scheduled">Gepland</SelectItem>
              <SelectItem value="publishing">Publiceren</SelectItem>
              <SelectItem value="published">Gepubliceerd</SelectItem>
              <SelectItem value="failed">Mislukt</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => handleSortChange(value as QueueSortBy)}>
            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder="Sorteer op" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="scheduled_at">Geplande datum</SelectItem>
              <SelectItem value="client">Klant</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortDirection}
            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
          >
            <ArrowUpDown className={`w-4 h-4 ${sortDirection === 'desc' ? 'rotate-180' : ''} transition-transform`} />
          </Button>
        </div>
      </div>

      {/* Queue Items */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4"></div>
          <p className="text-zinc-400">Wachtrij laden...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-400">Geen items in de wachtrij</p>
          {searchQuery && (
            <p className="text-sm text-zinc-500 mt-2">
              Probeer een andere zoekterm
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => (
            <QueueItem
              key={item.id}
              item={item}
              onEdit={onEdit ? () => onEdit(item) : undefined}
              onReschedule={onReschedule ? () => onReschedule(item) : undefined}
              onDelete={onDelete ? () => onDelete(item) : undefined}
              onPublishNow={onPublishNow ? () => onPublishNow(item) : undefined}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {!loading && filteredItems.length > 0 && (
        <div className="text-sm text-zinc-500 text-center">
          {filteredItems.length} van {items.length} items
        </div>
      )}
    </div>
  );
}
