import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import AdminUserList from "@/components/AdminUserList";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Check if user is admin
  const { data: subscriber, error: subscriberError } = await supabase
    .from('subscribers')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();

  // Redirect non-admin users
  if (subscriberError || !subscriber || !subscriber.is_admin) {
    redirect("/dashboard");
  }

  return (
    <DashboardLayout user={user} isAdmin={true}>
      <div className="p-6 lg:p-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400 text-lg">
            Beheer gebruikers en credits
          </p>
        </div>

        <AdminUserList />
      </div>
    </DashboardLayout>
  );
}
