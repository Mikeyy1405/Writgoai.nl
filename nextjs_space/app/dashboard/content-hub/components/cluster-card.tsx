'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, FileText } from 'lucide-react';

interface ClusterCardProps {
  name: string;
  articleCount: number;
  priority?: 'high' | 'medium' | 'low';
  isSelected?: boolean;
  onClick?: () => void;
}

export default function ClusterCard({ 
  name, 
  articleCount, 
  priority = 'medium',
  isSelected = false,
  onClick 
}: ClusterCardProps) {
  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-primary ring-2 ring-primary ring-opacity-50' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription className="mt-1">
              {articleCount} articles
            </CardDescription>
          </div>
          <Badge variant={isSelected ? 'default' : 'outline'} className={getPriorityColor()}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{articleCount} topics to cover</span>
        </div>
      </CardContent>
    </Card>
  );
}
