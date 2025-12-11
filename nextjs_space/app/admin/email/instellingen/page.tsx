'use client';

/**
 * Email Instellingen Page
 * Configure IMAP/SMTP settings for email management
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, X, Settings, Mail } from 'lucide-react';

interface EmailAccount {
  id?: string;
  email: string;
  displayName: string;
  imapHost: string;
  imapPort: number;
  imapTls: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpTls: boolean;
  password: string;
}

export default function EmailInstellingenPage() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<EmailAccount>({
    email: '',
    displayName: '',
    imapHost: '',
    imapPort: 993,
    imapTls: true,
    smtpHost: '',
    smtpPort: 587,
    smtpTls: true,
    password: '',
  });

  // Load existing configuration
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/email/accounts');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.accounts && data.accounts.length > 0) {
          const account = data.accounts[0];
          setFormData({
            id: account.id,
            email: account.email || '',
            displayName: account.displayName || '',
            imapHost: account.imapHost || '',
            imapPort: account.imapPort || 993,
            imapTls: account.imapTls ?? true,
            smtpHost: account.smtpHost || '',
            smtpPort: account.smtpPort || 587,
            smtpTls: account.smtpTls ?? true,
            password: '', // Don't pre-fill password
          });
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof EmailAccount, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setMessage(null);
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      setMessage(null);

      // Validate required fields
      if (!formData.imapHost || !formData.imapPort || !formData.email || !formData.password) {
        setMessage({
          type: 'error',
          text: 'Vul alle vereiste velden in om de connectie te testen.',
        });
        return;
      }

      const response = await fetch('/api/admin/email/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imapHost: formData.imapHost,
          imapPort: formData.imapPort,
          username: formData.email,
          password: formData.password,
          tls: formData.imapTls,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `✓ Connectie succesvol! ${data.message}`,
        });
      } else {
        setMessage({
          type: 'error',
          text: `✗ Connectie mislukt: ${data.error || 'Onbekende fout'}`,
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Fout bij testen connectie: ${error.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Validate required fields
      if (!formData.email || !formData.imapHost || !formData.imapPort || !formData.password) {
        setMessage({
          type: 'error',
          text: 'Vul alle vereiste velden in.',
        });
        return;
      }

      const response = await fetch('/api/admin/email/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          provider: 'imap',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: 'success',
          text: '✓ Email configuratie succesvol opgeslagen!',
        });
        
        // Reload configuration
        setTimeout(() => {
          loadConfiguration();
        }, 1000);
      } else {
        setMessage({
          type: 'error',
          text: `Fout bij opslaan: ${data.error || 'Onbekende fout'}`,
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Fout bij opslaan: ${error.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
          <Mail className="h-8 w-8 text-orange-500" />
          Email Instellingen
        </h1>
        <p className="text-gray-400 mt-2">
          Configureer uw email account voor het ontvangen en versturen van emails
        </p>
      </div>

      {/* Message */}
      {message && (
        <Alert className={message.type === 'success' ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Email Configuration Form */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Email Account</CardTitle>
          <CardDescription className="text-gray-400">
            Vul uw IMAP/SMTP gegevens in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-300">Email Adres *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="info@writgo.nl"
                className="bg-gray-900 border-gray-700 text-gray-100"
              />
            </div>

            <div>
              <Label htmlFor="displayName" className="text-gray-300">Weergave Naam</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                placeholder="Writgo Support"
                className="bg-gray-900 border-gray-700 text-gray-100"
              />
            </div>
          </div>

          {/* IMAP Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">IMAP Instellingen (Ontvangen)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="imapHost" className="text-gray-300">IMAP Host *</Label>
                <Input
                  id="imapHost"
                  value={formData.imapHost}
                  onChange={(e) => handleChange('imapHost', e.target.value)}
                  placeholder="imap.gmail.com"
                  className="bg-gray-900 border-gray-700 text-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="imapPort" className="text-gray-300">IMAP Poort *</Label>
                <Input
                  id="imapPort"
                  type="number"
                  value={formData.imapPort}
                  onChange={(e) => handleChange('imapPort', parseInt(e.target.value))}
                  placeholder="993"
                  className="bg-gray-900 border-gray-700 text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* SMTP Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">SMTP Instellingen (Versturen)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpHost" className="text-gray-300">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  value={formData.smtpHost}
                  onChange={(e) => handleChange('smtpHost', e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="bg-gray-900 border-gray-700 text-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="smtpPort" className="text-gray-300">SMTP Poort</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={formData.smtpPort}
                  onChange={(e) => handleChange('smtpPort', parseInt(e.target.value))}
                  placeholder="587"
                  className="bg-gray-900 border-gray-700 text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-gray-300">
              Wachtwoord {formData.id ? '(laat leeg om te behouden)' : '*'}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="••••••••"
              className="bg-gray-900 border-gray-700 text-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">
              Voor Gmail: gebruik een app-specifiek wachtwoord
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={testConnection}
              disabled={testing || saving}
              variant="outline"
              className="bg-gray-700 text-gray-100 hover:bg-gray-600"
            >
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {testing ? 'Testen...' : 'Test Connectie'}
            </Button>

            <Button
              onClick={saveConfiguration}
              disabled={testing || saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Veel Gebruikte Instellingen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-400">
          <div>
            <strong className="text-gray-300">Gmail:</strong>
            <p>IMAP: imap.gmail.com:993 | SMTP: smtp.gmail.com:587</p>
            <p className="text-xs text-gray-500">Gebruik een app-specifiek wachtwoord (niet je normale wachtwoord)</p>
          </div>
          <div>
            <strong className="text-gray-300">Outlook/Hotmail:</strong>
            <p>IMAP: outlook.office365.com:993 | SMTP: smtp.office365.com:587</p>
          </div>
          <div>
            <strong className="text-gray-300">Andere:</strong>
            <p>Vraag uw email provider naar de IMAP/SMTP instellingen</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
