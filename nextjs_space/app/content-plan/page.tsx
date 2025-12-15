'use client';

import SimplifiedLayout from '@/components/SimplifiedLayout';
import { Sparkles } from 'lucide-react';

export default function ContentPlanPage() {
  return (
    <SimplifiedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">📝 Content Plan</h1>
          <p className="text-lg text-slate-600 mt-2">Plan je content strategie met AI</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-slate-800 mb-4">🎯 Nieuw Content Plan</h2>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Voer een keyword in (bijv. 'fitness tips')"
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>Genereer Plan</span>
            </button>
          </div>
        </div>
      </div>
    </SimplifiedLayout>
  );
}
