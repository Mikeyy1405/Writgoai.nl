import Link from 'next/link';
import { FileText, Share2, TrendingUp, Settings } from 'lucide-react';

export default function ClientDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">
        Mijn Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Blog Posts"
          value="0"
          icon={FileText}
          color="green"
        />
        <StatCard
          title="Social Posts"
          value="0"
          icon={Share2}
          color="purple"
        />
        <StatCard
          title="Deze Week"
          value="0"
          icon={TrendingUp}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickLink
          href="/dashboard/blog"
          title="Blog Posts"
          description="Schrijf en publiceer blogs"
          icon={FileText}
        />
        <QuickLink
          href="/dashboard/social"
          title="Social Media"
          description="Plan je social media posts"
          icon={Share2}
        />
        <QuickLink
          href="/dashboard/settings"
          title="Instellingen"
          description="Beheer je account instellingen"
          icon={Settings}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: any;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    purple: 'bg-purple-500/10 text-purple-400',
    orange: 'bg-[#FF9933]/10 text-[#FF9933]',
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400">{title}</p>
    </div>
  );
}

interface QuickLinkProps {
  href: string;
  title: string;
  description: string;
  icon: any;
}

function QuickLink({ href, title, description, icon: Icon }: QuickLinkProps) {
  return (
    <Link
      href={href}
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:bg-zinc-800 hover:border-[#FF9933] transition-all"
    >
      <Icon className="w-8 h-8 text-[#FF9933] mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </Link>
  );
}
