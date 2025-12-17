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

// Create Map Wizard Component - AUTOMATIC VERSION
function CreateMapWizard({ projectId, onClose, onSuccess }: {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/client/topical-authority/generate-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          // Automatische instellingen - geen handmatige invoer nodig
          autoAnalyze: true, // Automatisch website analyseren
          targetArticles: 450, // Default 450 artikelen
          useDataForSEO: true, // Altijd DataForSEO gebruiken
          analyzeExistingContent: true, // Altijd bestaande content analyseren
          location: 'Netherlands',
          language: 'nl',
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Topical Authority Map gegenereerd!\n\nTotaal artikelen: ${data.data.totalArticles}\nGeschat tijdsbestek: ${data.data.estimatedTimeToComplete}`);
        onSuccess();
      } else {
        setError(data.details || data.error || 'Onbekende fout');
      }
    } catch (error: any) {
      setError(error.message || 'Fout bij genereren map');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Automatische Topical Authority Map</h2>
          <p className="text-slate-200 mt-1">Genereer automatisch 400-500 gestructureerde artikelen voor je WordPress site</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <span className="text-lg">ℹ️</span>
              Automatische Analyse & Generatie
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-slate-200 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Website wordt automatisch geanalyseerd</span>
              </li>
              <li className="flex items-start gap-2 text-slate-200 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Niche wordt automatisch gedetecteerd</span>
              </li>
              <li className="flex items-start gap-2 text-slate-200 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>400-500 artikelen worden gepland op basis van content gaps</span>
              </li>
              <li className="flex items-start gap-2 text-slate-200 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>DataForSEO keyword metrics worden toegevoegd</span>
              </li>
              <li className="flex items-start gap-2 text-slate-200 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Bestaande content wordt geanalyseerd voor internal links</span>
              </li>
            </ul>
          </div>

          {/* Expected Results */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <h3 className="text-orange-400 font-medium mb-2 text-sm">Wat je krijgt:</h3>
            <ul className="space-y-1 text-slate-200 text-sm">
              <li>• 5-10 Pillar Topics (hoofdonderwerpen)</li>
              <li>• 40-50 Subtopics per pillar</li>
              <li>• 8-10 Artikelen per subtopic</li>
              <li>• Totaal: ~450 gestructureerde artikelen</li>
              <li>• Geschatte tijd: 12-15 maanden (1 artikel/dag)</li>
            </ul>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm font-medium mb-1">❌ Fout bij genereren:</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              disabled={loading}
            >
              Annuleren
            </button>
            <button
              onClick={handleGenerate}
              className="px-8 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Bezig met analyseren en genereren...
                </>
              ) : (
                <>
                  <span className="text-lg">🚀</span>
                  Analyseer & Genereer Map
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
