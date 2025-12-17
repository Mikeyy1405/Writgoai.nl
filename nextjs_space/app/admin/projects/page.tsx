import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Globe, Share2, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { prisma } from '@/lib/prisma-shim';

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/client-login');
  }

  // Fetch projects with their content counts
  const projects = await prisma.project.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  // Get content counts for each project
  const projectsWithCounts = await Promise.all(
    projects.map(async (project) => {
      const [blogCount, socialCount] = await Promise.all([
        prisma.blogPost.count({ where: { projectId: project.id } }),
        prisma.socialMediaPost.count({ where: { projectId: project.id } }),
      ]);
      
      return {
        ...project,
        blogCount,
        socialCount,
      };
    })
  );

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projecten</h1>
          <p className="text-gray-600 mt-2">Beheer je 200 websites</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nieuw Project</span>
        </Link>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectsWithCounts.length === 0 ? (
          <div className="col-span-full bg-slate-900 rounded-lg border p-12 text-center">
            <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Geen projecten gevonden
            </h3>
            <p className="text-gray-600 mb-6">
              Voeg je eerste project toe om te beginnen
            </p>
            <Link
              href="/admin/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Nieuw Project</span>
            </Link>
          </div>
        ) : (
          projectsWithCounts.map((project) => {
            const hasWordPress = !!project.wordpressUrl;
            const hasGetlate = !!project.getlateProfileId;
            
            return (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="bg-slate-900 rounded-lg border p-6 hover:border-orange-500 hover:shadow-lg transition-all group"
              >
                {/* Project Name */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-orange-600 transition-colors">
                      {project.name}
                    </h3>
                    {project.siteUrl && (
                      <p className="text-sm text-gray-500 mt-1">{project.siteUrl}</p>
                    )}
                  </div>
                  <Sparkles className="w-5 h-5 text-orange-500" />
                </div>

                {/* Connections Status */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    {hasWordPress ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={`text-sm ${hasWordPress ? 'text-green-600' : 'text-gray-500'}`}>
                      WordPress {hasWordPress ? 'verbonden' : 'niet verbonden'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasGetlate ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={`text-sm ${hasGetlate ? 'text-green-600' : 'text-gray-500'}`}>
                      Socials {hasGetlate ? 'verbonden' : 'niet verbonden'}
                    </span>
                  </div>
                </div>

                {/* Content Stats */}
                <div className="pt-4 border-t border-slate-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Blog Posts</p>
                      <p className="text-xl font-bold text-white">{project.blogCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Social Posts</p>
                      <p className="text-xl font-bold text-white">{project.socialCount}</p>
                    </div>
                  </div>
                </div>

                {/* Niche & Audience Tags */}
                {(project.niche || project.targetAudience) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.niche && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                        {project.niche}
                      </span>
                    )}
                    {project.targetAudience && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {project.targetAudience}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>

      {/* Stats Summary */}
      {projectsWithCounts.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Totaal Overzicht</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm opacity-90">Totaal Projecten</p>
              <p className="text-3xl font-bold">{projectsWithCounts.length}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">WordPress Verbonden</p>
              <p className="text-3xl font-bold">
                {projectsWithCounts.filter(p => p.wordpressUrl).length}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-90">Socials Verbonden</p>
              <p className="text-3xl font-bold">
                {projectsWithCounts.filter(p => p.getlateProfileId).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
