import Link from 'next/link';
import { FolderKanban, FileText, Share2, TrendingUp, Users } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-8">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Klanten"
          value="0"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Projecten"
          value="0"
          icon={FolderKanban}
          color="green"
        />
        <StatCard
          title="Blog Posts"
          value="0"
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="Social Posts"
          value="0"
          icon={Share2}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickLink
          href="/admin/clients"
          title="Klanten Beheren"
          description="Bekijk en beheer al je klanten"
          icon={Users}
        />
        <QuickLink
          href="/admin/projects"
          title="Projecten Beheren"
          description="Bekijk en beheer al je projecten"
          icon={FolderKanban}
        />
        <QuickLink
          href="/admin/blogs"
          title="Blog Posts"
          description="Maak en publiceer blog posts"
          icon={FileText}
        />
        <QuickLink
          href="/admin/social-posts"
          title="Social Media"
          description="Plan en post social media content"
          icon={Share2}
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
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-100">{value}</p>
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
      className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 hover:border-[#FF9933] transition-all"
    >
      <Icon className="w-8 h-8 text-[#FF9933] mb-4" />
      <h3 className="text-lg font-semibold text-gray-100 mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </Link>
  );
}
