'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { MessageSquare, Loader2, Send, Search } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
}

export default function MessagingSystem() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const response = await fetch('/api/admin/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  }

  async function handleSendMessage() {
    if (!selectedClient || !message.trim()) {
      toast.error('Selecteer een klant en voer een bericht in');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient,
          subject: subject || 'Bericht van WritgoAI',
          message
        })
      });

      if (response.ok) {
        toast.success('Bericht succesvol verzonden!');
        setMessage('');
        setSubject('');
        setSelectedClient('');
      } else {
        toast.error('Fout bij verzenden bericht');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Fout bij verzenden bericht');
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-[#FF6B35]" />
            Berichten Systeem
          </CardTitle>
          <CardDescription className="text-gray-400">
            Stuur berichten naar klanten (zij ontvangen ook een email notificatie)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientSelect" className="text-gray-300">Selecteer Klant</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    placeholder="Zoek klant..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Kies een klant" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 max-h-[300px]">
                    {filteredClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-gray-300">Onderwerp (optioneel)</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Bericht onderwerp..."
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-gray-300">Bericht</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Typ je bericht hier..."
                rows={8}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={loading || !selectedClient || !message.trim()}
              className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Verzenden
            </Button>
          </div>

          <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <p className="text-sm text-blue-300">
              💡 <strong>Tip:</strong> De klant ontvangt dit bericht in hun inbox én via email. Ze kunnen direct vanuit hun portal reageren.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
