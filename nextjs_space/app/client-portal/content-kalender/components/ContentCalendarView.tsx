'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

interface PlannedItem {
  id: string;
  title: string;
  scheduledFor: string;
  status: string;
  contentType?: string;
}

interface ContentCalendarViewProps {
  projectId: string | null;
  items: PlannedItem[];
  onRefresh: () => void;
}

const MONTHS_NL = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
];

const DAYS_NL = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

export default function ContentCalendarView({ projectId, items, onRefresh }: ContentCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get first day of week (0 = Sunday, 1 = Monday, etc.)
    // Convert Sunday (0) to 7 for easier calculation
    const firstDayOfWeek = firstDay.getDay() || 7;
    
    const days: Array<{ date: Date | null; isCurrentMonth: boolean }> = [];
    
    // Add previous month days
    const prevMonthDays = firstDayOfWeek - 1;
    const prevMonth = new Date(year, month, 0);
    const prevMonthLastDay = prevMonth.getDate();
    
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }
    
    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // Add next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    
    return days;
  };
  
  const calendarDays = generateCalendarDays();
  
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const getItemsForDate = (date: Date | null) => {
    if (!date) return [];
    
    return items.filter(item => {
      const itemDate = new Date(item.scheduledFor);
      return (
        itemDate.getDate() === date.getDate() &&
        itemDate.getMonth() === date.getMonth() &&
        itemDate.getFullYear() === date.getFullYear()
      );
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'scheduled':
      case 'planned':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'draft':
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  if (!projectId) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="py-12">
          <div className="text-center text-zinc-400">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Selecteer een project om de content kalender te zien</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {MONTHS_NL[month]} {year}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousMonth}
              className="border-zinc-700 hover:bg-zinc-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextMonth}
              className="border-zinc-700 hover:bg-zinc-800"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-zinc-400">
          {items.filter(item => {
            const itemDate = new Date(item.scheduledFor);
            return itemDate.getMonth() === month && itemDate.getFullYear() === year;
          }).length} geplande items deze maand
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {DAYS_NL.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-zinc-400 py-2"
            >
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            const dayItems = getItemsForDate(day.date);
            const isToday = day.date && 
              day.date.getDate() === new Date().getDate() &&
              day.date.getMonth() === new Date().getMonth() &&
              day.date.getFullYear() === new Date().getFullYear();
            
            return (
              <div
                key={index}
                className={`
                  min-h-[100px] p-2 rounded-lg border
                  ${day.isCurrentMonth ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-900/30 border-zinc-800/50'}
                  ${isToday ? 'ring-2 ring-orange-500/50' : ''}
                `}
              >
                <div className={`text-sm font-medium mb-2 ${day.isCurrentMonth ? 'text-white' : 'text-zinc-600'}`}>
                  {day.date?.getDate()}
                </div>
                
                {dayItems.length > 0 && (
                  <div className="space-y-1">
                    {dayItems.map((item) => (
                      <div
                        key={item.id}
                        className={`text-xs p-1 rounded border ${getStatusColor(item.status)}`}
                        title={item.title}
                      >
                        <div className="truncate">{item.title}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
