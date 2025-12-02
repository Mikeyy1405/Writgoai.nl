'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Euro,
  Calendar,
} from 'lucide-react';

interface ClientRequest {
  id: string;
  title: string;
  description: string;
  type: string;
  budget: string | null;
  deadline: string | null;
  status: string;
  adminResponse: string | null;
  createdAt: string;
}

export default function ClientRequestsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRequests();
    }
  }, [status]);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/client/requests');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400';
      case 'reviewed': return 'bg-yellow-500/20 text-yellow-400';
      case 'converted': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'In Behandeling';
      case 'reviewed': return 'Beoordeeld';
      case 'converted': return 'Geaccepteerd';
      case 'rejected': return 'Afgewezen';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="w-4 h-4" />;
      case 'reviewed': return <Clock className="w-4 h-4" />;
      case 'converted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
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
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-white/10 rounded w-1/3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white/10 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/client-portal"
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-purple-400" />
              Mijn Verzoeken
            </h1>
            <p className="text-gray-400">Overzicht van al je ingediende verzoeken</p>
          </div>
        </div>
        <Link
          href="/client-portal/nieuw-verzoek"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuw Verzoek
        </Link>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Je hebt nog geen verzoeken ingediend</p>
            <Link
              href="/client-portal/nieuw-verzoek"
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300"
            >
              <Plus className="w-4 h-4" />
              Eerste verzoek indienen
            </Link>
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className="bg-white/5 border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{getTypeIcon(request.type)}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{request.title}</h3>
                    <p className="text-gray-400 mt-1 line-clamp-2">{request.description}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                  {getStatusIcon(request.status)}
                  {getStatusLabel(request.status)}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                {request.budget && (
                  <span className="flex items-center gap-1">
                    <Euro className="w-4 h-4" />
                    {request.budget}
                  </span>
                )}
                {request.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {request.deadline}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Ingediend: {new Date(request.createdAt).toLocaleDateString('nl-NL')}
                </span>
              </div>

              {request.adminResponse && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-300 mb-1">Reactie van WritgoAI:</p>
                  <p className="text-gray-300">{request.adminResponse}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
