'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

interface ContentOpportunity {
  id: string;
  title: string;
  source_url: string;
  status: 'detected' | 'generating' | 'queued' | 'published' | 'ignored';
  priority: number;
  metadata: {
    description?: string;
    published?: string;
    author?: string;
    categories?: string[];
  };
  created_at: string;
  writgo_content_triggers?: {
    name: string;
    category: string;
  };
}

export default function OpportunitiesSection() {
  const [opportunities, setOpportunities] = useState<ContentOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('writgo_content_opportunities')
        .select(`
          *,
          writgo_content_triggers (
            name,
            category
          )
        `)
        .in('status', ['detected', 'generating'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error('Error loading opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTriggers = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/writgo/check-triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ RSS feeds gecontroleerd!\n\n` +
              `Gecontroleerd: ${data.checked} feeds\n` +
              `Nieuwe kansen: ${data.newOpportunities}\n` +
              (data.errors.length > 0 ? `\n⚠️ Fouten: ${data.errors.length}` : ''));
        loadOpportunities();
      } else {
        const error = await response.json();
        alert(`❌ Fout: ${error.error || 'Kon triggers niet controleren'}`);
      }
    } catch (error) {
      console.error('Error checking triggers:', error);
      alert('❌ Fout bij controleren van RSS feeds');
    } finally {
      setChecking(false);
    }
  };

  const processOpportunity = async (opportunityId: string) => {
    if (!confirm('Content genereren voor deze kans?')) return;
    
    setProcessing(opportunityId);
    try {
      const response = await fetch('/api/writgo/process-opportunity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}`);
        loadOpportunities();
      } else {
        const error = await response.json();
        alert(`❌ Fout: ${error.error || 'Kon content niet genereren'}`);
      }
    } catch (error) {
      console.error('Error processing opportunity:', error);
      alert('❌ Fout bij genereren van content');
    } finally {
      setProcessing(null);
    }
  };

  const ignoreOpportunity = async (opportunityId: string) => {
    if (!confirm('Deze kans negeren?')) return;
    
    try {
      const { error } = await supabase
        .from('writgo_content_opportunities')
        .update({ status: 'ignored' })
        .eq('id', opportunityId);

      if (!error) {
        loadOpportunities();
      }
    } catch (error) {
      console.error('Error ignoring opportunity:', error);
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      'seo': 'bg-blue-500/20 text-blue-400',
      'ai': 'bg-purple-500/20 text-purple-400',
      'wordpress': 'bg-green-500/20 text-green-400',
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400';
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 8) return 'bg-red-500/20 text-red-400';
    if (priority >= 6) return 'bg-orange-500/20 text-orange-400';
    if (priority >= 4) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">🎯 Content Kansen</h2>
        <button
          onClick={checkTriggers}
          disabled={checking}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-semibold"
        >
          {checking ? '🔄 Bezig...' : '🔍 Check RSS Feeds'}
        </button>
      </div>

      <div className="space-y-3">
        {opportunities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>Geen nieuwe content kansen gevonden.</p>
            <p className="text-sm mt-2">Klik op "Check RSS Feeds" om te zoeken naar nieuwe artikelen.</p>
          </div>
        ) : (
          opportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-orange-500 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryBadge(opp.writgo_content_triggers?.category || '')}`}>
                      {opp.writgo_content_triggers?.name || 'Unknown'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(opp.priority)}`}>
                      Priority {opp.priority}
                    </span>
                    {opp.status === 'generating' && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 animate-pulse">
                        🔄 Generating...
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-1">{opp.title}</h3>
                  
                  {opp.metadata?.description && (
                    <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                      {opp.metadata.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <a 
                      href={opp.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-orange-400 transition-colors"
                    >
                      🔗 Bron artikel
                    </a>
                    {opp.metadata?.published && (
                      <span>
                        📅 {new Date(opp.metadata.published).toLocaleDateString('nl-NL')}
                      </span>
                    )}
                    {opp.metadata?.author && (
                      <span>
                        ✍️ {opp.metadata.author}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => processOpportunity(opp.id)}
                    disabled={processing === opp.id || opp.status === 'generating'}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-semibold whitespace-nowrap"
                  >
                    {processing === opp.id ? '⏳' : '✨ Genereer'}
                  </button>
                  <button
                    onClick={() => ignoreOpportunity(opp.id)}
                    disabled={processing === opp.id}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors disabled:opacity-50 text-sm"
                  >
                    ❌
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
