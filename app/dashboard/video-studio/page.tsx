'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

// Types
interface VideoScene {
  id: string;
  scene_number: number;
  prompt: string;
  narration_text: string;
  style: string;
  model: string;
  duration: number;
  video_url: string | null;
  voice_url: string | null;
  status: string;
  error_message: string | null;
}

interface VideoProject {
  id: string;
  title: string;
  description: string;
  aspect_ratio: string;
  status: string;
  voice_id: string;
  music_url: string | null;
  final_video_url: string | null;
  total_duration: number;
  total_credits_used: number;
  created_at: string;
  scenes: VideoScene[];
}

interface VideoModel {
  id: string;
  name: string;
  description: string;
  credits: number;
  maxDuration: number;
}

interface VideoStyle {
  id: string;
  name: string;
  prompt: string;
}

// Default models and voices (will be overwritten by API)
const DEFAULT_MODELS: VideoModel[] = [
  { id: 'luma/ray-2', name: 'Luma Ray 2', description: 'High-quality cinematic video', credits: 15, maxDuration: 10 },
  { id: 'luma/ray-flash-2', name: 'Luma Ray Flash 2', description: 'Fast video generation', credits: 8, maxDuration: 10 },
  { id: 'kling-video/v1.6/standard/text-to-video', name: 'Kling 1.6', description: 'Excellent quality', credits: 12, maxDuration: 10 },
];

const DEFAULT_VOICES = ['Rachel', 'Drew', 'Clyde', 'Paul', 'Sarah', 'Emily'];

const ASPECT_RATIOS = [
  { id: '9:16', name: 'TikTok/Shorts', description: 'Verticaal (9:16)' },
  { id: '16:9', name: 'YouTube', description: 'Horizontaal (16:9)' },
  { id: '1:1', name: 'Instagram', description: 'Vierkant (1:1)' },
];

type ViewMode = 'projects' | 'create' | 'edit' | 'generate';

