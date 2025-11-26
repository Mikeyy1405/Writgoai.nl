
/**
 * Project Social Media Configuration Component - Late.dev Integration
 * Individual platform buttons for direct account connection
 */

'use client';

import { LateDevAccountManager } from './late-dev-account-manager';

interface ProjectSocialMediaConfigProps {
  projectId: string;
}

export default function ProjectSocialMediaConfig({ projectId }: ProjectSocialMediaConfigProps) {
  return <LateDevAccountManager projectId={projectId} />;
}
