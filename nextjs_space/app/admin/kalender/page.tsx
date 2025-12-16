import { redirect } from 'next/navigation';

/**
 * Redirect /admin/kalender to /admin/distribution/calendar
 * Calendar functionality is in the distribution section
 */
export default function KalenderPage() {
  redirect('/admin/distribution/calendar');
}
