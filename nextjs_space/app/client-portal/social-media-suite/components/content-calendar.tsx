'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Trash2,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { 
  generateCalendarDays, 
  PLATFORM_CONFIG, 
  formatScheduleDate,
  PlatformId,
  CalendarDay,
} from '@/lib/social-media-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ScheduledPost {
  id: string;
  content: string;
  platform: PlatformId;
  scheduledAt: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  project: {
    id: string;
    name: string;
  };
}

interface ContentCalendarProps {
  projectId: string | null;
}

const MONTHS_NL = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
];

const DAYS_NL = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const CONTENT_PREVIEW_LENGTH = 200;

export default function ContentCalendar({ projectId }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarDays = generateCalendarDays(year, month);

  useEffect(() => {
    if (projectId) {
      loadPosts();
    }
  }, [projectId, currentDate]);

  const loadPosts = async () => {
    if (!projectId) return;

    try {
      setLoading(true);

      // Bereken start en eind datum voor de huidige maand
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const response = await fetch(
        `/api/client/social/schedule?projectId=${projectId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setPosts(data.posts || []);
      } else {
        throw new Error(data.error || 'Failed to load posts');
      }
    } catch (error: any) {
      console.error('Error loading posts:', error);
      toast.error('Kon geplande posts niet laden');
    } finally {
      setLoading(false);
    }
  };

  const getPostsForDay = (date: Date): ScheduledPost[] => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduledAt);
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: CalendarDay) => {
    const postsForDay = getPostsForDay(day.date);
    if (postsForDay.length > 0) {
      setSelectedDay(day.date);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setPostToDelete(postId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;

    try {
      const response = await fetch(`/api/client/social/schedule/${postToDelete}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Post verwijderd');
        loadPosts();
        setSelectedDay(null);
        setSelectedPost(null);
      } else {
        throw new Error(data.error || 'Failed to delete post');
      }
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error('Kon post niet verwijderen');
    } finally {
      setDeleteConfirmOpen(false);
      setPostToDelete(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-400" />;
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      published: 'bg-green-500/20 text-green-300 border-green-500/50',
      failed: 'bg-red-500/20 text-red-300 border-red-500/50',
      draft: 'bg-slate-8000/20 text-gray-300 border-gray-500/50',
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Kalender</CardTitle>
              <CardDescription>
                Overzicht van alle geplande posts
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[180px] text-center font-semibold">
                {MONTHS_NL[month]} {year}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Weekday Headers */}
                {DAYS_NL.map(day => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {calendarDays.map((day, index) => {
                  const postsForDay = getPostsForDay(day.date);
                  const hasContent = postsForDay.length > 0;

                  return (
                    <div
                      key={index}
                      onClick={() => hasContent && handleDayClick(day)}
                      className={`
                        min-h-[80px] p-2 rounded-lg border transition-colors
                        ${day.isCurrentMonth ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-900/20 border-gray-800'}
                        ${day.isToday ? 'border-orange-500 border-2' : ''}
                        ${hasContent ? 'cursor-pointer hover:border-orange-500/50' : ''}
                        ${!day.isCurrentMonth ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="text-sm font-medium mb-1">
                        {day.dayNumber}
                      </div>
                      
                      {hasContent && (
                        <div className="space-y-1">
                          {postsForDay.slice(0, 3).map(post => {
                            const config = PLATFORM_CONFIG[post.platform];
                            return (
                              <div
                                key={post.id}
                                className="flex items-center gap-1 text-xs"
                                title={`${config.name} - ${new Date(post.scheduledAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`}
                              >
                                <span>{config.emoji}</span>
                              </div>
                            );
                          })}
                          {postsForDay.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{postsForDay.length - 3} meer
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <p className="text-sm font-medium mb-2">Platform Legenda:</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-1">
                      <span>{config.emoji}</span>
                      <span className="text-muted-foreground">{config.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Day Details Modal */}
      <Dialog open={selectedDay !== null} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Posts voor {selectedDay && selectedDay.toLocaleDateString('nl-NL', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </DialogTitle>
            <DialogDescription>
              Bekijk en beheer je geplande posts voor deze dag
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {selectedDay && getPostsForDay(selectedDay).map(post => {
              const config = PLATFORM_CONFIG[post.platform];
              return (
                <Card key={post.id} className="bg-gray-800/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{config.emoji}</span>
                        <div>
                          <p className="font-medium">{config.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatScheduleDate(new Date(post.scheduledAt))}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusBadge(post.status)} border`}>
                          {getStatusIcon(post.status)}
                          <span className="ml-1 capitalize">{post.status}</span>
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm bg-gray-900/50 rounded p-3 whitespace-pre-wrap">
                      {post.content.substring(0, CONTENT_PREVIEW_LENGTH)}
                      {post.content.length > CONTENT_PREVIEW_LENGTH && '...'}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze geplande post wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setPostToDelete(null);
              }}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Verwijderen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
