import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Share2, Plus, Globe } from 'lucide-react';

export default async function ContentPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/client-login');
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Content</h1>
        <p className="text-gray-600 mt-2">Maak en beheer je blog posts en social media content</p>
      </div>

      {/* Content Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blog Posts */}
        <Link
          href="/admin/content/blog"
          className="bg-slate-900 rounded-lg border-2 border-slate-700 p-8 hover:border-orange-500 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white group-hover:text-orange-600 transition-colors">
                Blog Posts
              </h2>
              <p className="text-sm text-gray-600">Maak AI-gegenereerde blog content</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              Kies een project
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              AI genereert unieke content
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              Preview en bewerk
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              Publiceer naar WordPress
            </p>
          </div>
          
          <div className="mt-6 flex items-center gap-2 text-orange-600 font-medium">
            <Plus className="w-5 h-5" />
            <span>Nieuwe blog post →</span>
          </div>
        </Link>

        {/* Social Media Posts */}
        <Link
          href="/admin/content/social"
          className="bg-slate-900 rounded-lg border-2 border-slate-700 p-8 hover:border-orange-500 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <Share2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white group-hover:text-orange-600 transition-colors">
                Social Media
              </h2>
              <p className="text-sm text-gray-600">Maak AI-gegenereerde social posts</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
              Kies een project
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
              AI genereert per platform
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
              Preview en bewerk
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
              Publiceer via Getlate.dev
            </p>
          </div>
          
          <div className="mt-6 flex items-center gap-2 text-orange-600 font-medium">
            <Plus className="w-5 h-5" />
            <span>Nieuwe social post →</span>
          </div>
        </Link>
      </div>

      {/* Quick Info */}
      <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
        <div className="flex items-start gap-4">
          <Globe className="w-6 h-6 text-orange-600 mt-1" />
          <div>
            <h3 className="font-semibold text-white mb-2">💡 Tip: Project selectie</h3>
            <p className="text-slate-300 text-sm">
              Bij het maken van content selecteer je eerst een project. Elk project heeft zijn eigen
              WordPress en social media connecties. De AI genereert unieke content gebaseerd op het project.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
