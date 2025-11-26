
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ChatbotPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect naar de nieuwe AI chat pagina
    router.replace('/client-portal/ai-chat');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
        <p className="text-gray-400">WritGo AI Assistent laden...</p>
      </div>
    </div>
  );
}
