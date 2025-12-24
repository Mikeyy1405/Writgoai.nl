import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

// Disable caching for this layout to ensure fresh admin status
export const dynamic = 'force-dynamic';

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
  const { data: subscriber, error: subscriberError } = await supabase
    .from('subscribers')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();

  // Log for debugging (can be removed later)
  if (subscriberError) {
    console.error('Error fetching subscriber:', subscriberError);
  }
  console.log('Subscriber data:', subscriber, 'User ID:', user.id);

  const isAdmin = subscriber?.is_admin || false;

  return <DashboardLayout user={user} isAdmin={isAdmin}>{children}</DashboardLayout>;
}
