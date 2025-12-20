import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect("/login");
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6 lg:p-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Instellingen</h1>
          <p className="text-gray-400 text-lg">
            Beheer je account en applicatie instellingen
          </p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚙️</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Instellingen pagina komt binnenkort
            </h3>
            <p className="text-gray-400">
              Hier beheer je straks je account en instellingen
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
