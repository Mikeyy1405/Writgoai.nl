'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Login functionaliteit komt binnenkort...');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-8">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Login</h1>
        
        {message && (
          <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500 rounded text-orange-500 text-sm">
            {message}
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
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
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
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 rounded font-medium hover:bg-orange-600"
          >
            Inloggen
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
