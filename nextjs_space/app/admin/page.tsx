import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Globe, FileText, Share2, Plus, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma-shim';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/client-login');
  }

  // Fetch stats
  const [projectCount, blogPostCount, socialPostCount, publishedBlogCount, publishedSocialCount, scheduledCount] = await Promise.all([
    prisma.project.count({ where: { isActive: true } }),
    prisma.blogPost.count(),
    prisma.socialMediaPost.count(),
    prisma.blogPost.count({ where: { status: 'published' } }),
    prisma.socialMediaPost.count({ where: { status: 'published' } }),
    prisma.blogPost.count({ where: { status: 'scheduled' } }) + prisma.socialMediaPost.count({ where: { status: 'scheduled' } }),
  ]);

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Beheer je projecten en content</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Projects */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Actieve Projecten</p>
              <p className="text-2xl font-bold text-gray-900">{projectCount}</p>
            </div>
          </div>
          <Link
            href="/admin/projects"
            className="mt-4 text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
          >
            Bekijk projecten →
          </Link>
        </div>

        {/* Blog Posts */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Blog Posts</p>
              <p className="text-2xl font-bold text-gray-900">{blogPostCount}</p>
              <p className="text-xs text-gray-500 mt-1">{publishedBlogCount} gepubliceerd</p>
            </div>
          </div>
          <Link
            href="/admin/content"
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Maak blog post →
          </Link>
        </div>

        {/* Social Posts */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Share2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Social Posts</p>
              <p className="text-2xl font-bold text-gray-900">{socialPostCount}</p>
              <p className="text-xs text-gray-500 mt-1">{publishedSocialCount} gepubliceerd</p>
            </div>
          </div>
          <Link
            href="/admin/content"
            className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
          >
            Maak social post →
          </Link>
        </div>

        {/* Activity Stats */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Performance</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-90">Gepubliceerd deze maand</span>
              <span className="font-bold">{publishedBlogCount + publishedSocialCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-90">Ingepland</span>
              <span className="font-bold">{scheduledCount}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Planning</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Concepten</span>
              <span className="font-bold text-gray-900">
                {blogPostCount + socialPostCount - publishedBlogCount - publishedSocialCount - scheduledCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Te publiceren</span>
              <span className="font-bold text-gray-900">{scheduledCount}</span>
            </div>
          </div>
        </div>

        {/* Published Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Live Content</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Blogs live</span>
              <span className="font-bold text-gray-900">{publishedBlogCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Socials live</span>
              <span className="font-bold text-gray-900">{publishedSocialCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Snelle Acties</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/projects/new"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group"
          >
            <Plus className="w-5 h-5 text-gray-600 group-hover:text-orange-600" />
            <span className="font-medium text-gray-900">Nieuw Project</span>
          </Link>

          <Link
            href="/admin/content/create-blog"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
          >
            <FileText className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
            <span className="font-medium text-gray-900">Maak Blog Post</span>
          </Link>

          <Link
            href="/admin/content/create-social"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
          >
            <Share2 className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
            <span className="font-medium text-gray-900">Maak Social Post</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
