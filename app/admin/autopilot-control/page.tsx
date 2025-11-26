
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface AutopilotResult {
  projectId: string;
  projectName: string;
  processed?: number;
  successful?: number;
  failed?: number;
  status?: string;
  message?: string;
  error?: string;
}

export default function AutopilotControlPage() {
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<{
    timestamp: string;
    processed: number;
    results: AutopilotResult[];
  } | null>(null);

  const handleTriggerAutopilot = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/autopilot/trigger', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger autopilot');
      }

      toast.success('Autopilot succesvol gestart!', {
        description: data.message,
      });

      setLastRun({
        timestamp: data.data.timestamp,
        processed: data.data.processed,
        results: data.data.results,
      });

    } catch (error: any) {
      console.error('Error triggering autopilot:', error);
      toast.error('Fout bij starten autopilot', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Content Autopilot Besturing</h1>
        <p className="text-muted-foreground">
          Handmatig de content autopilot starten voor alle projecten die klaar zijn om te draaien.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Autopilot Handmatig Starten</CardTitle>
          <CardDescription>
            Start de autopilot voor alle projecten die vandaag nog niet zijn uitgevoerd of waarvan de volgende run tijd is verstreken.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleTriggerAutopilot}
            disabled={loading}
            size="lg"
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Autopilot wordt uitgevoerd...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-5 w-5" />
                Start Autopilot Nu
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {lastRun && (
        <Card>
          <CardHeader>
            <CardTitle>Laatste Run Resultaten</CardTitle>
            <CardDescription>
              Uitgevoerd op: {new Date(lastRun.timestamp).toLocaleString('nl-NL')}
              <br />
              Projecten verwerkt: {lastRun.processed}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lastRun.results.map((result, index) => (
                <div
                  key={result.projectId}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{result.projectName}</h3>
                      <p className="text-sm text-muted-foreground">{result.projectId}</p>
                    </div>
                    
                    {result.status === 'no_articles' && (
                      <Badge variant="outline" className="ml-2">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Geen artikelen
                      </Badge>
                    )}
                    
                    {result.error && (
                      <Badge variant="destructive" className="ml-2">
                        <XCircle className="mr-1 h-3 w-3" />
                        Fout
                      </Badge>
                    )}
                    
                    {result.successful !== undefined && result.successful > 0 && (
                      <Badge variant="default" className="ml-2 bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Succesvol
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                    {result.processed !== undefined && (
                      <div>
                        <p className="text-muted-foreground">Verwerkt</p>
                        <p className="font-semibold">{result.processed} artikel(en)</p>
                      </div>
                    )}
                    
                    {result.successful !== undefined && (
                      <div>
                        <p className="text-muted-foreground">Succesvol</p>
                        <p className="font-semibold text-green-600">{result.successful}</p>
                      </div>
                    )}
                    
                    {result.failed !== undefined && result.failed > 0 && (
                      <div>
                        <p className="text-muted-foreground">Mislukt</p>
                        <p className="font-semibold text-red-600">{result.failed}</p>
                      </div>
                    )}
                  </div>

                  {result.message && (
                    <p className="mt-2 text-sm text-muted-foreground">{result.message}</p>
                  )}

                  {result.error && (
                    <p className="mt-2 text-sm text-red-600">Error: {result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
