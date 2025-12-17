
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface TaskUpdate {
  id: string;
  taskId: string;
  title: string;
  description: string;
  createdByType: 'CLIENT' | 'TEAM';
  createdById: string;
  createdByName: string;
  updateType: 'NEW_REQUEST' | 'STATUS_CHANGE' | 'DELIVERY' | 'FEEDBACK' | 'DEADLINE_CHANGE' | 'GENERAL';
  newDeadline?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface TaskUpdatesProps {
  taskId: string;
  isClientView?: boolean;
  authToken?: string;
}

export function TaskUpdates({ taskId, isClientView = false, authToken }: TaskUpdatesProps) {
  const [updates, setUpdates] = useState<TaskUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [updateType, setUpdateType] = useState<string>('GENERAL');
  const [showForm, setShowForm] = useState(false);

  // Load updates
  useEffect(() => {
    loadUpdates();
  }, [taskId]);

  async function loadUpdates() {
    try {
      setLoading(true);
      
      const headers: HeadersInit = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`/api/tasks/${taskId}/updates`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to load updates');
      }

      const data = await response.json();
      setUpdates(data.updates || []);
    } catch (error) {
      console.error('Error loading updates:', error);
      toast.error('Kon updates niet laden');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      toast.error('Vul alle verplichte velden in');
      return;
    }

    try {
      setSubmitting(true);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`/api/tasks/${taskId}/updates`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title,
          description,
          updateType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create update');
      }

      toast.success('Update toegevoegd');
      
      // Reset form
      setTitle('');
      setDescription('');
      setUpdateType('GENERAL');
      setShowForm(false);
      
      // Reload updates
      loadUpdates();
    } catch (error) {
      console.error('Error creating update:', error);
      toast.error('Kon update niet toevoegen');
    } finally {
      setSubmitting(false);
    }
  }

  function getUpdateTypeLabel(type: string): { label: string; icon: any; color: string } {
    switch (type) {
      case 'NEW_REQUEST':
        return { label: 'Nieuwe aanvraag', icon: MessageSquare, color: 'bg-orange-500' };
      case 'STATUS_CHANGE':
        return { label: 'Status wijziging', icon: AlertCircle, color: 'bg-yellow-500' };
      case 'DELIVERY':
        return { label: 'Oplevering', icon: CheckCircle, color: 'bg-green-500' };
      case 'FEEDBACK':
        return { label: 'Feedback', icon: MessageSquare, color: 'bg-writgo-orange' };
      case 'DEADLINE_CHANGE':
        return { label: 'Deadline wijziging', icon: Calendar, color: 'bg-orange-500' };
      default:
        return { label: 'Algemeen', icon: FileText, color: 'bg-slate-8000' };
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Updates & Berichten</h3>
          {updates.length > 0 && (
            <Badge variant="secondary">{updates.length}</Badge>
          )}
        </div>
        
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Send className="h-4 w-4 mr-2" />
            Nieuwe update
          </Button>
        )}
      </div>

      {/* New update form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nieuwe update toevoegen</CardTitle>
            <CardDescription>
              Voeg een update of vraag toe aan deze opdracht
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Onderwerp *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Bijvoorbeeld: Extra content aanvraag"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="updateType">Type update</Label>
                <Select value={updateType} onValueChange={setUpdateType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">Algemeen</SelectItem>
                    <SelectItem value="NEW_REQUEST">Nieuwe aanvraag</SelectItem>
                    <SelectItem value="FEEDBACK">Feedback</SelectItem>
                    <SelectItem value="DEADLINE_CHANGE">Deadline wijziging</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschrijving *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschrijf je vraag of update..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Bezig...' : 'Verstuur update'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setTitle('');
                    setDescription('');
                    setUpdateType('GENERAL');
                  }}
                >
                  Annuleren
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Updates timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Update geschiedenis</CardTitle>
          <CardDescription>
            Alle updates en berichten voor deze opdracht
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Updates laden...
            </div>
          ) : updates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nog geen updates</p>
              <p className="text-sm">Voeg een update toe om van start te gaan</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {updates.map((update, index) => {
                  const typeInfo = getUpdateTypeLabel(update.updateType);
                  const Icon = typeInfo.icon;
                  
                  return (
                    <div key={update.id}>
                      <div className="flex gap-4">
                        {/* Timeline indicator */}
                        <div className="flex flex-col items-center">
                          <div className={`rounded-full p-2 ${typeInfo.color}`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          {index < updates.length - 1 && (
                            <div className="w-0.5 h-full bg-border mt-2" />
                          )}
                        </div>

                        {/* Update content */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{update.title}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {typeInfo.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-medium">
                                  {update.createdByName}
                                </span>
                                <span>•</span>
                                <Badge variant={update.createdByType === 'CLIENT' ? 'default' : 'outline'}>
                                  {update.createdByType === 'CLIENT' ? 'Klant' : 'Team'}
                                </Badge>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(update.createdAt), 'dd MMM yyyy HH:mm', { locale: nl })}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm whitespace-pre-wrap">{update.description}</p>
                          
                          {update.attachmentUrl && (
                            <div className="mt-2">
                              <a
                                href={update.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                <FileText className="h-4 w-4" />
                                {update.attachmentName || 'Bijlage'}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
