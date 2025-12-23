'use client';

import { useState } from 'react';

interface ProductListGeneratorProps {
  projectId: string;
  onInsert: (html: string) => void;
  onClose: () => void;
}

interface Product {
  ean: string;
  title: string;
  price?: number;
  rating?: number;
  rank: number;
  pros: string[];
  cons: string[];
  verdict: string;
}

export default function ProductListGenerator({
  projectId,
  onInsert,
  onClose,
}: ProductListGeneratorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [listTitle, setListTitle] = useState('');
  const [listCount, setListCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{
    html: string;
    products: Product[];
  } | null>(null);

  const generateList = async () => {
    if (!searchQuery.trim()) {
      setError('Voer een zoekterm in');
      return;
    }

    setLoading(true);
    setError('');
    setPreview(null);

    try {
      const response = await fetch('/api/generate/product-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          search_query: searchQuery,
          list_title: listTitle || undefined,
          list_count: listCount,
          language: 'nl',
          include_css: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Er is een fout opgetreden');
      }

      setPreview({
        html: data.html,
        products: data.products,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (preview?.html) {
      onInsert(preview.html);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white">🛒 Product Lijst Generator</h2>
            <p className="text-gray-400 text-sm mt-1">
              Genereer een top {listCount} lijst met Bol.com producten
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Zoekterm (verplicht) *
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="bijv. draadloze koptelefoon, yogamat, espressomachine"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Lijst Titel (optioneel)
                </label>
                <input
                  type="text"
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                  placeholder="bijv. Beste Koptelefoons 2024"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Aantal Producten
                </label>
                <select
                  value={listCount}
                  onChange={(e) => setListCount(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value={3}>Top 3</option>
                  <option value={5}>Top 5</option>
                  <option value={7}>Top 7</option>
                  <option value={10}>Top 10</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={generateList}
              disabled={loading || !searchQuery.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Producten zoeken en beoordelen...
                </>
              ) : (
                <>
                  🔍 Genereer Product Lijst
                </>
              )}
            </button>
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Preview ({preview.products.length} producten)
              </h3>

              {/* Product Summary */}
              <div className="grid gap-3">
                {preview.products.map((product) => (
                  <div
                    key={product.ean}
                    className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                      {product.rank}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium truncate">{product.title}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        {product.price && <span>€{product.price.toFixed(2)}</span>}
                        {product.rating && (
                          <span className="text-yellow-400">
                            {'★'.repeat(Math.round(product.rating))} {product.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-green-400">+{product.pros.length}</span>
                      {' / '}
                      <span className="text-red-400">-{product.cons.length}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* HTML Preview */}
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">HTML Preview</span>
                  <span className="text-xs text-gray-500">
                    {preview.html.length.toLocaleString()} karakters
                  </span>
                </div>
                <div 
                  className="prose prose-invert max-w-none max-h-[300px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: preview.html }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
          >
            Annuleren
          </button>
          <button
            onClick={handleInsert}
            disabled={!preview}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-green-500/50 disabled:opacity-50 transition-all"
          >
            ✓ Invoegen in Artikel
          </button>
        </div>
      </div>
    </div>
  );
}
