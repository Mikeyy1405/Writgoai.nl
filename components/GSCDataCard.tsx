'use client';

import { useState, useEffect } from 'react';

interface GSCDataCardProps {
  projectId: string;
}

export default function GSCDataCard({ projectId }: GSCDataCardProps) {
  const [gscData, setGscData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState('');

  useEffect(() => {
    if (projectId) {
      loadGSCData();
    }
  }, [projectId]);

  const loadGSCData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/gsc/sync?project_id=${projectId}&days=30`);
      const data = await response.json();
      if (response.ok) {
        setGscData(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load GSC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      const queries = JSON.parse(importData);
      
      const response = await fetch('/api/gsc/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          queries,
        }),
      });

      if (response.ok) {
        alert('✅ GSC data geïmporteerd!');
        setShowImport(false);
        setImportData('');
        loadGSCData();
      } else {
        throw new Error('Failed to import');
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="text-center text-gray-400">Laden...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Search Console Data</h2>
        <button
          onClick={() => setShowImport(!showImport)}
          className="text-sm text-orange-500 hover:text-orange-400"
        >
          {showImport ? 'Annuleren' : '+ Importeer Data'}
        </button>
      </div>

      {showImport && (
        <div className="mb-6 p-4 bg-black/50 border border-gray-700 rounded-lg">
          <div className="mb-3">
            <label className="block text-gray-300 text-sm mb-2">
              Plak GSC data (JSON format)
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm font-mono"
              rows={6}
              placeholder={`[
  {
    "query": "seo tips",
    "clicks": 120,
    "impressions": 5000,
    "ctr": 2.4,
    "position": 5.2,
    "date": "2024-12-20"
  }
]`}
            />
          </div>
          <button
            onClick={handleImport}
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600"
          >
            Importeer
          </button>
        </div>
      )}

      {gscData.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-gray-400 text-sm">
            Nog geen Search Console data
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Importeer data om insights te genereren
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 font-medium pb-2 border-b border-gray-800">
            <div>Query</div>
            <div className="text-right">Clicks</div>
            <div className="text-right">Impressions</div>
            <div className="text-right">Position</div>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {gscData.slice(0, 10).map((item, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 text-sm py-2 hover:bg-gray-800/50 rounded px-2">
                <div className="text-white truncate">{item.query}</div>
                <div className="text-gray-400 text-right">{item.clicks}</div>
                <div className="text-gray-400 text-right">{item.impressions}</div>
                <div className="text-gray-400 text-right">{item.position.toFixed(1)}</div>
              </div>
            ))}
          </div>
          {gscData.length > 10 && (
            <div className="text-center text-xs text-gray-500 pt-2">
              +{gscData.length - 10} meer queries
            </div>
          )}
        </div>
      )}
    </div>
  );
}
