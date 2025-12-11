'use client';

/**
 * Email Drafts Page
 * /admin/email/drafts
 * 
 * List and manage saved email drafts
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FileText, Trash2, Edit, Mail } from 'lucide-react';

interface Draft {
  id: string;
  to: string[];
  subject: string;
  bodyHtml: string;
  isReply: boolean;
  isForward: boolean;
  mailbox?: {
    email: string;
    displayName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/email/drafts');
      const data = await res.json();

      if (data.drafts) {
        setDrafts(data.drafts);
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
      toast.error('Fout bij laden concepten');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (draftId: string) => {
    if (!confirm('Weet je zeker dat je dit concept wilt verwijderen?')) {
      return;
    }

    setDeleting(draftId);
    try {
      const res = await fetch(`/api/admin/email/drafts/${draftId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Concept verwijderd');
        setDrafts((prev) => prev.filter((d) => d.id !== draftId));
      } else {
        throw new Error(data.error || 'Fout bij verwijderen');
      }
    } catch (error: any) {
      console.error('Failed to delete draft:', error);
      toast.error(error.message || 'Fout bij verwijderen concept');
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (draftId: string) => {
    router.push(`/admin/email/compose?draft=${draftId}`);
  };

  const getPreviewText = (html: string, maxLength = 100): string => {
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Gisteren';
    } else if (days < 7) {
      return `${days} dagen geleden`;
    } else {
      return date.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Concepten</h1>
            <p className="text-sm text-gray-400 mt-1">
              {drafts.length} {drafts.length === 1 ? 'concept' : 'concepten'} opgeslagen
            </p>
          </div>

          <button
            onClick={() => router.push('/admin/email/compose')}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <Mail className="w-4 h-4" />
            Nieuwe Email
          </button>
        </div>

        {/* Drafts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Laden...</div>
          </div>
        ) : drafts.length === 0 ? (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-300 mb-2">
              Geen concepten
            </h2>
            <p className="text-gray-400 mb-6">
              Je hebt nog geen email concepten opgeslagen
            </p>
            <button
              onClick={() => router.push('/admin/email/compose')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Nieuwe Email Schrijven
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-gray-900 rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      {draft.isReply && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                          Antwoord
                        </span>
                      )}
                      {draft.isForward && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                          Doorsturen
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatDate(draft.updatedAt)}
                      </span>
                    </div>

                    {/* Subject */}
                    <h3 className="text-lg font-medium text-gray-100 mb-2 truncate">
                      {draft.subject || '(Geen onderwerp)'}
                    </h3>

                    {/* Recipients */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                      <span>Aan:</span>
                      <span className="truncate">
                        {draft.to.length > 0
                          ? draft.to.join(', ')
                          : '(Geen ontvanger)'}
                      </span>
                    </div>

                    {/* Preview */}
                    <p className="text-sm text-gray-500 mb-3">
                      {getPreviewText(draft.bodyHtml)}
                    </p>

                    {/* From Mailbox */}
                    {draft.mailbox && (
                      <div className="text-xs text-gray-600">
                        Van: {draft.mailbox.displayName || draft.mailbox.email}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(draft.id)}
                      className="p-2 text-gray-400 hover:text-orange-500 hover:bg-gray-800 rounded-lg transition-colors"
                      title="Bewerken"
                    >
                      <Edit className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => handleDelete(draft.id)}
                      disabled={deleting === draft.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
