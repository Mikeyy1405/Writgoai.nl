'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SetupFormData {
  name: string;
  siteUrl: string;
  username: string;
  applicationPassword: string;
  postingFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  language: 'nl' | 'en' | 'de' | 'fr' | 'es';
}

export default function WordPressAutopilotSetup() {
  const router = useRouter();
  const [formData, setFormData] = useState<SetupFormData>({
    name: '',
    siteUrl: '',
    username: '',
    applicationPassword: '',
    postingFrequency: 'weekly',
    language: 'nl',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'verifying' | 'generating' | 'complete'>('form');
  const [strategy, setStrategy] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setStep('verifying');

    try {
      const response = await fetch('/api/admin/wordpress-autopilot/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      setStrategy(data);
      setStep('complete');
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/admin/wordpress-autopilot/dashboard');
      }, 3000);
      
    } catch (err: any) {
      setError(err.message);
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ⚡ WordPress Content Autopilot
          </h1>
          <p className="text-lg text-gray-600">
            Automatische content generatie met topical authority AI
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[
              { id: 'form', label: 'Site Toevoegen', icon: '📝' },
              { id: 'verifying', label: 'Verbinding Testen', icon: '🔌' },
              { id: 'generating', label: 'Strategie Genereren', icon: '🧠' },
              { id: 'complete', label: 'Voltooid', icon: '✅' },
            ].map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`flex flex-col items-center ${
                    step === s.id
                      ? 'opacity-100'
                      : step > s.id
                      ? 'opacity-100'
                      : 'opacity-40'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      step === s.id
                        ? 'bg-blue-600 text-white animate-pulse'
                        : step > s.id
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    {s.icon}
                  </div>
                  <span className="text-xs mt-1 text-gray-600">{s.label}</span>
                </div>
                {idx < 3 && (
                  <div className="w-16 h-1 bg-gray-300 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        {step === 'form' && (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              WordPress Site Toevoegen
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <strong>Error:</strong> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Site Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Naam *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Bijv: Mijn Lifestyle Blog"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Site URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WordPress URL *
                </label>
                <input
                  type="url"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://jouwsite.nl"
                  value={formData.siteUrl}
                  onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WordPress Username *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              {/* Application Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Password *
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={formData.applicationPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, applicationPassword: e.target.value })
                  }
                />
                <p className="mt-1 text-sm text-gray-500">
                  <a
                    href="https://wordpress.org/support/article/application-passwords/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Hoe maak ik een application password?
                  </a>
                </p>
              </div>

              {/* Posting Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Posting Frequentie
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.postingFrequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      postingFrequency: e.target.value as any,
                    })
                  }
                >
                  <option value="daily">Dagelijks</option>
                  <option value="weekly">Wekelijks</option>
                  <option value="biweekly">Tweewekelijks</option>
                  <option value="monthly">Maandelijks</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taal
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value as any })
                  }
                >
                  <option value="nl">Nederlands</option>
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Bezig...' : '🚀 Start Autopilot'}
              </button>
            </form>
          </div>
        )}

        {/* Processing Steps */}
        {(step === 'verifying' || step === 'generating') && (
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {step === 'verifying' ? 'Verbinding Testen...' : 'Strategie Genereren...'}
            </h2>
            <p className="text-gray-600">
              {step === 'verifying'
                ? 'We controleren de WordPress verbinding'
                : 'AI analyseert je site en genereert een topical authority strategie'}
            </p>
          </div>
        )}

        {/* Complete */}
        {step === 'complete' && strategy && (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Autopilot Actief!</h2>
              <p className="text-gray-600">Je WordPress Content Autopilot is succesvol geconfigureerd</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-gray-900">📊 Content Strategie</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Niche</div>
                  <div className="font-semibold text-gray-900">
                    {strategy.strategy?.niche || 'Gedetecteerd'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Main Topics</div>
                  <div className="font-semibold text-gray-900">
                    {strategy.strategy?.mainTopics?.length || 0} topics
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Content Items</div>
                  <div className="font-semibold text-gray-900">
                    {strategy.calendar?.totalItems || 0} gepland
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Eerste Post</div>
                  <div className="font-semibold text-gray-900">
                    {strategy.calendar?.nextPostDate
                      ? new Date(strategy.calendar.nextPostDate).toLocaleDateString('nl-NL')
                      : 'Binnenkort'}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-gray-600">
              <p>Je wordt doorgestuurd naar het dashboard...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
