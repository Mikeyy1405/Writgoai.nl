'use client';

import { useEffect, useState } from 'react';
import { FileText, Share2, TrendingUp, Calendar, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { useProject } from '@/lib/contexts/ProjectContext';
import Link from 'next/link';

interface DashboardStats {
  blogPosts: number;
  socialPosts: number;
  published: number;
  scheduled: number;
}

export default function ClientDashboardPage() {
  const { currentProject } = useProject();
  const [stats, setStats] = useState<DashboardStats>({
    blogPosts: 0,
    socialPosts: 0,
    published: 0,
    scheduled: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentProject) {
      fetchStats();
    }
  }, [currentProject]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API call when endpoint exists
      // const response = await fetch(`/api/dashboard/stats?projectId=${currentProject?.id}`);
      // const data = await response.json();
      
      // Mock data for now
      setStats({
        blogPosts: 12,
        socialPosts: 48,
        published: 35,
        scheduled: 25
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#FF9933]/10 via-gray-900 to-gray-900 rounded-2xl p-8 border border-gray-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF9933]/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welkom terug! 👋
          </h1>
          <p className="text-gray-400 text-lg">
            Hier is een overzicht van je content prestaties
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FileText}
          label="Blog Artikelen"
          value={stats.blogPosts}
          change="+12 deze maand"
          color="orange"
          loading={loading}
        />
        <StatCard
          icon={Share2}
          label="Social Posts"
          value={stats.socialPosts}
          change="+24 deze maand"
          color="purple"
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label="Gepubliceerd"
          value={stats.published}
          change="+8 deze week"
          color="green"
          loading={loading}
        />
        <StatCard
          icon={Calendar}
          label="Gepland"
          value={stats.scheduled}
          change="Volgende 7 dagen"
          color="blue"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Snel aan de slag</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActionCard
            title="Blog Content Pipeline"
            description="Maak een topical authority map en genereer artikelen"
            href="/dashboard/blog"
            icon={FileText}
            gradient="from-[#FF9933]/10 to-[#FF6B35]/10"
            iconColor="text-[#FF9933]"
          />
          <QuickActionCard
            title="Social Media Pipeline"
            description="Maak een social media strategie en genereer posts"
            href="/dashboard/social"
            icon={Share2}
            gradient="from-purple-500/10 to-purple-600/10"
            iconColor="text-purple-400"
          />
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Aan de slag</h2>
            <p className="text-sm text-gray-400">
              Volg deze stappen om je content marketing op te zetten
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StepCard
            number={1}
            title="Website Analyseren"
            description="Laat AI je website analyseren voor automatische configuratie"
            completed={false}
          />
          <StepCard
            number={2}
            title="Content Plan Maken"
            description="Genereer een blog of social media content strategie"
            completed={false}
          />
          <StepCard
            number={3}
            title="Autopilot Activeren"
            description="Zet automatische content generatie en publicatie aan"
            completed={false}
          />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  change: string;
  color: 'orange' | 'purple' | 'green' | 'blue';
  loading?: boolean;
}

function StatCard({ icon: Icon, label, value, change, color, loading }: StatCardProps) {
  const colors = {
    orange: 'from-[#FF9933]/10 to-[#FF6B35]/10 text-[#FF9933]',
    purple: 'from-purple-500/10 to-purple-600/10 text-purple-400',
    green: 'from-green-500/10 to-green-600/10 text-green-400',
    blue: 'from-blue-500/10 to-blue-600/10 text-blue-400'
  };

  const iconColors = {
    orange: 'text-[#FF9933]',
    purple: 'text-purple-400',
    green: 'text-green-400',
    blue: 'text-blue-400'
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse">
        <div className="h-20"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colors[color]}`}>
          <Icon className={`w-6 h-6 ${iconColors[color]}`} />
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-400 mb-1">{label}</p>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-sm text-gray-500">{change}</p>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
}

function QuickActionCard({ title, description, href, icon: Icon, gradient, iconColor }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group relative bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-200 overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      <div className="relative flex items-start gap-4">
        <div className={`p-3 ${gradient} rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#FF9933] transition-colors">
            {title}
          </h3>
          <p className="text-gray-400 text-sm mb-3">
            {description}
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-400 group-hover:text-[#FF9933] transition-colors">
            <span>Ga naar pipeline</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  completed: boolean;
}

function StepCard({ number, title, description, completed }: StepCardProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
          completed 
            ? 'bg-green-500/10 text-green-400' 
            : 'bg-gray-700 text-gray-400'
        }`}>
          {completed ? '✓' : number}
        </div>
        <h3 className="font-semibold text-white text-sm">{title}</h3>
      </div>
      <p className="text-xs text-gray-400 ml-11">
        {description}
      </p>
    </div>
  );
}
