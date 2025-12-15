import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import SimplifiedLayoutComponent from '@/components/SimplifiedLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WritGo AI - Content Platform',
  description: 'Maak eenvoudig content met AI',
};

export default async function SimplifiedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  // Redirect to login if not authenticated
  if (!session) {
    redirect('/inloggen');
  }

  return (
    <html lang="nl" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        {/* SimplifiedLayout component includes sidebar navigation */}
        <SimplifiedLayoutComponent>
          {children}
        </SimplifiedLayoutComponent>
      </body>
    </html>
  );
}
