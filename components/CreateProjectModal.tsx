'use client';

import { useState } from 'react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    wp_url: '',
    wp_username: '',
    wp_password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      onSuccess();
      onClose();
      setFormData({
        name: '',
        website_url: '',
        wp_url: '',
        wp_username: '',
        wp_password: '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-xl p-8">
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
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-500 text-sm">
            {error}
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
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50"
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
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50"
              placeholder="https://mijnblog.nl"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              WordPress REST API URL *
            </label>
            <input
              type="url"
              value={formData.wp_url}
              onChange={(e) => setFormData({ ...formData, wp_url: e.target.value })}
              required
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50"
              placeholder="https://mijnblog.nl/wp-json/wp/v2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Meestal: je-website.nl/wp-json/wp/v2
            </p>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              WordPress Username *
            </label>
            <input
              type="text"
              value={formData.wp_username}
              onChange={(e) => setFormData({ ...formData, wp_username: e.target.value })}
              required
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              WordPress Application Password *
            </label>
            <input
              type="password"
              value={formData.wp_password}
              onChange={(e) => setFormData({ ...formData, wp_password: e.target.value })}
              required
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50"
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maak een Application Password aan in WordPress → Users → Profile
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/50 disabled:opacity-50"
            >
              {loading ? 'Bezig...' : 'Project Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
