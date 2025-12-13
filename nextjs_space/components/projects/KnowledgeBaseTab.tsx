'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  BookOpen,
  FileText,
  Tag,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

const KNOWLEDGE_TYPES = [
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'faq', label: 'FAQ', icon: AlertCircle },
  { value: 'guideline', label: 'Guideline', icon: CheckCircle },
  { value: 'brand_voice', label: 'Brand Voice', icon: BookOpen },
];

export default function KnowledgeBaseTab({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadItems();
  }, [projectId]);

  const loadItems = async () => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/knowledge`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error loading knowledge items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/projects/${projectId}/knowledge/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setItems(items.filter(i => i.id !== itemId));
        toast({
          title: 'Verwijderd',
          description: 'Het knowledge item is verwijderd.',
        });
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Kon het knowledge item niet verwijderen.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (item: KnowledgeItem) => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/knowledge/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          isActive: !item.isActive,
        }),
      });

      if (response.ok) {
        setItems(items.map(i => i.id === item.id ? { ...i, isActive: !i.isActive } : i));
        toast({
          title: 'Bijgewerkt',
          description: `Item is ${!item.isActive ? 'geactiveerd' : 'gedeactiveerd'}.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Kon de status niet wijzigen.',
        variant: 'destructive',
      });
    }
  };

  const filteredItems = filterType === 'all' 
    ? items 
    : items.filter(item => item.type === filterType);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF9933]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Knowledge Base</h3>
          <p className="text-sm text-gray-400">
            Upload documenten, FAQ's en richtlijnen voor je AI content
          </p>
        </div>
        <Button
          onClick={() => {
            setShowAddForm(true);
            setEditingItem(null);
          }}
          className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuw Item
        </Button>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterType === 'all'
              ? 'bg-[#FF9933] text-white'
              : 'bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700'
          }`}
        >
          Alle ({items.length})
        </button>
        {KNOWLEDGE_TYPES.map((type) => {
          const count = items.filter(i => i.type === type.value).length;
          const Icon = type.icon;
          return (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterType === type.value
                  ? 'bg-[#FF9933] text-white'
                  : 'bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {type.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <KnowledgeItemForm
          projectId={projectId}
          item={editingItem}
          onSave={() => {
            setShowAddForm(false);
            setEditingItem(null);
            loadItems();
          }}
          onCancel={() => {
            setShowAddForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {filterType === 'all' ? 'Nog geen items' : `Geen ${KNOWLEDGE_TYPES.find(t => t.value === filterType)?.label.toLowerCase()} items`}
          </h3>
          <p className="text-gray-400">
            Voeg documenten toe om je AI te helpen betere content te maken
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const typeInfo = KNOWLEDGE_TYPES.find(t => t.value === item.type);
            const TypeIcon = typeInfo?.icon || FileText;
            
            return (
              <div
                key={item.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-zinc-800 rounded">
                        <TypeIcon className="w-4 h-4 text-[#FF9933]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{typeInfo?.label}</span>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            item.isActive 
                              ? 'bg-green-500/10 text-green-400' 
                              : 'bg-gray-500/10 text-gray-400'
                          }`}>
                            {item.isActive ? 'Actief' : 'Inactief'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                      {item.content}
                    </p>

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Tag className="w-3 h-3 text-gray-500" />
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleActive(item)}
                      className={`${
                        item.isActive
                          ? 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                          : 'text-gray-400 hover:text-gray-300 hover:bg-zinc-800'
                      }`}
                      title={item.isActive ? 'Deactiveren' : 'Activeren'}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingItem(item);
                        setShowAddForm(true);
                      }}
                      className="text-gray-400 hover:text-white hover:bg-zinc-800"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Form component for adding/editing knowledge items
function KnowledgeItemForm({
  projectId,
  item,
  onSave,
  onCancel,
}: {
  projectId: string;
  item: KnowledgeItem | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: item?.title || '',
    content: item?.content || '',
    type: item?.type || 'document',
    tags: item?.tags?.join(', ') || '',
    isActive: item?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast({
        title: 'Fout',
        description: 'Titel en inhoud zijn verplicht.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const url = item
        ? `/api/admin/projects/${projectId}/knowledge/${item.id}`
        : `/api/admin/projects/${projectId}/knowledge`;
      
      const method = item ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          type: formData.type,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          isActive: formData.isActive,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Opgeslagen',
          description: item ? 'Knowledge item bijgewerkt.' : 'Knowledge item toegevoegd.',
        });
        onSave();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Kon het knowledge item niet opslaan.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h4 className="text-lg font-semibold text-white mb-4">
        {item ? 'Item Bewerken' : 'Nieuw Knowledge Item'}
      </h4>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Titel <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="Bijv. Brand Guidelines"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#FF9933] transition-colors"
            >
              {KNOWLEDGE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Inhoud <span className="text-red-400">*</span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={8}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF9933] transition-colors resize-none"
            placeholder="Voer de inhoud van het document in..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Deze informatie wordt gebruikt door de AI bij het genereren van content
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tags
          </label>
          <Input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="bg-zinc-800 border-zinc-700 text-white"
            placeholder="tag1, tag2, tag3"
          />
          <p className="text-xs text-gray-500 mt-1">
            Gescheiden door komma's
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#FF9933] focus:ring-[#FF9933]"
          />
          <label htmlFor="isActive" className="text-sm text-gray-300">
            Item is actief (wordt gebruikt door AI)
          </label>
        </div>

        <div className="flex gap-3 pt-4 border-t border-zinc-800">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Opslaan...
              </>
            ) : (
              'Opslaan'
            )}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="ghost"
            className="text-gray-400 hover:text-white hover:bg-zinc-800"
          >
            Annuleren
          </Button>
        </div>
      </div>
    </form>
  );
}
