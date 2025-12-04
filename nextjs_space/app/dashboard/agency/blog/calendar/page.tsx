'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface CalendarData {
  publishedPosts: Array<{
    id: string;
    title: string;
    slug: string;
    publishedAt: string;
    category: string;
  }>;
  scheduledPosts: Array<{
    id: string;
    title: string;
    slug: string;
    scheduledFor: string;
    category: string;
  }>;
  ideas: Array<{
    id: string;
    title: string;
    dueDate: string;
    status: string;
    priority: string;
  }>;
}

export default function BlogCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      const month = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, '0')}`;
      const res = await fetch(`/api/admin/blog/calendar?month=${month}`);
      if (!res.ok) throw new Error('Failed to fetch calendar data');
      const data = await res.json();
      setCalendarData(data);
    } catch (error) {
      toast.error('Fout bij ophalen kalender');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getItemsForDate = (day: number) => {
    if (!calendarData) return { posts: [], scheduled: [], ideas: [] };

    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const posts = calendarData.publishedPosts.filter(
      (post) => post.publishedAt?.startsWith(dateStr)
    );

    const scheduled = calendarData.scheduledPosts.filter(
      (post) => post.scheduledFor?.startsWith(dateStr)
    );

    const ideas = calendarData.ideas.filter(
      (idea) => idea.dueDate?.startsWith(dateStr)
    );

    return { posts, scheduled, ideas };
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
  const days = [];
  
  // Add empty cells for days before the start of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-[120px]" />);
  }
  
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const { posts, scheduled, ideas } = getItemsForDate(day);
    const isToday =
      day === new Date().getDate() &&
      currentDate.getMonth() === new Date().getMonth() &&
      currentDate.getFullYear() === new Date().getFullYear();

    days.push(
      <Card
        key={day}
        className={`min-h-[120px] p-3 ${
          isToday ? 'border-[#FF9933] border-2' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-sm font-semibold ${
              isToday ? 'text-[#FF9933]' : ''
            }`}
          >
            {day}
          </span>
          {(posts.length > 0 || scheduled.length > 0 || ideas.length > 0) && (
            <div className="flex gap-1">
              {posts.length > 0 && (
                <Badge variant="default" className="text-xs px-1 py-0">
                  {posts.length}
                </Badge>
              )}
              {scheduled.length > 0 && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  {scheduled.length}
                </Badge>
              )}
              {ideas.length > 0 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {ideas.length}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/dashboard/agency/blog/posts/${post.id}`}
              className="block"
            >
              <div className="text-xs p-1 bg-green-100 dark:bg-green-900/30 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                <span className="font-medium line-clamp-1">{post.title}</span>
              </div>
            </Link>
          ))}

          {scheduled.map((post) => (
            <Link
              key={post.id}
              href={`/dashboard/agency/blog/posts/${post.id}`}
              className="block"
            >
              <div className="text-xs p-1 bg-blue-100 dark:bg-blue-900/30 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                <span className="font-medium line-clamp-1">{post.title}</span>
              </div>
            </Link>
          ))}

          {ideas.map((idea) => (
            <Link
              key={idea.id}
              href="/dashboard/agency/blog/ideas"
              className="block"
            >
              <div className="text-xs p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors">
                <span className="font-medium line-clamp-1">{idea.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    );
  }

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
          <h1 className="text-3xl font-bold">Content Kalender</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Overzicht van gepubliceerde en geplande content
          </p>
        </div>
      </div>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>Gepubliceerd</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span>Gepland</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span>Idee Deadline</span>
          </div>
        </div>
      </Card>

      {/* Calendar Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={previousMonth}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Vorige
          </Button>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {currentDate.toLocaleDateString('nl-NL', {
              month: 'long',
              year: 'numeric',
            })}
          </h2>
          <Button variant="outline" onClick={nextMonth}>
            Volgende
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">{days}</div>
      </Card>
    </div>
  );
}
