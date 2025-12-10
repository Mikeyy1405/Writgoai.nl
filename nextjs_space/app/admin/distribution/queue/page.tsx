'use client';

import { useEffect, useState } from 'react';
import { QueueResponse, QueueItem, QueueFilters, QueueSortBy, SortDirection } from '@/lib/types/distribution';
import { ContentQueue } from '@/components/admin/distribution/ContentQueue';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function QueuePage() {
  const router = useRouter();
  const [queueData, setQueueData] = useState<QueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<QueueFilters>({});
  const [sortBy, setSortBy] = useState<QueueSortBy>('scheduled_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<QueueItem | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.client_id) params.append('client_id', filters.client_id);
      if (filters.platform) params.append('platform', filters.platform);
      params.append('sort_by', sortBy);
      params.append('sort_direction', sortDirection);

      const response = await fetch(`/api/admin/distribution/queue?${params}`);
      
      if (!response.ok) {
        throw new Error('Fout bij het ophalen van wachtrij');
      }

      const data = await response.json();
      setQueueData(data);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
      toast.error('Kon wachtrij niet laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [filters, sortBy, sortDirection]);

  const handleEdit = (item: QueueItem) => {
    // TODO: Implement edit dialog
    toast.info('Bewerken functie komt binnenkort');
  };

  const handleReschedule = (item: QueueItem) => {
    // TODO: Implement reschedule dialog
    toast.info('Herplannen functie komt binnenkort');
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/admin/distribution/queue?id=${itemToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Fout bij het verwijderen');
      }

      toast.success('Item verwijderd uit wachtrij');
      fetchQueue();
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Kon item niet verwijderen');
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handlePublishNow = async (item: QueueItem) => {
    try {
      const response = await fetch('/api/admin/distribution/getlatedev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: item.task.id }),
      });

      if (!response.ok) {
        throw new Error('Fout bij het publiceren');
      }

      toast.success('Post wordt nu gepubliceerd!');
      fetchQueue();
    } catch (error) {
      console.error('Failed to publish:', error);
      toast.error('Kon post niet publiceren');
    }
  };

  const confirmDelete = (item: QueueItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/admin/distribution')}
              className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Content Wachtrij</h1>
              <p className="text-zinc-400">
                {queueData?.total || 0} items in wachtrij
              </p>
            </div>
          </div>
          <Button
            onClick={fetchQueue}
            variant="outline"
            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Ververs
          </Button>
        </div>

        {/* Queue */}
        <ContentQueue
          items={queueData?.items || []}
          loading={loading}
          onEdit={handleEdit}
          onReschedule={handleReschedule}
          onDelete={confirmDelete}
          onPublishNow={handlePublishNow}
          onFilterChange={setFilters}
          onSortChange={(sortBy, direction) => {
            setSortBy(sortBy);
            setSortDirection(direction);
          }}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Weet je het zeker?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Deze actie kan niet ongedaan worden gemaakt. Dit zal het item permanent verwijderen uit de wachtrij.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Annuleer
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Verwijder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
