import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import SimplifiedLayoutComponent from '@/components/SimplifiedLayout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated (redirect to /inloggen for consistency)
  if (!session?.user?.email) {
    redirect('/inloggen');
  }

  return <SimplifiedLayoutComponent>{children}</SimplifiedLayoutComponent>;
}
