/**
 * Deprecated Route Banner Component
 * 
 * Shows a warning banner on legacy routes indicating they will be removed
 * Provides a link to the new route for users to migrate
 */

'use client';

import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface DeprecatedRouteBannerProps {
  newRoute: string;
  message?: string;
}

export function DeprecatedRouteBanner({ 
  newRoute, 
  message 
}: DeprecatedRouteBannerProps) {
  const [visible, setVisible] = useState(true);
  
  if (!visible) return null;
  
  return (
    <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white mb-1">
            ⚠️ Deze pagina is verouderd
          </h3>
          <p className="text-sm text-gray-300 mb-2">
            {message || 'Deze pagina wordt binnenkort verwijderd. Gebruik de nieuwe interface voor de beste ervaring.'}
          </p>
          <Link 
            href={newRoute}
            className="inline-flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
          >
            Ga naar nieuwe pagina →
          </Link>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Sluit banner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
