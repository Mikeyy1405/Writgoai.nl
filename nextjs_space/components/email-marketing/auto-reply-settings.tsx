/**
 * Auto-Reply Settings Component
 * Configure AI auto-reply rules
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AutoReplyConfig {
  id: string;
  isActive: boolean;
  businessHoursOnly: boolean;
  businessHoursStart: string | null;
  businessHoursEnd: string | null;
  businessDays: number[];
  allowedCategories: string[];
  excludedSenders: string[];
  tone: string;
  includeSignature: boolean;
  createdAt: string;
}

export function AutoReplySettings() {
  const [configs, setConfigs] = useState<AutoReplyConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/admin/email-marketing/auto-reply');
      const data = await response.json();
      
      if (response.ok) {
        setConfigs(data.configs || []);
      } else {
        toast.error(data.error || 'Failed to fetch auto-reply configs');
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.error('Failed to fetch auto-reply configs');
    } finally {
      setLoading(false);
    }
  };

  const toggleConfig = async (configId: string, isActive: boolean) => {
    try {
      toast.info('Toggle functionality not yet implemented');
      // In a full implementation, you'd make a PATCH request here
    } catch (error) {
      console.error('Error toggling config:', error);
      toast.error('Failed to update config');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Auto-Reply Settings</h2>
          <p className="text-muted-foreground">
            Configure AI-powered automatic email responses
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Config
        </Button>
      </div>

      {configs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No auto-reply rules yet</h3>
              <p className="text-muted-foreground">
                Set up auto-reply rules to automatically respond to incoming emails
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {configs.map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Auto-Reply Configuration</CardTitle>
                    <CardDescription>
                      Tone: {config.tone} | Categories:{' '}
                      {config.allowedCategories.length > 0
                        ? config.allowedCategories.join(', ')
                        : 'All'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${config.id}`}>Active</Label>
                    <Switch
                      id={`active-${config.id}`}
                      checked={config.isActive}
                      onCheckedChange={(checked) => toggleConfig(config.id, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Business Hours Only</p>
                      <p className="text-sm text-muted-foreground">
                        {config.businessHoursOnly ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Include Signature</p>
                      <p className="text-sm text-muted-foreground">
                        {config.includeSignature ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>

                  {config.businessHoursOnly && (
                    <div>
                      <p className="text-sm font-medium">Business Hours</p>
                      <p className="text-sm text-muted-foreground">
                        {config.businessHoursStart} - {config.businessHoursEnd}
                      </p>
                    </div>
                  )}

                  {config.excludedSenders.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Excluded Senders</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {config.excludedSenders.map((sender, idx) => (
                          <Badge key={idx} variant="secondary">
                            {sender}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      Edit Configuration
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
