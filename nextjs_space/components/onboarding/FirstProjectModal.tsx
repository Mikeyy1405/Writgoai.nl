'use client';

import { useState } from 'react';
import { Globe, Sparkles, CheckCircle2 } from 'lucide-react';
import { useProject } from '@/lib/contexts/ProjectContext';

export default function FirstProjectModal() {
  const { addProject, projects, loading } = useProject();
  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Only show if no projects exist and not loading
  const shouldShow = !loading && projects.length === 0;

  if (!shouldShow) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const result = await addProject({
        ...formData,
        status: 'active'
      });

      if (!result) {
        throw new Error('Failed to create project');
      }

      // Modal will automatically close when projects.length > 0
    } catch (err: any) {
      setError(err.message || 'Er ging iets mis bij het aanmaken van je project');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-2xl w-full mx-4 shadow-2xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1">Welkom bij WritGo.nl!</h2>
              <p className="text-white text-opacity-90">
                Laten we beginnen met je eerste project
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Info Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <Globe className="w-6 h-6 text-blue-400 mb-2" />
              <h3 className="text-sm font-semibold text-white mb-1">Multi-website beheer</h3>
              <p className="text-xs text-gray-400">Beheer meerdere websites vanuit één account</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <Sparkles className="w-6 h-6 text-purple-400 mb-2" />
              <h3 className="text-sm font-semibold text-white mb-1">AI content generatie</h3>
              <p className="text-xs text-gray-400">Automatisch blogs en social media content</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <CheckCircle2 className="w-6 h-6 text-green-400 mb-2" />
              <h3 className="text-sm font-semibold text-white mb-1">SEO geoptimaliseerd</h3>
              <p className="text-xs text-gray-400">Content afgestemd op zoekmachines</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Website Naam *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="bijv. Mijn Bedrijfsnaam"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-500"
                required
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                De naam van je website of bedrijf
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Website URL *
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
                placeholder="https://jouwwebsite.nl"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-500"
                required
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Het volledige adres van je website (inclusief https://)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Korte Beschrijving (optioneel)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="bijv. Marketing en content voor lokale dienstverlening"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-500"
                rows={3}
                disabled={submitting}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-900 bg-opacity-30 text-red-300 rounded-lg text-sm border border-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Project aanmaken...
                </span>
              ) : (
                'Start met WritGo.nl'
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-900 bg-opacity-20 rounded-lg border border-blue-800">
            <p className="text-sm text-blue-300 flex items-start gap-2">
              <span className="text-lg">💡</span>
              <span>
                <strong>Tip:</strong> Je kunt later nog meer websites toevoegen. Begin met je belangrijkste website om vertrouwd te raken met het platform.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
