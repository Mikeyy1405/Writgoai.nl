import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect("/login");
  }

  // Get user's projects with article counts
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select(`
      *,
      articles:articles(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const projectsWithCounts = projects?.map(p => ({
    ...p,
    articleCount: p.articles?.[0]?.count || 0
  })) || [];

  const totalArticles = projectsWithCounts.reduce((sum, p) => sum + p.articleCount, 0);

  // Get total affiliate opportunities count
  let totalOpportunities = 0;
  if (projects && projects.length > 0) {
    const projectIds = projects.map(p => p.id);
    const { count } = await supabase
      .from('affiliate_opportunities')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .neq('status', 'dismissed');
    totalOpportunities = count || 0;
  }

  return (
    <div className="p-6 lg:p-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welkom terug, {user.user_metadata?.name?.split(' ')[0] || 'daar'}! 👋
          </h1>
          <p className="text-gray-400 text-lg">
            Beheer je WordPress projecten en genereer automatisch SEO-geoptimaliseerde content
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <span className="text-3xl font-bold text-white">{projectsWithCounts.length}</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium">Actieve Projecten</h3>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <span className="text-3xl font-bold text-white">{totalArticles}</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium">Totaal Artikelen</h3>
          </div>

          <Link 
            href="/dashboard/affiliate-opportunities"
            className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 hover:border-purple-500/40 rounded-xl p-6 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">💼</span>
              </div>
              <span className="text-3xl font-bold text-purple-400">{totalOpportunities}</span>
            </div>
            <h3 className="text-purple-400 text-sm font-medium">Affiliate Opportunities</h3>
          </Link>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <span className="text-3xl font-bold text-green-500">Actief</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium">AI Status</h3>
          </div>
        </div>

        {/* Projects Section */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Mijn Projecten</h2>
            <Link 
              href="/dashboard/projects"
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all"
            >
              + Nieuw Project
            </Link>
          </div>

          {projectsWithCounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Nog geen projecten
              </h3>
              <p className="text-gray-400 mb-6">
                Maak je eerste WordPress project aan om te beginnen met content generatie
              </p>
              <Link 
                href="/dashboard/projects"
                className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all"
              >
                Maak je eerste project
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projectsWithCounts.map((project) => (
                <div
                  key={project.id}
                  className="bg-black/50 border border-gray-800 rounded-lg p-6 hover:border-orange-500/50 transition-all"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 w-full lg:w-auto">
                      <h3 className="text-lg font-semibold text-white mb-1 break-words">
                        {project.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3 break-words">
                        {project.website_url}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <span className="text-gray-500">
                          📄 {project.articleCount} artikelen
                        </span>
                        {project.wp_url && project.wp_username ? (
                          <span className="text-green-500">✓ WordPress verbonden</span>
                        ) : (
                          <span className="text-gray-500">○ Geen WordPress</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                      <Link 
                        href="/dashboard/library"
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
                      >
                        📚 Bibliotheek
                      </Link>
                      <Link 
                        href="/dashboard/content-plan"
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all"
                      >
                        ✍️ Genereer Content
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Link 
            href="/dashboard/content-plan"
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all text-left block"
          >
            <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              AI Content Genereren
            </h3>
            <p className="text-gray-400 text-sm">
              Genereer direct een nieuw artikel met AI
            </p>
          </Link>

          <Link 
            href="/dashboard/library"
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all text-left block"
          >
            <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Bibliotheek
            </h3>
            <p className="text-gray-400 text-sm">
              Bekijk en beheer al je opgeslagen artikelen
            </p>
          </Link>

          <Link 
            href="/dashboard/projects"
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all text-left block"
          >
            <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Projecten Beheren
            </h3>
            <p className="text-gray-400 text-sm">
              Voeg nieuwe projecten toe of bewerk bestaande
            </p>
          </Link>
        </div>

        {/* Getting Started Guide */}
        <div className="mt-12 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">🚀 Aan de slag</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">1</div>
              <h4 className="text-white font-medium mb-1">Project Aanmaken</h4>
              <p className="text-gray-400 text-sm">Voeg je website toe als project</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">2</div>
              <h4 className="text-white font-medium mb-1">Content Plan</h4>
              <p className="text-gray-400 text-sm">Genereer 30 artikel ideeën</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">3</div>
              <h4 className="text-white font-medium mb-1">Artikel Schrijven</h4>
              <p className="text-gray-400 text-sm">AI schrijft je artikel</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">4</div>
              <h4 className="text-white font-medium mb-1">Publiceren</h4>
              <p className="text-gray-400 text-sm">Publiceer naar WordPress</p>
            </div>
          </div>
        </div>
    </div>
  );
}
