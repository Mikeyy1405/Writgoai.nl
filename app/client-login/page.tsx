import { redirect } from 'next/navigation';

export default async function ClientLogin() {
  // Server-side redirect to unified login page
  redirect('/inloggen');
}
