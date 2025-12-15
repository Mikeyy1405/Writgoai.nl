'use client';

// This page has been replaced by /client-portal/video/
// Redirecting to the new unified video generation page
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VideoGeneratorRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/client-portal/video');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-white text-lg">Redirecting to new video page...</p>
      </div>
    </div>
  );
}
