'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  User,
  Calendar,
  Euro,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ClientRequest {
  id: string;
  clientId: string;
  title: string;
  description: string;
  type: string;
  budget: string | null;
  deadline: string | null;
  status: string;
  adminResponse: string | null;
  assignmentId: string | null;
  createdAt: string;
  client: {
    id: string;
    name: string;
    email: string;
    companyName: string | null;
  };
}

const typeLabels: Record<string, string> = {
  blog: '📝 Blog/Content',
  video: '🎬 Video',
  chatbot: '🤖 Chatbot',
  automation: '⚙️ Automatisering',
  website: '🌐 Website',
  design: '🎨 Design',
  custom: '📋 Custom',
  other: '❓ Overig',
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('new');
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertModal, setConvertModal] = useState<{ request: ClientRequest; budget: string; deadline: string; response: string } | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      
      const res = await fetch(`/api/admin/agency/requests?${params}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Kon verzoeken niet laden');
    } finally {
      setLoading(false);
    }
  };

  const openConvertModal = (request: ClientRequest) => {
    setConvertModal({
      request,
      budget: request.budget || '',
      deadline: request.deadline || '',
      response: '',
    });
  };

  const convertToAssignment = async () => {
    if (!convertModal) return;
    
    setConvertingId(convertModal.request.id);
    try {
      const res = await fetch('/api/admin/agency/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: convertModal.request.id,
          budget: convertModal.budget,
          deadline: convertModal.deadline,
          adminResponse: convertModal.response,
        }),
      });

      if (res.ok) {
        toast.success('Verzoek omgezet naar opdracht!');
        setConvertModal(null);
        fetchRequests();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Kon verzoek niet omzetten');
      }
    } catch (error) {
      toast.error('Er ging iets mis');
    } finally {
      setConvertingId(null);
    }
  };

  const rejectRequest = async (id: string, reason: string) => {
    try {
      const res = await fetch(`/api/admin/agency/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          adminResponse: reason,
        }),
      });

      if (res.ok) {
        toast.success('Verzoek afgewezen');
        fetchRequests();
      } else {
        toast.error('Kon verzoek niet afwijzen');
      }
    } catch (error) {
      toast.error('Er ging iets mis');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400';
      case 'reviewed': return 'bg-yellow-500/20 text-yellow-400';
      case 'converted': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-8000/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nieuw';
      case 'reviewed': return 'Beoordeeld';
      case 'converted': return 'Omgezet';
      case 'rejected': return 'Afgewezen';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-900/10 rounded w-1/3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-900/10 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-purple-400" />
            Klant Verzoeken
          </h1>
          <p className="text-gray-400 mt-1">Bekijk en verwerk verzoeken van klanten</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['new', 'all', 'converted', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === status
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-slate-900/5 text-gray-400 hover:bg-slate-900/10'
            }`}
          >
            {status === 'all' ? 'Alle' : getStatusLabel(status)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/5 rounded-xl border border-white/10">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Geen verzoeken gevonden</p>
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className="bg-slate-900/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{typeLabels[request.type]?.split(' ')[0] || '📋'}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{request.title}</h3>
                    <p className="text-gray-400 flex items-center gap-2 mt-1">
                      <User className="w-4 h-4" />
                      {request.client.name}
                      {request.client.companyName && ` (${request.client.companyName})`}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                  {getStatusLabel(request.status)}
                </span>
              </div>

              <p className="text-gray-300 mb-4">{request.description}</p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                {request.budget && (
                  <span className="flex items-center gap-1">
                    <Euro className="w-4 h-4" />
                    Budget: {request.budget}
                  </span>
                )}
                {request.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Deadline: {request.deadline}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(request.createdAt).toLocaleDateString('nl-NL')}
                </span>
              </div>

              {/* Actions */}
              {request.status === 'new' && (
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => openConvertModal(request)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Omzetten naar Opdracht
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Reden voor afwijzing:');
                      if (reason) rejectRequest(request.id, reason);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Afwijzen
                  </button>
                </div>
              )}

              {request.status === 'converted' && request.assignmentId && (
                <div className="pt-4 border-t border-white/10">
                  <Link
                    href={`/dashboard/agency/assignments/${request.assignmentId}`}
                    className="inline-flex items-center gap-2 text-green-400 hover:text-green-300"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Bekijk opdracht
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {request.adminResponse && (
                <div className="mt-4 p-3 bg-slate-900/5 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Admin response:</p>
                  <p className="text-gray-300">{request.adminResponse}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Convert Modal */}
      {convertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold text-white mb-4">Omzetten naar Opdracht</h3>
            <p className="text-gray-400 mb-6">Verzoek: {convertModal.request.title}</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Budget (€)</label>
                <input
                  type="number"
                  value={convertModal.budget}
                  onChange={(e) => setConvertModal({ ...convertModal, budget: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Deadline</label>
                <input
                  type="date"
                  value={convertModal.deadline}
                  onChange={(e) => setConvertModal({ ...convertModal, deadline: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Reactie naar klant</label>
                <textarea
                  value={convertModal.response}
                  onChange={(e) => setConvertModal({ ...convertModal, response: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-900/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Optionele reactie naar de klant..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setConvertModal(null)}
                className="px-4 py-2 bg-slate-900/10 hover:bg-slate-900/20 text-white rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={convertToAssignment}
                disabled={convertingId === convertModal.request.id}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {convertingId === convertModal.request.id && <Loader2 className="w-4 h-4 animate-spin" />}
                Opdracht Aanmaken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
