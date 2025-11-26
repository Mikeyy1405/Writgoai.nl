import { redirect } from 'next/navigation';

export default async function OldClientRegisterRedirect() {
  // Server-side redirect to unified login page
  redirect('/inloggen');
}
