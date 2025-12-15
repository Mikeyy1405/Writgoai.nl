'use client';

import SimplifiedLayout from '@/components/SimplifiedLayout';
import { Sparkles } from 'lucide-react';

export default function GeneratePage() {
  return (
    <SimplifiedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">✨ Content Genereren</h1>
          <p className="text-lg text-slate-600 mt-2">Laat AI je artikelen schrijven</p>
        </div>
        <div className="bg-white rounded-xl p-12 text-center shadow-lg">
          <Sparkles className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Maak eerst een content plan!</h2>
          <p className="text-slate-600">Ga naar Content Plan om topics te genereren.</p>
        </div>
      </div>
    </SimplifiedLayout>
  );
}
