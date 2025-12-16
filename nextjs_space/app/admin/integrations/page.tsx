'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Settings,
  Globe,
  ShoppingCart,
  Share2,
  Mail,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';

interface Integration {
  id: string;
  name: string;
  type: 'wordpress' | 'woocommerce' | 'social' | 'email';
  status: 'connected' | 'disconnected' | 'error';
  clientCount: number;
  lastSync?: string;
  config?: any;
}

export default function IntegrationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingWordPress, setTestingWordPress] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    claude: '',
    elevenlabs: '',
    stability: '',
  });
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (status === 'authenticated') {
      loadIntegrations();
      loadApiKeys();
    }
  }, [status, router]);
  
  async function loadIntegrations() {
    try {
      const response = await fetch('/api/admin/integrations');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations);
      } else {
        toast.error('Fout bij laden van integraties');
      }
    } catch (error) {
      console.error('Failed to load integrations:', error);
      toast.error('Fout bij laden van integraties');
    } finally {
      setLoading(false);
    }
  }
  
  async function loadApiKeys() {
    try {
      const response = await fetch('/api/admin/api-keys');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys);
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  }
  
  async function saveApiKeys() {
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: apiKeys })
      });
      
      if (response.ok) {
        toast.success('API keys opgeslagen');
      } else {
        toast.error('Fout bij opslaan van API keys');
      }
    } catch (error) {
      console.error('Failed to save API keys:', error);
      toast.error('Fout bij opslaan van API keys');
    }
  }
  
  async function testWordPressConnection(integrationId: string) {
    setTestingWordPress(true);
    try {
      const response = await fetch(`/api/admin/integrations/${integrationId}/test`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast.success('WordPress verbinding succesvol getest');
        loadIntegrations();
      } else {
        const data = await response.json();
        toast.error(data.error || 'WordPress test mislukt');
      }
    } catch (error) {
      console.error('Failed to test WordPress:', error);
      toast.error('Fout bij testen van WordPress verbinding');
    } finally {
      setTestingWordPress(false);
    }
  }
  
  async function syncIntegration(integrationId: string) {
    try {
      const response = await fetch(`/api/admin/integrations/${integrationId}/sync`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast.success('Synchronisatie gestart');
        loadIntegrations();
      } else {
        toast.error('Fout bij synchronisatie');
      }
    } catch (error) {
      console.error('Failed to sync integration:', error);
      toast.error('Fout bij synchronisatie');
    }
  }
  
  function getStatusIcon(status: string) {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-gray-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  }
  
  function getStatusBadge(status: string) {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Verbonden</Badge>;
      case 'disconnected':
        return <Badge variant="outline">Niet verbonden</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Fout</Badge>;
      default:
        return <Badge variant="outline">Onbekend</Badge>;
    }
  }
  
  function getIntegrationIcon(type: string) {
    switch (type) {
      case 'wordpress':
        return <Globe className="h-6 w-6" />;
      case 'woocommerce':
        return <ShoppingCart className="h-6 w-6" />;
      case 'social':
        return <Share2 className="h-6 w-6" />;
      case 'email':
        return <Mail className="h-6 w-6" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const errorCount = integrations.filter(i => i.status === 'error').length;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8" />
            Integraties
          </h1>
          <p className="text-muted-foreground mt-1">
            Beheer platform koppelingen en API configuratie
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/dashboard">Terug naar Dashboard</Link>
        </Button>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totaal Integraties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{integrations.length}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">
              Verbonden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-800">{connectedCount}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700">
              Fouten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-800">{errorCount}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    {getIntegrationIcon(integration.type)}
                  </div>
                  <div>
                    <CardTitle>{integration.name}</CardTitle>
                    <CardDescription>{integration.type}</CardDescription>
                  </div>
                </div>
                {getStatusIcon(integration.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {getStatusBadge(integration.status)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Klanten:</span>
                  <span className="font-medium">{integration.clientCount}</span>
                </div>
                
                {integration.lastSync && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Laatste sync:</span>
                    <span className="text-sm">
                      {new Date(integration.lastSync).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  {integration.type === 'wordpress' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testWordPressConnection(integration.id)}
                      disabled={testingWordPress}
                    >
                      {testingWordPress ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Settings className="h-4 w-4 mr-2" />
                      )}
                      Test
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => syncIntegration(integration.id)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <Link href={`/admin/integrations/${integration.id}`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configureer
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* API Keys Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Beheer API sleutels voor AI en externe diensten
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApiKeys(!showApiKeys)}
            >
              {showApiKeys ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Verberg
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Toon
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai">OpenAI API Key</Label>
              <Input
                id="openai"
                type={showApiKeys ? 'text' : 'password'}
                value={apiKeys.openai}
                onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                placeholder="sk-..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="claude">Claude API Key (Anthropic)</Label>
              <Input
                id="claude"
                type={showApiKeys ? 'text' : 'password'}
                value={apiKeys.claude}
                onChange={(e) => setApiKeys({ ...apiKeys, claude: e.target.value })}
                placeholder="sk-ant-..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="elevenlabs">ElevenLabs API Key</Label>
              <Input
                id="elevenlabs"
                type={showApiKeys ? 'text' : 'password'}
                value={apiKeys.elevenlabs}
                onChange={(e) => setApiKeys({ ...apiKeys, elevenlabs: e.target.value })}
                placeholder="..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stability">Stability AI API Key</Label>
              <Input
                id="stability"
                type={showApiKeys ? 'text' : 'password'}
                value={apiKeys.stability}
                onChange={(e) => setApiKeys({ ...apiKeys, stability: e.target.value })}
                placeholder="sk-..."
              />
            </div>
            
            <div className="pt-4">
              <Button onClick={saveApiKeys}>
                <Key className="h-4 w-4 mr-2" />
                API Keys Opslaan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
