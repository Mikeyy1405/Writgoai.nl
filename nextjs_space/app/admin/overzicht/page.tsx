import { redirect } from 'next/navigation';

/**
 * Redirect /admin/overzicht to /admin/dashboard
 * Consolidates duplicate overview pages
 */
export default function OverzichtPage() {
  redirect('/admin/dashboard');
}
