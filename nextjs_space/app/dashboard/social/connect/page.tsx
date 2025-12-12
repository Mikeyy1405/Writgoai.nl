'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Linkedin, 
  Instagram, 
  Facebook, 
  Twitter, 
  Youtube,
  CheckCircle, 
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Link as LinkIcon
} from 'lucide-react';

const PLATFORMS = [
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: Linkedin, 
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    description: 'Zakelijke netwerken en content'
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: Instagram, 
    color: 'bg-gradient-to-r from-purple-600 to-pink-600',
    hoverColor: 'hover:from-purple-700 hover:to-pink-700',
    description: 'Visuele content en Stories'
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: Facebook, 
    color: 'bg-blue-700',
    hoverColor: 'hover:bg-blue-800',
    description: 'Facebook Pages en posts'
  },
  { 
    id: 'twitter', 
    name: 'X (Twitter)', 
    icon: Twitter, 
    color: 'bg-black',
    hoverColor: 'hover:bg-gray-900',
    description: 'Korte updates en threads'
  },
  { 
    id: 'youtube', 
    name: 'YouTube', 
    icon: Youtube, 
    color: 'bg-red-600',
    hoverColor: 'hover:bg-red-700',
    description: 'Video content en Shorts'
  }
];

interface ConnectedAccount {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  accountHandle?: string;
  profileImage?: string;
  getlateAccountId: string;
  isActive: boolean;
  followersCount?: number;
  connectedAt: string;
}

export default function SocialConnectPage() {
  const router = useRouter();
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentProject();
  }, []);

  useEffect(() => {
    if (currentProjectId) {
      fetchConnectedAccounts();
    }
  }, [currentProjectId]);

  const fetchCurrentProject = async () => {
    try {
      const response = await fetch('/api/admin/projects');
      const projects = await response.json();
      
      if (projects && projects.length > 0) {
        // Use first active project
        const activeProject = projects.find((p: any) => p.status === 'active') || projects[0];
        setCurrentProjectId(activeProject.id);
      } else {
        setError('Geen project gevonden. Maak eerst een project aan.');
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
      setError('Kon project niet laden');
    }
  };

  const fetchConnectedAccounts = async () => {
    if (!currentProjectId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/social/accounts?projectId=${currentProjectId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      
      const data = await response.json();
      setConnectedAccounts(data.accounts || []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      setError('Kon gekoppelde accounts niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    console.log('🔵 Connect clicked:', platform);
    
    if (!currentProjectId) {
      alert('Geen project geselecteerd');
      return;
    }

    setConnecting(platform);
    setError(null);
    
    try {
      console.log('🔵 Fetching connect URL for project:', currentProjectId);
      
      // Stap 1: Get OAuth URL from our API
      const response = await fetch('/api/social/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          platform
        })
      });
      
      console.log('🔵 Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API Error:', error);
        throw new Error(error.error || 'Failed to get connect URL');
      }
      
      const data = await response.json();
      console.log('🔵 Response data:', data);
      
      const { authUrl } = data;
      
      if (!authUrl) {
        console.error('❌ No authUrl in response');
        throw new Error('Geen connect URL ontvangen');
      }
      
      // Stap 2: Open OAuth in popup
      console.log('🔵 Opening popup with URL:', authUrl);
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        authUrl,
        'Connect Social Media',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      if (!popup) {
        console.error('❌ Popup blocked');
        throw new Error('Popup geblokkeerd. Sta popups toe voor deze website.');
      }
      
      console.log('✅ Popup opened successfully');
      
      // Stap 3: Poll for connection completion
      const pollInterval = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(pollInterval);
          setConnecting(null);
          // Refresh accounts list
          await fetchConnectedAccounts();
          return;
        }
        
        try {
          const statusResponse = await fetch(
            `/api/social/connect/status?projectId=${currentProjectId}&platform=${platform}`
          );
          
          if (statusResponse.ok) {
            const status = await statusResponse.json();
            
            if (status.connected) {
              clearInterval(pollInterval);
              popup?.close();
              await fetchConnectedAccounts();
              setConnecting(null);
              
              // Show success message
              alert(`✓ ${platform} succesvol gekoppeld!`);
            }
          }
        } catch (error) {
          console.error('Poll error:', error);
        }
      }, 2000);
      
      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (connecting === platform) {
          setConnecting(null);
        }
      }, 300000);
      
    } catch (error: any) {
      console.error('Failed to connect:', error);
      setError(error.message || 'Koppelen mislukt. Probeer het opnieuw.');
      setConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: string, platform: string) => {
    if (!confirm(`Weet je zeker dat je dit ${platform} account wilt ontkoppelen?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/social/accounts/${accountId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect account');
      }

      // Refresh list
      await fetchConnectedAccounts();
      alert('Account succesvol ontkoppeld');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Ontkoppelen mislukt. Probeer het opnieuw.');
    }
  };

  if (!currentProjectId && !loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-900">Geen project gevonden</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Je moet eerst een project aanmaken voordat je social media accounts kunt koppelen.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Ga naar Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-700">Social Media Koppelen</h1>
        <p className="text-gray-600 mt-2">
          Koppel je social media accounts om automatisch posts te kunnen plaatsen via WritGo.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Laden...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {PLATFORMS.map(platform => {
            const connected = connectedAccounts.filter(
              acc => acc.platform === platform.id && acc.isActive
            );
            const Icon = platform.icon;
            const isConnecting = connecting === platform.id;
            
            return (
              <div
                key={platform.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`${platform.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg text-gray-700">{platform.name}</h3>
                      <p className="text-sm text-gray-500">{platform.description}</p>
                      {connected.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-green-600 mt-1">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">{connected.length} account(s) gekoppeld</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnecting}
                    className={`flex items-center gap-2 px-4 py-2 ${platform.color} ${platform.hoverColor} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Koppelen...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Koppelen</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Show connected accounts */}
                {connected.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    {connected.map(account => (
                      <div 
                        key={account.id} 
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                      >
                        {account.profileImage ? (
                          <img
                            src={account.profileImage}
                            alt={account.displayName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <LinkIcon className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <p className="font-medium text-gray-700">{account.displayName}</p>
                          {account.accountHandle && (
                            <p className="text-sm text-gray-600">@{account.accountHandle}</p>
                          )}
                          {account.followersCount !== undefined && (
                            <p className="text-xs text-gray-500">
                              {account.followersCount.toLocaleString()} volgers
                            </p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleDisconnect(account.id, platform.name)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Ontkoppelen</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Success Summary */}
      {connectedAccounts.length > 0 && !loading && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <p className="font-medium">
              ✓ Je hebt {connectedAccounts.length} account(s) gekoppeld. 
              Je kunt nu automatisch posts plaatsen!
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/social')}
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Ga naar Social Media Pipeline
          </button>
        </div>
      )}
    </div>
  );
}
