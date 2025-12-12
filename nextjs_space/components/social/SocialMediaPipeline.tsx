'use client';

import { useState } from 'react';
import { Zap, Calendar, Share2 } from 'lucide-react';

interface SocialMediaPipelineProps {
  websiteAnalysis?: any;
}

export default function SocialMediaPipeline({ websiteAnalysis }: SocialMediaPipelineProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="p-4 bg-purple-500/10 rounded-full inline-flex mb-4">
            <Share2 className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Social Media Pipeline Coming Soon
          </h3>
          <p className="text-gray-400 mb-6">
            We werken hard aan de social media pipeline. Binnenkort kun je hier automatisch 
            social media posts genereren voor alle platformen.
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Content planning</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span>Multi-platform</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Share2 className="w-4 h-4" />
              <span>Auto-posting</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
