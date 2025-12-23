'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function BrandingSettings() {
  const [logoUrl, setLogoUrl] = useState('');
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Fetch current logo
    fetch('/api/branding/logo')
      .then(res => res.json())
      .then(data => {
        if (data.logoUrl) {
          setCurrentLogoUrl(data.logoUrl);
          setLogoUrl(data.logoUrl);
        }
      })
      .catch(err => console.error('Failed to fetch logo:', err));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/branding/logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logoUrl: logoUrl || null }),
      });

      if (!response.ok) {
        throw new Error('Failed to update logo');
      }

      setCurrentLogoUrl(logoUrl || null);
      setMessage({ type: 'success', text: 'Logo succesvol bijgewerkt!' });
    } catch (error) {
      console.error('Error updating logo:', error);
      setMessage({ type: 'error', text: 'Fout bij het bijwerken van het logo' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/branding/logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logoUrl: null }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove logo');
      }

      setLogoUrl('');
      setCurrentLogoUrl(null);
      setMessage({ type: 'success', text: 'Logo succesvol verwijderd!' });
    } catch (error) {
      console.error('Error removing logo:', error);
      setMessage({ type: 'error', text: 'Fout bij het verwijderen van het logo' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
      <h2 className="text-2xl font-bold text-white mb-4">🎨 Branding</h2>
      <p className="text-gray-400 mb-6">
        Personaliseer de applicatie met je eigen bedrijfslogo
      </p>

      <div className="space-y-6">
        {/* Current Logo Preview */}
        {currentLogoUrl && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Huidig Logo</label>
            <div className="w-32 h-32 relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <Image
                src={currentLogoUrl}
                alt="Current logo"
                fill
                className="object-contain p-2"
                sizes="128px"
              />
            </div>
          </div>
        )}

        {/* Logo URL Input */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Logo URL
          </label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <p className="mt-2 text-sm text-gray-500">
            Upload je logo naar een image hosting service (bijv. Imgur, Cloudinary) en plak de URL hier.
            <br />
            Aanbevolen: vierkant formaat, minimaal 256x256px, transparante achtergrond (PNG).
          </p>
        </div>

        {/* Preview of new logo */}
        {logoUrl && logoUrl !== currentLogoUrl && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Voorbeeld</label>
            <div className="w-32 h-32 relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <Image
                src={logoUrl}
                alt="Logo preview"
                fill
                className="object-contain p-2"
                sizes="128px"
                onError={() => setMessage({ type: 'error', text: 'Ongeldige afbeelding URL' })}
              />
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/50 text-green-500'
                : 'bg-red-500/10 border border-red-500/50 text-red-500'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading || !logoUrl}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Opslaan...' : 'Logo Opslaan'}
          </button>

          {currentLogoUrl && (
            <button
              onClick={handleRemove}
              disabled={loading}
              className="px-6 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Logo Verwijderen
            </button>
          )}
        </div>

        {/* Tips */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-orange-400 mb-2">💡 Tips voor het beste resultaat:</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Gebruik een vierkant logo voor optimale weergave</li>
            <li>• PNG formaat met transparante achtergrond werkt het best</li>
            <li>• Minimale resolutie: 256x256 pixels</li>
            <li>• Het logo wordt automatisch geschaald om binnen de kaders te passen</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
