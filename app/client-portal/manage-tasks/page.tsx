'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ManageTasksPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email !== 'info@WritgoAI.nl') {
      router.push('/client-portal');
      return;
    }
    fetchTasks();
  }, [session]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/task-requests');
      const data = await res.json();
      if (data.success) {
        setTasks(data.taskRequests);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/task-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) throw new Error('Failed');

      toast.success('Status bijgewerkt!');
      fetchTasks();
    } catch (error) {
      toast.error('Kon status niet bijwerken');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br bg-[#ff6b35] rounded-xl">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Opdrachten Beheer</h1>
          <p className="text-muted-foreground">Beheer alle klant opdrachten</p>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <Card key={task.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{task.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {task.client?.name} ({task.client?.email})
                </p>
              </div>
              <Badge>{task.status}</Badge>
            </div>

            <p className="text-sm mb-4">{task.description}</p>

            <div className="flex gap-2">
              <Button size="sm" onClick={() => updateStatus(task.id, 'approved')}>Goedkeuren</Button>
              <Button size="sm" variant="outline" onClick={() => updateStatus(task.id, 'in_progress')}>In Uitvoering</Button>
              <Button size="sm" variant="outline" onClick={() => updateStatus(task.id, 'completed')}>Voltooid</Button>
              <Button size="sm" variant="destructive" onClick={() => updateStatus(task.id, 'cancelled')}>Annuleren</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
