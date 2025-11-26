'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

export default function GSCTestPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/client/search-console/diagnostics');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const startOAuth = () => {
    window.location.href = '/api/client/search-console/oauth?action=connect';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  const hasTokens = status?.authFile?.accessToken && status?.authFile?.refreshToken;

  return (
    <div className="min-h-screen bg-black p-4 sm:p-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">
          Google Search Console Test
        </h1>

        <div className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {hasTokens ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                OAuth Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Verbinding</p>
                <p className={`text-lg font-bold ${hasTokens ? 'text-green-400' : 'text-red-400'}`}>
                  {hasTokens ? '✅ Gekoppeld' : '❌ Niet Gekoppeld'}
                </p>
              </div>

              {status?.authFile && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded">
                    <span className="text-sm text-gray-400">Access Token</span>
                    <span className={`text-sm font-medium ${status.authFile.accessToken ? 'text-green-400' : 'text-red-400'}`}>
                      {status.authFile.accessToken ? '✓ Aanwezig' : '✗ Ontbreekt'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded">
                    <span className="text-sm text-gray-400">Refresh Token</span>
                    <span className={`text-sm font-medium ${status.authFile.refreshToken ? 'text-green-400' : 'text-red-400'}`}>
                      {status.authFile.refreshToken ? '✓ Aanwezig' : '✗ Ontbreekt'}
                    </span>
                  </div>
                </div>
              )}

              {!hasTokens && (
                <Button
                  onClick={startOAuth}
                  className="w-full mt-4 bg-[#ff6b35] hover:bg-[#ff8c42] text-white"
                >
                  🔗 Koppel Google Account Nu
                </Button>
              )}

              {hasTokens && (
                <div className="mt-4 p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                  <p className="text-sm font-medium text-green-400">✅ Succesvol gekoppeld!</p>
                  <p className="text-xs text-green-200 mt-1">Je kunt nu GSC data ophalen.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {!hasTokens && (
            <Card className="bg-blue-900/20 border-blue-700/50">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Setup Instructies
                </CardTitle>
              </CardHeader>
              <CardContent className="text-blue-200 text-sm space-y-3">
                <p>1. Zorg dat deze redirect URI is toegevoegd in Google Cloud Console:</p>
                <code className="block p-3 bg-black/30 rounded text-xs">
                  https://writgoai.nl/api/client/search-console/oauth
                </code>
                <p>2. Klik op "Koppel Google Account Nu"</p>
                <p>3. Log in met je Google account</p>
                <p>4. Geef toestemming voor Search Console toegang</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
