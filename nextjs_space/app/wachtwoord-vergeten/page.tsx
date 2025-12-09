'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/brand/brand-logo';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/client-auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        toast.success('Check je inbox!');
      } else {
        toast.error(data.error || 'Er is iets misgegaan');
      }
    } catch (err) {
      toast.error('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

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
            Wachtwoord vergeten?
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Geen probleem! We sturen je een reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-200">Email adres</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="jouw@email.nl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600 pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-zinc-200 font-semibold transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verzenden...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Verstuur reset link
                  </>
                )}
              </Button>

              <div className="text-center pt-4">
                <Link
                  href="/inloggen"
                  className="text-sm text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Terug naar inloggen
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    Check je inbox!
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een e-mail met instructies.
                  </p>
                </div>
              </div>

              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2">
                <p className="text-sm text-zinc-300">
                  <strong>Tip:</strong> Check ook je spam folder als je de email niet ziet.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push('/inloggen')}
                  className="w-full bg-white text-black hover:bg-zinc-200 font-semibold transition-all"
                >
                  Naar inloggen
                </Button>
                <Button
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail('');
                  }}
                  variant="outline"
                  className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  Opnieuw proberen
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
