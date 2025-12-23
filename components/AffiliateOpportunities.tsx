'use client';

import { useState, useEffect } from 'react';

interface AffiliateProgram {
  network: string;
  type: string;
  signup_url: string;
  commission: string;
  cookie_duration: string;
  details: string;
}

interface Opportunity {
  id: string;
  product_name: string;
  brand_name: string | null;
  mentioned_at: string;
  context: string;
  affiliate_programs: AffiliateProgram[];
  status: string;
  research_completed: boolean;
  discovered_at: string;
  metadata?: any;
}

interface AffiliateOpportunitiesProps {
  projectId: string;
}

export default function AffiliateOpportunities({ projectId }: AffiliateOpportunitiesProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [researching, setResearching] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    by_status: {
      discovered: 0,
      researching: 0,
      signed_up: 0,
      active: 0,
      dismissed: 0,
    },
  });

  useEffect(() => {
    loadOpportunities();
  }, [projectId, filter]);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const response = await fetch(`/api/affiliate/opportunities?project_id=${projectId}${statusParam}`);
      const data = await response.json();

      if (data.success) {
        setOpportunities(data.opportunities);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const researchPrograms = async (opportunityId: string) => {
    try {
      setResearching(opportunityId);
      const response = await fetch('/api/affiliate/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: opportunityId }),
      });

      const data = await response.json();
      if (data.success) {
        // Reload opportunities to show updated data
        await loadOpportunities();
      }
    } catch (error) {
      console.error('Failed to research programs:', error);
    } finally {
      setResearching(null);
    }
  };

  const updateStatus = async (opportunityId: string, status: string) => {
    try {
      const response = await fetch('/api/affiliate/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: opportunityId, status }),
      });

      if (response.ok) {
        await loadOpportunities();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      discovered: 'bg-blue-500/10 text-blue-400',
      researching: 'bg-yellow-500/10 text-yellow-400',
      signed_up: 'bg-purple-500/10 text-purple-400',
      active: 'bg-green-500/10 text-green-400',
      dismissed: 'bg-gray-500/10 text-gray-400',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-400';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      discovered: 'Ontdekt',
      researching: 'Onderzoek',
      signed_up: 'Aangemeld',
      active: 'Actief',
      dismissed: 'Afgewezen',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-gray-400">Totaal</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{stats.by_status.discovered}</div>
          <div className="text-sm text-gray-400">Ontdekt</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">{stats.by_status.researching}</div>
          <div className="text-sm text-gray-400">Onderzoek</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-400">{stats.by_status.signed_up}</div>
          <div className="text-sm text-gray-400">Aangemeld</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{stats.by_status.active}</div>
          <div className="text-sm text-gray-400">Actief</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'discovered', 'researching', 'signed_up', 'active', 'dismissed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === status
                ? 'bg-orange-500 text-white'
                : 'bg-gray-900/50 border border-gray-800 text-gray-400 hover:bg-gray-800'
            }`}
          >
            {status === 'all' ? 'Alle' : getStatusLabel(status)}
          </button>
        ))}
      </div>

      {/* Opportunities List */}
      {opportunities.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-xl">
          <div className="text-4xl mb-4">💼</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Geen opportunities gevonden
          </h3>
          <p className="text-gray-400">
            Genereer content om automatisch affiliate opportunities te ontdekken
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {opp.product_name}
                    </h3>
                    {opp.brand_name && (
                      <span className="text-sm text-gray-400">• {opp.brand_name}</span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(opp.status)}`}>
                      {getStatusLabel(opp.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mb-2">
                    <span className="font-medium">Locatie:</span> {opp.mentioned_at}
                  </div>
                  <div className="text-sm text-gray-400 bg-gray-800/50 rounded p-3 italic">
                    "{opp.context.substring(0, 200)}{opp.context.length > 200 ? '...' : ''}"
                  </div>
                </div>
              </div>

              {/* Affiliate Programs */}
              {opp.affiliate_programs && opp.affiliate_programs.length > 0 && (
                <div className="mb-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                    Affiliate Programma's:
                  </h4>
                  {opp.affiliate_programs.map((program, idx) => (
                    <div key={idx} className="bg-gray-800/50 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white">{program.network}</span>
                        <span className="text-xs text-gray-400">
                          {program.type === 'direct_program' ? '🔗 Direct' : '🌐 Netwerk'}
                        </span>
                      </div>
                      <div className="text-gray-400 mb-1">
                        💰 {program.commission} • 🍪 {program.cookie_duration}
                      </div>
                      {program.details && (
                        <div className="text-xs text-gray-500 mb-2">{program.details}</div>
                      )}
                      <a
                        href={program.signup_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 text-xs"
                      >
                        Aanmelden →
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {!opp.research_completed && (
                  <button
                    onClick={() => researchPrograms(opp.id)}
                    disabled={researching === opp.id}
                    className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-all disabled:opacity-50"
                  >
                    {researching === opp.id ? 'Onderzoek...' : '🔍 Research'}
                  </button>
                )}
                {opp.status === 'discovered' && opp.research_completed && (
                  <button
                    onClick={() => updateStatus(opp.id, 'signed_up')}
                    className="px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/20 transition-all"
                  >
                    ✅ Aangemeld
                  </button>
                )}
                {opp.status === 'signed_up' && (
                  <button
                    onClick={() => updateStatus(opp.id, 'active')}
                    className="px-4 py-2 bg-green-500/10 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/20 transition-all"
                  >
                    ⚡ Mark Actief
                  </button>
                )}
                {opp.status !== 'dismissed' && (
                  <button
                    onClick={() => updateStatus(opp.id, 'dismissed')}
                    className="px-4 py-2 bg-gray-700/50 text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-700 transition-all"
                  >
                    ✕ Afwijzen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
