'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2,
  TrendingUp,
  DollarSign,
  Info,
  Upload,
  ExternalLink,
  RefreshCw,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import ArticleGenerator from './article-generator';
import RewriteModal from './rewrite-modal';
import EditArticleModal from './edit-article-modal';
import DeleteConfirmationModal from './delete-confirmation-modal';

interface Article {
  id: string;
  title: string;
  cluster: string;
  keywords: string[];
  status: string;
  priority: number;
  searchVolume: number | null;
  difficulty: number | null;
  searchIntent: string | null;
  wordpressUrl: string | null;
  publishedAt: string | null;
  content: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

interface ArticleRowProps {
  article: Article;
  onUpdate?: () => void;
}

export default function ArticleRow({ article, onUpdate }: ArticleRowProps) {
  const [showGenerator, setShowGenerator] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusIcon = () => {
    switch (article.status) {
      case 'published':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'writing':
      case 'researching':
      case 'publishing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (article.status) {
      case 'published':
        return 'Gepubliceerd';
      case 'pending':
        return 'Wachtend';
      case 'writing':
        return 'Schrijven...';
      case 'researching':
        return 'Onderzoeken...';
      case 'publishing':
        return 'Publiceren...';
      case 'failed':
        return 'Mislukt';
      default:
        return article.status;
    }
  };

  const getIntentBadge = () => {
    const intent = article.searchIntent || 'informational';
    const colors = {
      commercial: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      transactional: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      informational: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    
    return (
      <Badge variant="outline" className={colors[intent as keyof typeof colors] || colors.informational}>
        {intent}
      </Badge>
    );
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const response = await fetch('/api/content-hub/publish-wordpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId: article.id,
          status: 'publish',
        }),
      });

      if (!response.ok) {
        throw new Error('Publiceren mislukt');
      }

      toast.success('Artikel gepubliceerd naar WordPress!');
      onUpdate?.();
    } catch (error) {
      console.error('Failed to publish:', error);
      toast.error('Kon artikel niet publiceren');
    } finally {
      setPublishing(false);
    }
  };

  const handleRewrite = () => {
    setShowRewriteModal(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/content-hub/articles/${article.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Verwijderen mislukt');
      }

      toast.success('Artikel succesvol verwijderd');
      setShowDeleteModal(false);
      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to delete:', error);
      toast.error(error.message || 'Kon artikel niet verwijderen');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {getStatusIcon()}
            </div>

            {/* Article Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1 truncate">{article.title}</h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {article.searchVolume !== null && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{article.searchVolume.toLocaleString()}</span>
                  </div>
                )}
                {article.difficulty !== null && (
                  <div className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    <span>Diff: {article.difficulty}</span>
                  </div>
                )}
                {getIntentBadge()}
                {article.searchIntent === 'commercial' && (
                  <div className="flex items-center gap-1 text-green-600">
                    <DollarSign className="h-3 w-3" />
                    <span>€€€</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {article.keywords.slice(0, 3).map((keyword, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                {article.keywords.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{article.keywords.length - 3} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex-shrink-0">
              <Badge 
                variant={article.status === 'published' ? 'default' : 'secondary'}
                className={
                  article.status === 'published' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : article.status === 'failed'
                    ? 'bg-red-500 hover:bg-red-600'
                    : ''
                }
              >
                {getStatusText()}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex gap-2">
              {article.status === 'pending' && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowEditModal(true)}
                    className="gap-2"
                    title="Bewerk artikel"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setShowGenerator(true)}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Genereer
                  </Button>
                </>
              )}
              
              {article.status === 'published' && !article.wordpressUrl && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handlePublish}
                  disabled={publishing}
                  className="gap-2"
                >
                  {publishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Publiceer
                </Button>
              )}
              
              {article.wordpressUrl && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  asChild
                  className="gap-2"
                >
                  <a href={article.wordpressUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Bekijk
                  </a>
                </Button>
              )}
              
              {article.status === 'published' && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleRewrite}
                  className="gap-2"
                  title="Herschrijf dit artikel"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              
              {article.status === 'published' && !article.wordpressUrl && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setShowGenerator(true)}
                  title="Bekijk artikel"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}

              {/* Delete button - available for all statuses except in-progress */}
              {!['researching', 'writing', 'publishing'].includes(article.status) && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setShowDeleteModal(true)}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  title="Verwijder artikel"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Article Generator Modal */}
      {showGenerator && (
        <ArticleGenerator
          article={article}
          onClose={() => setShowGenerator(false)}
          onComplete={() => {
            setShowGenerator(false);
            onUpdate?.();
          }}
        />
      )}

      {/* Rewrite Modal */}
      {showRewriteModal && (
        <RewriteModal
          article={article}
          onClose={() => setShowRewriteModal(false)}
          onComplete={() => {
            setShowRewriteModal(false);
            onUpdate?.();
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditArticleModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            onUpdate?.();
          }}
          article={article}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        articleTitle={article.title}
        isDeleting={isDeleting}
      />
    </>
  );
}
