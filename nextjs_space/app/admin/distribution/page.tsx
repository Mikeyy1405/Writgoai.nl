'use client';

import { useEffect, useState } from 'react';
import { DistributionOverview } from '@/lib/types/distribution';
import { DistributionDashboard } from '@/components/admin/distribution/DistributionDashboard';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function DistributionPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<DistributionOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/distribution');
      
      if (!response.ok) {
        throw new Error('Fout bij het ophalen van distributie gegevens');
      }

      const data = await response.json();
      setOverview(data);
    } catch (error) {
      console.error('Failed to fetch distribution overview:', error);
      toast.error('Kon distributie gegevens niet laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleTestPlatform = async (platform: string) => {
    try {
      const response = await fetch('/api/admin/distribution/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });

      if (!response.ok) {
        throw new Error('Test mislukt');
      }

      const result = await response.json();
      
      if (result.connected) {
        toast.success(`${platform} verbinding succesvol getest!`);
      } else {
        toast.error(`${platform} verbinding mislukt`);
      }
    } catch (error) {
      console.error('Failed to test platform:', error);
      toast.error('Kon platform niet testen');
    }
  };

  const handleConfigurePlatform = (platform: string) => {
    router.push(`/admin/distribution/platforms?platform=${platform}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4"></div>
            <p className="text-zinc-400">Distributie centrum laden...</p>
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
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Distributie Centrum</h1>
            <p className="text-zinc-400">
              Beheer multi-platform content distributie
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchOverview}
              variant="outline"
              className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Ververs
            </Button>
            <Button
              onClick={() => router.push('/admin/distribution/queue')}
              className="bg-[#FF6B35] hover:bg-[#FF8555] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Distributie
            </Button>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid gap-4 md:grid-cols-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/distribution/queue')}
            className="h-auto p-4 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-left flex-col items-start"
          >
            <span className="text-white font-semibold">Wachtrij</span>
            <span className="text-sm text-zinc-400">Beheer geplande content</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/distribution/calendar')}
            className="h-auto p-4 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-left flex-col items-start"
          >
            <span className="text-white font-semibold">Kalender</span>
            <span className="text-sm text-zinc-400">Plan nieuwe posts</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/distribution/platforms')}
            className="h-auto p-4 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-left flex-col items-start"
          >
            <span className="text-white font-semibold">Platforms</span>
            <span className="text-sm text-zinc-400">Beheer verbindingen</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/distribution/analytics')}
            className="h-auto p-4 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-left flex-col items-start"
          >
            <span className="text-white font-semibold">Analytics</span>
            <span className="text-sm text-zinc-400">Bekijk prestaties</span>
          </Button>
        </div>

        {/* Dashboard */}
        {overview && (
          <DistributionDashboard
            overview={overview}
            onTestPlatform={handleTestPlatform}
            onConfigurePlatform={handleConfigurePlatform}
          />
        )}
      </div>
    </div>
  );
}
