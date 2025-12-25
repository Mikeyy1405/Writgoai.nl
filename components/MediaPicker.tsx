'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Media {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  filename: string;
  uploaded_at: string;
}

interface MediaPickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
  type?: 'image' | 'video' | 'all';
}

export default function MediaPicker({ onSelect, onClose, type = 'all' }: MediaPickerProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (type !== 'all') params.append('type', type);
      if (search) params.append('search', search);
      params.append('limit', '50');

      const response = await fetch(`/api/media-library?${params}`);
      if (!response.ok) throw new Error('Failed to load media');

      const data = await response.json();
      setMedia(data.media || []);
    } catch (err) {
      console.error('Error loading media:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [type]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMedia();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">
              Selecteer Media uit Bibliotheek
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek media..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Zoeken
            </button>
          </form>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-400 mt-4">Media laden...</p>
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Geen media gevonden</p>
              <p className="text-gray-500 text-sm mt-2">
                Upload eerst media naar de bibliotheek
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {media.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.url)}
                  className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 transition-colors group"
                >
                  <div className="aspect-square relative bg-gray-900">
                    {item.type === 'image' ? (
                      <Image
                        src={item.url}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 25vw"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm">Selecteer</span>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-white text-xs truncate">{item.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}
