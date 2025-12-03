'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users,
  FileText,
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Euro,
  Plus,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { StatsCard } from '@/components/dashboard/stats-card';

interface Stats {
  totalClients: number;
  openAssignments: number;
  pendingRequests: number;
  unpaidInvoices: number;
  totalRevenue: number;
  completedThisMonth: number;
}

export default function AgencyDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    openAssignments: 0,
    pendingRequests: 0,
    unpaidInvoices: 0,
    totalRevenue: 0,
    completedThisMonth: 0,
  });
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    }
  }, [status, router]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch clients
      const clientsRes = await fetch('/api/admin/agency/clients');
      const clientsData = await clientsRes.json();
      
      // Fetch assignments
      const assignmentsRes = await fetch('/api/admin/agency/assignments');
      const assignmentsData = await assignmentsRes.json();
      
      // Fetch requests
      const requestsRes = await fetch('/api/admin/agency/requests?status=new');
      const requestsData = await requestsRes.json();
      
      // Fetch invoices
      const invoicesRes = await fetch('/api/admin/agency/invoices');
      const invoicesData = await invoicesRes.json();

      const clients = clientsData.clients || [];
      const assignments = assignmentsData.assignments || [];
      const requests = requestsData.requests || [];
      const invoices = invoicesData.invoices || [];

      // Calculate stats
      const openAssignments = assignments.filter((a: any) => 
        ['open', 'in_progress', 'review'].includes(a.status)
      );
      const unpaidInvoices = invoices.filter((i: any) => 
        ['sent', 'overdue'].includes(i.status)
      );
      const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
      const totalRevenue = paidInvoices.reduce((sum: number, i: any) => sum + i.total, 0);
      
      // Completed this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const completedThisMonth = assignments.filter((a: any) => 
        a.status === 'completed' && new Date(a.completedAt) >= startOfMonth
      ).length;

      setStats({
        totalClients: clients.length,
        openAssignments: openAssignments.length,
        pendingRequests: requests.length,
        unpaidInvoices: unpaidInvoices.length,
        totalRevenue,
        completedThisMonth,
      });

      setRecentAssignments(assignments.slice(0, 5));
      setRecentRequests(requests.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'review': return 'bg-purple-500/20 text-purple-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Uitvoering';
      case 'review': return 'Review';
      case 'completed': return 'Voltooid';
      case 'cancelled': return 'Geannuleerd';
      case 'new': return 'Nieuw';
      case 'reviewed': return 'Beoordeeld';
      case 'converted': return 'Omgezet';
      case 'rejected': return 'Afgewezen';
      default: return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blog': return '📝';
      case 'video': return '🎬';
      case 'chatbot': return '🤖';
      case 'automation': return '⚙️';
      case 'website': return '🌐';
      case 'design': return '🎨';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-white/10 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Agency Dashboard</h1>
          <p className="text-gray-400 mt-1">Overzicht van alle klanten en opdrachten</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/agency/clients/new"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuwe Klant
          </Link>
          <Link
            href="/dashboard/agency/assignments/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuwe Opdracht
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Totaal Klanten"
          value={stats.totalClients}
          icon={Users}
          href="/dashboard/agency/clients"
          color="blue"
        />
        <StatsCard
          title="Openstaande Opdrachten"
          value={stats.openAssignments}
          icon={ClipboardList}
          href="/dashboard/agency/assignments"
          color="yellow"
        />
        <StatsCard
          title="Nieuwe Verzoeken"
          value={stats.pendingRequests}
          icon={AlertCircle}
          href="/dashboard/agency/requests"
          color="purple"
        />
        <StatsCard
          title="Totale Omzet"
          value={`€${stats.totalRevenue.toLocaleString()}`}
          icon={Euro}
          href="/dashboard/agency/invoices"
          color="green"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatsCard
          title="Deze Maand Voltooid"
          value={stats.completedThisMonth}
          icon={CheckCircle}
          color="green"
          description="opdrachten afgerond"
        />
        <StatsCard
          title="Openstaande Facturen"
          value={stats.unpaidInvoices}
          icon={FileText}
          color="orange"
          description="wachtend op betaling"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Assignments */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recente Opdrachten</h3>
            <Link href="/dashboard/agency/assignments" className="text-[#FF9933] hover:text-[#FFAD33] text-sm transition-colors">
              Bekijk alles →
            </Link>
          </div>
          <div className="space-y-3">
            {recentAssignments.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">Geen opdrachten</p>
            ) : (
              recentAssignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  href={`/dashboard/agency/assignments/${assignment.id}`}
                  className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-all duration-200 hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(assignment.type)}</span>
                    <div>
                      <p className="text-white font-medium">{assignment.title}</p>
                      <p className="text-zinc-400 text-sm">{assignment.client?.name}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                    {getStatusLabel(assignment.status)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* New Requests */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Nieuwe Verzoeken</h3>
            <Link href="/dashboard/agency/requests" className="text-[#FF9933] hover:text-[#FFAD33] text-sm transition-colors">
              Bekijk alles →
            </Link>
          </div>
          <div className="space-y-3">
            {recentRequests.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">Geen nieuwe verzoeken</p>
            ) : (
              recentRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/dashboard/agency/requests`}
                  className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-all duration-200 hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(request.type)}</span>
                    <div>
                      <p className="text-white font-medium">{request.title}</p>
                      <p className="text-zinc-400 text-sm">{request.client?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-400 text-sm">
                      {new Date(request.createdAt).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
