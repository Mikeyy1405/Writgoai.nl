'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          Er is iets misgegaan
        </h2>
        <p className="text-gray-400 mb-6">
          {error.message || 'Er is een onverwachte fout opgetreden'}
        </p>
        <button
          onClick={reset}
          className="w-full px-6 py-3 bg-[#FF9933] text-white rounded-lg hover:bg-[#FF8555] transition-colors"
        >
          Probeer opnieuw
        </button>
      </div>
    </div>
  );
}
