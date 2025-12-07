'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, CheckCircle2, XCircle, Package, Link2, Plug } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProjectIntegrationsProps {
  projectId: string;
}

export default function ProjectIntegrations({ projectId }: ProjectIntegrationsProps) {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);

  // WordPress state
  const [wpEditing, setWpEditing] = useState(false);
  const [wpSaving, setWpSaving] = useState(false);
  const [wpSettings, setWpSettings] = useState({
    wordpressUrl: '',
    wordpressUsername: '',
    wordpressPassword: '',
    wordpressCategory: '',
    wordpressAutoPublish: false
  });

  // Bol.com state
  const [bolEditing, setBolEditing] = useState(false);
  const [bolSaving, setBolSaving] = useState(false);
  const [bolSettings, setBolSettings] = useState({
    bolcomClientId: '',
    bolcomClientSecret: '',
    bolcomAffiliateId: '',
    bolcomEnabled: false
  });

  // TradeTracker state
  const [ttEditing, setTtEditing] = useState(false);
  const [ttSaving, setTtSaving] = useState(false);
  const [ttSettings, setTtSettings] = useState({
    tradeTrackerSiteId: '',
    tradeTrackerPassphrase: '',
    tradeTrackerCampaignId: '',
    tradeTrackerEnabled: false
  });

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/client/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      const data = await response.json();
      setProject(data.project);

      // Set WordPress settings
      setWpSettings({
        wordpressUrl: data.project.wordpressUrl || '',
        wordpressUsername: data.project.wordpressUsername || '',
        wordpressPassword: data.project.wordpressPassword || '',
        wordpressCategory: data.project.wordpressCategory || '',
        wordpressAutoPublish: data.project.wordpressAutoPublish || false
      });

      // Set Bol.com settings
      setBolSettings({
        bolcomClientId: data.project.bolcomClientId || '',
        bolcomClientSecret: data.project.bolcomClientSecret || '',
        bolcomAffiliateId: data.project.bolcomAffiliateId || '',
        bolcomEnabled: data.project.bolcomEnabled || false
      });

      // Set TradeTracker settings
      setTtSettings({
        tradeTrackerSiteId: data.project.tradeTrackerSiteId || '',
        tradeTrackerPassphrase: data.project.tradeTrackerPassphrase || '',
        tradeTrackerCampaignId: data.project.tradeTrackerCampaignId || '',
        tradeTrackerEnabled: data.project.tradeTrackerEnabled || false
      });
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Kon project niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWordPress = async () => {
    setWpSaving(true);
    try {
      const response = await fetch(`/api/client/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wpSettings)
      });

      if (!response.ok) throw new Error('Failed to update WordPress settings');
      
      toast.success('WordPress instellingen opgeslagen');
      setWpEditing(false);
      fetchProject();
    } catch (error) {
      console.error('Error saving WordPress settings:', error);
      toast.error('Fout bij opslaan WordPress instellingen');
    } finally {
      setWpSaving(false);
    }
  };

  const handleSaveBolcom = async () => {
    setBolSaving(true);
    try {
      const response = await fetch(`/api/client/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bolSettings)
      });

      if (!response.ok) throw new Error('Failed to update Bol.com settings');
      
      toast.success('Bol.com instellingen opgeslagen');
      setBolEditing(false);
      fetchProject();
    } catch (error) {
      console.error('Error saving Bol.com settings:', error);
      toast.error('Fout bij opslaan Bol.com instellingen');
    } finally {
      setBolSaving(false);
    }
  };

  const handleSaveTradeTracker = async () => {
    setTtSaving(true);
    try {
      const response = await fetch(`/api/client/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ttSettings)
      });

      if (!response.ok) throw new Error('Failed to update TradeTracker settings');
      
      toast.success('TradeTracker instellingen opgeslagen');
      setTtEditing(false);
      fetchProject();
    } catch (error) {
      console.error('Error saving TradeTracker settings:', error);
      toast.error('Fout bij opslaan TradeTracker instellingen');
    } finally {
      setTtSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* WordPress Integration */}
      <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-[#ff6b35]/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2">
              <Plug className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff6b35]" />
              WordPress
            </CardTitle>
            <div className="flex items-center gap-2">
              {project?.wordpressUrl && !wpEditing ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : !wpEditing ? (
                <XCircle className="w-4 h-4 text-gray-500" />
              ) : null}
              <Button
                onClick={() => setWpEditing(!wpEditing)}
                size="sm"
                variant={wpEditing ? "outline" : "default"}
                className={wpEditing ? "border-zinc-700 text-white text-xs" : "bg-[#ff6b35] hover:bg-[#ff8c42] text-white text-xs"}
              >
                {wpEditing ? 'Annuleren' : 'Configureren'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {wpEditing ? (
            <div className="space-y-2 sm:space-y-3">
              <div>
                <Label className="text-gray-300 text-xs sm:text-sm">WordPress URL</Label>
                <Input
                  value={wpSettings.wordpressUrl}
                  onChange={(e) => setWpSettings({ ...wpSettings, wordpressUrl: e.target.value })}
                  placeholder="https://jouwsite.nl"
                  className="bg-zinc-800 border-zinc-700 text-white text-xs sm:text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs sm:text-sm">Gebruikersnaam</Label>
                <Input
                  value={wpSettings.wordpressUsername}
                  onChange={(e) => setWpSettings({ ...wpSettings, wordpressUsername: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white text-xs sm:text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs sm:text-sm">Application Password</Label>
                <Input
                  type="password"
                  value={wpSettings.wordpressPassword}
                  onChange={(e) => setWpSettings({ ...wpSettings, wordpressPassword: e.target.value })}
                  placeholder={project?.wordpressPassword ? "••••••••" : ""}
                  className="bg-zinc-800 border-zinc-700 text-white text-xs sm:text-sm mt-1"
                />
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  {project?.wordpressPassword ? "Laat leeg om het huidige wachtwoord te behouden" : "Maak een application password aan in WordPress → Gebruikers → Profiel"}
                </p>
              </div>
              <div>
                <Label className="text-gray-300 text-xs sm:text-sm">Categorie (optioneel)</Label>
                <Input
                  value={wpSettings.wordpressCategory}
                  onChange={(e) => setWpSettings({ ...wpSettings, wordpressCategory: e.target.value })}
                  placeholder="Bijvoorbeeld: Blog"
                  className="bg-zinc-800 border-zinc-700 text-white text-xs sm:text-sm mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={wpSettings.wordpressAutoPublish}
                  onCheckedChange={(checked) => setWpSettings({ ...wpSettings, wordpressAutoPublish: checked })}
                />
                <Label className="text-gray-300 text-xs sm:text-sm">Automatisch publiceren</Label>
              </div>
              <Button
                onClick={handleSaveWordPress}
                disabled={wpSaving}
                className="w-full bg-[#ff6b35] hover:bg-[#ff8c42] text-white text-xs sm:text-sm py-2"
              >
                {wpSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opslaan'}
              </Button>
            </div>
          ) : project?.wordpressUrl ? (
            <div className="text-xs sm:text-sm space-y-2">
              <p className="text-gray-400">Geconfigureerd voor:</p>
              <p className="text-white font-medium break-all">{project.wordpressUrl}</p>
              <p className="text-green-400 text-xs">✓ Inloggegevens opgeslagen</p>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-gray-400">Niet geconfigureerd</p>
          )}
        </CardContent>
      </Card>

      {/* Bol.com Integration */}
      <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-[#ff6b35]/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              Bol.com
            </CardTitle>
            <div className="flex items-center gap-2">
              {bolSettings.bolcomEnabled && !bolEditing ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : !bolEditing ? (
                <XCircle className="w-4 h-4 text-gray-500" />
              ) : null}
              <Button
                onClick={() => setBolEditing(!bolEditing)}
                size="sm"
                variant={bolEditing ? "outline" : "default"}
                className={bolEditing ? "border-zinc-700 text-white text-xs" : "bg-[#ff6b35] hover:bg-[#ff8c42] text-white text-xs"}
              >
                {bolEditing ? 'Annuleren' : 'Configureren'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {bolEditing ? (
            <div className="space-y-2 sm:space-y-3">
              <div>
                <Label className="text-gray-300 text-xs sm:text-sm">Client ID</Label>
                <Input
                  value={bolSettings.bolcomClientId}
                  onChange={(e) => setBolSettings({ ...bolSettings, bolcomClientId: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white text-xs sm:text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs sm:text-sm">Client Secret</Label>
                <Input
                  type="password"
                  value={bolSettings.bolcomClientSecret}
                  onChange={(e) => setBolSettings({ ...bolSettings, bolcomClientSecret: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white text-xs sm:text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs sm:text-sm">Affiliate ID</Label>
                <Input
                  value={bolSettings.bolcomAffiliateId}
                  onChange={(e) => setBolSettings({ ...bolSettings, bolcomAffiliateId: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white text-xs sm:text-sm mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={bolSettings.bolcomEnabled}
                  onCheckedChange={(checked) => setBolSettings({ ...bolSettings, bolcomEnabled: checked })}
                />
                <Label className="text-gray-300 text-xs sm:text-sm">Integratie inschakelen</Label>
              </div>
              <Button
                onClick={handleSaveBolcom}
                disabled={bolSaving}
                className="w-full bg-[#ff6b35] hover:bg-[#ff8c42] text-white text-xs sm:text-sm py-2"
              >
                {bolSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opslaan'}
              </Button>
            </div>
          ) : bolSettings.bolcomEnabled ? (
            <p className="text-xs sm:text-sm text-green-400">✓ Actief</p>
          ) : (
            <p className="text-xs sm:text-sm text-gray-400">Niet ingeschakeld</p>
          )}
        </CardContent>
      </Card>

      {/* TradeTracker Integration */}
      <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-[#ff6b35]/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2">
              <Link2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              TradeTracker
            </CardTitle>
            <div className="flex items-center gap-2">
              {ttSettings.tradeTrackerEnabled && !ttEditing ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : !ttEditing ? (
                <XCircle className="w-4 h-4 text-gray-500" />
              ) : null}
              <Button
                onClick={() => setTtEditing(!ttEditing)}
                size="sm"
                variant={ttEditing ? "outline" : "default"}
                className={ttEditing ? "border-zinc-700 text-white text-xs" : "bg-[#ff6b35] hover:bg-[#ff8c42] text-white text-xs"}
              >
                {ttEditing ? 'Annuleren' : 'Configureren'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {ttEditing ? (
            <div className="space-y-2 sm:space-y-3">
              <div>
                <Label className="text-gray-300 text-xs sm:text-sm">Site ID</Label>
                <Input
                  value={ttSettings.tradeTrackerSiteId}
                  onChange={(e) => setTtSettings({ ...ttSettings, tradeTrackerSiteId: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white text-xs sm:text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs sm:text-sm">Passphrase</Label>
                <Input
                  type="password"
                  value={ttSettings.tradeTrackerPassphrase}
                  onChange={(e) => setTtSettings({ ...ttSettings, tradeTrackerPassphrase: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white text-xs sm:text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs sm:text-sm">Campaign ID</Label>
                <Input
                  value={ttSettings.tradeTrackerCampaignId}
                  onChange={(e) => setTtSettings({ ...ttSettings, tradeTrackerCampaignId: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white text-xs sm:text-sm mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={ttSettings.tradeTrackerEnabled}
                  onCheckedChange={(checked) => setTtSettings({ ...ttSettings, tradeTrackerEnabled: checked })}
                />
                <Label className="text-gray-300 text-xs sm:text-sm">Integratie inschakelen</Label>
              </div>
              <Button
                onClick={handleSaveTradeTracker}
                disabled={ttSaving}
                className="w-full bg-[#ff6b35] hover:bg-[#ff8c42] text-white text-xs sm:text-sm py-2"
              >
                {ttSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opslaan'}
              </Button>
            </div>
          ) : ttSettings.tradeTrackerEnabled ? (
            <p className="text-xs sm:text-sm text-green-400">✓ Actief</p>
          ) : (
            <p className="text-xs sm:text-sm text-gray-400">Niet ingeschakeld</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
