'use client';

import { useEffect, useState } from 'react';
import { QueueResponse, QueueItem } from '@/lib/types/distribution';
import { SchedulingCalendar } from '@/components/admin/distribution/SchedulingCalendar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CalendarPage() {
  const router = useRouter();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduledItems = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/distribution/queue?per_page=100');
      
      if (!response.ok) {
        throw new Error('Fout bij het ophalen van geplande items');
      }

      const data: QueueResponse = await response.json();
      setItems(data.items);
    } catch (error) {
      console.error('Failed to fetch scheduled items:', error);
      toast.error('Kon geplande items niet laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledItems();
  }, []);

  const handleDateSelect = (date: Date) => {
    // TODO: Implement new post creation for selected date
    toast.info('Nieuwe post plannen komt binnenkort');
  };

  const handleItemClick = (item: QueueItem) => {
    // TODO: Implement item details/edit
    toast.info(`Item: ${item.content.title}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4"></div>
            <p className="text-zinc-400">Kalender laden...</p>
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-white mb-2">Planningskalender</h1>
              <p className="text-zinc-400">
                {items.length} posts gepland
              </p>
            </div>
          </div>
          <Button
            onClick={fetchScheduledItems}
            variant="outline"
            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Ververs
          </Button>
        </div>

        {/* Calendar */}
        <SchedulingCalendar
          items={items}
          onDateSelect={handleDateSelect}
          onItemClick={handleItemClick}
        />
      </div>
    </div>
  );
}
