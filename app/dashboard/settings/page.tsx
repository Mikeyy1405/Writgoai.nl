import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import BillingSection from "@/components/BillingSection";

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

        {/* Billing Section */}
        <div className="mb-8">
          <BillingSection />
        </div>

        {/* Account Section */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">👤 Account Informatie</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <div className="text-white">{user.email}</div>
            </div>
            
            {user.user_metadata?.name && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Naam</label>
                <div className="text-white">{user.user_metadata.name}</div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">User ID</label>
              <div className="text-white font-mono text-sm">{user.id}</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
