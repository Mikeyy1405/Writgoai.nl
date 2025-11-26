
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, FileText, Calendar, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface RecentContent {
  id: string;
  title: string;
  language: string;
  createdAt: Date;
  projectName?: string;
}

interface RecentActivityProps {
  content: RecentContent[];
}

const languageFlags: Record<string, string> = {
  NL: '🇳🇱',
  EN: '🇺🇸',
  FR: '🇫🇷',
  ES: '🇪🇸',
  DE: '🇩🇪'
};

export function RecentActivity({ content }: RecentActivityProps) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Recent gegenereerd</CardTitle>
            <p className="text-sm text-gray-400 mt-1">
              Je laatste {content.length} artikelen
            </p>
          </div>
          <Link href="/client-portal/content-library">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-orange-400 hover:text-purple-300 hover:bg-orange-500/10"
            >
              Bekijk alles
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {content.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nog geen content gegenereerd</p>
            <Link href="/client-portal/content-generator">
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
              >
                Start met Auto Writer
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {content.map((item) => (
              <Link
                key={item.id}
                href={`/client-portal/content-library/${item.id}/edit`}
                className="block p-4 hover:bg-gray-800/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">
                        {languageFlags[item.language] || '🌐'}
                      </span>
                      <h4 className="font-medium text-white truncate group-hover:text-orange-400 transition-colors">
                        {item.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                          locale: nl
                        })}
                      </span>
                      {item.projectName && (
                        <Badge variant="outline" className="border-gray-700 text-gray-400">
                          {item.projectName}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
