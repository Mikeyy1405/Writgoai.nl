'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/brand/brand-logo';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accessToken, setAccessToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Supabase sends the access_token in the URL hash after email verification
    // Format: #access_token=xxx&refresh_token=yyy&type=recovery
    const hash = window.location.hash;
    
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      const type = params.get('type');
      
      if (token && type === 'recovery') {
        setAccessToken(token);
      } else {
        setError('Geen geldige reset link. Vraag een nieuwe aan.');
      }
    } else {
      setError('Geen geldige reset link. Vraag een nieuwe aan.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen');
      toast.error('Wachtwoorden komen niet overeen');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens bevatten');
      toast.error('Wachtwoord moet minimaal 6 tekens bevatten');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/client-auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        toast.success('Wachtwoord succesvol gewijzigd!');
      } else {
        setError(data.error || 'Er is iets misgegaan');
        toast.error(data.error || 'Er is iets misgegaan');
      }
    } catch (err) {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
      toast.error('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!accessToken && !error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF9933] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#FF9933] rounded-full opacity-10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-[#FFAD33] rounded-full opacity-10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Logo bovenaan */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <BrandLogo variant="full" size="xl" />
      </div>

      {/* Card */}
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl relative z-10">
        <CardHeader className="space-y-2 pb-4">
          <CardTitle className="text-2xl text-center text-white">
            Nieuw wachtwoord instellen
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Kies een veilig wachtwoord
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSuccess && !error && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-200">Nieuw wachtwoord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimaal 6 tekens"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-zinc-200">Bevestig wachtwoord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Herhaal je wachtwoord"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600 pl-10"
                  />
                </div>
              </div>

              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
                <p className="text-xs text-zinc-400">
                  <strong>Tip:</strong> Gebruik een combinatie van letters, cijfers en speciale tekens voor een veilig wachtwoord.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-zinc-200 font-semibold transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wachtwoord wijzigen...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Wachtwoord wijzigen
                  </>
                )}
              </Button>
            </form>
          )}

          {isSuccess && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    Wachtwoord gewijzigd!
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Je wachtwoord is succesvol gewijzigd. Je kunt nu inloggen met je nieuwe wachtwoord.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => router.push('/inloggen')}
                className="w-full bg-white text-black hover:bg-zinc-200 font-semibold transition-all"
              >
                Naar inloggen
              </Button>
            </div>
          )}

          {error && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    Er is iets misgegaan
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {error}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push('/wachtwoord-vergeten')}
                  className="w-full bg-white text-black hover:bg-zinc-200 font-semibold transition-all"
                >
                  Nieuwe reset link aanvragen
                </Button>
                <Link
                  href="/inloggen"
                  className="text-center text-sm text-zinc-400 hover:text-white transition-colors py-2"
                >
                  Terug naar inloggen
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF9933] animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
