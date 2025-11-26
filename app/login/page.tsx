'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  
  // Redirect to unified login page
  useEffect(() => {
    router.replace('/inloggen');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#FF9933] animate-spin" />
    </div>
  );
}
