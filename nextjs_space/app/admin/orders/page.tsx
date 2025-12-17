'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, Plus, Clock, CheckCircle2, RefreshCw, Loader2, 
  FileText, User, Calendar, DollarSign, MessageSquare,
  ArrowLeft, Send, X, AlertCircle, Star
} from 'lucide-react';
import Link from 'next/link';

type OrderStatus = 'open' | 'assigned' | 'busy' | 'review' | 'revision' | 'done';
type CategoryKey = 'blog' | 'web' | 'app' | 'landing';

interface Order {
  id: string;
  title: string;
  category: CategoryKey;
  words: number;
  notes?: string;
  deadline: string;
  status: OrderStatus;
  priority: boolean;
  paymentStatus: 'paid' | 'unpaid';
  invoiceNumber?: string;
  assignedWriter?: string;
  assignedEmail?: string;
  rate?: number;
  price?: number;
  vat?: number;
  totalPrice?: number;
  writerFee?: number;
  rating?: number;
  deliveryUrl?: string;
  createdAt: string;
  client: {
    name: string;
    email: string;
    companyName?: string;
  };
  messages?: OrderMessage[];
  timeline?: OrderTimeline[];
}

interface OrderMessage {
  id: string;
  sender: string;
  text: string;
  type: string;
  createdAt: string;
}

