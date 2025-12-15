'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { nl } from 'date-fns/locale';

interface CalendarTabProps {
  projectId: string;
  refreshTrigger: number;
}

interface Post {
  id: string;
  content: string;
  platform: string;
  status: string;
  scheduledFor: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: 'bg-blue-500',
  instagram: 'bg-pink-500',
  twitter: 'bg-gray-800',
  facebook: 'bg-blue-600',
  tiktok: 'bg-black',
};

const PLATFORM_ICONS: Record<string, string> = {
  linkedin: '🔵',
  instagram: '🟢',
  twitter: '🟠',
  facebook: '🔴',
  tiktok: '⚫',
};

export default function CalendarTab({ projectId, refreshTrigger }: CalendarTabProps) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    loadPosts();
  }, [projectId, currentDate, refreshTrigger]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/client/social?projectId=${projectId}&status=scheduled`
      );

      if (!response.ok) {
        throw new Error('Failed to load posts');
      }

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      toast.error('Kon posts niet laden');
    } finally {
      setLoading(false);
    }
  };

  const getPostsForDay = (day: Date) => {
    return posts.filter(post =>
      post.scheduledFor && isSameDay(new Date(post.scheduledFor), day)
    );
  };

  const getDaysInView = () => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(currentDate), { locale: nl });
      const end = endOfWeek(endOfMonth(currentDate), { locale: nl });
      return eachDayOfInterval({ start, end });
    }
    // TODO: Implement week and day views
    return [];
  };

  const navigatePrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const days = getDaysInView();
  const daysOfWeek = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              📅 Kalender
            </CardTitle>
            <CardDescription>
              Plan en beheer je social media posts
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex gap-1 border border-gray-700 rounded-md p-1">
              <Button
                size="sm"
                variant={view === 'month' ? 'default' : 'ghost'}
                onClick={() => setView('month')}
              >
                Maand
              </Button>
              <Button
                size="sm"
                variant={view === 'week' ? 'default' : 'ghost'}
                onClick={() => setView('week')}
              >
                Week
              </Button>
              <Button
                size="sm"
                variant={view === 'day' ? 'default' : 'ghost'}
                onClick={() => setView('day')}
              >
                Dag
              </Button>
            </div>

            {/* Navigation */}
            <Button size="sm" variant="outline" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: nl })}
            </span>
            <Button size="sm" variant="outline" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Month View */}
        {view === 'month' && (
          <div className="space-y-2">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const dayPosts = getPostsForDay(day);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      min-h-[100px] p-2 border rounded-lg
                      ${isCurrentMonth ? 'border-gray-700 bg-gray-800/30' : 'border-gray-800 bg-gray-900/30'}
                      ${isToday ? 'ring-2 ring-orange-500' : ''}
                    `}
                  >
                    <div className="text-sm font-medium mb-1">
                      {format(day, 'd')}
                    </div>

                    <div className="space-y-1">
                      {dayPosts.map((post) => (
                        <div
                          key={post.id}
                          className="text-xs p-1 rounded bg-gray-700 hover:bg-gray-600 cursor-pointer truncate"
                          onClick={() => setSelectedPost(post)}
                        >
                          <span className="mr-1">
                            {PLATFORM_ICONS[post.platform] || '📱'}
                          </span>
                          {post.content.substring(0, 20)}...
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week and Day views TODO */}
        {view === 'week' && (
          <div className="text-center py-12 text-muted-foreground">
            Week view - Coming soon
          </div>
        )}

        {view === 'day' && (
          <div className="text-center py-12 text-muted-foreground">
            Day view - Coming soon
          </div>
        )}
      </CardContent>
    </Card>
  );
}
