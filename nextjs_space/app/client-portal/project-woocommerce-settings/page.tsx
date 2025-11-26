
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Settings, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  Store,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProjectWooCommerceSettingsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);

  const [projectId, setProjectId] = useState<string>('');
  const [projects, setProjects] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  
  const [wooCommerceUrl, setWooCommerceUrl] = useState('');
  const [wooCommerceConsumerKey, setWooCommerceConsumerKey] = useState('');
  const [wooCommerceConsumerSecret, setWooCommerceConsumerSecret] = useState('');
  const [wooCommerceEnabled, setWooCommerceEnabled] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadProjects();
    }
  }, [status]);

  useEffect(() => {
    const paramProjectId = searchParams?.get('projectId');
    if (paramProjectId && projects.length > 0) {
      setProjectId(paramProjectId);
    } else if (projects.length > 0 && !projectId) {
      const primaryProject = projects.find(p => p.isPrimary);
      setProjectId(primaryProject?.id || projects[0].id);
    }
  }, [searchParams, projects]);

  useEffect(() => {
    if (projectId) {
      loadProjectSettings();
    }
  }, [projectId]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/client/projects');
      const data = await response.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Fout bij laden projecten:', error);
    }
  };

  const loadProjectSettings = async () => {
    if (!projectId) return;
    
    try {
      const response = await fetch(`/api/client/projects/woocommerce-settings?projectId=${projectId}`);
      const data = await response.json();
      
      if (response.ok && data.project) {
        setProject(data.project);
        setWooCommerceUrl(data.project.wooCommerceUrl || '');
        setWooCommerceConsumerKey(data.project.wooCommerceConsumerKey || '');
        setWooCommerceConsumerSecret(data.project.wooCommerceConsumerSecret || '');
        setWooCommerceEnabled(data.project.wooCommerceEnabled || false);
      }
    } catch (error) {
      console.error('Fout bij laden project settings:', error);
    }
  };

  const testConnection = async () => {
    if (!wooCommerceUrl || !wooCommerceConsumerKey || !wooCommerceConsumerSecret) {
      toast.error('Vul alle velden in om de verbinding te testen');
      return;
    }
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/client/projects/woocommerce-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          wooCommerceUrl,
          wooCommerceConsumerKey,
          wooCommerceConsumerSecret,
          wooCommerceEnabled: false,
          testConnection: true,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTestResult({ success: true, message: 'Verbinding succesvol!' });
        toast.success('Verbinding succesvol getest! ✓');
      } else {
        setTestResult({ success: false, message: data.message || data.error });
        toast.error(data.message || data.error || 'Verbinding mislukt');
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
      toast.error('Fout bij testen verbinding');
    } finally {
      setIsTesting(false);
    }
  };

  const saveSettings = async () => {
    if (!projectId) {
      toast.error('Geen project geselecteerd');
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/client/projects/woocommerce-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          wooCommerceUrl: wooCommerceUrl.trim() || null,
          wooCommerceConsumerKey: wooCommerceConsumerKey.trim() || null,
          wooCommerceConsumerSecret: wooCommerceConsumerSecret.trim() || null,
          wooCommerceEnabled,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Instellingen opgeslagen! ✓');
        loadProjectSettings();
      } else {
        toast.error(data.error || 'Fout bij opslaan');
      }
    } catch (error) {
      console.error('Fout bij opslaan settings:', error);
      toast.error('Fout bij opslaan instellingen');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || !isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              <Store className="inline-block mr-3 h-8 w-8 text-blue-600" />
              WooCommerce Instellingen
            </h1>
            <p className="text-gray-600 mt-2">
              Configureer WooCommerce voor {project?.name || 'dit project'}
            </p>
          </div>
        </div>
        
        {/* Project selector */}
        {projects.length > 1 && (
          <div className="mt-4">
            <Label>Project</Label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>WooCommerce REST API Credentials</CardTitle>
          <CardDescription>
            Configureer de WooCommerce REST API om producten aan te maken vanuit Bol.com
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled" className="text-base">
                WooCommerce Integratie Inschakelen
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Activeer WooCommerce productbeheer voor dit project
              </p>
            </div>
            <Switch
              id="enabled"
              checked={wooCommerceEnabled}
              onCheckedChange={setWooCommerceEnabled}
            />
          </div>
          
          {/* URL */}
          <div>
            <Label htmlFor="url">
              WooCommerce Site URL
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://jouwwebshop.nl"
              value={wooCommerceUrl}
              onChange={(e) => setWooCommerceUrl(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              De volledige URL van je WooCommerce webshop
            </p>
          </div>
          
          {/* Consumer Key */}
          <div>
            <Label htmlFor="consumerKey">
              Consumer Key
            </Label>
            <Input
              id="consumerKey"
              type="text"
              placeholder="ck_..."
              value={wooCommerceConsumerKey}
              onChange={(e) => setWooCommerceConsumerKey(e.target.value)}
              className="mt-1 font-mono text-sm"
            />
          </div>
          
          {/* Consumer Secret */}
          <div>
            <Label htmlFor="consumerSecret">
              Consumer Secret
            </Label>
            <Input
              id="consumerSecret"
              type="password"
              placeholder="cs_..."
              value={wooCommerceConsumerSecret}
              onChange={(e) => setWooCommerceConsumerSecret(e.target.value)}
              className="mt-1 font-mono text-sm"
            />
          </div>
          
          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              Hoe verkrijg ik WooCommerce API credentials?
            </h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Log in op je WordPress website</li>
              <li>Ga naar WooCommerce → Instellingen → Geavanceerd → REST API</li>
              <li>Klik op "Toevoegen sleutel"</li>
              <li>Vul een beschrijving in (bijv. "WritgoAI")</li>
              <li>Kies "Lezen/Schrijven" als machtigingen</li>
              <li>Klik op "API sleutel genereren"</li>
              <li>Kopieer de Consumer Key en Consumer Secret</li>
            </ol>
            <a
              href="https://woocommerce.com/document/woocommerce-rest-api/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-2"
            >
              WooCommerce REST API Documentatie
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
          
          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-start">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-semibold ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                    {testResult.success ? 'Verbinding Succesvol' : 'Verbinding Mislukt'}
                  </p>
                  {testResult.message && (
                    <p className={`text-sm mt-1 ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {testResult.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={isTesting || !wooCommerceUrl || !wooCommerceConsumerKey || !wooCommerceConsumerSecret}
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testen...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Test Verbinding
                </>
              )}
            </Button>
            
            <Button
              onClick={saveSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Instellingen Opslaan
                </>
              )}
            </Button>
            
            {wooCommerceEnabled && (
              <Button
                variant="secondary"
                onClick={() => router.push(`/client-portal/woocommerce-products?projectId=${projectId}`)}
              >
                <Store className="mr-2 h-4 w-4" />
                Naar Productbeheer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
