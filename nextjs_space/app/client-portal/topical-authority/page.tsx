/**
 * Topical Authority Dashboard
 * Main page for managing topical authority maps
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Plus, Map, Target, TrendingUp, Calendar } from 'lucide-react';

export default function TopicalAuthorityDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [loading, setLoading] = useState(true);
  const [maps, setMaps] = useState<any[]>([]);
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadMaps();
    }
  }, [projectId]);

  const loadMaps = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/topical-authority/maps?projectId=${projectId}`);
      const data = await response.json();
      
      if (data.success) {
        setMaps(data.data);
      }
    } catch (error) {
      console.error('Failed to load maps:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!projectId) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Selecteer een Project</h1>
          <p className="text-gray-600">Selecteer een project om je topical authority maps te beheren.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Topical Authority</h1>
            <p className="text-gray-600">Bouw complete topical authority met 400-500 gestructureerde artikelen</p>
          </div>
          <button
            onClick={() => setShowCreateWizard(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-5 h-5" />
            Nieuwe Map
          </button>
        </div>

        {/* Create Wizard Modal */}
        {showCreateWizard && (
          <CreateMapWizard
            projectId={projectId}
            onClose={() => setShowCreateWizard(false)}
            onSuccess={() => {
              setShowCreateWizard(false);
              loadMaps();
            }}
          />
        )}

        {/* Maps Grid */}
        {maps.length === 0 ? (
          <div className="text-center py-16">
            <Map className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Geen Topical Authority Maps</h2>
            <p className="text-gray-600 mb-6">Creëer je eerste topical authority map om te beginnen met professionele content planning.</p>
            <button
              onClick={() => setShowCreateWizard(true)}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Creëer Eerste Map
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {maps.map((map: any) => (
              <MapCard
                key={map.id}
                map={map}
                onClick={() => router.push(`/client-portal/topical-authority/${map.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Map Card Component
function MapCard({ map, onClick }: { map: any; onClick: () => void }) {
  const progress = Math.round((map.totalArticlesPublished / map.totalArticlesTarget) * 100);
  
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg mb-1">{map.niche}</h3>
          <p className="text-sm text-gray-600">{map.description}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          map.status === 'active' ? 'bg-green-100 text-green-700' :
          map.status === 'completed' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {map.status === 'active' ? 'Actief' : 
           map.status === 'completed' ? 'Voltooid' : 'Concept'}
        </div>
      </div>

      <div className="space-y-3">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Voortgang</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{map.totalArticlesTarget}</div>
            <div className="text-xs text-gray-600">Target</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{map.totalArticlesGenerated}</div>
            <div className="text-xs text-gray-600">Gegenereerd</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{map.totalArticlesPublished}</div>
            <div className="text-xs text-gray-600">Gepubliceerd</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Map Wizard Component
function CreateMapWizard({ projectId, onClose, onSuccess }: {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    niche: '',
    description: '',
    targetArticles: 450,
    location: 'Netherlands',
    language: 'nl',
    useDataForSEO: true,
    analyzeExistingContent: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/client/topical-authority/generate-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Topical Authority Map gegenereerd! \n\nTotaal artikelen: ${data.data.totalArticles}\nGeschat tijdsbestek: ${data.data.estimatedTimeToComplete}`);
        onSuccess();
      } else {
        alert('Fout bij genereren map: ' + (data.details || data.error));
      }
    } catch (error: any) {
      alert('Fout: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Nieuwe Topical Authority Map</h2>
          <p className="text-gray-600 mt-1">Genereer een complete content strategie met 400-500 artikelen</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Niche */}
          <div>
            <label className="block text-sm font-medium mb-2">Niche / Onderwerp *</label>
            <input
              type="text"
              value={formData.niche}
              onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              placeholder="b.v. WordPress SEO, E-commerce Marketing, Piano Leren"
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Beschrijving (optioneel)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Extra context over je niche en doelgroep"
              rows={3}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* Target Articles */}
          <div>
            <label className="block text-sm font-medium mb-2">Aantal Artikelen</label>
            <input
              type="number"
              value={formData.targetArticles}
              onChange={(e) => setFormData({ ...formData, targetArticles: parseInt(e.target.value) })}
              min={100}
              max={1000}
              step={50}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-sm text-gray-600 mt-1">Aanbevolen: 400-500 artikelen voor complete topical authority</p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.useDataForSEO}
                onChange={(e) => setFormData({ ...formData, useDataForSEO: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Gebruik DataForSEO voor keyword metrics</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.analyzeExistingContent}
                onChange={(e) => setFormData({ ...formData, analyzeExistingContent: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Analyseer bestaande WordPress content</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              disabled={loading}
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Genereren...' : 'Genereer Map'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
