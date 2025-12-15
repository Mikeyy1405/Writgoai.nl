'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProgressStatusBar, useProgressSteps, ProgressStep } from '@/components/simplified/ProgressStatusBar';
import { Sparkles, Globe, Loader2, ArrowRight, FileText } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  websiteUrl: string | null;
}

interface ContentPlanTopic {
  title: string;
  description: string;
  keywords: string[];
  priority: string;
  reason?: string;
}

interface ContentPlan {
  id: string;
  source: string;
  name: string;
  plan: {
    source: string;
    keyword?: string;
    topics: ContentPlanTopic[];
    generatedAt: string;
  };
  lastGenerated: string;
}

const WORDPRESS_STEPS: ProgressStep[] = [
  { id: 'analyze', label: 'WordPress site analyseren', status: 'pending' },
  { id: 'fetch', label: 'Bestaande content ophalen', status: 'pending' },
  { id: 'ai_analyze', label: 'AI analyseert topics en content gaps', status: 'pending' },
  { id: 'generate', label: 'Content plan genereren', status: 'pending' },
  { id: 'save', label: 'Plan opslaan', status: 'pending' },
  { id: 'complete', label: 'Klaar! ✅', status: 'pending' },
];

const MANUAL_STEPS: ProgressStep[] = [
  { id: 'keyword', label: 'Keyword verwerken', status: 'pending' },
  { id: 'research', label: 'AI doet keyword research', status: 'pending' },
  { id: 'topics', label: 'Topics genereren', status: 'pending' },
  { id: 'plan', label: 'Content plan maken', status: 'pending' },
  { id: 'save', label: 'Plan opslaan', status: 'pending' },
  { id: 'complete', label: 'Klaar! ✅', status: 'pending' },
];

