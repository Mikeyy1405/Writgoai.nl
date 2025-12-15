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
  PenTool,
  Search,
  Map,
  Image,
  Wand2,
  Users,
  Bot,
  FolderKanban,
  Send,
  Receipt,
  Video,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';

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
    
    // Redirect admin users to admin dashboard
    if (status === 'authenticated') {
      const isAdmin = session?.user?.email === 'info@writgo.nl' || session?.user?.role === 'admin';
      if (isAdmin) {
        router.replace('/admin');
      }
    }
  }, [status, session, router]);

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
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Welkom terug, {session?.user?.name?.split(' ')[0] || 'Gebruiker'}!</h1>
        <p className="text-gray-400 mt-1">Wat wil je vandaag doen?</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Openstaande Opdrachten"
          value={stats.openAssignments}
          icon={FolderKanban}
          href="/client-portal/opdrachten"
          color="blue"
        />
        <StatsCard
          title="Voltooide Opdrachten"
          value={stats.completedAssignments}
          icon={CheckCircle}
          href="/client-portal/opdrachten"
          color="green"
        />
        <StatsCard
          title="Nieuwe Verzoeken"
          value={stats.pendingRequests}
          icon={Send}
          href="/client-portal/verzoeken"
          color="purple"
        />
        <StatsCard
          title="Openstaande Facturen"
          value={stats.unpaidInvoices}
          icon={Receipt}
          href="/client-portal/facturen"
          color="orange"
        />
      </div>

      {/* Two-Column Layout */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Zelf Doen - AI Tools */}
        <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/10 border border-emerald-500/30 rounded-xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Bot className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Zelf Doen</h2>
              <p className="text-emerald-400 text-sm">AI tools - zelf content maken</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Link 
              href="/client-portal/blog-generator" 
              className="flex items-center gap-3 p-4 bg-zinc-800/30 hover:bg-emerald-500/10 border border-zinc-700/50 hover:border-emerald-500/30 rounded-xl transition-all group"
            >
              <PenTool className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-white font-medium group-hover:text-emerald-400 transition-colors text-sm">Blog Generator</p>
                <p className="text-zinc-500 text-xs">AI blogs schrijven</p>
              </div>
            </Link>
            
            <Link 
              href="/client-portal/video" 
              className="flex items-center gap-3 p-4 bg-zinc-800/30 hover:bg-emerald-500/10 border border-zinc-700/50 hover:border-emerald-500/30 rounded-xl transition-all group relative"
            >
              <Video className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-white font-medium group-hover:text-emerald-400 transition-colors text-sm">Video Generator</p>
                <p className="text-zinc-500 text-xs">AI video's maken</p>
              </div>
              <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-bold rounded">Pro</span>
            </Link>
            
            <Link 
              href="/client-portal/zoekwoord-onderzoek" 
              className="flex items-center gap-3 p-4 bg-zinc-800/30 hover:bg-emerald-500/10 border border-zinc-700/50 hover:border-emerald-500/30 rounded-xl transition-all group relative"
            >
              <Search className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-white font-medium group-hover:text-emerald-400 transition-colors text-sm">Zoekwoord</p>
                <p className="text-zinc-500 text-xs">Keywords vinden</p>
              </div>
              <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">Nieuw</span>
            </Link>
            
            <Link 
              href="/client-portal/site-planner" 
              className="flex items-center gap-3 p-4 bg-zinc-800/30 hover:bg-emerald-500/10 border border-zinc-700/50 hover:border-emerald-500/30 rounded-xl transition-all group"
            >
              <Map className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-white font-medium group-hover:text-emerald-400 transition-colors text-sm">Site Planner</p>
                <p className="text-zinc-500 text-xs">Content strategie</p>
              </div>
            </Link>
            
            <Link 
              href="/client-portal/content-generator" 
              className="flex items-center gap-3 p-4 bg-zinc-800/30 hover:bg-emerald-500/10 border border-zinc-700/50 hover:border-emerald-500/30 rounded-xl transition-all group"
            >
              <Wand2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-white font-medium group-hover:text-emerald-400 transition-colors text-sm">Content Gen</p>
                <p className="text-zinc-500 text-xs">Diverse content</p>
              </div>
            </Link>
            
            <Link 
              href="/client-portal/image-specialist" 
              className="flex items-center gap-3 p-4 bg-zinc-800/30 hover:bg-emerald-500/10 border border-zinc-700/50 hover:border-emerald-500/30 rounded-xl transition-all group col-span-2"
            >
              <Image className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-white font-medium group-hover:text-emerald-400 transition-colors text-sm">Afbeelding Generator</p>
                <p className="text-zinc-500 text-xs">AI afbeeldingen maken</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Laat Ons Doen - Agency Services */}
        <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/10 border border-blue-500/30 rounded-xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Laat Ons Doen</h2>
              <p className="text-blue-400 text-sm">Agency diensten - wij doen het werk</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Link 
              href="/client-portal/nieuw-verzoek" 
              className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border border-blue-500/30 hover:border-blue-400/50 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white font-medium">Nieuw Verzoek Indienen</p>
                  <p className="text-zinc-400 text-xs">Blog, video, chatbot of maatwerk</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <div className="grid grid-cols-3 gap-3">
              <Link 
                href="/client-portal/opdrachten" 
                className="p-4 bg-zinc-800/30 hover:bg-blue-500/10 border border-zinc-700/50 hover:border-blue-500/30 rounded-xl transition-all text-center"
              >
                <FolderKanban className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-white text-sm font-medium">{stats.openAssignments}</p>
                <p className="text-zinc-500 text-xs">Opdrachten</p>
              </Link>
              
              <Link 
                href="/client-portal/verzoeken" 
                className="p-4 bg-zinc-800/30 hover:bg-blue-500/10 border border-zinc-700/50 hover:border-blue-500/30 rounded-xl transition-all text-center"
              >
                <Send className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-white text-sm font-medium">{stats.pendingRequests}</p>
                <p className="text-zinc-500 text-xs">Verzoeken</p>
              </Link>
              
              <Link 
                href="/client-portal/facturen" 
                className="p-4 bg-zinc-800/30 hover:bg-blue-500/10 border border-zinc-700/50 hover:border-blue-500/30 rounded-xl transition-all text-center"
              >
                <Receipt className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-white text-sm font-medium">{stats.unpaidInvoices}</p>
                <p className="text-zinc-500 text-xs">Facturen</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Assignments */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-yellow-400" />
              Recente Opdrachten
            </h3>
            <Link href="/client-portal/opdrachten" className="text-[#FF9933] hover:text-[#FFAD33] text-sm transition-colors">
              Bekijk alles →
            </Link>
          </div>
          <div className="space-y-3">
            {assignments.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">Nog geen opdrachten</p>
                <Link
                  href="/client-portal/nieuw-verzoek"
                  className="inline-flex items-center gap-1 text-[#FF9933] hover:text-[#FFAD33] text-sm mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Eerste verzoek indienen
                </Link>
              </div>
            ) : (
              assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-all duration-200 hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(assignment.type)}</span>
                    <div>
                      <p className="text-white font-medium">{assignment.title}</p>
                      {assignment.deadline && (
                        <p className="text-zinc-500 text-xs">
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
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-purple-400" />
              Recente Verzoeken
            </h3>
            <Link href="/client-portal/verzoeken" className="text-[#FF9933] hover:text-[#FFAD33] text-sm transition-colors">
              Bekijk alles →
            </Link>
          </div>
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <Send className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">Nog geen verzoeken</p>
                <Link
                  href="/client-portal/nieuw-verzoek"
                  className="inline-flex items-center gap-1 text-[#FF9933] hover:text-[#FFAD33] text-sm mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Eerste verzoek indienen
                </Link>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-all duration-200 hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(request.type)}</span>
                    <div>
                      <p className="text-white font-medium">{request.title}</p>
                      <p className="text-zinc-500 text-xs">
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
