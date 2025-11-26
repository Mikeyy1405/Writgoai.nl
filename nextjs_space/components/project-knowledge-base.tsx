
'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Trash2, Loader2, AlertCircle, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

interface KnowledgeItem {
  id: string;
  title: string;
  type: string;
  content: string;
  category?: string;
  tags: string[];
  importance: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
}

interface ProjectKnowledgeBaseProps {
  projectId: string;
}

export default function ProjectKnowledgeBase({ projectId }: ProjectKnowledgeBaseProps) {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    tags: '',
    importance: 'normal',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchKnowledgeItems();
  }, [projectId]);

  const fetchKnowledgeItems = async () => {
    try {
      const res = await fetch(`/api/client/knowledge-base?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('Bestand is te groot. Maximum grootte is 10MB.');
        return;
      }

      const supportedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];

      if (!supportedTypes.includes(file.type)) {
        toast.error('Ongeldig bestandstype. Alleen PDF, DOCX en XLSX worden ondersteund.');
        return;
      }

      setSelectedFile(file);
      if (!formData.title) {
        setFormData({ ...formData, title: file.name });
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Selecteer eerst een bestand');
      return;
    }

    setUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('projectId', projectId);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('category', formData.category);
      uploadFormData.append('tags', formData.tags);
      uploadFormData.append('importance', formData.importance);

      const res = await fetch('/api/client/knowledge-base', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Bestand succesvol toegevoegd aan knowledge base!');
        setShowUploadForm(false);
        setFormData({ title: '', category: '', tags: '', importance: 'normal' });
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchKnowledgeItems();
      } else {
        toast.error(data.error || 'Er ging iets mis bij het uploaden');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Er ging iets mis bij het uploaden');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;

    try {
      const res = await fetch(`/api/client/knowledge-base?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Item verwijderd');
        fetchKnowledgeItems();
      } else {
        toast.error('Er ging iets mis');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Er ging iets mis');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'high':
        return <Badge className="bg-red-500">Hoog</Badge>;
      case 'normal':
        return <Badge className="bg-blue-500">Normaal</Badge>;
      case 'low':
        return <Badge className="bg-gray-500">Laag</Badge>;
      default:
        return <Badge>{importance}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold">Knowledge Base</h3>
          <p className="text-sm text-muted-foreground mt-1 break-words">
            Upload bestanden (PDF, DOCX, XLSX) die de AI kan gebruiken voor context
          </p>
        </div>
        <Button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="w-full sm:w-auto shrink-0"
        >
          <Upload className="w-4 h-4 mr-2" />
          Bestand Uploaden
        </Button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <Card className="p-6 border-purple-200 bg-purple-50/50">
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="file">Bestand *</Label>
              <Input
                ref={fileInputRef}
                id="file"
                type="file"
                accept=".pdf,.docx,.doc,.xlsx,.xls"
                onChange={handleFileSelect}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ondersteunde formaten: PDF, DOCX, XLSX (max 10MB)
              </p>
              {selectedFile && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <File className="w-4 h-4" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-muted-foreground">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Bijv. Bedrijfsinformatie, Product specificaties"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Categorie (optioneel)</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Bijv. Algemeen, Product info, Brand guidelines"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (optioneel)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Bijv. product, pricing, company"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Gescheiden door komma's
              </p>
            </div>

            <div>
              <Label htmlFor="importance">Belangrijkheid</Label>
              <select
                id="importance"
                value={formData.importance}
                onChange={(e) => setFormData({ ...formData, importance: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="low">Laag</option>
                <option value="normal">Normaal</option>
                <option value="high">Hoog</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Hoge belangrijkheid betekent dat deze informatie vaker gebruikt wordt door de AI
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" disabled={uploading} className="w-full sm:w-auto">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploaden...
                  </>
                ) : (
                  'Uploaden'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="w-full sm:w-auto"
              >
                Annuleren
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Knowledge Items List */}
      {items.length === 0 ? (
        <Card className="p-6 md:p-8">
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">Nog geen bestanden</h3>
            <p className="text-sm text-muted-foreground break-words px-2">
              Upload bestanden die de AI kan gebruiken voor betere content generatie
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <FileText className="w-5 h-5 text-purple-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium break-words">{item.title}</div>
                      {item.category && (
                        <div className="text-sm text-muted-foreground">{item.category}</div>
                      )}
                    </div>
                    {getImportanceBadge(item.importance)}
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                    {item.fileSize && (
                      <div>Grootte: {formatFileSize(item.fileSize)}</div>
                    )}
                    <div>
                      Toegevoegd:{' '}
                      {new Date(item.createdAt).toLocaleDateString('nl-NL')}
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-muted rounded text-sm line-clamp-3">
                    {item.content.substring(0, 300)}
                    {item.content.length > 300 && '...'}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 self-end sm:self-start"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