interface OrderTimeline {
  id: string;
  action: string;
  details: string;
  user: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
  assigned: { label: 'Toegewezen', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: User },
  busy: { label: 'In Behandeling', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: RefreshCw },
  review: { label: 'Review', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: FileText },
  revision: { label: 'Revisie', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle },
  done: { label: 'Klaar', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
};

const CATEGORY_CONFIG = {
  blog: { label: 'Blog', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  web: { label: 'Website', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  app: { label: 'App', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  landing: { label: 'Landing', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/admin/orders?status=${statusFilter}`);
      const data = await res.json();
      
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = orders.filter(
        (order) =>
          order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchTerm, orders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          const data = await res.json();
          setSelectedOrder(data.order);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedOrder) return;

    setSending(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMessage }),
      });

      if (res.ok) {
        setNewMessage('');
        const detailRes = await fetch(`/api/admin/orders/${selectedOrder.id}`);
        const detailData = await detailRes.json();
        setSelectedOrder(detailData.order);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleRating = async (orderId: string, rating: number) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });

      if (res.ok) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          const data = await res.json();
          setSelectedOrder(data.order);
        }
      }
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const stats = {
    total: orders.length,
    open: orders.filter((o) => o.status === 'open').length,
    inProgress: orders.filter((o) => ['assigned', 'busy', 'review', 'revision'].includes(o.status)).length,
    done: orders.filter((o) => o.status === 'done').length,
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/superadmin/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Opdrachten Management</h1>
              <p className="text-sm text-gray-400">Beheer alle content opdrachten</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Totaal</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Open</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.open}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">In Behandeling</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.inProgress}</p>
                </div>
                <RefreshCw className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Afgerond</p>
                  <p className="text-2xl font-bold text-green-400">{stats.done}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 bg-gray-900 border-gray-800">
            <CardHeader className="border-b border-gray-800">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Zoek opdrachten..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-950 border-gray-800"
                  />
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {['all', 'open', 'assigned', 'busy', 'review', 'done'].map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={statusFilter === status ? 'default' : 'outline'}
                      onClick={() => setStatusFilter(status)}
                      className={
                        statusFilter === status
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-gray-950 border-gray-800 hover:bg-gray-800'
                      }
                    >
                      {status === 'all' ? 'Alle' : STATUS_CONFIG[status as OrderStatus]?.label || status}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
                {filteredOrders.map((order) => {
                  const status = STATUS_CONFIG[order.status];
                  const category = CATEGORY_CONFIG[order.category];
                  const StatusIcon = status.icon;
                  
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-4 cursor-pointer transition-all hover:bg-gray-800/50 ${
                        selectedOrder?.id === order.id
                          ? 'bg-gray-800 border-l-2 border-purple-500'
                          : 'border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white truncate">{order.title}</h4>
                          <p className="text-xs text-gray-500 truncate">{order.client.name}</p>
                        </div>
                        {order.messages && order.messages.length > 0 && (
                          <MessageSquare className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-2">
                          <Badge className={`text-[10px] ${category.color}`}>
                            {category.label}
                          </Badge>
                          <span className="text-[10px] text-gray-500">
                            {order.words} woorden
                          </span>
                        </div>
                        <div className={`flex items-center gap-1.5 text-[10px] ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span>{status.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {filteredOrders.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Geen opdrachten gevonden</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-gray-900 border-gray-800">
            {selectedOrder ? (
              <>
                <CardHeader className="border-b border-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl text-white">{selectedOrder.title}</CardTitle>
                        {selectedOrder.priority && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            Prioriteit
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {selectedOrder.client.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(selectedOrder.deadline).toLocaleDateString('nl-NL')}
                        </span>
                        {selectedOrder.totalPrice && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            €{selectedOrder.totalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedOrder(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Status</h3>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <Button
                            key={key}
                            size="sm"
                            variant={selectedOrder.status === key ? 'default' : 'outline'}
                            onClick={() => handleStatusChange(selectedOrder.id, key as OrderStatus)}
                            className={
                              selectedOrder.status === key
                                ? 'bg-purple-600 hover:bg-purple-700'
                                : 'bg-gray-950 border-gray-800 hover:bg-gray-800'
                            }
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-950 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Categorie</p>
                      <p className="text-sm text-white font-medium">
                        {CATEGORY_CONFIG[selectedOrder.category].label}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Woorden</p>
                      <p className="text-sm text-white font-medium">{selectedOrder.words}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Betaling</p>
                      <Badge
                        className={
                          selectedOrder.paymentStatus === 'paid'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }
                      >
                        {selectedOrder.paymentStatus === 'paid' ? 'Betaald' : 'Onbetaald'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Aangemaakt</p>
                      <p className="text-sm text-white font-medium">
                        {new Date(selectedOrder.createdAt).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  </div>

                  {selectedOrder.notes && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-2">Notities</h3>
                      <p className="text-sm text-gray-400 p-4 bg-gray-950 rounded-lg">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  )}

                  {selectedOrder.status === 'done' && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3">Beoordeling</h3>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleRating(selectedOrder.id, rating)}
                            className={`p-2 rounded-lg transition-colors ${
                              (selectedOrder.rating || 0) >= rating
                                ? 'text-yellow-400'
                                : 'text-gray-600 hover:text-gray-400'
                            }`}
                          >
                            <Star
                              className="w-6 h-6"
                              fill={(selectedOrder.rating || 0) >= rating ? 'currentColor' : 'none'}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Berichten</h3>
                    <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto">
                      {selectedOrder.messages && selectedOrder.messages.length > 0 ? (
                        selectedOrder.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-lg ${
                              msg.sender === 'info@writgo.nl'
                                ? 'bg-purple-500/20 ml-8'
                                : 'bg-gray-950 mr-8'
                            }`}
                          >
                            <p className="text-xs text-gray-500 mb-1">{msg.sender}</p>
                            <p className="text-sm text-white">{msg.text}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(msg.createdAt).toLocaleString('nl-NL')}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Nog geen berichten
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type een bericht..."
                        className="bg-gray-950 border-gray-800 resize-none"
                        rows={2}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="bg-purple-600 hover:bg-purple-700 shrink-0"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3">Tijdlijn</h3>
                      <div className="space-y-3">
                        {selectedOrder.timeline.map((event) => (
                          <div key={event.id} className="flex gap-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                            <div className="flex-1">
                              <p className="text-sm text-white">{event.details}</p>
                              <p className="text-xs text-gray-500">
                                {event.user} • {new Date(event.createdAt).toLocaleString('nl-NL')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-12">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">
                    Selecteer een opdracht
                  </h3>
                  <p className="text-sm text-gray-600">
                    Kies een opdracht uit de lijst om details te bekijken
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
