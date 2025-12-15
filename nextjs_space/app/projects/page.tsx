'use client';

import SimplifiedLayout from '@/components/SimplifiedLayout';
import { Plus } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <SimplifiedLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">📁 Mijn Projecten</h1>
            <p className="text-lg text-slate-600 mt-2">Beheer je WordPress websites</p>
          </div>
          <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-xl">
            <Plus className="w-5 h-5" />
            <span>Nieuw Project</span>
          </button>
        </div>
        <div className="bg-white rounded-xl p-12 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800">Projecten pagina komt binnenkort!</h2>
          <p className="text-slate-600 mt-2">We maken dit super simpel voor je.</p>
        </div>
      </div>
    </SimplifiedLayout>
  );
}
