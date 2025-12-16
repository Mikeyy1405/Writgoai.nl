import { redirect } from 'next/navigation';

/**
 * Admin root page - redirect to dashboard
 * This consolidates multiple admin entry points into a single dashboard
 */
export default function AdminPage() {
  redirect('/admin/dashboard');
}
