'use client';

import SimplifiedLayout from '@/components/SimplifiedLayout';
import { TrendingUp, FileText, Eye } from 'lucide-react';

export default function StatsPage() {
  return (
    <SimplifiedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">📊 Statistieken</h1>
          <p className="text-lg text-slate-600 mt-2">Volg je content performance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8" />
              <span className="text-4xl font-bold">0</span>
            </div>
            <h3 className="text-lg font-semibold">Totaal Artikelen</h3>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-8 h-8" />
              <span className="text-4xl font-bold">0</span>
            </div>
            <h3 className="text-lg font-semibold">Totaal Views</h3>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8" />
              <span className="text-4xl font-bold">0</span>
            </div>
            <h3 className="text-lg font-semibold">Deze Maand</h3>
          </div>
        </div>
      </div>
    </SimplifiedLayout>
  );
}
