import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

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
        <div className="grid md:grid-cols-3 gap-6 mb-12">
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

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <span className="text-3xl font-bold text-white">0</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium">AutoPilot Actief</h3>
          </div>
        </div>

        {/* Projects Section */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Mijn Projecten</h2>
            <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all">
              + Nieuw Project
            </button>
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
              <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all">
                Maak je eerste project
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {projectsWithCounts.map((project) => (
                <div
                  key={project.id}
                  className="bg-black/50 border border-gray-800 rounded-lg p-6 hover:border-orange-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {project.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3">
                        {project.website_url}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-500">
                          📄 {project.articleCount} artikelen
                        </span>
                        {project.wp_url && (
                          <span className="text-green-500">✓ WordPress verbonden</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all">
                        Beheer
                      </button>
                      <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all">
                        Genereer Content
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <button className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all text-left">
            <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              AI Content Genereren
            </h3>
            <p className="text-gray-400 text-sm">
              Genereer direct een nieuw artikel met AI
            </p>
          </button>

          <button className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all text-left">
            <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              AutoPilot Instellen
            </h3>
            <p className="text-gray-400 text-sm">
              Automatisch content genereren op schema
            </p>
          </button>

          <button className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all text-left">
            <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Keyword Research
            </h3>
            <p className="text-gray-400 text-sm">
              Vind de beste keywords voor je niche
            </p>
          </button>
        </div>
    </div>
  );
}
