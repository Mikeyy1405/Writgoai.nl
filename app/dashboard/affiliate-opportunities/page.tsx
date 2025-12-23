import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AffiliateOpportunities from "@/components/AffiliateOpportunities";

export default async function AffiliateOpportunitiesPage({
  searchParams,
}: {
  searchParams: { project?: string };
}) {
  const supabase = createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect("/login");
  }

  // Get user's projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, website')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (projectsError || !projects || projects.length === 0) {
    return (
      <div className="p-6 lg:p-12">
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="text-orange-400 hover:text-orange-300 text-sm mb-4 inline-block"
          >
            ← Terug naar Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            Affiliate Opportunities 💼
          </h1>
          <p className="text-gray-400 text-lg">
            Automatisch gevonden affiliate mogelijkheden in je content
          </p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Nog geen projecten
          </h3>
          <p className="text-gray-400 mb-6">
            Maak eerst een project aan om affiliate opportunities te kunnen ontdekken
          </p>
          <Link 
            href="/dashboard/projects"
            className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all"
          >
            Nieuw Project Aanmaken
          </Link>
        </div>
      </div>
    );
  }

  // Use selected project or default to first project
  const selectedProjectId = searchParams.project || projects[0].id;
  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  return (
    <div className="p-6 lg:p-12">
      <div className="mb-8">
        <Link 
          href="/dashboard"
          className="text-orange-400 hover:text-orange-300 text-sm mb-4 inline-block"
        >
          ← Terug naar Dashboard
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">
          Affiliate Opportunities 💼
        </h1>
        <p className="text-gray-400 text-lg">
          Automatisch gevonden affiliate mogelijkheden in je content
        </p>
      </div>

      {/* Project Selector */}
      {projects.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Selecteer Project
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set('project', e.target.value);
              window.location.href = url.toString();
            }}
            className="bg-gray-900 border border-gray-800 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.website}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Current Project Info */}
      <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <span className="text-2xl">🌐</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{selectedProject.name}</h2>
            <p className="text-orange-400">{selectedProject.website}</p>
          </div>
        </div>
      </div>

      {/* Opportunities Component */}
      <AffiliateOpportunities projectId={selectedProjectId} />
    </div>
  );
}
