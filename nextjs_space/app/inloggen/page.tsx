
'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2, Sparkles, Gift, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/brand/brand-logo';

function LoginRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showRegister, setShowRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [affiliateCodeManual, setAffiliateCodeManual] = useState('');
  const [showManualCodeInput, setShowManualCodeInput] = useState(false);

  const [loginData, setLoginData] = useState({ 
    email: '', 
    password: '' 
  });
  
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    website: '',
    phone: ''
  });

  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      setError('Er is een probleem opgetreden bij het inloggen. Probeer het opnieuw.');
    }
    
    // Check for affiliate ref parameter
    const refParam = searchParams?.get('ref');
    if (refParam) {
      setAffiliateCode(refParam.toUpperCase());
      setShowRegister(true); // Automatically show register form
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('universal-login', {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result?.ok) {
        toast.success('Welkom terug!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
      toast.error('Er is iets misgegaan');
    } finally {
      setIsLoading(false);
    }
  };

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

      toast.success(data.message || 'Account aangemaakt! Je hebt gratis credits ontvangen! 🎉');
      // Switch to login view
      setShowRegister(false);
      setLoginData({ email: registerData.email, password: '' });
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

      {/* Login/Register Card */}
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl relative z-10">
        <CardHeader className="space-y-2 pb-4">
          <CardTitle className="text-2xl text-center text-white">
            {showRegister ? 'Maak een account' : 'Welkom terug'}
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            {showRegister 
              ? 'Start gratis met 1 artikel + 1 reel cadeau 🎁' 
              : 'Log in om je dashboard te bekijken'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Toggle buttons */}
          <div className="grid w-full grid-cols-2 gap-2 mb-6 p-1 bg-zinc-800 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setShowRegister(false);
                setError('');
              }}
              className={`py-2 px-4 rounded-md font-medium transition-colors ${
                !showRegister 
                  ? 'bg-white text-black shadow' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setShowRegister(true);
                setError('');
              }}
              className={`py-2 px-4 rounded-md font-medium transition-colors ${
                showRegister 
                  ? 'bg-white text-black shadow' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Registreer
            </button>
          </div>

          {/* Login Form */}
          {!showRegister && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-zinc-200">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="jouw@email.nl"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-zinc-200">Wachtwoord</Label>
                  <Link
                    href="/wachtwoord-vergeten"
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    Wachtwoord vergeten?
                  </Link>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600"
                />
              </div>
              {error && (
                <div className="text-sm text-red-400 bg-red-950/50 border border-red-900 p-3 rounded">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-zinc-200 font-semibold transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inloggen...
                  </>
                ) : 'Inloggen'}
              </Button>
            </form>
          )}

          {/* Register Form */}
          {showRegister && (
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

              {/* Free Credits Highlight */}
              <div className="p-4 bg-green-900/20 border-2 border-green-500 rounded-lg mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="h-5 w-5 text-[#FF9933]" />
                  <h3 className="font-semibold text-white">Gratis Welkomstcadeau!</h3>
                </div>
                <ul className="text-sm text-zinc-300 space-y-1 ml-8">
                  <li>✅ 1000 gratis credits (≈ 20 blogs)</li>
                  <li>✅ AI-geschreven artikelen (2000+ woorden)</li>
                  <li>✅ Volledige toegang tot alle tools</li>
                </ul>
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
                <Label htmlFor="register-phone" className="text-zinc-200">Telefoonnummer (optioneel)</Label>
                <Input
                  id="register-phone"
                  type="tel"
                  placeholder="+31612345678"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
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
                        Voer de affiliate code in die je hebt ontvangen
                      </p>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="text-sm text-red-400 bg-red-950/50 border border-red-900 p-3 rounded">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-zinc-200 font-semibold transition-all"
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
                    Account aanmaken
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UniversalLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF9933] animate-spin" />
      </div>
    }>
      <LoginRegisterForm />
    </Suspense>
  );
}