export default function VideoStudioPage() {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('projects');
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [currentProject, setCurrentProject] = useState<VideoProject | null>(null);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<VideoModel[]>(DEFAULT_MODELS);
  const [availableVoices, setAvailableVoices] = useState<string[]>(DEFAULT_VOICES);
  const [availableStyles, setAvailableStyles] = useState<VideoStyle[]>([]);

  // Create form state
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    aspectRatio: '9:16',
    numberOfScenes: 6,
    sceneDuration: 5,
    model: 'luma/ray-2',
    voiceId: 'Rachel',
    musicPrompt: '',
  });

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');

  // Load initial data
  useEffect(() => {
    loadCreditBalance();
    loadProjects();
  }, []);

  const loadCreditBalance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/credits/balance', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCreditBalance(data.credits);
      }
    } catch (error) {
      console.error('Error loading credit balance:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/video-studio/projects', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const createProject = async () => {
    if (!newProject.title.trim() || !newProject.description.trim()) {
      setError('Vul een titel en beschrijving in');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Je moet ingelogd zijn');
        return;
      }

      const response = await fetch('/api/video-studio/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Project aanmaken mislukt');
        return;
      }

      // Update available options from API response
      if (data.availableModels) setAvailableModels(data.availableModels);
      if (data.availableVoices) setAvailableVoices(data.availableVoices);
      if (data.availableStyles) setAvailableStyles(data.availableStyles);

      setCurrentProject(data.project);
      setViewMode('edit');
      await loadProjects();

    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden');
    } finally {
      setIsLoading(false);
    }
  };

  const startGeneration = async () => {
    if (!currentProject) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Video generatie starten...');
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Je moet ingelogd zijn');
        return;
      }

      // Start generation (non-blocking)
      fetch(`/api/video-studio/projects/${currentProject.id}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voiceId: currentProject.voice_id,
          generateMusic: true,
        }),
      }).catch((err) => {
        console.error('Generation error:', err);
      });

      // Poll for status updates
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/video-studio/projects/${currentProject.id}/generate`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            const { project, progress, completedScenes, totalScenes } = statusData;

            // Update progress
            setGenerationProgress(progress);

            // Update status message
            if (progress === 100) {
              setGenerationStatus('✅ Alle scenes zijn gegenereerd!');
              setCurrentProject(project);
              clearInterval(pollInterval);
              setIsGenerating(false);
              await loadCreditBalance();
              await loadProjects();
            } else if (progress > 0) {
              setGenerationStatus(`🎬 Bezig met genereren: ${completedScenes}/${totalScenes} scenes klaar...`);
              // Update the current project to show real-time scene updates
              setCurrentProject(project);
            } else {
              setGenerationStatus('⏳ Video generatie is gestart, even geduld...');
            }
          }
        } catch (err) {
          console.error('Poll error:', err);
        }
      }, 5000); // Poll every 5 seconds

      // Cleanup polling after 10 minutes (safety measure)
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          setError('Generatie timeout - controleer de project status');
        }
      }, 600000); // 10 minutes

    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden');
      setIsGenerating(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Weet je zeker dat je dit project wilt verwijderen?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`/api/video-studio/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      await loadProjects();
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
        setViewMode('projects');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const openProject = async (project: VideoProject) => {
    setCurrentProject(project);
    setViewMode('edit');
  };

  const calculateEstimatedCredits = () => {
    const model = availableModels.find(m => m.id === newProject.model);
    const credits = model?.credits || 10;
    return newProject.numberOfScenes * credits + // Videos
           newProject.numberOfScenes * 2 + // Voice-overs
           5; // Music
  };

  const getStyleName = (styleId: string) => {
    const style = availableStyles.find(s => s.id === styleId);
    return style?.name || styleId;
  };

  // Render projects list
  const renderProjectsList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mijn Video Projecten</h2>
          <p className="text-gray-400">Beheer je AI-gegenereerde video's</p>
        </div>
        <button
          onClick={() => setViewMode('create')}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg font-bold"
        >
          + Nieuw Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-lg border border-gray-700 border-dashed">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-2xl font-bold mb-2">Nog geen projecten</h3>
          <p className="text-gray-400 mb-6">
            Maak je eerste AI video met automatische scene generatie
          </p>
          <button
            onClick={() => setViewMode('create')}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-bold"
          >
            Start je eerste video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 hover:border-orange-500 transition-colors cursor-pointer"
              onClick={() => openProject(project)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg truncate">{project.title}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  project.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  project.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                  project.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {project.description}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{project.scenes?.length || 0} scenes</span>
                <span>{project.total_duration}s</span>
                <span>{project.aspect_ratio}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteProject(project.id);
                }}
                className="mt-3 text-red-400 hover:text-red-300 text-sm"
              >
                Verwijderen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render create form
  const renderCreateForm = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setViewMode('projects')}
          className="text-gray-400 hover:text-white"
        >
          ← Terug
        </button>
        <h2 className="text-2xl font-bold">Nieuw Video Project</h2>
      </div>

      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Video Titel</label>
          <input
            type="text"
            value={newProject.title}
            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            placeholder="bijv. 5 Tips voor Productiviteit"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Beschrijving / Script</label>
          <textarea
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            placeholder="Beschrijf je video inhoud. Dit wordt gebruikt om scenes en voice-over automatisch te genereren..."
            rows={5}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="block text-sm font-medium mb-2">Formaat</label>
          <div className="grid grid-cols-3 gap-3">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.id}
                onClick={() => setNewProject({ ...newProject, aspectRatio: ratio.id })}
                className={`p-4 rounded-lg text-center transition-all ${
                  newProject.aspectRatio === ratio.id
                    ? 'bg-orange-500/20 border-2 border-orange-500'
                    : 'bg-gray-900 border border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="font-bold">{ratio.name}</div>
                <div className="text-sm text-gray-400">{ratio.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Number of Scenes */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Aantal Scenes: {newProject.numberOfScenes}
          </label>
          <input
            type="range"
            min="3"
            max="12"
            value={newProject.numberOfScenes}
            onChange={(e) => setNewProject({ ...newProject, numberOfScenes: parseInt(e.target.value) })}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>3 scenes (kort)</span>
            <span>12 scenes (lang)</span>
          </div>
        </div>

        {/* Scene Duration */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Duur per scene: {newProject.sceneDuration}s
          </label>
          <input
            type="range"
            min="3"
            max="10"
            value={newProject.sceneDuration}
            onChange={(e) => setNewProject({ ...newProject, sceneDuration: parseInt(e.target.value) })}
            className="w-full accent-orange-500"
          />
        </div>

        {/* Video Model */}
        <div>
          <label className="block text-sm font-medium mb-2">Video Model</label>
          <div className="grid grid-cols-1 gap-2">
            {availableModels.map((model) => (
              <button
                key={model.id}
                onClick={() => setNewProject({ ...newProject, model: model.id })}
                className={`p-4 rounded-lg text-left transition-all ${
                  newProject.model === model.id
                    ? 'bg-orange-500/20 border-2 border-orange-500'
                    : 'bg-gray-900 border border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{model.name}</span>
                  <span className="text-orange-400 text-sm">{model.credits} credits/scene</span>
                </div>
                <div className="text-sm text-gray-400">{model.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Voice */}
        <div>
          <label className="block text-sm font-medium mb-2">Voice-over Stem</label>
          <select
            value={newProject.voiceId}
            onChange={(e) => setNewProject({ ...newProject, voiceId: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
          >
            {availableVoices.map((voice) => (
              <option key={voice} value={voice}>{voice}</option>
            ))}
          </select>
        </div>

        {/* Music Prompt */}
        <div>
          <label className="block text-sm font-medium mb-2">Achtergrondmuziek (optioneel)</label>
          <input
            type="text"
            value={newProject.musicPrompt}
            onChange={(e) => setNewProject({ ...newProject, musicPrompt: e.target.value })}
            placeholder="bijv. Upbeat electronic music, motivational"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Estimated Credits */}
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Geschatte kosten:</span>
            <span className="text-2xl font-bold text-orange-400">
              {calculateEstimatedCredits()} credits
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {newProject.numberOfScenes} video's + {newProject.numberOfScenes} voice-overs + muziek
          </div>
          {creditBalance < calculateEstimatedCredits() && (
            <div className="text-red-400 text-sm mt-2">
              Je hebt onvoldoende credits ({creditBalance} beschikbaar)
            </div>
          )}
        </div>

        {/* Create Button */}
        <button
          onClick={createProject}
          disabled={isLoading || !newProject.title.trim() || !newProject.description.trim()}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold text-lg transition-all disabled:cursor-not-allowed"
        >
          {isLoading ? 'Project aanmaken...' : 'Maak Project & Genereer Scenes'}
        </button>
      </div>
    </div>
  );

  // Render project editor
  const renderProjectEditor = () => {
    if (!currentProject) return null;

    const completedScenes = currentProject.scenes?.filter(s => s.status === 'completed').length || 0;
    const totalScenes = currentProject.scenes?.length || 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setCurrentProject(null);
                setViewMode('projects');
              }}
              className="text-gray-400 hover:text-white"
            >
              ← Terug
            </button>
            <div>
              <h2 className="text-2xl font-bold">{currentProject.title}</h2>
              <p className="text-gray-400">{currentProject.description.slice(0, 100)}...</p>
            </div>
          </div>

          {currentProject.status === 'draft' && (
            <button
              onClick={startGeneration}
              disabled={isGenerating}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold"
            >
              {isGenerating ? 'Genereren...' : 'Start Video Generatie'}
            </button>
          )}

          {currentProject.status === 'completed' && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  // Download all scenes as a zip or play sequentially
                  alert('Download functie komt binnenkort!');
                }}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-bold"
              >
                Download Video's
              </button>
              <button
                onClick={() => {
                  // Publish to social media via Getlate
                  alert('Social media publicatie via Later komt binnenkort!');
                }}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg font-bold"
              >
                Publiceer naar Social Media
              </button>
            </div>
          )}
        </div>

        {/* Generation Progress */}
        {isGenerating && (
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">{generationStatus}</span>
              <span className="text-orange-400">{generationProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Project Info */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{totalScenes}</div>
            <div className="text-sm text-gray-400">Scenes</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{currentProject.total_duration}s</div>
            <div className="text-sm text-gray-400">Duur</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{currentProject.aspect_ratio}</div>
            <div className="text-sm text-gray-400">Formaat</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{completedScenes}/{totalScenes}</div>
            <div className="text-sm text-gray-400">Compleet</div>
          </div>
        </div>

        {/* Scenes Grid */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Scenes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentProject.scenes?.map((scene) => (
              <div
                key={scene.id}
                className={`bg-gray-800/50 rounded-lg border p-4 ${
                  scene.status === 'completed' ? 'border-green-500/50' :
                  scene.status === 'generating' ? 'border-yellow-500/50' :
                  scene.status === 'failed' ? 'border-red-500/50' :
                  'border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold">Scene {scene.scene_number}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    scene.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    scene.status === 'generating' ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' :
                    scene.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {scene.status === 'generating' ? '⏳ Genereren...' :
                     scene.status === 'completed' ? '✓ Klaar' :
                     scene.status === 'failed' ? '✗ Mislukt' :
                     'Wachtend'}
                  </span>
                </div>

                {/* Video Preview */}
                {scene.video_url && (
                  <div className="mb-3 bg-black rounded-lg overflow-hidden">
                    <video
                      src={scene.video_url}
                      controls
                      className="w-full h-auto"
                    />
                  </div>
                )}

                {/* Scene Details */}
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Stijl: </span>
                    <span className="text-orange-400">{getStyleName(scene.style)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Prompt: </span>
                    <span className="text-gray-300">{scene.prompt.slice(0, 80)}...</span>
                  </div>
                  {scene.narration_text && (
                    <div>
                      <span className="text-gray-400">Voice-over: </span>
                      <span className="text-gray-300">"{scene.narration_text.slice(0, 50)}..."</span>
                    </div>
                  )}
                  {scene.voice_url && (
                    <div>
                      <audio src={scene.voice_url} controls className="w-full h-8 mt-2" />
                    </div>
                  )}
                  {scene.error_message && (
                    <div className="text-red-400 text-xs mt-2">
                      Error: {scene.error_message}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Music Section */}
        {currentProject.music_url && (
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
            <h3 className="font-bold mb-3">Achtergrondmuziek</h3>
            <audio src={currentProject.music_url} controls className="w-full" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            Video Studio
          </h1>
          <p className="text-gray-400">
            Maak complete AI video's met automatische scene generatie, voice-over en muziek
          </p>

          <div className="mt-4 flex items-center gap-4">
            <div className="px-4 py-2 bg-gray-800 rounded-lg">
              <span className="text-gray-400">Credits: </span>
              <span className="text-orange-500 font-bold">{creditBalance}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-700 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 text-sm mt-2 hover:underline"
            >
              Sluiten
            </button>
          </div>
        )}

        {/* Main Content */}
        {viewMode === 'projects' && renderProjectsList()}
        {viewMode === 'create' && renderCreateForm()}
        {viewMode === 'edit' && renderProjectEditor()}
      </div>
    </div>
  );
}
