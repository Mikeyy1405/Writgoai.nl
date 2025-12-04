'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface WebsiteConnectorProps {
  onClose: () => void;
  onSuccess: (site: any) => void;
}

export default function WebsiteConnector({ onClose, onSuccess }: WebsiteConnectorProps) {
  const [wordpressUrl, setWordpressUrl] = useState('');
  const [username, setUsername] = useState('');
  const [applicationPassword, setApplicationPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; siteInfo?: any } | null>(null);

  const handleConnect = async () => {
    if (!wordpressUrl || !username || !applicationPassword) {
      toast.error('Vul alle velden in');
      return;
    }

    // Validate URL format
    try {
      new URL(wordpressUrl);
    } catch {
      toast.error('Voer een geldige URL in');
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/content-hub/connect-wordpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wordpressUrl,
          username,
          applicationPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed',
        });
        toast.error(data.error || 'Failed to connect');
        return;
      }

      setTestResult({
        success: true,
        message: 'Verbinding succesvol!',
        siteInfo: data.siteInfo,
      });

      toast.success('WordPress succesvol verbonden!');
      
      // Wait a moment to show success, then call onSuccess
      setTimeout(() => {
        onSuccess(data.site);
      }, 1000);
    } catch (error: any) {
      console.error('Connection error:', error);
      setTestResult({
        success: false,
        message: error.message || 'Verbinding mislukt',
      });
      toast.error('Kon niet verbinden met WordPress');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>WordPress Website Koppelen</CardTitle>
              <CardDescription>
                Voeg je WordPress site toe om content te genereren
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* WordPress URL */}
          <div className="space-y-2">
            <Label htmlFor="wordpress-url">WordPress URL</Label>
            <Input
              id="wordpress-url"
              type="url"
              placeholder="https://voorbeeld.nl"
              value={wordpressUrl}
              onChange={(e) => setWordpressUrl(e.target.value)}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              De volledige URL van je WordPress website
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Gebruikersnaam</Label>
            <Input
              id="username"
              type="text"
              placeholder="jouw-gebruikersnaam"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Application Password */}
          <div className="space-y-2">
            <Label htmlFor="app-password">Applicatie Wachtwoord</Label>
            <Input
              id="app-password"
              type="password"
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
              value={applicationPassword}
              onChange={(e) => setApplicationPassword(e.target.value)}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Genereer een Applicatie Wachtwoord in WordPress onder Gebruikers → Profiel
            </p>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertDescription className="text-sm space-y-2">
              <div className="font-semibold mb-2">Hoe maak je een Applicatie Wachtwoord aan:</div>
              <ol className="list-decimal list-inside space-y-1">
                <li>Log in op je WordPress admin dashboard</li>
                <li>Ga naar Gebruikers → Profiel (jouw gebruiker)</li>
                <li>Scroll naar beneden naar "Applicatie Wachtwoorden"</li>
                <li>Voer een naam in (bijv. "Content Hub") en klik op "Nieuw toepassingswachtwoord toevoegen"</li>
                <li>Kopieer het gegenereerde wachtwoord en plak het hierboven</li>
              </ol>
              <a 
                href="https://wordpress.org/support/article/application-passwords/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
              >
                Meer informatie <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>

          {/* Test Result */}
          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    {testResult.message}
                    {testResult.siteInfo && (
                      <div className="mt-2 text-sm">
                        <div><strong>Site Naam:</strong> {testResult.siteInfo.name}</div>
                        <div><strong>URL:</strong> {testResult.siteInfo.url}</div>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuleren
          </Button>
          <Button onClick={handleConnect} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {testResult?.success ? 'Verbonden' : 'Verbinden & Testen'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
