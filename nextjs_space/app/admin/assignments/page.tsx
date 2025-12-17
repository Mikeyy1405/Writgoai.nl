'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Eye,
  Euro,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Assignment {
  id: string;
  clientId: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  deadline: string | null;
  budget: number | null;
  finalPrice: number | null;
  createdAt: string;
  client: {
    id: string;
    name: string;
    email: string;
    companyName: string | null;
  };
}

const statusOptions = [
  { value: 'all', label: 'Alle' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Uitvoering' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Voltooid' },
  { value: 'cancelled', label: 'Geannuleerd' },
];

const typeOptions = [
  { value: 'blog', label: '📝 Blog/Content', color: 'blue' },
  { value: 'video', label: '🎬 Video', color: 'red' },
  { value: 'chatbot', label: '🤖 Chatbot', color: 'purple' },
  { value: 'automation', label: '⚙️ Automatisering', color: 'yellow' },
  { value: 'website', label: '🌐 Website', color: 'green' },
  { value: 'design', label: '🎨 Design', color: 'pink' },
  { value: 'custom', label: '📋 Custom', color: 'gray' },
];

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAssignments();
  }, [statusFilter]);

  const fetchAssignments = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      
      const res = await fetch(`/api/admin/agency/assignments?${params}`);
      const data = await res.json();
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Kon opdrachten niet laden');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/agency/assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success('Status bijgewerkt');
        fetchAssignments();
      } else {
        toast.error('Kon status niet bijwerken');
      }
    } catch (error) {
      toast.error('Er ging iets mis');
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
    return statusOptions.find(s => s.value === status)?.label || status;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'normal': return 'text-gray-400';
      case 'low': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getTypeInfo = (type: string) => {
    return typeOptions.find(t => t.value === type) || typeOptions[6];
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by status
  const groupedAssignments = {
    open: filteredAssignments.filter(a => a.status === 'open'),
    in_progress: filteredAssignments.filter(a => a.status === 'in_progress'),
    review: filteredAssignments.filter(a => a.status === 'review'),
    completed: filteredAssignments.filter(a => a.status === 'completed'),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-900/10 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-slate-900/10 rounded-xl"></div>
            ))}
          </div>
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
            <ClipboardList className="w-8 h-8 text-yellow-400" />
            Opdrachten
          </h1>
          <p className="text-gray-400 mt-1">{assignments.length} opdrachten in totaal</p>
        </div>
        <Link
          href="/dashboard/agency/assignments/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuwe Opdracht
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek opdrachten..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-slate-900/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value} className="bg-[#1a1a1a]">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Kanban Board View */}
      {statusFilter === 'all' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Open */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-blue-500/30">
              <AlertCircle className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Open</h3>
              <span className="ml-auto text-sm text-gray-400">{groupedAssignments.open.length}</span>
            </div>
            {groupedAssignments.open.map(assignment => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                getTypeInfo={getTypeInfo}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                onStatusChange={updateStatus}
              />
            ))}
          </div>

          {/* In Progress */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-yellow-500/30">
              <Play className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold text-white">In Uitvoering</h3>
              <span className="ml-auto text-sm text-gray-400">{groupedAssignments.in_progress.length}</span>
            </div>
            {groupedAssignments.in_progress.map(assignment => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                getTypeInfo={getTypeInfo}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                onStatusChange={updateStatus}
              />
            ))}
          </div>

          {/* Review */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-purple-500/30">
              <Eye className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-white">Review</h3>
              <span className="ml-auto text-sm text-gray-400">{groupedAssignments.review.length}</span>
            </div>
            {groupedAssignments.review.map(assignment => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                getTypeInfo={getTypeInfo}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                onStatusChange={updateStatus}
              />
            ))}
          </div>

          {/* Completed */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-green-500/30">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-white">Voltooid</h3>
              <span className="ml-auto text-sm text-gray-400">{groupedAssignments.completed.length}</span>
            </div>
            {groupedAssignments.completed.slice(0, 5).map(assignment => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                getTypeInfo={getTypeInfo}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                onStatusChange={updateStatus}
              />
            ))}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/5 rounded-xl border border-white/10">
              <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Geen opdrachten gevonden</p>
            </div>
          ) : (
            filteredAssignments.map(assignment => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                getTypeInfo={getTypeInfo}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                onStatusChange={updateStatus}
                expanded
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AssignmentCard({
  assignment,
  getTypeInfo,
  getStatusColor,
  getPriorityColor,
  onStatusChange,
  expanded = false,
}: {
  assignment: Assignment;
  getTypeInfo: (type: string) => any;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  onStatusChange: (id: string, status: string) => void;
  expanded?: boolean;
}) {
  const typeInfo = getTypeInfo(assignment.type);
  const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date() && assignment.status !== 'completed';

  return (
    <Link
      href={`/dashboard/agency/assignments/${assignment.id}`}
      className={`block bg-slate-900/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all ${
        isOverdue ? 'border-red-500/30' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-lg">{typeInfo.label.split(' ')[0]}</span>
        {assignment.priority === 'urgent' && (
          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">URGENT</span>
        )}
      </div>
      
      <h4 className="font-medium text-white mb-1 line-clamp-2">{assignment.title}</h4>
      <p className="text-sm text-gray-400 mb-3">{assignment.client.name}</p>

      {expanded && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{assignment.description}</p>
      )}

      <div className="flex items-center justify-between text-xs">
        {assignment.deadline && (
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
            <Calendar className="w-3 h-3" />
            {new Date(assignment.deadline).toLocaleDateString('nl-NL')}
          </span>
        )}
        {assignment.budget && (
          <span className="flex items-center gap-1 text-green-400">
            <Euro className="w-3 h-3" />
            {assignment.budget}
          </span>
        )}
      </div>

      {/* Quick Status Change */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <select
          value={assignment.status}
          onChange={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onStatusChange(assignment.id, e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full px-2 py-1 text-xs rounded-lg border ${getStatusColor(assignment.status)} bg-transparent focus:outline-none`}
        >
          <option value="open" className="bg-[#1a1a1a]">Open</option>
          <option value="in_progress" className="bg-[#1a1a1a]">In Uitvoering</option>
          <option value="review" className="bg-[#1a1a1a]">Review</option>
          <option value="completed" className="bg-[#1a1a1a]">Voltooid</option>
          <option value="cancelled" className="bg-[#1a1a1a]">Geannuleerd</option>
        </select>
      </div>
    </Link>
  );
}
