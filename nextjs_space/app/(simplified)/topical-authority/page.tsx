/**
 * Topical Authority Dashboard
 * Main page for managing topical authority maps
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Map, Globe } from 'lucide-react';

export default function TopicalAuthorityDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [maps, setMaps] = useState<any[]>([]);
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadMaps();
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/simplified/projects');
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setProjects(data.data);
        // Auto-select first project
        setSelectedProjectId(data.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMaps = async () => {
    try {
      const response = await fetch(`/api/client/topical-authority/maps?projectId=${selectedProjectId}`);
      const data = await response.json();
      
      if (data.success) {
        setMaps(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load maps:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <Globe className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-white">Geen WordPress Sites</h1>
          <p className="text-slate-200 mb-6">Voeg eerst een WordPress site toe op het Dashboard om te beginnen met content planning.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Naar Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-white">Topical Authority</h1>
              <p className="text-slate-200">Bouw complete topical authority met 400-500 gestructureerde artikelen</p>
            </div>
            <button
              onClick={() => setShowCreateWizard(true)}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Plus className="w-5 h-5" />
              Nieuwe Map
            </button>
          </div>

          {/* Project Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-white">WordPress Site:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Create Wizard Modal */}
        {showCreateWizard && (
          <CreateMapWizard
            projectId={selectedProjectId}
            onClose={() => setShowCreateWizard(false)}
            onSuccess={() => {
              setShowCreateWizard(false);
              loadMaps();
            }}
          />
        )}

        {/* Maps Grid */}
        {maps.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700">
            <Map className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">Geen Topical Authority Maps</h2>
            <p className="text-slate-200 mb-6">Creëer je eerste topical authority map om te beginnen met professionele content planning.</p>
            <button
              onClick={() => setShowCreateWizard(true)}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
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
                onClick={() => router.push(`/topical-authority/${map.id}`)}
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
      className="bg-slate-800 rounded-xl border-2 border-slate-700 p-6 hover:border-orange-500 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg mb-1 text-white">{map.niche}</h3>
          <p className="text-sm text-slate-200">{map.description}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          map.status === 'active' ? 'bg-green-500/20 text-green-400' :
          map.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
          'bg-slate-700 text-slate-300'
        }`}>
          {map.status === 'active' ? 'Actief' : 
           map.status === 'completed' ? 'Voltooid' : 'Concept'}
        </div>
      </div>

      <div className="space-y-3">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-200">Voortgang</span>
            <span className="font-medium text-white">{progress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{map.totalArticlesTarget}</div>
            <div className="text-xs text-slate-200">Target</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{map.totalArticlesGenerated}</div>
            <div className="text-xs text-slate-200">Gegenereerd</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{map.totalArticlesPublished}</div>
            <div className="text-xs text-slate-200">Gepubliceerd</div>
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Nieuwe Topical Authority Map</h2>
          <p className="text-slate-200 mt-1">Genereer een complete content strategie met 400-500 artikelen</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Niche */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Niche / Onderwerp *</label>
            <input
              type="text"
              value={formData.niche}
              onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              placeholder="b.v. WordPress SEO, E-commerce Marketing, Piano Leren"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Beschrijving (optioneel)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Extra context over je niche en doelgroep"
              rows={3}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Target Articles */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Aantal Artikelen</label>
            <input
              type="number"
              value={formData.targetArticles}
              onChange={(e) => setFormData({ ...formData, targetArticles: parseInt(e.target.value) })}
              min={100}
              max={1000}
              step={50}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-sm text-slate-200 mt-1">Aanbevolen: 400-500 artikelen voor complete topical authority</p>
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
              <span className="text-sm text-white">Gebruik DataForSEO voor keyword metrics</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.analyzeExistingContent}
                onChange={(e) => setFormData({ ...formData, analyzeExistingContent: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-white">Analyseer bestaande WordPress content</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-slate-200 hover:bg-slate-800 rounded-lg"
              disabled={loading}
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
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
