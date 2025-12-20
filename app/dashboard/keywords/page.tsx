import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

export default async function KeywordsPage() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect("/login");
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6 lg:p-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Keyword Research</h1>
          <p className="text-gray-400 text-lg">
            Vind de beste keywords voor je niche en content
          </p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Keyword Research komt binnenkort
            </h3>
            <p className="text-gray-400">
              Hier doe je straks keyword research voor je artikelen
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
