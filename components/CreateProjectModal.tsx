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
      setError('Vul eerst alle WordPress velden in om te testen');
      return;
    }

    setTesting(true);
    setError('');
    setSuccess('');
    setWarning('');

    try {
      // Build the WordPress API URL
      let wpUrl = formData.website_url.trim();
      if (wpUrl.endsWith('/')) wpUrl = wpUrl.slice(0, -1);
      wpUrl = wpUrl.replace(/\/wp-json.*$/, '');
      const apiUrl = `${wpUrl}/wp-json/wp/v2/posts?per_page=1`;

      // Clean the password (remove spaces from Application Password)
      const cleanPassword = formData.wp_password.replace(/\s+/g, '');
      const authHeader = 'Basic ' + btoa(`${formData.wp_username}:${cleanPassword}`);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': authHeader,
        },
      });

      if (response.ok) {
        setSuccess('✅ WordPress verbinding succesvol! Je kunt het project aanmaken.');
      } else if (response.status === 401) {
        setError('Authenticatie mislukt. Controleer je gebruikersnaam en applicatiewachtwoord.');
      } else if (response.status === 403) {
        setError('Toegang geweigerd. Controleer de gebruikersrechten.');
      } else if (response.status === 404) {
        setError('WordPress REST API niet gevonden. Is dit een WordPress website?');
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
              <span>WordPress Credentials (Optioneel)</span>
            </button>
            <p className="text-sm text-gray-400 mb-4">
              Alleen nodig als je wilt publiceren naar een externe WordPress site
            </p>
          </div>

          {showWordPress && (
            <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded text-blue-300 text-sm">
                <strong>💡 Hoe maak je een Application Password?</strong>
                <ol className="mt-2 ml-4 list-decimal space-y-1 text-blue-200">
                  <li>Ga naar je WordPress admin → Gebruikers → Profiel</li>
                  <li>Scroll naar &quot;Application Passwords&quot;</li>
                  <li>Voer een naam in (bijv. &quot;WritGo&quot;) en klik &quot;Nieuw wachtwoord toevoegen&quot;</li>
                  <li>Kopieer het wachtwoord (met of zonder spaties)</li>
                </ol>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  WordPress Username
                </label>
                <input
                  type="text"
                  value={formData.wp_username}
                  onChange={(e) => setFormData({ ...formData, wp_username: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="admin"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Je WordPress gebruikersnaam (niet je e-mail)
                </p>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  WordPress Application Password
                </label>
                <input
                  type="text"
                  value={formData.wp_password}
                  onChange={(e) => setFormData({ ...formData, wp_password: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                  placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Het Application Password (spaties worden automatisch verwijderd)
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
