'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Er ging iets mis');
        setLoading(false);
        return;
      }

      // Success
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Er ging iets mis. Probeer het opnieuw.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Wachtwoord Vergeten</h1>
        <p className="text-gray-400 text-sm text-center mb-6">
          Voer je email adres in en we sturen je een link om je wachtwoord te resetten.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-500 text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/20 border border-green-500 rounded text-green-500">
              <div className="flex items-start">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <p className="font-semibold mb-1">Email Verzonden!</p>
                  <p className="text-sm text-gray-300">
                    We hebben een wachtwoord reset link gestuurd naar <strong>{email}</strong>.
                    Check je inbox (en spam folder) en klik op de link om je wachtwoord te resetten.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-3 pt-4">
              <Link
                href="/login"
                className="block text-orange-500 hover:text-orange-400 text-sm"
              >
                ← Terug naar login
              </Link>
            </div>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Bezig met verzenden...' : 'Verstuur Reset Link'}
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-6 text-center space-y-3">
            <Link
              href="/login"
              className="block text-gray-500 hover:text-gray-400 text-sm"
            >
              ← Terug naar login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
