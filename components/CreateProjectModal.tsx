'use client';

import { useState } from 'react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warning, setWarning] = useState('');
  const [showWordPress, setShowWordPress] = useState(false);
  const [skipWpTest, setSkipWpTest] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    wp_username: '',
    wp_password: '',
  });

  const testWordPressConnection = async () => {
    if (!formData.website_url || !formData.wp_username || !formData.wp_password) {
      setError('Vul eerst de WordPress URL, gebruikersnaam en applicatiewachtwoord in om te testen');
      return;
    }

    setTesting(true);
    setError('');
    setSuccess('');
    setWarning('');

    try {
      // Test via standard WordPress REST API
      let baseUrl = formData.website_url.trim();
      if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
      baseUrl = baseUrl.replace(/\/wp-json.*$/, '');

      // Create Basic Auth credentials
      const credentials = btoa(`${formData.wp_username}:${formData.wp_password.replace(/\s/g, '')}`);
      const testUrl = `${baseUrl}/wp-json/wp/v2/users/me`;

      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setSuccess(`✅ WordPress verbinding succesvol! Ingelogd als: ${userData.name || formData.wp_username}`);
      } else if (response.status === 401) {
        setError('Gebruikersnaam of applicatiewachtwoord is ongeldig. Controleer je WordPress Application Password.');
      } else if (response.status === 404) {
        setError('WordPress REST API niet bereikbaar. Controleer de WordPress URL.');
      } else {
        setError(`WordPress gaf fout ${response.status}. Controleer de instellingen.`);
      }
    } catch (err: any) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setWarning('Kon geen verbinding maken vanuit de browser (CORS). De server zal de verbinding testen bij het aanmaken.');
      } else {
        setError(`Verbindingsfout: ${err.message}`);
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setWarning('');
    setLoading(true);

    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          skip_wp_test: skipWpTest,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      // Show warning if there was a WordPress issue but project was created
      if (data.wordpress_warning) {
        setWarning(data.wordpress_warning);
        // Still close and refresh after a short delay
        setTimeout(() => {
          onSuccess();
          onClose();
          setFormData({
            name: '',
            website_url: '',
            wp_username: '',
            wp_password: '',
          });
          setShowWordPress(false);
          setSkipWpTest(false);
          setWarning('');
        }, 2000);
      } else {
        onSuccess();
        onClose();
        setFormData({
          name: '',
          website_url: '',
          wp_username: '',
          wp_password: '',
        });
        setShowWordPress(false);
        setSkipWpTest(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Nieuw Project Toevoegen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {warning && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded text-yellow-400 text-sm">
            ⚠️ {warning}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded text-green-400 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Project Naam *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Mijn Blog"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Website URL *
            </label>
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              required
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="https://mijnblog.nl"
            />
          </div>

          <div className="border-t border-gray-800 pt-4">
            <button
              type="button"
              onClick={() => setShowWordPress(!showWordPress)}
              className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors mb-3"
            >
              <span>{showWordPress ? '▼' : '▶'}</span>
              <span>WordPress Verbinding (Optioneel)</span>
            </button>
            <p className="text-sm text-gray-400 mb-4">
              Verbind je WordPress site om automatisch artikelen te publiceren via Application Passwords
            </p>
          </div>

          {showWordPress && (
            <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded text-blue-300 text-sm">
                <strong>💡 Hoe maak je een Application Password aan?</strong>
                <ol className="mt-2 ml-4 list-decimal space-y-1 text-blue-200">
                  <li>Login in je WordPress admin panel</li>
                  <li>Ga naar Gebruikers → Profiel</li>
                  <li>Scroll naar de sectie "Application Passwords"</li>
                  <li>Voer een naam in (bijv. "WritGo") en klik op "Add New Application Password"</li>
                  <li>Kopieer het gegenereerde wachtwoord (spaties mogen blijven staan)</li>
                </ol>
                <p className="mt-2 text-blue-200">
                  <strong>⚠️ Vereist:</strong> WordPress 5.6+ en HTTPS (of localhost voor testen)
                </p>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  WordPress Gebruikersnaam
                </label>
                <input
                  type="text"
                  value={formData.wp_username}
                  onChange={(e) => setFormData({ ...formData, wp_username: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="admin"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Applicatiewachtwoord
                </label>
                <input
                  type="password"
                  value={formData.wp_password}
                  onChange={(e) => setFormData({ ...formData, wp_password: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                  placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Het Application Password dat je hebt aangemaakt in WordPress (spaties worden automatisch verwijderd)
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={testWordPressConnection}
                  disabled={testing || loading}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Testen...
                    </>
                  ) : (
                    <>
                      🔌 Test Verbinding
                    </>
                  )}
                </button>
              </div>

              {/* Skip test option for slow servers */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                <input
                  type="checkbox"
                  id="skipWpTest"
                  checked={skipWpTest}
                  onChange={(e) => setSkipWpTest(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="skipWpTest" className="text-sm text-gray-400">
                  Server test overslaan (voor trage servers)
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Als je server traag is en de test steeds faalt, vink dit aan. De credentials worden opgeslagen en je kunt later publiceren.
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-all"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Bezig...
                </>
              ) : (
                'Project Toevoegen'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
