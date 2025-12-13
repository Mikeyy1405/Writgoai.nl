'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Loader2,
  Search,
  DollarSign,
  Calendar,
  Activity,
  Trash2,
  Eye,
  Plus,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ClientManagementPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialogs
  const [customCreditsDialog, setCustomCreditsDialog] = useState<{ open: boolean; clientId: string; clientName: string }>({
    open: false,
    clientId: '',
    clientName: '',
  });
  const [customAmount, setCustomAmount] = useState('');
  
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; clientId: string; clientName: string }>({
    open: false,
    clientId: '',
    clientName: '',
  });
  
  const [usageDialog, setUsageDialog] = useState<{ open: boolean; client: any | null }>({
    open: false,
    client: null,
  });

  useEffect(() => {
    // Check if admin
    if (session?.user?.email !== 'info@WritgoAI.nl') {
      router.push('/client-portal');
      return;
    }
    fetchClients();
  }, [session]);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients-overview');
      const data = await res.json();
      if (data.success) {
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      toast.error('Kon klanten niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async (clientId: string, amount: number) => {
    try {
      const res = await fetch('/api/admin/manage-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          amount,
          type: 'topup',
          description: `Admin toegewezen: ${amount} credits`,
        }),
      });

      if (!res.ok) throw new Error('Failed to add credits');

      toast.success(`${amount} credits toegevoegd!`);
      fetchClients();
    } catch (error) {
      toast.error('Kon credits niet toevoegen');
    }
  };

  const handleCustomCredits = async () => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Voer een geldig bedrag in');
      return;
    }

    await handleAddCredits(customCreditsDialog.clientId, amount);
    setCustomCreditsDialog({ open: false, clientId: '', clientName: '' });
    setCustomAmount('');
  };

  const handleDeleteClient = async () => {
    try {
      const res = await fetch('/api/admin/delete-client', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: deleteDialog.clientId }),
      });

      if (!res.ok) throw new Error('Failed to delete client');

      toast.success('Klant verwijderd');
      setDeleteDialog({ open: false, clientId: '', clientName: '' });
      fetchClients();
    } catch (error) {
      toast.error('Kon klant niet verwijderen');
    }
  };

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-3 sm:p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="p-2 sm:p-3 bg-gradient-to-br from-red-600 to-rose-700 rounded-xl">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Klanten Beheer</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Overzicht en beheer van alle klanten</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Zoek klant..."
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="w-fit">{filteredClients.length} klanten</Badge>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold truncate">{client.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{client.email}</p>
                  {client.companyName && (
                    <p className="text-xs text-gray-400 truncate">{client.companyName}</p>
                  )}
                </div>
                <Badge variant={client.subscriptionStatus === 'active' ? 'default' : 'secondary'} className="text-xs whitespace-nowrap">
                  {client.subscriptionPlan || 'Geen abonnement'}
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-orange-600 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-medium">Credits</span>
                  </div>
                  <p className="text-xl font-bold text-orange-600">{client.totalCredits.toFixed(0)}</p>
                </div>
                <div className="bg-zinc-900 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-[#ff6b35] mb-1">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-medium">Content</span>
                  </div>
                  <p className="text-xl font-bold text-[#ff6b35]">{client.stats.contentPieces}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(client.createdAt), 'dd MMM yyyy', { locale: nl })}
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {format(new Date(client.lastActive), 'dd MMM yyyy', { locale: nl })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 sm:gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddCredits(client.id, 10)}
                  className="text-xs px-2 sm:px-3"
                >
                  +10
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddCredits(client.id, 20)}
                  className="text-xs px-2 sm:px-3"
                >
                  +20
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddCredits(client.id, 50)}
                  className="text-xs px-2 sm:px-3"
                >
                  +50
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddCredits(client.id, 100)}
                  className="text-xs px-2 sm:px-3"
                >
                  +100
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddCredits(client.id, 500)}
                  className="text-xs px-2 sm:px-3"
                >
                  +500
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setCustomCreditsDialog({
                        open: true,
                        clientId: client.id,
                        clientName: client.name,
                      })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Custom credits
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setUsageDialog({
                        open: true,
                        client,
                      })}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Gebruik inzien
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(`/client-portal/messages?clientId=${client.id}`)}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Berichten
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteDialog({
                        open: true,
                        clientId: client.id,
                        clientName: client.name,
                      })}
                      className="text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Verwijderen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Custom Credits Dialog */}
      <Dialog open={customCreditsDialog.open} onOpenChange={(open) => {
        setCustomCreditsDialog({ ...customCreditsDialog, open });
        if (!open) setCustomAmount('');
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Credits toevoegen aan {customCreditsDialog.clientName}</DialogTitle>
            <DialogDescription className="text-sm">
              Voer het aantal credits in dat je wilt toevoegen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Aantal credits"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min="1"
            />
            <div className="flex gap-2 flex-wrap">
              {[10, 20, 50, 100, 250, 500, 1000, 2000, 5000].map((amount) => (
                <Button
                  key={amount}
                  size="sm"
                  variant="outline"
                  onClick={() => setCustomAmount(amount.toString())}
                >
                  {amount}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCustomCreditsDialog({ open: false, clientId: '', clientName: '' });
                setCustomAmount('');
              }}
            >
              Annuleren
            </Button>
            <Button onClick={handleCustomCredits}>
              Credits toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Klant verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je <strong>{deleteDialog.clientName}</strong> wilt verwijderen?
              Dit verwijdert alle content, opdrachten en gegevens van deze klant. Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-red-600 hover:bg-red-700">
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Usage Dialog */}
      <Dialog open={usageDialog.open} onOpenChange={(open) => setUsageDialog({ ...usageDialog, open })}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Gebruik overzicht - {usageDialog.client?.name}</DialogTitle>
            <DialogDescription className="text-sm">
              Gedetailleerd overzicht van credits en content gebruik
            </DialogDescription>
          </DialogHeader>
          
          {usageDialog.client && (
            <div className="space-y-4">
              {/* Credit Summary */}
              <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50">
                <h3 className="font-semibold mb-2 text-orange-800">Credits Overzicht</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-300">Beschikbaar</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {usageDialog.client.totalCredits?.toFixed(0) || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Totaal content</p>
                    <p className="text-2xl font-bold text-[#ff6b35]">
                      {usageDialog.client.stats?.contentPieces || 0}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Content Breakdown */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Content Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Blogs geschreven</span>
                    <Badge>{usageDialog.client.stats?.blogs || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Video's gegenereerd</span>
                    <Badge>{usageDialog.client.stats?.videos || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Social media posts</span>
                    <Badge>{usageDialog.client.stats?.socialPosts || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Afbeeldingen</span>
                    <Badge>{usageDialog.client.stats?.images || 0}</Badge>
                  </div>
                </div>
              </Card>

              {/* Account Info */}
              <Card className="p-4 bg-zinc-900">
                <h3 className="font-semibold mb-3">Account Informatie</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Email:</span>
                    <span className="font-medium">{usageDialog.client.email}</span>
                  </div>
                  {usageDialog.client.companyName && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Bedrijf:</span>
                      <span className="font-medium">{usageDialog.client.companyName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-300">Abonnement:</span>
                    <Badge variant={usageDialog.client.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                      {usageDialog.client.subscriptionPlan || 'Geen'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Lid sinds:</span>
                    <span className="font-medium">
                      {format(new Date(usageDialog.client.createdAt), 'dd MMMM yyyy', { locale: nl })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Laatst actief:</span>
                    <span className="font-medium">
                      {format(new Date(usageDialog.client.lastActive), 'dd MMMM yyyy', { locale: nl })}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setUsageDialog({ open: false, client: null })}>
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
