
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, Copy, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sessionId = searchParams?.get('session_id');
    
    if (!sessionId) {
      router.push('/prijzen');
      return;
    }

    // Fetch session details and credentials
    fetchSessionDetails(sessionId);
  }, [searchParams, router]);

  const fetchSessionDetails = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/stripe/session?session_id=${sessionId}`);
      
      if (response.ok) {
        const data = await response.json();
        setCredentials({
          email: data.email,
          password: data.password,
        });
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Kon accountgegevens niet ophalen');
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    if (credentials?.password) {
      navigator.clipboard.writeText(credentials.password);
      setCopied(true);
      toast.success('Wachtwoord gekopieerd!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyEmail = () => {
    if (credentials?.email) {
      navigator.clipboard.writeText(credentials.email);
      toast.success('Email gekopieerd!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#FF6B35] mx-auto mb-4" />
          <p className="text-gray-600">Betalingsgegevens verwerken...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-[#0B3C5D] mb-2">
            Betaling Succesvol! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Je WritgoAI account is aangemaakt en klaar voor gebruik
          </p>
        </div>

        {/* Credentials Card */}
        {credentials && (
          <Card className="border-2 border-green-200 mb-6">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-[#0B3C5D] flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-600" />
                Je Inloggegevens
              </CardTitle>
              <CardDescription>
                Bewaar deze gegevens goed! Je hebt ze nodig om in te loggen.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={credentials.email}
                    readOnly
                    className="flex-1 px-4 py-3 bg-slate-800 border rounded-lg font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyEmail}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  Wachtwoord
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={credentials.password}
                    readOnly
                    className="flex-1 px-4 py-3 bg-slate-800 border rounded-lg font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyPassword}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Belangrijk:</strong> Dit is de enige keer dat je dit wachtwoord ziet.
                  Bewaar het op een veilige plek! Je kunt later je wachtwoord wijzigen in je account instellingen.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-[#0B3C5D]">Wat Nu? 🚀</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-[#FF6B35] text-white rounded-full font-bold shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-[#0B3C5D] mb-1">Log in met je gegevens</h4>
                <p className="text-sm text-gray-600">
                  Gebruik de bovenstaande email en wachtwoord om in te loggen
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-[#FF6B35] text-white rounded-full font-bold shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-[#0B3C5D] mb-1">Voltooi je AI-profiel</h4>
                <p className="text-sm text-gray-600">
                  Beantwoord enkele vragen zodat onze AI perfect afgestemde content voor je maakt
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-[#FF6B35] text-white rounded-full font-bold shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-[#0B3C5D] mb-1">Koppel Buffer.com</h4>
                <p className="text-sm text-gray-600">
                  Maak een gratis Buffer account aan voor social media publicatie
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full font-bold shrink-0">
                ✓
              </div>
              <div>
                <h4 className="font-semibold text-[#0B3C5D] mb-1">Start met automatiseren!</h4>
                <p className="text-sm text-gray-600">
                  Onze AI gaat direct aan de slag met jouw content
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:opacity-90 text-white font-semibold"
            onClick={() => router.push('/client-login')}
          >
            Naar Inlogpagina
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Support */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Hulp nodig? Neem contact op via{' '}
            <a href="mailto:support@WritgoAI.nl" className="text-[#FF6B35] hover:underline font-medium">
              support@WritgoAI.nl
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#FF6B35] mx-auto mb-4" />
            <p className="text-gray-600">Laden...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
