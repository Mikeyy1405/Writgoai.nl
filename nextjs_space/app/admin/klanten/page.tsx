import { redirect } from 'next/navigation';

/**
 * Redirect /admin/klanten to /admin/clients
 * Consolidates client management pages
 */
export default function KlantenPage() {
  redirect('/admin/clients');
}
