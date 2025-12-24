import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: subscriber } = await supabase
    .from('subscribers')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();

  const isAdmin = subscriber?.is_admin || false;

  return <DashboardLayout user={user} isAdmin={isAdmin}>{children}</DashboardLayout>;
}
