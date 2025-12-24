'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login mislukt');
        setLoading(false);
        return;
      }

      // Success - redirect via window.location for full page reload
      setSuccess(true);
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Login error:', err);
      setError('Er ging iets mis. Probeer het opnieuw.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-8">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Login</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-500 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded text-green-500 text-sm">
            ✅ Login succesvol! Je wordt doorgestuurd...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50"
              placeholder="jouw@email.nl"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Wachtwoord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white disabled:opacity-50"
              placeholder="••••••••"
            />
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="text-sm text-orange-500 hover:text-orange-400">
                Wachtwoord vergeten?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-orange-500 text-white py-3 rounded font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {success ? '✅ Succesvol!' : loading ? 'Bezig met inloggen...' : 'Inloggen'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400 text-sm">
          Nog geen account?{' '}
          <Link href="/register" className="text-orange-500 hover:text-orange-400">
            Registreer
          </Link>
        </p>

        <p className="mt-4 text-center">
          <Link href="/" className="text-gray-500 hover:text-gray-400 text-sm">
            ← Terug naar home
          </Link>
        </p>
      </div>
    </div>
  );
}
