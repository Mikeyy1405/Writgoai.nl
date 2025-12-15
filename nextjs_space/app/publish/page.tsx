'use client';

import SimplifiedLayout from '@/components/SimplifiedLayout';
import { Send } from 'lucide-react';

export default function PublishPage() {
  return (
    <SimplifiedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">🚀 Publiceren</h1>
          <p className="text-lg text-slate-600 mt-2">Publiceer je content naar WordPress en social media</p>
        </div>
        <div className="bg-white rounded-xl p-12 text-center shadow-lg">
          <Send className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Nog geen artikelen om te publiceren</h2>
          <p className="text-slate-600">Genereer eerst content om te publiceren.</p>
        </div>
      </div>
    </SimplifiedLayout>
  );
}
