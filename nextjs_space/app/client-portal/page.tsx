'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardList,
  FileText,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Euro,
  ArrowRight,
  Sparkles,
  Eye,
} from 'lucide-react';

interface Stats {
  openAssignments: number;
  completedAssignments: number;
  pendingRequests: number;
  unpaidInvoices: number;
}

interface Assignment {
  id: string;
  title: string;
  type: string;
  status: string;
  deadline: string | null;
  createdAt: string;
}

interface ClientRequest {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
}

export default function ClientDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    openAssignments: 0,
    completedAssignments: 0,
    pendingRequests: 0,
    unpaidInvoices: 0,
  });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      const [assignmentsRes, requestsRes, invoicesRes] = await Promise.all([
        fetch('/api/client/assignments'),
        fetch('/api/client/requests'),
        fetch('/api/client/invoices'),
      ]);

      const [assignmentsData, requestsData, invoicesData] = await Promise.all([
        assignmentsRes.json(),
        requestsRes.json(),
        invoicesRes.json(),
      ]);

      const allAssignments = assignmentsData.assignments || [];
      const allRequests = requestsData.requests || [];
      const allInvoices = invoicesData.invoices || [];

      const openAssignments = allAssignments.filter((a: any) => 
        ['open', 'in_progress', 'review'].includes(a.status)
      );
      const completedAssignments = allAssignments.filter((a: any) => 
        a.status === 'completed'
      );
      const pendingRequests = allRequests.filter((r: any) => 
        ['new', 'reviewed'].includes(r.status)
      );
      const unpaidInvoices = allInvoices.filter((i: any) => 
        ['sent', 'overdue'].includes(i.status)
      );

      setStats({
        openAssignments: openAssignments.length,
        completedAssignments: completedAssignments.length,
        pendingRequests: pendingRequests.length,
        unpaidInvoices: unpaidInvoices.length,
      });

      setAssignments(allAssignments.slice(0, 5));
      setRequests(allRequests.slice(0, 5));
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
      case 'new': return 'bg-blue-500/20 text-blue-400';
      case 'converted': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Uitvoering';
      case 'review': return 'In Review';
      case 'completed': return 'Voltooid';
      case 'new': return 'Nieuw';
      case 'reviewed': return 'Beoordeeld';
      case 'converted': return 'In Behandeling';
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

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
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
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Welkom terug!</h1>
        <p className="text-gray-400 mt-1">Bekijk de status van je opdrachten en verzoeken</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-6">
          <ClipboardList className="w-8 h-8 text-yellow-400 mb-4" />
          <p className="text-3xl font-bold text-white">{stats.openAssignments}</p>
          <p className="text-yellow-300 text-sm">Lopende Opdrachten</p>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-6">
          <CheckCircle className="w-8 h-8 text-green-400 mb-4" />
          <p className="text-3xl font-bold text-white">{stats.completedAssignments}</p>
          <p className="text-green-300 text-sm">Voltooid</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-6">
          <Clock className="w-8 h-8 text-purple-400 mb-4" />
          <p className="text-3xl font-bold text-white">{stats.pendingRequests}</p>
          <p className="text-purple-300 text-sm">Verzoeken in Behandeling</p>
        </div>

        <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-xl p-6">
          <FileText className="w-8 h-8 text-orange-400 mb-4" />
          <p className="text-3xl font-bold text-white">{stats.unpaidInvoices}</p>
          <p className="text-orange-300 text-sm">Openstaande Facturen</p>
        </div>
      </div>

      {/* Quick Action */}
      <div className="mb-8">
        <Link
          href="/client-portal/nieuw-verzoek"
          className="flex items-center justify-between p-6 bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-xl hover:border-green-400/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Sparkles className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Nieuw AI Verzoek</h3>
              <p className="text-gray-400 text-sm">Blog, video, chatbot, automatisering of custom project</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-400 group-hover:translate-x-1 transition-transform">
            <Plus className="w-5 h-5" />
            <span>Verzoek Indienen</span>
          </div>
        </Link>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Assignments */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-yellow-400" />
              Mijn Opdrachten
            </h3>
            <Link href="/client-portal/opdrachten" className="text-blue-400 hover:text-blue-300 text-sm">
              Bekijk alles →
            </Link>
          </div>
          <div className="space-y-3">
            {assignments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Geen opdrachten</p>
            ) : (
              assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(assignment.type)}</span>
                    <div>
                      <p className="text-white font-medium">{assignment.title}</p>
                      {assignment.deadline && (
                        <p className="text-gray-500 text-xs">
                          Deadline: {new Date(assignment.deadline).toLocaleDateString('nl-NL')}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                    {getStatusLabel(assignment.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Requests */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-purple-400" />
              Mijn Verzoeken
            </h3>
            <Link href="/client-portal/verzoeken" className="text-blue-400 hover:text-blue-300 text-sm">
              Bekijk alles →
            </Link>
          </div>
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">Nog geen verzoeken</p>
                <Link
                  href="/client-portal/nieuw-verzoek"
                  className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Eerste verzoek indienen
                </Link>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(request.type)}</span>
                    <div>
                      <p className="text-white font-medium">{request.title}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(request.createdAt).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
