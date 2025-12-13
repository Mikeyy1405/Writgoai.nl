import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import AdminNav from '@/components/admin/AdminNav';

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

  return (
    <div className="min-h-screen bg-gray-950">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
