import { redirect } from 'next/navigation';

/**
 * Redirect /admin/instellingen to /admin/settings
 * Consolidates settings pages
 */
export default function InstellingenPage() {
  redirect('/admin/settings');
}
