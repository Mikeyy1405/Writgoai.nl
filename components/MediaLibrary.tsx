'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import MediaUpload from './MediaUpload';

interface Media {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  description: string | null;
  alt_text: string | null;
  filename: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  tags: string[] | null;
}

export default function MediaLibrary() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [search, setSearch] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('type', filter);
      if (search) params.append('search', search);
      params.append('limit', '100');

      const response = await fetch(`/api/media-library?${params}`);
      if (!response.ok) throw new Error('Failed to load media');

      const data = await response.json();
      setMedia(data.media || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMedia();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze media wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/media-library/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete media');

      setMedia(media.filter(m => m.id !== id));
      if (selectedMedia?.id === id) setSelectedMedia(null);
    } catch (err: any) {
      alert('Fout bij verwijderen: ' + err.message);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">📚 Media Bibliotheek</h2>
          <p className="text-gray-400 mt-1">
            Beheer al je afbeeldingen en video&apos;s op één plek
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {showUpload ? 'Sluiten' : '+ Upload Media'}
        </button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="mb-6">
          <MediaUpload
            onUploadComplete={() => {
              loadMedia();
              setShowUpload(false);
            }}
          />
        </div>
      )}

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Alles
          </button>
          <button
            onClick={() => setFilter('image')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'image'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Afbeeldingen
          </button>
          <button
            onClick={() => setFilter('video')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'video'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Video&apos;s
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op titel, beschrijving of bestandsnaam..."
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

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-400 mt-4">Media laden...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-400">
          Fout bij laden: {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && media.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Geen media gevonden</p>
          <p className="text-gray-500 mt-2">Upload je eerste afbeelding of video</p>
        </div>
      )}

      {/* Media Grid */}
      {!loading && !error && media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 transition-colors cursor-pointer group"
              onClick={() => setSelectedMedia(item)}
            >
              <div className="aspect-square relative bg-gray-900">
                {item.type === 'image' ? (
                  <Image
                    src={item.url}
                    alt={item.alt_text || item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm">Klik voor details</span>
                </div>
              </div>
              <div className="p-3">
                <p className="text-white text-sm font-medium truncate">
                  {item.title}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {formatFileSize(item.file_size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Detail Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  {selectedMedia.title}
                </h3>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                {selectedMedia.type === 'image' ? (
                  <div className="relative w-full h-96 bg-gray-800 rounded-lg">
                    <Image
                      src={selectedMedia.url}
                      alt={selectedMedia.alt_text || selectedMedia.title}
                      fill
                      className="object-contain"
                      sizes="100vw"
                    />
                  </div>
                ) : (
                  <video
                    src={selectedMedia.url}
                    controls
                    className="w-full rounded-lg bg-gray-800"
                  />
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedMedia.url}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                    />
                    <button
                      onClick={() => handleCopyUrl(selectedMedia.url)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      {copiedUrl === selectedMedia.url ? 'Gekopieerd!' : 'Kopieer'}
                    </button>
                  </div>
                </div>

                {selectedMedia.description && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Beschrijving</label>
                    <p className="text-white">{selectedMedia.description}</p>
                  </div>
                )}

                {selectedMedia.alt_text && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Alt Text</label>
                    <p className="text-white">{selectedMedia.alt_text}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Bestandsnaam</label>
                    <p className="text-white text-sm">{selectedMedia.filename}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Type</label>
                    <p className="text-white text-sm">{selectedMedia.mime_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Grootte</label>
                    <p className="text-white text-sm">{formatFileSize(selectedMedia.file_size)}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Geüpload</label>
                    <p className="text-white text-sm">
                      {new Date(selectedMedia.uploaded_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                </div>

                {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedMedia.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => handleDelete(selectedMedia.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    Verwijderen
                  </button>
                  <button
                    onClick={() => setSelectedMedia(null)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                  >
                    Sluiten
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
