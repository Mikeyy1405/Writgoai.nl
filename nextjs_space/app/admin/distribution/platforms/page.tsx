'use client';

import { useEffect, useState } from 'react';
import { PlatformConfig } from '@/lib/types/distribution';
import { PlatformGrid } from '@/components/admin/distribution/PlatformGrid';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function PlatformsPage() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/distribution/platforms');
      
      if (!response.ok) {
        throw new Error('Fout bij het ophalen van platforms');
      }

      const data = await response.json();
      setPlatforms(data);
    } catch (error) {
      console.error('Failed to fetch platforms:', error);
      toast.error('Kon platforms niet laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const handleTest = async (platform: PlatformConfig) => {
    try {
      const response = await fetch('/api/admin/distribution/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platform.platform }),
      });

      if (!response.ok) {
        throw new Error('Test mislukt');
      }

      const result = await response.json();
      
      if (result.connected) {
        toast.success(`${platform.display_name} verbinding succesvol getest!`);
      } else {
        toast.error(`${platform.display_name} verbinding mislukt`);
      }
    } catch (error) {
      console.error('Failed to test platform:', error);
      toast.error('Kon platform niet testen');
    }
  };

  const handleConfigure = (platform: PlatformConfig) => {
    // TODO: Implement platform configuration dialog
    toast(`${platform.display_name} configuratie komt binnenkort`);
  };

  const handleToggle = async (platform: PlatformConfig, enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/distribution/platforms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          platform: platform.platform,
          enabled 
        }),
      });

      if (!response.ok) {
        throw new Error('Bijwerken mislukt');
      }

      toast.success(`${platform.display_name} ${enabled ? 'ingeschakeld' : 'uitgeschakeld'}`);
      fetchPlatforms();
    } catch (error) {
      console.error('Failed to toggle platform:', error);
      toast.error('Kon platform niet bijwerken');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4"></div>
            <p className="text-zinc-400">Platforms laden...</p>
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
              <h1 className="text-3xl font-bold text-white mb-2">Platform Beheer</h1>
              <p className="text-zinc-400">
                Beheer verbindingen en instellingen voor alle platforms
              </p>
            </div>
          </div>
          <Button
            onClick={fetchPlatforms}
            variant="outline"
            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Ververs
          </Button>
        </div>

        {/* Platforms Grid */}
        <PlatformGrid
          platforms={platforms}
          onTest={handleTest}
          onConfigure={handleConfigure}
          onToggle={handleToggle}
        />
      </div>
    </div>
  );
}
