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
      toast.error('Please fill in all fields');
      return;
    }

    // Validate URL format
    try {
      new URL(wordpressUrl);
    } catch {
      toast.error('Please enter a valid URL');
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
        message: 'Connection successful!',
        siteInfo: data.siteInfo,
      });

      toast.success('WordPress connected successfully!');
      
      // Wait a moment to show success, then call onSuccess
      setTimeout(() => {
        onSuccess(data.site);
      }, 1000);
    } catch (error: any) {
      console.error('Connection error:', error);
      setTestResult({
        success: false,
        message: error.message || 'Connection failed',
      });
      toast.error('Failed to connect to WordPress');
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
              <CardTitle>Connect WordPress Website</CardTitle>
              <CardDescription>
                Add your WordPress site to start generating content
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
              placeholder="https://example.com"
              value={wordpressUrl}
              onChange={(e) => setWordpressUrl(e.target.value)}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              The full URL of your WordPress website
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="your-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Application Password */}
          <div className="space-y-2">
            <Label htmlFor="app-password">Application Password</Label>
            <Input
              id="app-password"
              type="password"
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
              value={applicationPassword}
              onChange={(e) => setApplicationPassword(e.target.value)}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Generate an Application Password in WordPress under Users → Profile
            </p>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertDescription className="text-sm space-y-2">
              <div className="font-semibold mb-2">How to create an Application Password:</div>
              <ol className="list-decimal list-inside space-y-1">
                <li>Log in to your WordPress admin dashboard</li>
                <li>Go to Users → Profile (your user)</li>
                <li>Scroll down to "Application Passwords"</li>
                <li>Enter a name (e.g., "Content Hub") and click "Add New Application Password"</li>
                <li>Copy the generated password and paste it above</li>
              </ol>
              <a 
                href="https://wordpress.org/support/article/application-passwords/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
              >
                Learn more <ExternalLink className="h-3 w-3" />
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
                        <div><strong>Site Name:</strong> {testResult.siteInfo.name}</div>
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
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {testResult?.success ? 'Connected' : 'Connect & Test'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
