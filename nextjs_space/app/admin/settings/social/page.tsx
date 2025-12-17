'use client';

import { useState, useEffect } from 'react';
import { Share2, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

export default function SocialMediaSettingsPage() {
  const [lateDevApiKey, setLateDevApiKey] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/social');
      if (response.ok) {
        const data = await response.json();
        if (data.lateDevApiKey) {
          setLateDevApiKey(data.lateDevApiKey);
          setConnected(data.connected || false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!lateDevApiKey.trim()) {
      setError('Voer een geldige API key in');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/settings/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lateDevApiKey: lateDevApiKey.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setConnected(true);
        setSuccess('Social media succesvol gekoppeld!');
      } else {
        setError(data.error || 'Koppelen mislukt');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setError('Er is een fout opgetreden bij het koppelen');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Weet je zeker dat je de social media koppeling wilt verwijderen?')) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/settings/social', {
        method: 'DELETE'
      });

      if (response.ok) {
        setLateDevApiKey('');
        setConnected(false);
        setSuccess('Social media koppeling verwijderd');
      } else {
        const data = await response.json();
        setError(data.error || 'Verwijderen mislukt');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      setError('Er is een fout opgetreden bij het verwijderen');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-800 p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center">
              <Share2 className="w-6 h-6 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-300">Social Media Koppelen</h1>
          </div>
          <p className="text-gray-600 ml-15">
            Koppel je social media accounts via Late.dev om automatisch content te kunnen plaatsen
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-700 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {connected ? (
                <>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-300">Gekoppeld</h3>
                    <p className="text-sm text-gray-600">Social media is actief</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-slate-800/50 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-300">Niet gekoppeld</h3>
                    <p className="text-sm text-gray-600">Voeg je API key toe om te koppelen</p>
                  </div>
                </>
              )}
            </div>
            {connected && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Actief
              </span>
            )}
          </div>
        </div>

        {/* Configuration Card */}
        <div className="bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-300 mb-4">Late.dev Configuratie</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Late.dev API Key
              </label>
              <input
                type="password"
                value={lateDevApiKey}
                onChange={(e) => setLateDevApiKey(e.target.value)}
                placeholder="Voer je Late.dev API key in"
                className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={saving}
              />
              <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                <span>Krijg je API key van</span>
                <a 
                  href="https://late.dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 font-medium"
                >
                  late.dev
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            {/* Alert Messages */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Fout</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Succes</h4>
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {!connected ? (
                <button
                  onClick={handleConnect}
                  disabled={!lateDevApiKey || saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Koppelen...
                    </>
                  ) : (
                    'Koppelen'
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleConnect}
                    disabled={!lateDevApiKey || saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Bijwerken...
                      </>
                    ) : (
                      'API Key Bijwerken'
                    )}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={saving}
                    className="px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Ontkoppelen
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Hoe werkt het?
          </h4>
          <ul className="space-y-2 text-sm text-blue-600">
            <li className="flex gap-2">
              <span className="font-bold">1.</span>
              <span>Maak een account aan op <a href="https://late.dev" target="_blank" rel="noopener noreferrer" className="underline">late.dev</a></span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">2.</span>
              <span>Genereer een API key in je Late.dev dashboard</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">3.</span>
              <span>Koppel je social media accounts (LinkedIn, Twitter, etc.) aan Late.dev</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">4.</span>
              <span>Voer de API key hierboven in en klik op "Koppelen"</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">5.</span>
              <span>Je kunt nu automatisch posts plaatsen via WritGo!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
