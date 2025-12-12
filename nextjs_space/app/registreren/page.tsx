
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Gift, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/brand/brand-logo';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [affiliateCodeManual, setAffiliateCodeManual] = useState('');
  const [showManualCodeInput, setShowManualCodeInput] = useState(false);
  
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    website: '',
  });

  // Check for ref parameter in URL
  useEffect(() => {
    const refParam = searchParams?.get('ref');
    if (refParam) {
      setAffiliateCode(refParam.toUpperCase());
    }
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (registerData.password !== registerData.confirmPassword) {
      setError('Wachtwoorden komen niet overeen');
      toast.error('Wachtwoorden komen niet overeen');
      return;
    }

    if (registerData.password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens bevatten');
      toast.error('Wachtwoord moet minimaal 6 tekens bevatten');
      return;
    }

    setIsLoading(true);

    try {
      // Use manual code if provided, otherwise use URL code
      const finalAffiliateCode = affiliateCodeManual.trim().toUpperCase() || affiliateCode;
      
      const res = await fetch('/api/client-auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...registerData,
          referralCode: finalAffiliateCode || undefined,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registratie mislukt');
        toast.error(data.error || 'Registratie mislukt');
        return;
      }

      toast.success(data.message || 'Account aangemaakt! Je hebt nu toegang tot alle AI tools! 🎉');
      
      // Redirect to login page after successful registration
      setTimeout(() => {
        router.push('/inloggen');
      }, 1500);
    } catch (err) {
      setError('Er ging iets mis bij registreren');
      toast.error('Er ging iets mis bij registreren');
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

      {/* Registration Card */}
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl relative z-10">
        <CardHeader className="space-y-2 pb-4">
          <CardTitle className="text-2xl text-center text-white">
            Maak een WritgoAI account
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Start met professionele omnipresence marketing - 100% autonoom en AI-gedreven
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Affiliate Code Display */}
            {affiliateCode && (
              <div className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-500 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white">Je bent uitgenodigd!</h3>
                    <p className="text-sm text-zinc-300 mt-1">
                      Affiliate code: <span className="font-mono text-green-400">{affiliateCode}</span>
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-400 ml-auto flex-shrink-0" />
                </div>
              </div>
            )}

            {/* Features Highlight - 100% Autonomous Marketing */}
            <div className="p-4 bg-gradient-to-r from-orange-900/20 to-amber-900/20 border-2 border-[#FF9933] rounded-lg mb-4">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-5 w-5 text-[#FF9933]" />
                <h3 className="font-semibold text-white">100% Autonome Marketing</h3>
              </div>
              <ul className="text-sm text-zinc-300 space-y-2 ml-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span><strong>SEO Artikelen</strong> - Pillar & cluster content voor Google rankings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Social Media</strong> - Posts op ALLE platforms die jij kiest (LinkedIn, Instagram, TikTok, Facebook, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Faceless Videos</strong> - Professionele video content zonder dat je voor de camera hoeft</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Volledig Autonoom</strong> - Wij doen alles, jij doet niets (na onboarding)</span>
                </li>
              </ul>
            </div>

            {/* Platform Flexibility Note */}
            <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg mb-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                🎯 <strong className="text-white">Jij bepaalt waar we posten</strong> - Verbind LinkedIn, Instagram, TikTok, Facebook, Pinterest, Google My Business en meer. Wij passen content automatisch aan per platform.
              </p>
            </div>

            {/* Package Information */}
            <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg mb-4">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#FF9933]" />
                Kies Straks Je Pakket
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                  <span>INSTAPPER vanaf €197/mnd</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                  <span>STARTER vanaf €297/mnd</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#FF9933]"></div>
                  <span><strong>GROEI vanaf €497/mnd ⭐</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                  <span>DOMINANT vanaf €797/mnd</span>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Na registratie krijg je een overzicht van alle pakketten
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-name" className="text-zinc-200">Naam *</Label>
              <Input
                id="register-name"
                required
                placeholder="Jan Jansen"
                value={registerData.name}
                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                disabled={isLoading}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email" className="text-zinc-200">Email *</Label>
              <Input
                id="register-email"
                type="email"
                required
                placeholder="jouw@email.nl"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                disabled={isLoading}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-company" className="text-zinc-200">Bedrijfsnaam (optioneel)</Label>
              <Input
                id="register-company"
                placeholder="Mijn Bedrijf B.V."
                value={registerData.companyName}
                onChange={(e) => setRegisterData({ ...registerData, companyName: e.target.value })}
                disabled={isLoading}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-website" className="text-zinc-200">Website (optioneel)</Label>
              <Input
                id="register-website"
                type="url"
                placeholder="https://jouwwebsite.nl"
                value={registerData.website}
                onChange={(e) => setRegisterData({ ...registerData, website: e.target.value })}
                disabled={isLoading}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password" className="text-zinc-200">Wachtwoord *</Label>
              <Input
                id="register-password"
                type="password"
                placeholder="Minimaal 6 tekens"
                required
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                disabled={isLoading}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-confirm" className="text-zinc-200">Bevestig wachtwoord *</Label>
              <Input
                id="register-confirm"
                type="password"
                placeholder="Herhaal je wachtwoord"
                required
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                disabled={isLoading}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600"
              />
            </div>

            {/* Manual Affiliate Code Input */}
            {!affiliateCode && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowManualCodeInput(!showManualCodeInput)}
                  className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Gift className="h-4 w-4" />
                  {showManualCodeInput ? 'Verberg affiliate code' : 'Heb je een affiliate code?'}
                </button>
                
                {showManualCodeInput && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="affiliate-code" className="text-zinc-200">Affiliate code (optioneel)</Label>
                    <Input
                      id="affiliate-code"
                      placeholder="PARTNER123"
                      value={affiliateCodeManual}
                      onChange={(e) => setAffiliateCodeManual(e.target.value.toUpperCase())}
                      disabled={isLoading}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600 font-mono"
                    />
                    <p className="text-xs text-zinc-500">
                      Voer de affiliate code in die je hebt ontvangen van je contact persoon
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/50 border border-red-900 p-3 rounded">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#FF9933] to-[#FFAD33] hover:from-[#FF8822] hover:to-[#FF9933] text-white font-semibold transition-all shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Account aanmaken...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gratis Account Aanmaken
                </>
              )}
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-zinc-400">
                Heb je al een account?{' '}
                <Link href="/inloggen" className="text-[#FF9933] hover:text-[#FFAD33] font-medium transition-colors">
                  Log hier in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF9933] animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
