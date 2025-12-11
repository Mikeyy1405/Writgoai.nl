'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-client/dashboard-layout';
import { isUserAdmin } from '@/lib/navigation-config';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { API_TIMEOUTS } from '@/lib/api-timeout';

interface DashboardLayoutPropsType {
  children: React.ReactNode;
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutPropsType) {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Set a timeout for authentication check
    const authTimeout = setTimeout(() => {
      if (isMountedRef.current && status === 'loading') {
        setAuthError('Authenticatie duurt langer dan verwacht. Probeer de pagina te verversen.');
      }
    }, API_TIMEOUTS.AUTH_CHECK);

    try {
      if (status === 'unauthenticated') {
        setIsRedirecting(true);
        clearTimeout(authTimeout);
        router.push('/client-login');
        return;
      }

      if (status === 'authenticated') {
        clearTimeout(authTimeout);
        // Check if user is admin - redirect admins to /admin
        try {
          const isAdmin = isUserAdmin(session?.user?.email, session?.user?.role);
          if (isAdmin) {
            setIsRedirecting(true);
            router.push('/admin');
            return;
          }
          // User is client, clear any errors
          setAuthError(null);
        } catch (error) {
          console.error('Error checking user status:', error);
          setAuthError('Fout bij het controleren van gebruikersrechten');
        }
      }
    } catch (error) {
      console.error('Error in auth check:', error);
      setAuthError('Er is een fout opgetreden bij authenticatie');
      clearTimeout(authTimeout);
    }

    return () => {
      isMountedRef.current = false;
      clearTimeout(authTimeout);
    };
  }, [status, session, router]);

  // Loading state
  if (status === 'loading' && !authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9933] mx-auto mb-4"></div>
          <p className="text-gray-600">Sessie controleren...</p>
        </div>
      </div>
    );
  }

  // Redirecting state
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9933] mx-auto mb-4"></div>
          <p className="text-gray-600">Doorverwijzen...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md text-center shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authenticatie Fout</h2>
          <p className="text-gray-600 mb-6">{authError}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setAuthError(null);
                window.location.reload();
              }}
              className="w-full px-6 py-3 bg-[#FF9933] hover:bg-[#FF8555] text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Pagina verversen
            </button>
            <button
              onClick={() => router.push('/client-login')}
              className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors"
            >
              Terug naar login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
