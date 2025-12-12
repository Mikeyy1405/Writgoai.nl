'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProjectProvider } from '@/lib/contexts/ProjectContext';
import ClientSidebar from '@/components/client-dashboard/ClientSidebar';
import ClientHeader from '@/components/client-dashboard/ClientHeader';
import ClientMobileNav from '@/components/client-dashboard/ClientMobileNav';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { API_TIMEOUTS } from '@/lib/api-timeout';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        // User is authenticated, clear any errors
        setAuthError(null);
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
  }, [status, router]);

  // Loading state
  if (status === 'loading' && !authError) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9933] mx-auto mb-4"></div>
          <p className="text-gray-400">Sessie controleren...</p>
        </div>
      </div>
    );
  }

  // Redirecting state
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9933] mx-auto mb-4"></div>
          <p className="text-gray-400">Doorverwijzen...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md text-center shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-100 mb-2">Authenticatie Fout</h2>
          <p className="text-gray-400 mb-6">{authError}</p>
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
              className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition-colors"
            >
              Terug naar login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProjectProvider>
      <div className="min-h-screen bg-gray-950 flex">
        {/* Sidebar */}
        <ClientSidebar />

        {/* Mobile Navigation */}
        <ClientMobileNav 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <ClientHeader onMobileMenuToggle={() => setMobileMenuOpen(true)} />

          {/* Page Content */}
          <main className="flex-1 overflow-x-hidden">
            <div className="p-4 lg:p-8">{children}</div>
          </main>
        </div>
      </div>
    </ProjectProvider>
  );
}
