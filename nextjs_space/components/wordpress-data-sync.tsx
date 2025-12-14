'use client';

import { useEffect } from 'react';
import { useProject } from '@/lib/contexts/ProjectContext';
import { useWordPressData } from '@/lib/contexts/WordPressDataContext';

/**
 * Component that automatically syncs WordPress data when the current project changes
 * This should be mounted once in the app tree where ProjectContext is available
 */
export default function WordPressDataSync() {
  const { currentProject } = useProject();
  const { loadWordPressData, loading } = useWordPressData();

  useEffect(() => {
    // Load WordPress data whenever the current project changes
    if (currentProject?.id && !loading) {
      console.log('[WordPressDataSync] Loading WordPress data for project:', currentProject.name);
      loadWordPressData(currentProject.id);
    }
  }, [currentProject?.id, loadWordPressData]);

  // This component doesn't render anything - it just handles the side effect
  return null;
}
