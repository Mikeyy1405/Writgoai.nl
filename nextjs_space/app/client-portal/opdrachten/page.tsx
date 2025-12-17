'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardList,
  Calendar,
  Clock,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  deadline: string | null;
  notes: string | null;
  createdAt: string;
  completedAt: string | null;
}

export default function ClientAssignmentsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAssignments();
    }
  }, [status]);

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/client/assignments');
      const data = await res.json();
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'review': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-8000/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Uitvoering';
      case 'review': return 'In Review';
      case 'completed': return 'Voltooid';
      case 'cancelled': return 'Geannuleerd';
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

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['open', 'in_progress', 'review'].includes(a.status);
    if (filter === 'completed') return a.status === 'completed';
    return true;
  });

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-3 sm:p-4 md:p-6 lg:p-8">
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
    <div className="min-h-screen bg-[#0a0a0a] p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Link
          href="/client-portal"
          className="p-2 hover:bg-slate-900/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
            Mijn Opdrachten
          </h1>
          <p className="text-sm sm:text-base text-gray-400">Bekijk de status van al je opdrachten</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        {['all', 'active', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
              filter === f
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-slate-900/5 text-gray-400 hover:bg-slate-900/10'
            }`}
          >
            {f === 'all' ? 'Alle' : f === 'active' ? 'Actief' : 'Voltooid'}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/5 rounded-xl border border-white/10">
            <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Geen opdrachten gevonden</p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-slate-900/5 border border-white/10 rounded-xl p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex items-start gap-3 sm:gap-4 flex-1">
                  <span className="text-2xl sm:text-3xl">{getTypeIcon(assignment.type)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-white break-words">{assignment.title}</h3>
                    <p className="text-sm sm:text-base text-gray-400 mt-1 line-clamp-2">{assignment.description}</p>
                  </div>
                </div>
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border whitespace-nowrap ${getStatusColor(assignment.status)}`}>
                  {getStatusLabel(assignment.status)}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
                {assignment.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Deadline: {new Date(assignment.deadline).toLocaleDateString('nl-NL')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Aangemaakt: {new Date(assignment.createdAt).toLocaleDateString('nl-NL')}
                </span>
                {assignment.completedAt && (
                  <span className="flex items-center gap-1 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Voltooid: {new Date(assignment.completedAt).toLocaleDateString('nl-NL')}
                  </span>
                )}
              </div>

              {assignment.notes && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-1">Notities:</p>
                  <p className="text-gray-300">{assignment.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
