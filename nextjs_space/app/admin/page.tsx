'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Users, FileText, DollarSign, Activity, 
  Loader2, ArrowRight, TrendingUp, Save,
  UserPlus, Package, MessageSquare, AlertCircle,
  Mail, StickyNote, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const NOTES_PLACEHOLDER = `- Factuur sturen naar klant X
- Content Hub bug fixen
- Nieuwe feature bespreken`;

interface Stats {
  totalClients: number;
  newClientsThisWeek: number;
  activeClients: number;
  totalContent: number;
  contentThisMonth: number;
  credits: {
    totalUsed: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesLastSaved, setNotesLastSaved] = useState<Date | null>(null);
  const hasFetchedRef = useRef(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auth check and data fetching
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/client-login');
      return;
    }
    
    if (session?.user?.email !== 'info@writgo.nl') {
      router.push('/client-portal');
      return;
    }
    
    // Only fetch data once
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData();
      fetchNotes();
    }
  }, [status, session?.user?.email, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stats
      const statsRes = await fetch('/api/superadmin/stats');
      if (!statsRes.ok) {
        throw new Error('Failed to fetch stats');
      }
      const statsData = await statsRes.json();
      
      // Transform stats to match our interface
      setStats({
        totalClients: statsData.totalClients || 0,
        newClientsThisWeek: 0, // Will be calculated if available
        activeClients: statsData.activeClients || 0,
        totalContent: statsData.totalContentGenerated || 0,
        contentThisMonth: 0, // Will be calculated if available
        credits: {
          totalUsed: statsData.credits?.totalUsed || 0,
        },
        revenue: {
          total: statsData.revenue?.total || 0,
          thisMonth: statsData.revenueThisMonth || 0,
        },
        recentActivity: statsData.recentActivity?.slice(0, 5) || [],
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/admin/notes');
      if (response.ok) {
        const data = await response.json();
        setNotes(data.content || '');
        if (data.updatedAt) {
          setNotesLastSaved(new Date(data.updatedAt));
        }
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const saveNotes = useCallback(async (content: string) => {
    try {
      setNotesSaving(true);
      const response = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotesLastSaved(new Date(data.updatedAt));
        toast({
          title: 'Opgeslagen',
          description: 'Notities zijn succesvol opgeslagen',
        });
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Fout',
        description: 'Notities konden niet worden opgeslagen',
        variant: 'destructive',
      });
    } finally {
      setNotesSaving(false);
    }
  }, [toast]);

  // Auto-save notes after 5 seconds of inactivity
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (notes && notes.length > 0) {
      autoSaveTimerRef.current = setTimeout(() => {
        saveNotes(notes);
      }, 5000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [notes, saveNotes]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 5000) {
      setNotes(value);
    }
  };

  const handleManualSave = () => {
    saveNotes(notes);
  };

  // Loading state
  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Dashboard laden...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-gray-800 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Fout bij laden</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button onClick={() => {
              hasFetchedRef.current = false;
              fetchData();
            }} className="bg-blue-600 hover:bg-blue-700">
              Opnieuw proberen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">WritGo Management Overzicht</p>
          </div>
          <Link href="/client-portal">
            <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
              Naar Portal
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">👥 Klanten</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {stats?.totalClients ?? 0}
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    +{stats?.newClientsThisWeek ?? 0} deze week
                  </p>
                </div>
                <Users className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">💰 Omzet</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    €{(stats?.revenue?.total ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    +€{(stats?.revenue?.thisMonth ?? 0).toLocaleString()} maand
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">📝 Content</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {stats?.totalContent ?? 0}
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    +{stats?.contentThisMonth ?? 0} maand
                  </p>
                </div>
                <FileText className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">🎫 Credits</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {(stats?.credits?.totalUsed ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">gebruikt</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Personal Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                ⚡ Snelle Acties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/clients">
                <Button className="w-full justify-between bg-blue-600 hover:bg-blue-700">
                  <span className="flex items-center">
                    <UserPlus className="w-4 h-4 mr-2" />
                    + Nieuwe Klant
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/admin/assignments">
                <Button className="w-full justify-between bg-blue-600 hover:bg-blue-700">
                  <span className="flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    + Nieuwe Opdracht
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/admin/emails">
                <Button className="w-full justify-between bg-blue-600 hover:bg-blue-700">
                  <span className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    📧 Berichten
                  </span>
                  <Badge className="bg-orange-500 text-white">3</Badge>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Personal Notes */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <StickyNote className="w-5 h-5" />
                  📝 Mijn Notities
                </CardTitle>
                <Button 
                  size="sm" 
                  onClick={handleManualSave}
                  disabled={notesSaving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {notesSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Opslaan
                    </>
                  )}
                </Button>
              </div>
              {notesLastSaved && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" />
                  Laatst opgeslagen: {notesLastSaved.toLocaleTimeString('nl-NL')}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder={NOTES_PLACEHOLDER}
                className="min-h-[150px] bg-gray-950 border-gray-700 text-white resize-none"
                maxLength={5000}
              />
              <p className="text-xs text-gray-500 mt-2">
                {notes.length} / 5000 karakters
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              🕐 Recente Activiteit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-950 hover:bg-gray-800 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        {activity.type === 'new_client' && '• Nieuwe klant: '}
                        {activity.type === 'order_completed' && '• Opdracht voltooid: '}
                        {activity.type === 'payment_received' && '• Betaling ontvangen: '}
                        <span className="font-semibold">{activity.message}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleString('nl-NL') : ''}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Geen recente activiteit</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
