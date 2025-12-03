'use client';

import { FolderKanban, Loader2 } from 'lucide-react';

export default function ContentHubPage() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF9933] to-orange-600 mb-6">
          <FolderKanban className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
          📍 Content Hub
        </h1>
        <p className="text-zinc-400 mb-8">
          De unified content workflow wordt momenteel gebouwd. Binnenkort beschikbaar!
        </p>
        <div className="flex items-center justify-center gap-2 text-[#FF9933]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Coming Soon...</span>
        </div>
      </div>
    </div>
  );
}
