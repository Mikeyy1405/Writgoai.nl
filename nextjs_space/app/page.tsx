'use client';

import { useEffect, useState } from 'react';
import SimplifiedLayout from '@/components/SimplifiedLayout';
import { useSession } from 'next-auth/react';
import { Users, FileText, TrendingUp, Clock } from 'lucide-react';

/**
 * DASHBOARD - Overzicht en Stats
 * 
 * Simpele kaarten met:
 * - Aantal projecten
 * - Gegenereerde content deze maand
 * - Gepubliceerde artikelen
 * - Recente activiteit
 */

interface Stats {
  totalProjects: number;
  contentThisMonth: number;
  publishedArticles: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    contentThisMonth: 0,
    publishedArticles: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats/overview');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SimplifiedLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-2">👋 Welkom terug, {session?.user?.name || 'daar'}!</h1>
          <p className="text-lg opacity-90">Hier is je content overzicht</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Projecten */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-slate-800">{stats.totalProjects}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Actieve Projecten</h3>
            <p className="text-sm text-slate-500 mt-1">WordPress sites verbonden</p>
          </div>

          {/* Content deze maand */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-slate-800">{stats.contentThisMonth}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Content deze maand</h3>
            <p className="text-sm text-slate-500 mt-1">Artikelen gegenereerd</p>
          </div>

          {/* Gepubliceerd */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-slate-800">{stats.publishedArticles}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Gepubliceerd</h3>
            <p className="text-sm text-slate-500 mt-1">Artikelen live</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">🚀 Snel aan de slag</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/projects"
              className="flex items-center space-x-4 p-4 rounded-lg border-2 border-dashed border-slate-300 hover:border-orange-500 hover:bg-orange-50 transition-all"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Nieuw Project</h3>
                <p className="text-sm text-slate-500">WordPress koppelen</p>
              </div>
            </a>

            <a
              href="/content-plan"
              className="flex items-center space-x-4 p-4 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Content Plannen</h3>
                <p className="text-sm text-slate-500">Nieuwe topics maken</p>
              </div>
            </a>
          </div>
        </div>

        {/* Recente Activiteit */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">📋 Recente Activiteit</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-slate-700">Systeem draait automatisch</span>
            </div>
            <p className="text-sm text-slate-500 px-3">
              💡 Tip: Maak eerst een project aan om te beginnen met content genereren!
            </p>
          </div>
        </div>
      </div>
    </SimplifiedLayout>
  );
}
