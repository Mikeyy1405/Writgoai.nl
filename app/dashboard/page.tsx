import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  // Get user's projects
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { articles: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg"></div>
              <span className="text-xl font-bold text-white">WritGo AI</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="text-white font-medium">
                Dashboard
              </Link>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{session.user.name}</div>
                  <div className="text-xs text-gray-400">{session.user.email}</div>
                </div>
                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Uitloggen
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welkom terug, {session.user.name?.split(' ')[0]}! 👋
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
              <span className="text-3xl font-bold text-white">{projects.length}</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium">Actieve Projecten</h3>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <span className="text-3xl font-bold text-white">
                {projects.reduce((sum, p) => sum + p._count.articles, 0)}
              </span>
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

          {projects.length === 0 ? (
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
              {projects.map((project) => (
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
                        {project.websiteUrl}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-500">
                          📄 {project._count.articles} artikelen
                        </span>
                        {project.wpUrl && (
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
      </main>
    </div>
  );
}