export default function ContentPlanPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [mode, setMode] = useState<'wordpress' | 'manual'>('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New state for content plan display
  const [contentPlanItems, setContentPlanItems] = useState<ContentPlanTopic[]>([]);
  const [existingPlans, setExistingPlans] = useState<ContentPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  const { steps: wpSteps, setStepStatus: setWpStepStatus, resetSteps: resetWpSteps } = useProgressSteps(WORDPRESS_STEPS);
  const { steps: manualSteps, setStepStatus: setManualStepStatus, resetSteps: resetManualSteps } = useProgressSteps(MANUAL_STEPS);

  const currentSteps = mode === 'wordpress' ? wpSteps : manualSteps;
  const setStepStatus = mode === 'wordpress' ? setWpStepStatus : setManualStepStatus;

  useEffect(() => {
    fetchProjects();
    fetchExistingPlans();
  }, []);

  // Load content plan when selected plan changes
  useEffect(() => {
    if (selectedPlanId && existingPlans.length > 0) {
      const plan = existingPlans.find(p => p.id === selectedPlanId);
      if (plan?.plan?.topics) {
        setContentPlanItems(plan.plan.topics);
      }
    }
  }, [selectedPlanId, existingPlans]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/simplified/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchExistingPlans = async () => {
    try {
      const res = await fetch('/api/simplified/content-plan');
      if (res.ok) {
        const data = await res.json();
        setExistingPlans(data.plans || []);
        
        // Auto-select first plan if available
        if (data.plans && data.plans.length > 0) {
          setSelectedPlanId(data.plans[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching existing plans:', error);
    }
  };

  const handleGenerateWordPress = async () => {
    if (!selectedProject) {
      setError('Selecteer een project');
      return;
    }

    setError('');
    setLoading(true);
    resetWpSteps();

    try {
      // Stap 1: Start analyseren
      setStepStatus('analyze', 'in_progress', 'WordPress REST API wordt bevraagd...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stap 2: Content ophalen
      setStepStatus('analyze', 'completed');
      setStepStatus('fetch', 'in_progress', 'Posts, categories en tags worden opgehaald...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stap 3: AI analyse
      setStepStatus('fetch', 'completed');
      setStepStatus('ai_analyze', 'in_progress', 'AI analyseert bestaande content en vindt content gaps...');

      const response = await fetch('/api/simplified/content-plan/analyze-wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze WordPress site');
      }

      // Stap 4: Plan genereren
      setStepStatus('ai_analyze', 'completed');
      setStepStatus('generate', 'in_progress', `${data.topics?.length || 0} nieuwe topics gegenereerd...`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stap 5: Opslaan
      setStepStatus('generate', 'completed');
      setStepStatus('save', 'in_progress', 'Content plan wordt opgeslagen...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stap 6: Klaar
      setStepStatus('save', 'completed');
      setStepStatus('complete', 'completed', 'Je content plan is klaar om mee te werken!');

      // Update state with generated topics
      setContentPlanItems(data.topics || []);
      
      // Refresh existing plans to include the new one
      await fetchExistingPlans();
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Er is iets misgegaan');
      const currentInProgress = currentSteps.find(s => s.status === 'in_progress');
      if (currentInProgress) {
        setStepStatus(currentInProgress.id, 'error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateManual = async () => {
    if (!keyword.trim()) {
      setError('Voer een keyword in');
      return;
    }

    setError('');
    setLoading(true);
    resetManualSteps();

    try {
      // Stap 1: Keyword verwerken
      setStepStatus('keyword', 'in_progress', 'Keyword wordt verwerkt...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stap 2: Research
      setStepStatus('keyword', 'completed');
      setStepStatus('research', 'in_progress', 'AI doet keyword research en competitor analysis...');

      const response = await fetch('/api/simplified/content-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject || undefined,
          keyword: keyword.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content plan');
      }

      // Stap 3: Topics genereren
      setStepStatus('research', 'completed');
      setStepStatus('topics', 'in_progress', `${data.topics?.length || 0} relevante topics gevonden...`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stap 4: Plan maken
      setStepStatus('topics', 'completed');
      setStepStatus('plan', 'in_progress', 'Content plan wordt samengesteld...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Stap 5: Opslaan
      setStepStatus('plan', 'completed');
      setStepStatus('save', 'in_progress', 'Plan wordt opgeslagen in je project...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stap 6: Klaar
      setStepStatus('save', 'completed');
      setStepStatus('complete', 'completed', 'Je content plan is klaar!');

      // Update state with generated topics
      setContentPlanItems(data.topics || []);
      
      // Refresh existing plans to include the new one
      await fetchExistingPlans();
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Er is iets misgegaan');
      const currentInProgress = currentSteps.find(s => s.status === 'in_progress');
      if (currentInProgress) {
        setStepStatus(currentInProgress.id, 'error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            📝 Content Plan
          </h1>
          <p className="text-gray-400">Plan je content strategie met AI</p>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setMode('manual')}
            className={`p-6 rounded-lg border-2 transition-all ${
              mode === 'manual'
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
          >
            <Sparkles className={`w-8 h-8 mb-3 ${mode === 'manual' ? 'text-orange-500' : 'text-gray-400'}`} />
            <h3 className="text-lg font-semibold text-white mb-2">Handmatig</h3>
            <p className="text-sm text-gray-400">Voer een keyword in en AI genereert een content plan</p>
          </button>

          <button
            onClick={() => setMode('wordpress')}
            className={`p-6 rounded-lg border-2 transition-all ${
              mode === 'wordpress'
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
          >
            <Globe className={`w-8 h-8 mb-3 ${mode === 'wordpress' ? 'text-orange-500' : 'text-gray-400'}`} />
            <h3 className="text-lg font-semibold text-white mb-2">WordPress Analyse</h3>
            <p className="text-sm text-gray-400">Analyseer je WordPress site en vind content gaps</p>
          </button>
        </div>

        {/* Form */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-4">
          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Koppel aan project (optioneel)
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">-- Selecteer project --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Keyword Input (for manual mode) */}
          {mode === 'manual' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Voer een keyword in (bijv. 'fitness tips')
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="fitness tips"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={mode === 'wordpress' ? handleGenerateWordPress : handleGenerateManual}
            disabled={loading || (mode === 'manual' && !keyword.trim()) || (mode === 'wordpress' && !selectedProject)}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Bezig met genereren...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Genereer Plan</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Status Bar */}
        {loading && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <ProgressStatusBar steps={currentSteps} />
          </div>
        )}

        {/* Existing Plans Section */}
        {!loading && existingPlans.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Bestaande Content Plans</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Selecteer een content plan om te bekijken
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">-- Selecteer een plan --</option>
                {existingPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} {plan.plan.keyword ? `(${plan.plan.keyword})` : ''} - {new Date(plan.lastGenerated).toLocaleDateString('nl-NL')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Content Plan Items Display */}
        {!loading && contentPlanItems.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                📋 Content Plan Items ({contentPlanItems.length} topics)
              </h2>
            </div>
            
            <div className="space-y-3">
              {contentPlanItems.map((topic, index) => (
                <div
                  key={index}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-5 space-y-3 hover:border-gray-600 transition-all"
                >
                  {/* Priority Badge and Title */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                            topic.priority === 'high'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : topic.priority === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-green-500/20 text-green-400 border border-green-500/30'
                          }`}
                        >
                          {topic.priority === 'high' ? '🔥 HIGH' : topic.priority === 'medium' ? '🟡 MEDIUM' : '🟢 LOW'}
                        </span>
                        <h3 className="text-lg font-semibold text-white flex-1">
                          {topic.title}
                        </h3>
                      </div>
                      
                      {/* Description */}
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {topic.description}
                      </p>
                      
                      {/* Keywords */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500 font-medium">Keywords:</span>
                        {topic.keywords.map((keyword, kidx) => (
                          <span
                            key={kidx}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-800 text-gray-300 border border-gray-700"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                      
                      {/* Reason (if available from WordPress analysis) */}
                      {topic.reason && topic.reason !== topic.description && (
                        <p className="text-xs text-gray-500 italic">
                          💡 {topic.reason}
                        </p>
                      )}
                    </div>
                    
                    {/* Write Article Button */}
                    <button
                      onClick={() => {
                        const keywordsParam = encodeURIComponent(topic.keywords.join(','));
                        const titleParam = encodeURIComponent(topic.title);
                        router.push(`/generate?title=${titleParam}&keywords=${keywordsParam}`);
                      }}
                      className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      <span>Schrijf artikel</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && contentPlanItems.length === 0 && existingPlans.length === 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Nog geen content plan
            </h3>
            <p className="text-gray-500">
              Genereer je eerste content plan met een keyword of WordPress analyse
            </p>
          </div>
        )}

        {/* Empty State - Plan selected but no items */}
        {!loading && contentPlanItems.length === 0 && existingPlans.length > 0 && selectedPlanId && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Geen topics in dit plan
            </h3>
            <p className="text-gray-500">
              Selecteer een ander plan of genereer een nieuw content plan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
