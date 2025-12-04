'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, BarChart3, Eye } from 'lucide-react';

interface PublishedArticle {
  id: string;
  title: string;
  wordpressUrl: string;
  publishedAt: string;
  wordCount?: number;
  views?: number;
  ranking?: number;
}

interface PublishedContentProps {
  articles: PublishedArticle[];
}

export default function PublishedContent({ articles }: PublishedContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Published Content</h3>
          <p className="text-sm text-muted-foreground">
            {articles.length} articles published
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {articles.map((article) => (
          <Card key={article.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">{article.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {article.wordCount && (
                      <span>{article.wordCount.toLocaleString()} words</span>
                    )}
                    {article.views !== undefined && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {article.views.toLocaleString()} views
                      </div>
                    )}
                    {article.ranking && (
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        Rank #{article.ranking}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Published {new Date(article.publishedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={article.wordpressUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {articles.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No published articles yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
