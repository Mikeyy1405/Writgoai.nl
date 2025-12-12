'use client';

import { useState, useEffect } from 'react';
import { Globe, Check, X, Loader2 } from 'lucide-react';

interface WordPressConnectionProps {
  clientId: string;
}

export default function WordPressConnection({ clientId }: WordPressConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [testing, setTesting] = useState(false);
  const [formData, setFormData] = useState({
    siteUrl: '',
    username: '',
    applicationPassword: ''
  });
  const [siteInfo, setSiteInfo] = useState<any>(null);

  useEffect(() => {
    if (clientId) {
      checkConnection();
    }
  }, [clientId]);

  const checkConnection = async () => {
    try {
      const response = await fetch(`/api/dashboard/wordpress/status?clientId=${clientId}`);
      const data = await response.json();
      setIsConnected(data.connected);
      if (data.siteInfo) {
        setSiteInfo(data.siteInfo);
      }
    } catch (error) {
      console.error('Failed to check WordPress connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);

    try {
      const response = await fetch('/api/dashboard/wordpress/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          ...formData
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(true);
        setSiteInfo(data.siteInfo);
        setShowForm(false);
        setFormData({ siteUrl: '', username: '', applicationPassword: '' });
      } else {
        const error = await response.json();
        alert(`Koppelen mislukt: ${error.message || 'Onbekende fout'}`);
      }
    } catch (error) {
      alert('Koppelen mislukt. Probeer het opnieuw.');
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Weet je zeker dat je WordPress wilt ontkoppelen?')) {
      return;
    }

    try {
      await fetch(`/api/dashboard/wordpress/disconnect?clientId=${clientId}`, {
        method: 'DELETE'
      });
      setIsConnected(false);
      setSiteInfo(null);
    } catch (error) {
      alert('Ontkoppelen mislukt.');
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-[#FF9933]" />
          <div>
            <h3 className="font-semibold text-white">WordPress Verbinding</h3>
            {siteInfo && (
              <p className="text-xs text-gray-400">{siteInfo.name}</p>
            )}
          </div>
        </div>
        
        {isConnected ? (
          <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium flex items-center gap-1">
            <Check className="w-4 h-4" />
            Gekoppeld
          </span>
        ) : (
          <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm font-medium flex items-center gap-1">
            <X className="w-4 h-4" />
            Niet gekoppeld
          </span>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-400">
              Je WordPress website is gekoppeld. Artikelen kunnen automatisch worden gepubliceerd.
            </p>
            {siteInfo && (
              <div className="mt-2 text-xs text-gray-400">
                <p>URL: {siteInfo.url}</p>
                <p>Beschrijving: {siteInfo.description || 'Geen beschrijving'}</p>
              </div>
            )}
          </div>
          
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 text-red-400 border border-red-400/50 rounded-lg hover:bg-red-400/10 transition-colors"
          >
            WordPress Ontkoppelen
          </button>
        </div>
      ) : showForm ? (
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">
              WordPress Site URL *
            </label>
            <input
              type="url"
              value={formData.siteUrl}
              onChange={(e) => setFormData({...formData, siteUrl: e.target.value})}
              placeholder="https://jouwwebsite.nl"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">
              WordPress Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="admin"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Application Password *
            </label>
            <input
              type="password"
              value={formData.applicationPassword}
              onChange={(e) => setFormData({...formData, applicationPassword: e.target.value})}
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Maak een Application Password aan in WordPress → Gebruikers → Profiel
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-white"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={testing}
              className="flex-1 px-4 py-2 bg-[#FF9933] text-white rounded-lg hover:bg-[#FF9933]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testen...
                </>
              ) : (
                'Koppelen'
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            WordPress connectie zorgt ervoor dat gegenereerde artikelen automatisch worden gepubliceerd op je website.
          </p>
          
          <button
            onClick={() => setShowForm(true)}
            className="w-full px-4 py-2 bg-[#FF9933] text-white rounded-lg hover:bg-[#FF9933]/90 font-medium transition-colors"
          >
            WordPress Koppelen
          </button>
        </div>
      )}
    </div>
  );
}
