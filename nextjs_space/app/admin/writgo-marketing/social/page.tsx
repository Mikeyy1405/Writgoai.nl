'use client';

import { useEffect, useState } from 'react';
import { Share2, CheckCircle, XCircle, ExternalLink, AlertCircle } from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  accountId: string;
  isActive: boolean;
  connectedAt: string;
}

interface ClientStatus {
  isSetup: boolean;
  client?: {
    id: string;
  };
  lateDevAccounts?: SocialAccount[];
}

export default function WritgoSocialAccounts() {
  const [status, setStatus] = useState<ClientStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/writgo-marketing/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError('Failed to load status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!status?.isSetup) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
            <Share2 className="w-16 h-16 text-[#FF6B35] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-100 mb-4">
              Setup Vereist
            </h1>
            <p className="text-gray-400 mb-6">
              Ga eerst naar het hoofddashboard om Writgo.nl als client op te zetten.
            </p>
            <a
              href="/admin/writgo-marketing"
              className="inline-block px-6 py-3 bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-lg transition-colors"
            >
              Naar Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  const platforms = [
    {
      name: 'LinkedIn',
      icon: '💼',
      description: 'Verbind je LinkedIn bedrijfspagina',
      color: 'bg-blue-600'
    },
    {
      name: 'Instagram',
      icon: '📸',
      description: 'Verbind je Instagram account',
      color: 'bg-pink-600'
    },
    {
      name: 'Facebook',
      icon: '👤',
      description: 'Verbind je Facebook pagina',
      color: 'bg-blue-700'
    },
    {
      name: 'Twitter',
      icon: '🐦',
      description: 'Verbind je X (Twitter) account',
      color: 'bg-sky-600'
    }
  ];

  const connectedAccounts = status.lateDevAccounts || [];

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="w-8 h-8 text-[#FF6B35]" />
            <h1 className="text-3xl font-bold text-gray-100">Social Media Accounts</h1>
          </div>
          <p className="text-gray-400">
            Beheer je social media koppelingen voor Writgo.nl marketing
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-300 mb-2">
                GetLate.dev Integratie
              </h3>
              <p className="text-blue-200 mb-4">
                Writgo.nl gebruikt GetLate.dev voor social media posting. Om accounts te verbinden, 
                moet je eerst naar het GetLate.dev dashboard gaan en daar je social media accounts koppelen.
              </p>
              <a
                href="https://getlate.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Open GetLate.dev Dashboard
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Connected Accounts Status */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Verbonden Accounts ({connectedAccounts.length})
          </h2>
          
          {connectedAccounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connectedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-100 capitalize">
                        {account.platform}
                      </h3>
                      <p className="text-gray-400 text-sm">{account.accountName}</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Verbonden op:</span>
                    <span>{new Date(account.connectedAt).toLocaleDateString('nl-NL')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
              <XCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                Nog geen accounts verbonden. Ga naar GetLate.dev om je accounts te koppelen.
              </p>
            </div>
          )}
        </div>

        {/* Platform Cards */}
        <div>
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Beschikbare Platformen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {platforms.map((platform) => {
              const isConnected = connectedAccounts.some(
                (acc) => acc.platform.toLowerCase() === platform.name.toLowerCase()
              );

              return (
                <div
                  key={platform.name}
                  className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center text-2xl`}>
                      {platform.icon}
                    </div>
                    {isConnected && (
                      <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    {platform.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {platform.description}
                  </p>
                  <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    isConnected
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {isConnected ? 'Verbonden' : 'Nog niet verbonden'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Hoe social accounts verbinden?
          </h3>
          <ol className="space-y-3 text-gray-400">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#FF6B35] text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span>
                Ga naar <a href="https://getlate.dev" target="_blank" rel="noopener noreferrer" className="text-[#FF6B35] hover:underline">GetLate.dev</a> en log in met je Writgo.nl account
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#FF6B35] text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>
                Navigeer naar "Connected Accounts" of "Social Accounts"
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#FF6B35] text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>
                Klik op "Connect" bij het platform dat je wilt koppelen (LinkedIn, Instagram, Facebook, Twitter)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#FF6B35] text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              <span>
                Volg de OAuth flow en geef de benodigde permissies
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#FF6B35] text-white rounded-full flex items-center justify-center text-sm font-bold">
                5
              </span>
              <span>
                Ververs deze pagina om je verbonden accounts te zien
              </span>
            </li>
          </ol>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
