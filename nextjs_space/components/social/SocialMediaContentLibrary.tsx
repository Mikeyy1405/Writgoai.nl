'use client';

import { useState } from 'react';
import { Calendar, Share2 } from 'lucide-react';

export default function SocialMediaContentLibrary() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="p-4 bg-purple-500/10 rounded-full inline-flex mb-4">
          <Calendar className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Content Kalender Coming Soon
        </h3>
        <p className="text-gray-400 mb-6">
          Hier kun je binnenkort al je geplande en gepubliceerde social media posts beheren 
          in een overzichtelijke kalender.
        </p>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-900 rounded-lg p-3">
            <Share2 className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-gray-400">LinkedIn</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <Share2 className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-gray-400">Instagram</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <Share2 className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-gray-400">Twitter/X</p>
          </div>
        </div>
      </div>
    </div>
  );
}
