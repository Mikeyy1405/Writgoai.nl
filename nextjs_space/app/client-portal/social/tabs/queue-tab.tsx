'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Rocket, Loader2, Calendar, Shuffle } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface QueueTabProps {
  projectId: string;
  refreshTrigger: number;
}

interface Post {
  id: string;
  content: string;
  platform: string;
  scheduledFor: string;
}

export default function QueueTab({ projectId, refreshTrigger }: QueueTabProps) {
  const [queue, setQueue] = useState<Post[]>([]);
  const [queueByDay, setQueueByDay] = useState<Record<string, Post[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, [projectId, refreshTrigger]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/social/queue?projectId=${projectId}`);

      if (!response.ok) {
        throw new Error('Failed to load queue');
      }

      const data = await response.json();
      setQueue(data.queue || []);
      setQueueByDay(data.queueByDay || {});
    } catch (error: any) {
      console.error('Error loading queue:', error);
      toast.error('Kon wachtrij niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleShuffle = () => {
    toast.info('Shuffle functie komt binnenkort');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              🚀 Wachtrij
            </CardTitle>
            <CardDescription>
              Geplande posts ({queue.length})
            </CardDescription>
          </div>

          <Button variant="outline" size="sm" onClick={handleShuffle}>
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {queue.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Geen geplande posts
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(queueByDay).map(([day, posts]) => (
              <div key={day}>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(day), 'EEEE d MMMM yyyy', { locale: nl })}
                </h3>

                <div className="space-y-2">
                  {posts.map((post) => (
                    <Card key={post.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{post.platform}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(post.scheduledFor), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2">{post.content}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
