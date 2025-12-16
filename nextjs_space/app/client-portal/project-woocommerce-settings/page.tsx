
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
  const [wooCommerceEnabled, setWooCommerceEnabled] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

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
      const response = await fetch(`/api/client/projects/${projectId}/integrations/woocommerce`);
      const data = await response.json();
      
      if (response.ok) {
        // Get project info for name display
        const projectResponse = await fetch(`/api/client/projects/${projectId}`);
        const projectData = await projectResponse.json();
        if (projectData.project) {
          setProject(projectData.project);
        }
        
        setWooCommerceUrl(data.wordpressUrl || '');
        setWooCommerceEnabled(data.enabled || false);
        setIsConfigured(data.isConfigured || false);
      }
    } catch (error) {
      console.error('Fout bij laden project settings:', error);
    }
  };

  const testConnection = async () => {
    // WooCommerce gebruikt de WordPress credentials van het project
    // Test de WordPress verbinding via de WordPress integration route
    if (!projectId) {
      toast.error('Geen project geselecteerd');
      return;
    }
    
    toast.info('WooCommerce gebruikt de WordPress credentials. Test eerst de WordPress verbinding in de WordPress instellingen.');
  };

  const saveSettings = async () => {
    if (!projectId) {
      toast.error('Geen project geselecteerd');
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/client/projects/${projectId}/integrations/woocommerce`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: wooCommerceEnabled,
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
            <h1 className="text-3xl font-bold text-gray-700">
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
          {/* WordPress Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-700 mb-2">
              ℹ️ WooCommerce gebruikt WordPress credentials
            </h4>
            <p className="text-sm text-blue-600">
              WooCommerce integratie gebruikt automatisch de WordPress credentials die je hebt geconfigureerd in de WordPress instellingen van dit project.
              {!isConfigured && (
                <span className="block mt-2 font-semibold">
                  ⚠️ Configureer eerst de WordPress instellingen voordat je WooCommerce kunt gebruiken.
                </span>
              )}
            </p>
            {wooCommerceUrl && (
              <p className="text-sm text-blue-600 mt-2">
                <strong>WordPress URL:</strong> {wooCommerceUrl}
              </p>
            )}
          </div>
          
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
              disabled={!isConfigured}
            />
          </div>
          
          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-gray-700 mb-2">
              📝 Hoe configureer ik WooCommerce?
            </h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Ga naar de WordPress instellingen van dit project</li>
              <li>Configureer de WordPress URL, gebruikersnaam en wachtwoord</li>
              <li>Test de WordPress verbinding</li>
              <li>Kom terug naar deze pagina en schakel WooCommerce in</li>
            </ol>
            <Button
              variant="link"
              onClick={() => router.push(`/client-portal/projects/${projectId}/settings?tab=wordpress`)}
              className="mt-2 p-0 h-auto text-blue-600"
            >
              → Naar WordPress instellingen
            </Button>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={saveSettings}
              disabled={isSaving || !isConfigured}
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
