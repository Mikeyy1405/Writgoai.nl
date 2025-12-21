'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

interface QueueItem {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  featured_image: string;
  status: string;
  scheduled_for: string;
  created_at: string;
  metadata: any;
}

export default function ContentQueuePage() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    try {
      // supabase is already imported
      const { data, error } = await supabase
        .from('writgo_content_queue')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQueueItems(data || []);
    } catch (error) {
      console.error('Error loading queue:', error);
    } finally {
      setLoading(false);
    }
  }

  async function publishArticle(item: QueueItem) {
    setPublishing(item.id);
    try {
      const response = await fetch('/api/writgo/publish-from-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId: item.id })
      });

      if (!response.ok) throw new Error('Publish failed');

      alert('✅ Artikel gepubliceerd!');
      loadQueue(); // Reload
    } catch (error) {
      console.error('Publish error:', error);
      alert('❌ Publiceren mislukt');
    } finally {
      setPublishing(null);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Weet je zeker dat je dit artikel wilt verwijderen?')) return;

    try {
      // supabase is already imported
      await supabase.from('writgo_content_queue').delete().eq('id', id);
      loadQueue();
    } catch (error) {
      console.error('Delete error:', error);
    }
  }

  const statusColors: Record<string, string> = {
    queued: 'bg-yellow-500',
    generating: 'bg-blue-500',
    scheduled: 'bg-green-500',
    completed: 'bg-green-600',
    failed: 'bg-red-500',
  };

  const statusLabels: Record<string, string> = {
    queued: 'In wachtrij',
    generating: 'Genereren...',
    scheduled: 'Gepland',
    completed: 'Klaar',
    failed: 'Mislukt',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Content Queue</h1>
          <p>Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Content Queue</h1>
          <button
            onClick={loadQueue}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄 Ververs
          </button>
        </div>

        {queueItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Geen artikelen in de queue</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queueItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-white text-sm ${
                          statusColors[item.status] || 'bg-gray-500'
                        }`}
                      >
                        {statusLabels[item.status] || item.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleString('nl-NL')}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold mb-2">{item.title}</h2>
                    <p className="text-gray-600 mb-4">{item.excerpt}</p>
                    
                    {item.featured_image && (
                      <img
                        src={item.featured_image}
                        alt={item.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}

                    <div className="flex gap-2 text-sm text-gray-500">
                      <span>📅 Gepland: {new Date(item.scheduled_for).toLocaleDateString('nl-NL')}</span>
                      {item.metadata?.word_count && (
                        <span>📝 {item.metadata.word_count} woorden</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {(item.status === 'scheduled' || item.status === 'completed') && (
                    <button
                      onClick={() => publishArticle(item)}
                      disabled={publishing === item.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {publishing === item.id ? '⏳ Publiceren...' : '🚀 Publiceer Nu'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    🗑️ Verwijder
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
