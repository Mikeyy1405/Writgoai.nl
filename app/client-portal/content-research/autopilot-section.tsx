
'use client';

/**
 * Autopilot Section Component
 * 
 * Full autopilot functionality integrated in the unified content planning page:
 * - Autopilot settings management (enable/disable, frequency, mode)
 * - Active job tracking with real-time progress
 * - Manual "Run Now" functionality
 * - Schedule management
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Rocket,
  Settings,
  Play,
  RefreshCw,
  Check,
  AlertCircle,
  Clock,
  Zap,
  Calendar,
  BarChart3,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  XCircle,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface AutopilotSectionProps {
  projectId: string | null;
  projectName: string;
  articleIdeasCount: number;
  language?: 'NL' | 'EN' | 'DE' | 'FR' | 'ES';
}

interface AutopilotSettings {
  projectId: string;
  projectName: string;
  enabled: boolean;
  mode: 'fast' | 'research';
  frequency: 'daily' | 'weekly' | 'monthly';
  articlesPerRun: number;
  wordCount: number;
  priority: 'all' | 'high' | 'medium';
  autoPublish: boolean;
  contentType: string;
  includeFAQ: boolean;
  includeDirectAnswer: boolean;
  includeYouTube: boolean;
  imageCount: number;
  publishingDays: string[];
  publishingTime: string;
  nextRun: string | null;
  lastRun: string | null;
}

interface AutopilotJob {
  id: string;
  articleId: string;
  projectId: string;
  status: 'pending' | 'generating' | 'publishing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStep: string;
  contentId: string | null;
  publishedUrl: string | null;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
}

export default function AutopilotSection({ 
  projectId, 
  projectName,
  articleIdeasCount,
  language = 'NL'
}: AutopilotSectionProps) {
  const [settings, setSettings] = useState<AutopilotSettings | null>(null);
  const [jobs, setJobs] = useState<AutopilotJob[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isRunningNow, setIsRunningNow] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState(false);

  // Load settings and jobs
  useEffect(() => {
    if (projectId) {
      loadSettings();
      loadJobs();
      
      // Check if autopilot needs to run automatically
      checkAndRunAutopilot();
      
      // Poll for job updates every 5 seconds
      const jobInterval = setInterval(loadJobs, 5000);
      
      // Check if autopilot needs to run every 5 minutes
      const autopilotCheckInterval = setInterval(checkAndRunAutopilot, 5 * 60 * 1000);
      
      // Cleanup stuck jobs every 2 minutes
      const cleanupInterval = setInterval(async () => {
        try {
          await fetch('/api/client/autopilot/cleanup-stuck-jobs', {
            method: 'POST',
          });
        } catch (error) {
          console.error('Failed to cleanup stuck jobs:', error);
        }
      }, 120000); // 2 minutes
      
      return () => {
        clearInterval(jobInterval);
        clearInterval(cleanupInterval);
        clearInterval(autopilotCheckInterval);
      };
    }
  }, [projectId]);

  // Check if autopilot needs to run and trigger it automatically
  const checkAndRunAutopilot = async () => {
    if (!projectId) return;
    
    try {
      const res = await fetch(`/api/client/autopilot/settings?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        const projectSettings = data.settings;
        
        // Check if autopilot is enabled
        if (!projectSettings.enabled) {
          return;
        }
        
        // ✅ NIEUWE LOGICA: Check of er al een run is geweest volgens de schedule
        const now = new Date();
        const lastRun = projectSettings.lastRun ? new Date(projectSettings.lastRun) : null;
        const frequency = projectSettings.frequency || 'weekly';
        
        // Check of we al binnen de huidige schedule periode zitten
        let shouldRun = false;
        
        if (!lastRun) {
          // Nog nooit gedraaid, dus mag draaien
          shouldRun = true;
        } else {
          const timeSinceLastRun = now.getTime() - lastRun.getTime();
          const hoursSinceLastRun = timeSinceLastRun / (1000 * 60 * 60);
          
          switch (frequency) {
            case 'daily':
              // Alleen draaien als laatste run meer dan 20 uur geleden was
              // (geeft wat ruimte voor timezone verschillen en timing)
              shouldRun = hoursSinceLastRun >= 20;
              if (!shouldRun) {
                console.log(`[Autopilot] Daily schedule: Last run was ${hoursSinceLastRun.toFixed(1)} hours ago, skipping (waiting for 20+ hours)`);
              }
              break;
            
            case 'weekly':
              // Alleen draaien als laatste run meer dan 6 dagen geleden was
              const daysSinceLastRun = hoursSinceLastRun / 24;
              shouldRun = daysSinceLastRun >= 6;
              if (!shouldRun) {
                console.log(`[Autopilot] Weekly schedule: Last run was ${daysSinceLastRun.toFixed(1)} days ago, skipping (waiting for 6+ days)`);
              }
              break;
            
            case 'monthly':
              // Alleen draaien als laatste run meer dan 28 dagen geleden was
              const daysSinceLastRunMonthly = hoursSinceLastRun / 24;
              shouldRun = daysSinceLastRunMonthly >= 28;
              if (!shouldRun) {
                console.log(`[Autopilot] Monthly schedule: Last run was ${daysSinceLastRunMonthly.toFixed(1)} days ago, skipping (waiting for 28+ days)`);
              }
              break;
            
            default:
              shouldRun = false;
          }
        }
        
        // Als we niet moeten draaien volgens de schedule, stop hier
        if (!shouldRun) {
          return;
        }
        
        console.log('[Autopilot] Schedule check passed, checking for active jobs...');
        
        // Check if there are any active jobs
        const jobsRes = await fetch(`/api/client/autopilot/jobs?projectId=${projectId}`);
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          const activeJobs = jobsData.jobs?.filter((j: AutopilotJob) => 
            j.status === 'pending' || j.status === 'generating' || j.status === 'publishing'
          ) || [];
          
          // Only auto-trigger if no jobs are currently running
          if (activeJobs.length === 0) {
            console.log('[Autopilot] No active jobs found, triggering autopilot...');
            
            // Trigger autopilot run silently
            fetch('/api/client/autopilot/run-now', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId,
                articlesCount: projectSettings.articlesPerRun || 1,
                performResearch: projectSettings.mode === 'research',
                language: language || projectSettings.language || 'NL',
                autoTriggered: true, // Flag to indicate this is automatic
              }),
            }).then((response) => {
              if (response.ok) {
                console.log('[Autopilot] Auto-triggered successfully');
                // Reload jobs to show the new run
                setTimeout(() => loadJobs(), 2000);
              }
            }).catch(error => {
              console.error('[Autopilot] Failed to auto-trigger:', error);
            });
          } else {
            console.log('[Autopilot] Active jobs found, skipping auto-trigger');
          }
        }
      }
    } catch (error) {
      console.error('[Autopilot] Error checking autopilot status:', error);
    }
  };

  const loadSettings = async () => {
    if (!projectId) return;
    
    setIsLoadingSettings(true);
    try {
      const res = await fetch(`/api/client/autopilot/settings?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading autopilot settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadJobs = async () => {
    if (!projectId) return;
    
    setIsLoadingJobs(true);
    try {
      const res = await fetch(`/api/client/autopilot/jobs?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error loading autopilot jobs:', error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const saveSettings = async () => {
    if (!projectId || !settings) return;
    
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/client/autopilot/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, ...settings }),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        alert('✅ Autopilot instellingen opgeslagen!');
      } else {
        const error = await res.json();
        alert(`❌ ${error.error || 'Kon instellingen niet opslaan'}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ Fout bij opslaan instellingen');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const runNow = async () => {
    if (!projectId || !settings) return;

    // Check of er recent al een run is geweest
    const now = new Date();
    const lastRun = settings.lastRun ? new Date(settings.lastRun) : null;
    const frequency = settings.frequency || 'weekly';
    
    let recentRunWarning = '';
    
    if (lastRun) {
      const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
      
      if (frequency === 'daily' && hoursSinceLastRun < 20) {
        recentRunWarning = `\n⚠️ Let op: Er is ${hoursSinceLastRun.toFixed(1)} uur geleden al een run geweest (dagelijkse schedule).\nWeet je zeker dat je nu opnieuw wilt starten?`;
      } else if (frequency === 'weekly' && hoursSinceLastRun < 144) { // 6 dagen
        const daysSince = hoursSinceLastRun / 24;
        recentRunWarning = `\n⚠️ Let op: Er is ${daysSince.toFixed(1)} dagen geleden al een run geweest (wekelijkse schedule).\nWeet je zeker dat je nu opnieuw wilt starten?`;
      } else if (frequency === 'monthly' && hoursSinceLastRun < 672) { // 28 dagen
        const daysSince = hoursSinceLastRun / 24;
        recentRunWarning = `\n⚠️ Let op: Er is ${daysSince.toFixed(1)} dagen geleden al een run geweest (maandelijkse schedule).\nWeet je zeker dat je nu opnieuw wilt starten?`;
      }
    }

    const confirmMessage = `🚀 Autopilot Nu Starten\n\nDit start de autopilot voor dit project en genereert content op basis van je huidige instellingen.${recentRunWarning}\n\nDoorgaan?`;
    if (!confirm(confirmMessage)) return;

    setIsRunningNow(true);
    try {
      const res = await fetch('/api/client/autopilot/run-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          articlesCount: settings?.articlesPerRun || 1,
          performResearch: settings?.mode === 'research',
          language, // Include selected language
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        loadJobs(); // Refresh jobs list
        loadSettings(); // Refresh settings to update lastRun
      } else {
        alert(`❌ ${data.error || 'Kon autopilot niet starten'}`);
      }
    } catch (error) {
      console.error('Error running autopilot:', error);
      alert('❌ Fout bij starten autopilot');
    } finally {
      setIsRunningNow(false);
    }
  };

  const cancelJob = async (jobId: string) => {
    const confirmMessage = `🛑 Weet je zeker dat je deze generatie wilt stoppen?\n\nHet proces kan niet hervat worden.`;
    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/client/autopilot/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          error: 'Geannuleerd door gebruiker',
        }),
      });

      if (res.ok) {
        alert('✅ Generatie succesvol geannuleerd');
        loadJobs(); // Refresh jobs list
      } else {
        alert('❌ Kon generatie niet annuleren');
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
      alert('❌ Fout bij annuleren');
    }
  };

  // No project selected
  if (!projectId) {
    return (
      <div className="p-8 bg-gradient-to-br from-orange-500/10 to-purple-500/10 border border-orange-500/20 rounded-lg text-center">
        <Rocket className="w-16 h-16 mx-auto mb-4 text-orange-500" />
        <h3 className="text-2xl font-bold text-white mb-2">Selecteer een Project</h3>
        <p className="text-gray-300">
          Selecteer eerst een project om de autopilot functionaliteit te gebruiken.
        </p>
      </div>
    );
  }

  // No content ideas
  if (articleIdeasCount === 0) {
    return (
      <div className="p-8 bg-gradient-to-br from-orange-500/10 to-purple-500/10 border border-orange-500/20 rounded-lg text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-orange-500" />
        <h3 className="text-2xl font-bold text-white mb-2">Geen Content Ideeën</h3>
        <p className="text-gray-300 mb-4">
          Er zijn nog geen content ideeën voor dit project. Ga naar "Ideeën Beheren" om ideeën te genereren.
        </p>
        <Button
          onClick={() => window.location.href = '/client-portal/content-research?tab=planning'}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          Naar Ideeën Beheren
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoadingSettings) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-orange-500 animate-spin" />
        <p className="text-gray-300">Autopilot instellingen laden...</p>
      </div>
    );
  }

  // Active jobs count
  const activeJobs = jobs.filter(j => ['pending', 'generating', 'publishing'].includes(j.status));
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const failedJobs = jobs.filter(j => j.status === 'failed');
  const cancelledJobs = jobs.filter(j => j.status === 'cancelled');

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <Card className="bg-[#1a1a1a] border-orange-500/20 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Rocket className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                Autopilot voor {projectName}
                {settings?.enabled && (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                    <Check className="w-3 h-3 mr-1" />
                    Actief
                  </Badge>
                )}
                {!settings?.enabled && (
                  <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
                    Inactief
                  </Badge>
                )}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {articleIdeasCount} content ideeën beschikbaar
              </p>
              {settings?.lastRun && (
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Laatste run: {new Date(settings.lastRun).toLocaleString('nl-NL')}
                </p>
              )}
              {settings?.nextRun && settings.enabled && (
                <p className="text-sm text-orange-400 mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Volgende run: {new Date(settings.nextRun).toLocaleString('nl-NL')}
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 lg:w-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{activeJobs.length}</div>
              <div className="text-xs text-gray-400">Actief</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{completedJobs.length}</div>
              <div className="text-xs text-gray-400">Voltooid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{failedJobs.length}</div>
              <div className="text-xs text-gray-400">Mislukt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">{cancelledJobs.length}</div>
              <div className="text-xs text-gray-400">Geannuleerd</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Active Jobs - Real-time Progress */}
      {activeJobs.length > 0 && (
        <Card className="bg-[#1a1a1a] border-orange-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            Actieve Content Generatie ({activeJobs.length})
          </h3>
          <div className="space-y-4">
            {activeJobs.map(job => (
              <div key={job.id} className="p-4 bg-[#0a0a0a] border border-orange-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    <span className="text-sm font-medium text-white">{job.currentStep}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-500/10 text-orange-500">
                      {job.status}
                    </Badge>
                    <Button
                      onClick={() => cancelJob(job.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Annuleren
                    </Button>
                  </div>
                </div>
                <div className="w-full bg-[#1a1a1a] rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{job.progress}%</span>
                  <span>Gestart: {new Date(job.startedAt).toLocaleString('nl-NL')}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Completed Jobs */}
      {completedJobs.length > 0 && (
        <Card className="bg-[#1a1a1a] border-green-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Recent Voltooid ({completedJobs.slice(0, 3).length})
          </h3>
          <div className="space-y-3">
            {completedJobs.slice(0, 3).map(job => (
              <div key={job.id} className="p-4 bg-[#0a0a0a] border border-green-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-white">{job.currentStep}</span>
                  </div>
                  {job.publishedUrl && (
                    <a
                      href={job.publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-500 hover:underline flex items-center gap-1"
                    >
                      Bekijk <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {job.completedAt && (
                  <div className="text-xs text-gray-400 mt-2">
                    Voltooid: {new Date(job.completedAt).toLocaleString('nl-NL')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Failed Jobs */}
      {failedJobs.length > 0 && (
        <Card className="bg-[#1a1a1a] border-red-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Mislukt ({failedJobs.slice(0, 2).length})
          </h3>
          <div className="space-y-3">
            {failedJobs.slice(0, 2).map(job => (
              <div key={job.id} className="p-4 bg-[#0a0a0a] border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-white">{job.currentStep}</span>
                </div>
                {job.error && (
                  <div className="text-xs text-red-400 mt-2">
                    Error: {job.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cancelled Jobs */}
      {cancelledJobs.length > 0 && (
        <Card className="bg-[#1a1a1a] border-gray-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-gray-500" />
            Geannuleerd ({cancelledJobs.slice(0, 2).length})
          </h3>
          <div className="space-y-3">
            {cancelledJobs.slice(0, 2).map(job => (
              <div key={job.id} className="p-4 bg-[#0a0a0a] border border-gray-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-white">{job.currentStep}</span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Geannuleerd: {new Date(job.completedAt || job.updatedAt).toLocaleString('nl-NL')}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Autopilot Settings */}
      <Card className="bg-[#1a1a1a] border-orange-500/20 p-6">
        <button
          onClick={() => setExpandedSettings(!expandedSettings)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" />
            Autopilot Instellingen
          </h3>
          {expandedSettings ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSettings && settings && (
          <div className="mt-6 space-y-6">
            {/* Enable/Disable Autopilot */}
            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-orange-500/20 rounded-lg">
              <div>
                <Label htmlFor="autopilot-enabled" className="text-white font-medium">
                  Autopilot Inschakelen
                </Label>
                <p className="text-sm text-gray-400 mt-1">
                  Automatisch content genereren volgens planning
                </p>
              </div>
              <Switch
                id="autopilot-enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
              />
            </div>

            {/* Mode Selection */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Mode</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSettings({ ...settings, mode: 'fast' })}
                  className={`p-4 rounded-lg border transition-all ${
                    settings.mode === 'fast'
                      ? 'bg-orange-500/20 border-orange-500 text-white'
                      : 'bg-[#0a0a0a] border-orange-500/20 text-gray-400 hover:border-orange-500/50'
                  }`}
                >
                  <Zap className="w-5 h-5 mx-auto mb-2" />
                  <div className="font-medium">Fast</div>
                  <div className="text-xs mt-1">Snelle generatie</div>
                </button>
                <button
                  onClick={() => setSettings({ ...settings, mode: 'research' })}
                  className={`p-4 rounded-lg border transition-all ${
                    settings.mode === 'research'
                      ? 'bg-orange-500/20 border-orange-500 text-white'
                      : 'bg-[#0a0a0a] border-orange-500/20 text-gray-400 hover:border-orange-500/50'
                  }`}
                >
                  <BarChart3 className="w-5 h-5 mx-auto mb-2" />
                  <div className="font-medium">Research</div>
                  <div className="text-xs mt-1">Met keyword research</div>
                </button>
              </div>
            </div>

            {/* Frequency Selection */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Frequentie</Label>
              <select
                value={settings.frequency}
                onChange={(e) => setSettings({ ...settings, frequency: e.target.value as any })}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-orange-500/30 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="daily">Dagelijks</option>
                <option value="weekly">Wekelijks</option>
                <option value="monthly">Maandelijks</option>
              </select>
            </div>

            {/* Articles Per Run */}
            <div className="space-y-2">
              <Label className="text-white font-medium">
                Artikelen per run: {settings.articlesPerRun}
              </Label>
              <input
                type="range"
                min="1"
                max="5"
                value={settings.articlesPerRun}
                onChange={(e) => setSettings({ ...settings, articlesPerRun: parseInt(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-400">
                1 = Minder vaak, 5 = Meer artikelen per keer
              </p>
            </div>

            {/* Word Count */}
            <div className="space-y-2">
              <Label className="text-white font-medium">
                Woorden per artikel: {settings.wordCount}
              </Label>
              <select
                value={settings.wordCount}
                onChange={(e) => setSettings({ ...settings, wordCount: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-orange-500/30 text-white rounded-lg"
              >
                <option value="1500">1500 woorden</option>
                <option value="2000">2000 woorden</option>
                <option value="3000">3000 woorden</option>
                <option value="4000">4000 woorden</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Prioriteit Filter</Label>
              <select
                value={settings.priority}
                onChange={(e) => setSettings({ ...settings, priority: e.target.value as any })}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-orange-500/30 text-white rounded-lg"
              >
                <option value="all">Alle prioriteiten</option>
                <option value="high">Alleen hoge prioriteit</option>
                <option value="medium">Hoge + medium prioriteit</option>
              </select>
            </div>

            {/* Auto-publish */}
            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-orange-500/20 rounded-lg">
              <div>
                <Label htmlFor="auto-publish" className="text-white font-medium">
                  Auto-publiceren
                </Label>
                <p className="text-sm text-gray-400 mt-1">
                  Publiceer direct naar WordPress
                </p>
              </div>
              <Switch
                id="auto-publish"
                checked={settings.autoPublish}
                onCheckedChange={(checked) => setSettings({ ...settings, autoPublish: checked })}
              />
            </div>

            {/* Content Options */}
            <div className="space-y-3">
              <Label className="text-white font-medium">Content Opties</Label>
              
              <div className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-orange-500/20 rounded-lg">
                <Label htmlFor="include-faq" className="text-sm text-gray-300">
                  FAQ sectie toevoegen
                </Label>
                <Switch
                  id="include-faq"
                  checked={settings.includeFAQ}
                  onCheckedChange={(checked) => setSettings({ ...settings, includeFAQ: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-orange-500/20 rounded-lg">
                <Label htmlFor="include-direct-answer" className="text-sm text-gray-300">
                  Direct antwoord box
                </Label>
                <Switch
                  id="include-direct-answer"
                  checked={settings.includeDirectAnswer}
                  onCheckedChange={(checked) => setSettings({ ...settings, includeDirectAnswer: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-orange-500/20 rounded-lg">
                <Label htmlFor="include-youtube" className="text-sm text-gray-300">
                  YouTube video's toevoegen
                </Label>
                <Switch
                  id="include-youtube"
                  checked={settings.includeYouTube}
                  onCheckedChange={(checked) => setSettings({ ...settings, includeYouTube: checked })}
                />
              </div>
            </div>

            {/* Image Count */}
            <div className="space-y-2">
              <Label className="text-white font-medium">
                Aantal afbeeldingen per artikel: {settings.imageCount}
              </Label>
              <input
                type="range"
                min="0"
                max="5"
                value={settings.imageCount}
                onChange={(e) => setSettings({ ...settings, imageCount: parseInt(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-400">
                0 = Geen afbeeldingen, 5 = Maximum afbeeldingen
              </p>
            </div>

            {/* Publishing Schedule */}
            <div className="space-y-3">
              <Label className="text-white font-medium">Publicatie Schema</Label>
              
              {/* Days Selection */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-400">Selecteer dagen</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'monday', label: 'Maandag' },
                    { value: 'tuesday', label: 'Dinsdag' },
                    { value: 'wednesday', label: 'Woensdag' },
                    { value: 'thursday', label: 'Donderdag' },
                    { value: 'friday', label: 'Vrijdag' },
                    { value: 'saturday', label: 'Zaterdag' },
                    { value: 'sunday', label: 'Zondag' },
                  ].map((day) => (
                    <button
                      key={day.value}
                      onClick={() => {
                        const days = settings.publishingDays || [];
                        if (days.includes(day.value)) {
                          setSettings({ ...settings, publishingDays: days.filter(d => d !== day.value) });
                        } else {
                          setSettings({ ...settings, publishingDays: [...days, day.value] });
                        }
                      }}
                      className={`p-2 rounded-lg border text-sm transition-all ${
                        (settings.publishingDays || []).includes(day.value)
                          ? 'bg-orange-500/20 border-orange-500 text-white'
                          : 'bg-[#0a0a0a] border-orange-500/20 text-gray-400 hover:border-orange-500/50'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                {(!settings.publishingDays || settings.publishingDays.length === 0) && (
                  <p className="text-xs text-orange-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Selecteer minimaal 1 dag
                  </p>
                )}
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-400">Publicatietijd</Label>
                <input
                  type="time"
                  value={settings.publishingTime || '09:00'}
                  onChange={(e) => setSettings({ ...settings, publishingTime: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-orange-500/30 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Summary */}
              {settings.publishingDays && settings.publishingDays.length > 0 && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-400">
                    📅 Publiceert {settings.publishingDays.length}x per week om {settings.publishingTime || '09:00'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {settings.publishingDays.map(d => {
                      const dayNames: Record<string, string> = {
                        monday: 'ma', tuesday: 'di', wednesday: 'wo',
                        thursday: 'do', friday: 'vr', saturday: 'za', sunday: 'zo'
                      };
                      return dayNames[d] || d;
                    }).join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4 border-t border-orange-500/20">
              <Button
                onClick={saveSettings}
                disabled={isSavingSettings}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Instellingen Opslaan
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Manual Run Button */}
      <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/20 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
              <Play className="w-5 h-5 text-green-500" />
              Handmatig Starten
            </h3>
            <p className="text-sm text-gray-300">
              Start de autopilot nu met de huidige instellingen. Dit genereert direct content zonder te wachten op de geplande run.
            </p>
          </div>
          <Button
            onClick={runNow}
            disabled={isRunningNow || activeJobs.length > 0}
            className="bg-green-500 hover:bg-green-600 text-white shrink-0"
          >
            {isRunningNow ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starten...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Nu Starten
              </>
            )}
          </Button>
        </div>
        {activeJobs.length > 0 && (
          <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-sm text-orange-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Er zijn al actieve jobs bezig. Wacht tot deze klaar zijn.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
