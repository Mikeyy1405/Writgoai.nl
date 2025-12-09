'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/admin-layout';
import { isUserAdmin } from '@/lib/navigation-config';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface AdminLayoutPropsType {
  children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutPropsType) {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Set a timeout for authentication check
    const authTimeout = setTimeout(() => {
      if (status === 'loading') {
        setAuthError('Authenticatie duurt langer dan verwacht. Probeer de pagina te verversen.');
      }
    }, 10000); // 10 seconds

    try {
      if (status === 'unauthenticated') {
        setIsRedirecting(true);
        clearTimeout(authTimeout);
        router.push('/client-login');
        return;
      }

      if (status === 'authenticated') {
        clearTimeout(authTimeout);
        // Check if user is admin
        try {
          const isAdmin = isUserAdmin(session?.user?.email, session?.user?.role);
          if (!isAdmin) {
            setIsRedirecting(true);
            router.push('/client-portal');
            return;
          }
          // User is admin, clear any errors
          setAuthError(null);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setAuthError('Fout bij het controleren van admin rechten');
        }
      }
    } catch (error) {
      console.error('Error in auth check:', error);
      setAuthError('Er is een fout opgetreden bij authenticatie');
      clearTimeout(authTimeout);
    }

    return () => {
      clearTimeout(authTimeout);
    };
  }, [status, session, router]);

  // Loading state
  if (status === 'loading' && !authError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4"></div>
          <p className="text-zinc-400">Sessie controleren...</p>
        </div>
      </div>
    );
  }

  // Redirecting state
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4"></div>
          <p className="text-zinc-400">Doorverwijzen...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (authError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Authenticatie Fout</h2>
          <p className="text-zinc-400 mb-6">{authError}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setAuthError(null);
                window.location.reload();
              }}
              className="w-full px-6 py-3 bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Pagina verversen
            </button>
            <button
              onClick={() => router.push('/client-login')}
              className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >
              Terug naar login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}
