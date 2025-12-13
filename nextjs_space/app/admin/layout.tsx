import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session?.user?.email) {
    redirect('/client-login');
  }

  // Check if user is admin
  const isAdmin = session.user.email === 'info@writgo.nl' || session.user.role === 'admin';
  if (!isAdmin) {
    redirect('/client-portal');
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
