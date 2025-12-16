import { redirect } from 'next/navigation';

/**
 * Redirect /admin/statistieken to /admin/analytics
 * Consolidates analytics/stats pages
 */
export default function StatistiekenPage() {
  redirect('/admin/analytics');
}
