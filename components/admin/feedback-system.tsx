'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Star,
  Loader2,
  MessageSquare,
  Coins,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Feedback {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  creditsAwarded: number;
  adminNotes?: string;
  adminResponse?: string;
  rating?: number;
  createdAt: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
}

export default function FeedbackSystem() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [creditsToAward, setCreditsToAward] = useState('5');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, [filter]);

  async function loadFeedback() {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/feedback?status=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback || []);
      }
    } catch (error) {
      console.error('Failed to load feedback:', error);
      toast.error('Fout bij laden feedback');
    } finally {
      setLoading(false);
    }
  }

  function openDetails(item: Feedback) {
    setSelectedFeedback(item);
    setAdminResponse(item.adminResponse || '');
    setAdminNotes(item.adminNotes || '');
    setDetailsOpen(true);
  }

  async function handleUpdateStatus(status: string) {
    if (!selectedFeedback) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackId: selectedFeedback.id,
          status,
          adminResponse: adminResponse || undefined,
          adminNotes: adminNotes || undefined
        })
      });

      if (response.ok) {
        toast.success('Feedback status bijgewerkt');
        loadFeedback();
        setDetailsOpen(false);
      } else {
        toast.error('Fout bij bijwerken feedback');
      }
    } catch (error) {
      console.error('Failed to update feedback:', error);
      toast.error('Fout bij bijwerken feedback');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAwardCredits() {
    if (!selectedFeedback) return;

    const credits = parseFloat(creditsToAward);
    if (isNaN(credits) || credits <= 0) {
      toast.error('Ongeldig creditbedrag');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/feedback/${selectedFeedback.id}/award-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits })
      });

      if (response.ok) {
        toast.success(`${credits} credits toegekend aan ${selectedFeedback.client.name}`);
        loadFeedback();
        setDetailsOpen(false);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Fout bij toekennen credits');
      }
    } catch (error) {
      console.error('Failed to award credits:', error);
      toast.error('Fout bij toekennen credits');
    } finally {
      setActionLoading(false);
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'bug': return 'bg-red-900/30 text-red-300 border-red-700';
      case 'feature': return 'bg-blue-900/30 text-blue-300 border-blue-700';
      case 'improvement': return 'bg-yellow-900/30 text-yellow-300 border-yellow-700';
      case 'compliment': return 'bg-green-900/30 text-green-300 border-green-700';
      default: return 'bg-gray-900/30 text-gray-300 border-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="h-6 w-6 text-[#FF6B35]" />
            Feedback Systeem
          </CardTitle>
          <CardDescription className="text-gray-400">
            Beheer gebruikersfeedback en ken credits toe (max 10 per uur per gebruiker)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
              className={filter === 'pending' ? 'bg-[#FF6B35]' : 'bg-transparent border-zinc-700 text-gray-400'}
            >
              Wachtend
            </Button>
            <Button
              variant={filter === 'in_review' ? 'default' : 'outline'}
              onClick={() => setFilter('in_review')}
              className={filter === 'in_review' ? 'bg-[#FF6B35]' : 'bg-transparent border-zinc-700 text-gray-400'}
            >
              In behandeling
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilter('completed')}
              className={filter === 'completed' ? 'bg-[#FF6B35]' : 'bg-transparent border-zinc-700 text-gray-400'}
            >
              Afgehandeld
            </Button>
            <Button
              variant={filter === '' ? 'default' : 'outline'}
              onClick={() => setFilter('')}
              className={filter === '' ? 'bg-[#FF6B35]' : 'bg-transparent border-zinc-700 text-gray-400'}
            >
              Alles
            </Button>
          </div>

          {/* Feedback Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-700 overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-800">
                  <TableRow className="border-zinc-700">
                    <TableHead className="text-white font-semibold">Klant</TableHead>
                    <TableHead className="text-white font-semibold">Categorie</TableHead>
                    <TableHead className="text-white font-semibold">Titel</TableHead>
                    <TableHead className="text-white font-semibold">Rating</TableHead>
                    <TableHead className="text-white font-semibold">Credits</TableHead>
                    <TableHead className="text-white font-semibold">Datum</TableHead>
                    <TableHead className="text-right text-white font-semibold">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.map((item) => (
                    <TableRow key={item.id} className="hover:bg-zinc-800/50 border-zinc-700">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{item.client.name}</p>
                          <p className="text-sm text-gray-500">{item.client.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getCategoryColor(item.category)}>
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">{item.title}</TableCell>
                      <TableCell>
                        {item.rating && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star className="h-4 w-4 fill-current" />
                            <span>{item.rating}/5</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.creditsAwarded > 0 ? (
                          <Badge className="bg-green-600">
                            <Coins className="h-3 w-3 mr-1" />
                            {item.creditsAwarded}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-zinc-700 text-gray-500">
                            Geen
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: nl })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => openDetails(item)}
                          className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Bekijken
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && feedback.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Geen feedback items gevonden
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white">Feedback Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Van: {selectedFeedback?.client.name} ({selectedFeedback?.client.email})
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-6 py-4">
              {/* Feedback Info */}
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Categorie</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={getCategoryColor(selectedFeedback.category)}>
                      {selectedFeedback.category}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300">Titel</Label>
                  <p className="mt-1 text-white">{selectedFeedback.title}</p>
                </div>

                <div>
                  <Label className="text-gray-300">Beschrijving</Label>
                  <p className="mt-1 text-white whitespace-pre-wrap">{selectedFeedback.description}</p>
                </div>

                {selectedFeedback.rating && (
                  <div>
                    <Label className="text-gray-300">Rating</Label>
                    <div className="mt-1 flex items-center gap-1 text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < (selectedFeedback.rating || 0) ? 'fill-current' : ''}`}
                        />
                      ))}
                      <span className="ml-2 text-white">{selectedFeedback.rating}/5</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-700 pt-4" />

              {/* Admin Response */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="adminResponse" className="text-gray-300">Reactie naar gebruiker (optioneel)</Label>
                  <Textarea
                    id="adminResponse"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Typ je reactie hier..."
                    rows={4}
                    className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="adminNotes" className="text-gray-300">Interne notities (niet zichtbaar voor gebruiker)</Label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Interne notities..."
                    rows={3}
                    className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                {selectedFeedback.creditsAwarded === 0 && (
                  <div>
                    <Label htmlFor="credits" className="text-gray-300">Credits toekennen</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="credits"
                        type="number"
                        value={creditsToAward}
                        onChange={(e) => setCreditsToAward(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white"
                        min="1"
                        max="10"
                      />
                      <Button
                        onClick={handleAwardCredits}
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Coins className="h-4 w-4 mr-2" />}
                        Toekennen
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Max 10 credits per uur per gebruiker. Standaard: 5 credits per feedback.
                    </p>
                  </div>
                )}

                {selectedFeedback.creditsAwarded > 0 && (
                  <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">
                        {selectedFeedback.creditsAwarded} credits al toegekend
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsOpen(false)}
              className="bg-transparent border-zinc-700 text-gray-300 hover:bg-zinc-800"
            >
              Sluiten
            </Button>
            <Button
              onClick={() => handleUpdateStatus('in_review')}
              disabled={actionLoading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              In behandeling
            </Button>
            <Button
              onClick={() => handleUpdateStatus('completed')}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Afhandelen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
