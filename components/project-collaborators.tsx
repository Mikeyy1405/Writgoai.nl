
'use client';

import { useState, useEffect } from 'react';
import { Mail, UserPlus, Trash2, Eye, Check, X, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import toast from 'react-hot-toast';

interface Collaborator {
  id: string;
  email: string;
  name?: string;
  role: string;
  status: string;
  accessToken: string;
  notifyOnPublish: boolean;
  invitedAt: string;
  lastAccessAt?: string;
  acceptedAt?: string;
  revokedAt?: string;
}

interface ProjectCollaboratorsProps {
  projectId: string;
}

export default function ProjectCollaborators({ projectId }: ProjectCollaboratorsProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'client',
    notifyOnPublish: true,
    password: '',
  });
  const [addMode, setAddMode] = useState<'invite' | 'direct'>('invite');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchCollaborators();
  }, [projectId]);

  const fetchCollaborators = async () => {
    try {
      const res = await fetch(`/api/client/project-members?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data.collaborators || []);
      }
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      const endpoint = addMode === 'direct' 
        ? `/api/client/create-project-client`
        : `/api/client/project-members`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, projectId }),
      });

      const data = await res.json();

      if (res.ok) {
        if (addMode === 'direct') {
          const loginUrl = data.loginUrl || 'https://WritgoAI.nl/inloggen';
          
          // Show detailed success message with credentials
          toast.success(
            <div className="space-y-2">
              <div className="font-semibold">✅ Client succesvol aangemaakt!</div>
              <div className="text-sm space-y-1">
                <div>📧 <strong>Email:</strong> {formData.email}</div>
                <div>🔑 <strong>Wachtwoord:</strong> {formData.password}</div>
                <div>🔗 <strong>Login URL:</strong></div>
                <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {loginUrl}
                </div>
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                💡 Deel deze inloggegevens met je client
              </div>
            </div>,
            { duration: 15000 } // Show for 15 seconds
          );
          
          // Also show a persistent banner with the info
          setTimeout(() => {
            alert(`✅ Client aangemaakt!\n\n📧 Email: ${formData.email}\n🔑 Wachtwoord: ${formData.password}\n\n🔗 Login URL:\n${loginUrl}\n\nNa inloggen krijgt de client automatisch toegang tot dit project.`);
          }, 500);
        } else {
          toast.success('Collaborator succesvol uitgenodigd!');
        }
        setShowAddForm(false);
        setFormData({ email: '', name: '', role: 'client', notifyOnPublish: true, password: '' });
        fetchCollaborators();
      } else {
        toast.error(data.error || 'Er ging iets mis');
      }
    } catch (error) {
      console.error('Error adding collaborator:', error);
      toast.error('Er ging iets mis');
    } finally {
      setAdding(false);
    }
  };

  const handleRevoke = async (collaboratorId: string) => {
    if (!confirm('Weet je zeker dat je de toegang wilt intrekken?')) return;

    try {
      const res = await fetch(
        `/api/client/project-members?collaboratorId=${collaboratorId}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        toast.success('Toegang ingetrokken');
        fetchCollaborators();
      } else {
        toast.error('Er ging iets mis');
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error('Er ging iets mis');
    }
  };

  const copyAccessLink = (token: string) => {
    const url = `${window.location.origin}/project-view/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link gekopieerd naar klembord!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Actief</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">In afwachting</Badge>;
      case 'revoked':
        return <Badge className="bg-red-500">Ingetrokken</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold">Project Collaborators</h3>
          <p className="text-sm text-muted-foreground mt-1 break-words">
            Geef anderen read-only toegang tot dit project
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full sm:w-auto shrink-0"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Uitnodigen
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="p-6 border-purple-200 bg-purple-50/50">
          <form onSubmit={handleInvite} className="space-y-4">
            {/* Mode Selection */}
            <div className="mb-4">
              <Label>Toegang geven via:</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={addMode === 'invite' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAddMode('invite')}
                  className="flex-1"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Uitnodigen (via email)
                </Button>
                <Button
                  type="button"
                  variant={addMode === 'direct' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAddMode('direct')}
                  className="flex-1"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Direct aanmaken
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {addMode === 'invite' 
                  ? 'Stuurt een uitnodigingsmail naar het opgegeven emailadres'
                  : 'Maakt direct een account aan met zelfgekozen wachtwoord'}
              </p>
            </div>

            <div>
              <Label htmlFor="email">Email adres *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="naam@bedrijf.nl"
                required
              />
            </div>

            <div>
              <Label htmlFor="name">Naam *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Jan Jansen"
                required={addMode === 'direct'}
              />
            </div>

            {/* Password field for direct mode */}
            {addMode === 'direct' && (
              <div>
                <Label htmlFor="password">Wachtwoord *</Label>
                <Input
                  id="password"
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimaal 8 tekens"
                  minLength={8}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Dit wachtwoord kan de client gebruiken om in te loggen
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="role">Rol *</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="client">Klant (Beperkte weergave)</option>
                <option value="employee">Medewerker (Volledige toegang)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.role === 'client' 
                  ? 'Klanten zien alleen content planning en gepubliceerde artikelen'
                  : 'Medewerkers hebben volledige toegang tot alle project onderdelen'}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify">Notificaties bij nieuwe publicaties</Label>
              <Switch
                id="notify"
                checked={formData.notifyOnPublish}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notifyOnPublish: checked })
                }
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" disabled={adding} className="w-full sm:w-auto">
                {adding 
                  ? (addMode === 'direct' ? 'Aanmaken...' : 'Uitnodigen...') 
                  : (addMode === 'direct' ? 'Client Aanmaken' : 'Uitnodigen')}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
                className="w-full sm:w-auto"
              >
                Annuleren
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Collaborators List */}
      {collaborators.length === 0 ? (
        <Card className="p-6 md:p-8">
          <div className="text-center">
            <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">Nog geen collaborators</h3>
            <p className="text-sm text-muted-foreground break-words px-2">
              Nodig iemand uit om je contentplanning te kunnen bekijken
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {collaborators.map((collab) => (
            <Card key={collab.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium break-words">{collab.name || collab.email}</div>
                      {collab.name && (
                        <div className="text-sm text-muted-foreground break-all">{collab.email}</div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={collab.role === 'client' ? 'default' : 'secondary'}>
                        {collab.role === 'client' ? 'Klant' : 'Medewerker'}
                      </Badge>
                      {getStatusBadge(collab.status)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                    <div>
                      Uitgenodigd:{' '}
                      {new Date(collab.invitedAt).toLocaleDateString('nl-NL')}
                    </div>
                    {collab.lastAccessAt && (
                      <div>
                        Laatste toegang:{' '}
                        {new Date(collab.lastAccessAt).toLocaleDateString('nl-NL')}
                      </div>
                    )}
                  </div>

                  {collab.status !== 'revoked' && (
                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyAccessLink(collab.accessToken)}
                        className="w-full sm:w-auto justify-center sm:justify-start"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        <span className="truncate">Kopieer link</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(`/project-view/${collab.accessToken}`, '_blank')
                        }
                        className="w-full sm:w-auto justify-center sm:justify-start"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        <span className="truncate">Open dashboard</span>
                      </Button>
                    </div>
                  )}
                </div>

                {collab.status !== 'revoked' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(collab.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 self-end sm:self-start"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
