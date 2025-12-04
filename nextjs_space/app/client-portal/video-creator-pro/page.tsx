'use client';

/**
 * AI Video Creator Pro
 * Professioneel systeem voor faceless YouTube video generatie
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  AVAILABLE_NICHES,
  LANGUAGE_OPTIONS,
  VIDEO_LENGTH_OPTIONS,
  TONE_OPTIONS,
  IMAGE_STYLE_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
} from '@/lib/niche-presets';

export default function VideoCreatorProPage() {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    niche: 'lifestyle',
    onderwerp: '',
    taal: 'nl',
    videoLengte: 'medium',
    toon: 'informatief',
    beeldstijl: 'realistic',
    aspectRatio: '9:16',
    projectId: '',
  });

  // Results
  const [videoIdeas, setVideoIdeas] = useState<any[]>([]);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);

  // Load projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/client/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  // Step 1: Generate Ideas
  const handleGenerateIdeas = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/client/video-creator-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_ideas',
          data: {
            niche: formData.niche,
            onderwerp: formData.onderwerp,
            taal: formData.taal,
            projectId: formData.projectId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ideas');
      }

      const result = await response.json();
      setVideoIdeas(result.ideas);
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || 'Er ging iets mis bij het genereren van ideeën');
    } finally {
      setLoading(false);
    }
  };

  // Complete workflow
  const handleGenerateComplete = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/client/video-creator-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_complete',
          data: {
            ...formData,
            selectedIdeaIndex,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate video');
      }

      const result = await response.json();
      setGeneratedVideo(result.result);
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || 'Er ging iets mis bij het genereren van de video');
    } finally {
      setLoading(false);
    }
  };

  const selectedNiche = AVAILABLE_NICHES.find(n => n.value === formData.niche);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🎬 AI Video Creator Pro
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Genereer professionele faceless YouTube video's in minuten
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: 'Configuratie', icon: '⚙️' },
              { step: 2, label: 'Idee Selectie', icon: '💡' },
              { step: 3, label: 'Video Generatie', icon: '🎬' },
            ].map((item, idx) => (
              <div key={item.step} className="flex-1 flex items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full text-xl ${
                    currentStep >= item.step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {item.icon}
                </div>
                <div className="ml-3 flex-1">
                  <div
                    className={`text-sm font-medium ${
                      currentStep >= item.step
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-500'
                    }`}
                  >
                    Stap {item.step}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{item.label}</div>
                </div>
                {idx < 2 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      currentStep > item.step
                        ? 'bg-blue-600'
                        : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 dark:text-red-400 mr-2">⚠️</span>
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Step 1: Configuration */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Video Configuratie
            </h2>

            <div className="space-y-6">
              {/* Niche Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Niche *
                </label>
                <select
                  value={formData.niche}
                  onChange={e => setFormData({ ...formData, niche: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {AVAILABLE_NICHES.map(niche => (
                    <option key={niche.value} value={niche.value}>
                      {niche.label} - {niche.description}
                    </option>
                  ))}
                </select>
                {selectedNiche && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {selectedNiche.description}
                  </p>
                )}
              </div>

              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project (Optioneel)
                </label>
                <select
                  value={formData.projectId}
                  onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Geen project geselecteerd</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Selecteer een project om brand voice en target audience te gebruiken
                </p>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Onderwerp (Optioneel)
                </label>
                <input
                  type="text"
                  value={formData.onderwerp}
                  onChange={e => setFormData({ ...formData, onderwerp: e.target.value })}
                  placeholder="Laat leeg voor AI suggesties..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Language & Length Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Taal *
                  </label>
                  <select
                    value={formData.taal}
                    onChange={e => setFormData({ ...formData, taal: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {LANGUAGE_OPTIONS.map(lang => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Video Lengte *
                  </label>
                  <select
                    value={formData.videoLengte}
                    onChange={e => setFormData({ ...formData, videoLengte: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {VIDEO_LENGTH_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tone & Style Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Toon *
                  </label>
                  <select
                    value={formData.toon}
                    onChange={e => setFormData({ ...formData, toon: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {TONE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Beeldstijl *
                  </label>
                  <select
                    value={formData.beeldstijl}
                    onChange={e => setFormData({ ...formData, beeldstijl: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {IMAGE_STYLE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aspect Ratio *
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: '9:16', label: 'Verticaal (TikTok, Reels)', icon: '📱' },
                    { value: '16:9', label: 'Horizontaal (YouTube)', icon: '🖥️' },
                    { value: '1:1', label: 'Vierkant (Instagram)', icon: '⬜' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFormData({ ...formData, aspectRatio: option.value })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.aspectRatio === option.value
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-700 hover:border-blue-400'
                      }`}
                    >
                      <div className="text-3xl mb-2">{option.icon}</div>
                      <div className="text-sm font-medium">{option.value}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {option.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <button
                  onClick={handleGenerateIdeas}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Video-ideeën genereren...
                    </span>
                  ) : (
                    '✨ Genereer Video-ideeën'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Idea Selection */}
        {currentStep === 2 && videoIdeas.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Selecteer een Video Idee
            </h2>

            <div className="space-y-4 mb-8">
              {videoIdeas.map((idea, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedIdeaIndex(index)}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedIdeaIndex === index
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-700 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex-1">
                      {idea.titel}
                    </h3>
                    <span className="ml-4 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm font-medium rounded-full">
                      🔥 Viraal Score: {idea.viraalScore}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{idea.beschrijving}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {idea.keywords.slice(0, 5).map((keyword: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    ⏱️ Geschatte duur: {idea.geschatteDuur}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-all"
              >
                ← Terug
              </button>
              <button
                onClick={handleGenerateComplete}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Video genereren (dit kan enkele minuten duren)...
                  </span>
                ) : (
                  '🎬 Genereer Complete Video'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Video Result */}
        {currentStep === 3 && generatedVideo && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              ✅ Video Gegenereerd!
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Video Player */}
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Video Preview
                  </h3>
                  <video
                    controls
                    className="w-full rounded-lg shadow-lg"
                    poster={generatedVideo.video.thumbnailUrl}
                  >
                    <source src={generatedVideo.video.videoUrl} type="video/mp4" />
                  </video>
                </div>

                {/* Download Buttons */}
                <div className="flex gap-3">
                  <a
                    href={generatedVideo.video.videoUrl}
                    download
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-center transition-all"
                  >
                    📥 Download Video
                  </a>
                  <a
                    href={generatedVideo.video.thumbnailUrl}
                    download
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-center transition-all"
                  >
                    🖼️ Download Thumbnail
                  </a>
                </div>
              </div>

              {/* Metadata */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  YouTube Metadata
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Titel
                    </label>
                    <input
                      type="text"
                      value={generatedVideo.video.youtubeMetadata.titel}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Beschrijving
                    </label>
                    <textarea
                      value={generatedVideo.video.youtubeMetadata.beschrijving}
                      readOnly
                      rows={6}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {generatedVideo.video.youtubeMetadata.tags.map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setCurrentStep(1);
                        setGeneratedVideo(null);
                        setVideoIdeas([]);
                        setSelectedIdeaIndex(0);
                      }}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
                    >
                      🎬 Genereer Nieuwe Video
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
