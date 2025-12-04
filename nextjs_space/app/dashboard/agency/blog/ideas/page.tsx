'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Lightbulb, TrendingUp, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface BlogIdea {
  id: string;
  title: string;
  description?: string;
  keywords: string[];
  priority: string;
  status: string;
  assignedTo?: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
}

export default function BlogIdeasPage() {
  const [ideas, setIdeas] = useState<BlogIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingIdea, setEditingIdea] = useState<BlogIdea | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    keywords: '',
    priority: 'medium',
    status: 'idea',
    assignedTo: '',
    dueDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchIdeas();
  }, [statusFilter, priorityFilter]);

  const fetchIdeas = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);

      const res = await fetch(`/api/admin/blog/ideas?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch ideas');
      const data = await res.json();
      setIdeas(data.ideas || []);
    } catch (error) {
      toast.error('Fout bij ophalen ideeën');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ideaData = {
      ...formData,
      keywords: formData.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      dueDate: formData.dueDate || null,
    };

    try {
      const url = editingIdea
        ? `/api/admin/blog/ideas/${editingIdea.id}`
        : '/api/admin/blog/ideas';
      const method = editingIdea ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ideaData),
      });

      if (!res.ok) throw new Error('Failed to save idea');

      toast.success(editingIdea ? 'Idee bijgewerkt!' : 'Idee toegevoegd!');
      setShowDialog(false);
      resetForm();
      fetchIdeas();
    } catch (error) {
      toast.error('Fout bij opslaan');
    }
  };

  const handleEdit = (idea: BlogIdea) => {
    setEditingIdea(idea);
    setFormData({
      title: idea.title,
      description: idea.description || '',
      keywords: idea.keywords.join(', '),
      priority: idea.priority,
      status: idea.status,
      assignedTo: idea.assignedTo || '',
      dueDate: idea.dueDate ? idea.dueDate.split('T')[0] : '',
      notes: idea.notes || '',
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit idee wilt verwijderen?')) return;

    try {
      const res = await fetch(`/api/admin/blog/ideas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Idee verwijderd');
      fetchIdeas();
    } catch (error) {
      toast.error('Fout bij verwijderen');
    }
  };

  const resetForm = () => {
    setEditingIdea(null);
    setFormData({
      title: '',
      description: '',
      keywords: '',
      priority: 'medium',
      status: 'idea',
      assignedTo: '',
      dueDate: '',
      notes: '',
    });
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-500',
      medium: 'bg-yellow-500',
      high: 'bg-red-500',
    };
    return <Badge className={colors[priority] || 'bg-gray-500'}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      idea: 'bg-blue-500',
      planned: 'bg-purple-500',
      in_progress: 'bg-orange-500',
      written: 'bg-green-500',
    };
    const labels: Record<string, string> = {
      idea: 'Idee',
      planned: 'Gepland',
      in_progress: 'Bezig',
      written: 'Geschreven',
    };
    return (
      <Badge className={colors[status] || 'bg-gray-500'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const groupedIdeas = {
    idea: ideas.filter((i) => i.status === 'idea'),
    planned: ideas.filter((i) => i.status === 'planned'),
    in_progress: ideas.filter((i) => i.status === 'in_progress'),
    written: ideas.filter((i) => i.status === 'written'),
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9933]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Content Ideeën</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {ideas.length} ideeën in totaal
          </p>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setShowDialog(true);
              }}
              className="bg-gradient-to-r from-[#FF9933] to-[#FFAD33]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuw Idee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIdea ? 'Idee Bewerken' : 'Nieuw Idee'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Titel *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Beschrijving</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prioriteit</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Laag</SelectItem>
                      <SelectItem value="medium">Gemiddeld</SelectItem>
                      <SelectItem value="high">Hoog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idee</SelectItem>
                      <SelectItem value="planned">Gepland</SelectItem>
                      <SelectItem value="in_progress">Bezig</SelectItem>
                      <SelectItem value="written">Geschreven</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Keywords (komma gescheiden)</Label>
                <Input
                  value={formData.keywords}
                  onChange={(e) =>
                    setFormData({ ...formData, keywords: e.target.value })
                  }
                  placeholder="AI, SEO, content"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Toegewezen aan</Label>
                  <Input
                    value={formData.assignedTo}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedTo: e.target.value })
                    }
                    placeholder="Naam"
                  />
                </div>

                <div>
                  <Label>Deadline</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Notities</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="bg-gradient-to-r from-[#FF9933] to-[#FFAD33]">
                  {editingIdea ? 'Bijwerken' : 'Toevoegen'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false);
                    resetForm();
                  }}
                >
                  Annuleren
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Statussen</SelectItem>
              <SelectItem value="idea">Idee</SelectItem>
              <SelectItem value="planned">Gepland</SelectItem>
              <SelectItem value="in_progress">Bezig</SelectItem>
              <SelectItem value="written">Geschreven</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Prioriteit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Prioriteiten</SelectItem>
              <SelectItem value="high">Hoog</SelectItem>
              <SelectItem value="medium">Gemiddeld</SelectItem>
              <SelectItem value="low">Laag</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(groupedIdeas).map(([status, statusIdeas]) => (
          <div key={status}>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold capitalize flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  {status === 'in_progress'
                    ? 'Bezig'
                    : status === 'idea'
                    ? 'Ideeën'
                    : status === 'planned'
                    ? 'Gepland'
                    : 'Geschreven'}
                </h3>
                <Badge variant="outline">{statusIdeas.length}</Badge>
              </div>

              <div className="space-y-3">
                {statusIdeas.map((idea) => (
                  <Card key={idea.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{idea.title}</h4>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(idea)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(idea.id)}
                            className="h-6 w-6 p-0 text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {idea.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {idea.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {idea.keywords.slice(0, 3).map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        {getPriorityBadge(idea.priority)}
                        {idea.dueDate && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-3 h-3" />
                            {new Date(idea.dueDate).toLocaleDateString('nl-NL')}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}

                {statusIdeas.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    Geen ideeën
                  </p>
                )}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
