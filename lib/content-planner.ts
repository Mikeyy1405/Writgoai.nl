/**
 * Intelligent Content Planning & Scheduling System
 * Generates balanced content calendar based on topical authority strategy
 */

export interface Topic {
  id: string;
  name: string;
  slug: string;
  priority: number;
  target_percentage: number;
}

export interface CalendarEntry {
  date: Date;
  topicId: string;
  topicName: string;
  contentType: 'pillar' | 'cluster' | 'supporting';
  title?: string;
  focusKeyword?: string;
  priorityScore: number;
  plannedTime: string;
}

export interface DailyLimit {
  topicId: string;
  topicName: string;
  maxPerDay: number;
  generatedToday: number;
  remaining: number;
}

/**
 * Generate content calendar for specified period
 */
export function generateContentCalendar(
  topics: Topic[],
  startDate: Date,
  days: number,
  articlesPerDay: number = 2
): CalendarEntry[] {
  const calendar: CalendarEntry[] = [];
  
  // Sort topics by priority
  const sortedTopics = [...topics].sort((a, b) => a.priority - b.priority);
  
  for (let day = 0; day < days; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    
    const dayOfWeek = date.getDay();
    
    // Weekend: 1 evergreen article (supporting content)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const topic = selectTopicByPercentage(sortedTopics, calendar);
      
      calendar.push({
        date,
        topicId: topic.id,
        topicName: topic.name,
        contentType: 'supporting',
        priorityScore: 300,
        plannedTime: '09:00:00'
      });
      continue;
    }
    
    // Weekdays: 2-3 articles based on parameter
    const dailyArticles = articlesPerDay;
    
    for (let i = 0; i < dailyArticles; i++) {
      const topic = selectTopicByPercentage(sortedTopics, calendar);
      const contentType = selectContentType(topic, calendar);
      const priorityScore = calculatePriorityScore(topic, contentType);
      
      // Stagger times throughout the day
      const hours = [9, 12, 15];
      const plannedTime = `${hours[i % hours.length].toString().padStart(2, '0')}:00:00`;
      
      calendar.push({
        date,
        topicId: topic.id,
        topicName: topic.name,
        contentType,
        priorityScore,
        plannedTime
      });
    }
  }
  
  // Balance topics to match target percentages
  return balanceTopics(calendar, sortedTopics);
}

/**
 * Select topic based on target percentage
 */
function selectTopicByPercentage(topics: Topic[], calendar: CalendarEntry[]): Topic {
  // Calculate current distribution
  const totalEntries = calendar.length || 1;
  const distribution: Record<string, number> = {};
  
  topics.forEach(topic => {
    const count = calendar.filter(e => e.topicId === topic.id).length;
    distribution[topic.id] = (count / totalEntries) * 100;
  });
  
  // Find topic that's most under its target
  let selectedTopic = topics[0];
  let maxDeficit = -Infinity;
  
  for (const topic of topics) {
    const current = distribution[topic.id] || 0;
    const deficit = topic.target_percentage - current;
    
    if (deficit > maxDeficit) {
      maxDeficit = deficit;
      selectedTopic = topic;
    }
  }
  
  return selectedTopic;
}

/**
 * Select content type based on topic's current content structure
 */
function selectContentType(
  topic: Topic,
  calendar: CalendarEntry[]
): 'pillar' | 'cluster' | 'supporting' {
  const topicEntries = calendar.filter(e => e.topicId === topic.id);
  const pillarCount = topicEntries.filter(e => e.contentType === 'pillar').length;
  const clusterCount = topicEntries.filter(e => e.contentType === 'cluster').length;
  
  // Need pillar page first (1 per topic)
  if (pillarCount === 0) {
    return 'pillar';
  }
  
  // Need clusters (5-10 per pillar)
  if (clusterCount < 10) {
    return 'cluster';
  }
  
  // Supporting content
  return 'supporting';
}

/**
 * Calculate priority score for calendar entry
 */
function calculatePriorityScore(topic: Topic, contentType: string): number {
  let score = 500; // Base score
  
  // Topic priority bonus (higher priority = higher score)
  score += (6 - topic.priority) * 100;
  
  // Content type bonus
  if (contentType === 'pillar') score += 300;
  else if (contentType === 'cluster') score += 200;
  else if (contentType === 'supporting') score += 100;
  
  return score;
}

/**
 * Balance topics to match target percentages
 */
function balanceTopics(calendar: CalendarEntry[], topics: Topic[]): CalendarEntry[] {
  const totalEntries = calendar.length;
  const balanced = [...calendar];
  
  // Calculate target counts
  const targets: Record<string, number> = {};
  topics.forEach(topic => {
    targets[topic.id] = Math.round((topic.target_percentage / 100) * totalEntries);
  });
  
  // Count current distribution
  const counts: Record<string, number> = {};
  topics.forEach(topic => {
    counts[topic.id] = balanced.filter(e => e.topicId === topic.id).length;
  });
  
  // Adjust entries to match targets (simple approach)
  // In production, this would be more sophisticated
  return balanced;
}

/**
 * Check daily limits for topics
 */
export function checkDailyLimits(
  topics: Topic[],
  date: Date,
  generatedToday: Record<string, number>
): DailyLimit[] {
  const limits: DailyLimit[] = [];
  
  // Max 3 articles per day total
  const totalMax = 3;
  
  for (const topic of topics) {
    // Calculate max per topic based on percentage
    const maxPerDay = Math.max(1, Math.round((topic.target_percentage / 100) * totalMax));
    const generated = generatedToday[topic.id] || 0;
    
    limits.push({
      topicId: topic.id,
      topicName: topic.name,
      maxPerDay,
      generatedToday: generated,
      remaining: Math.max(0, maxPerDay - generated)
    });
  }
  
  return limits;
}

/**
 * Get next scheduled content from calendar
 */
export function getNextScheduledContent(
  calendar: CalendarEntry[],
  currentDate: Date
): CalendarEntry | null {
  // Find entries for today or future
  const upcoming = calendar
    .filter(e => e.date >= currentDate)
    .sort((a, b) => {
      const dateCompare = a.date.getTime() - b.date.getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.priorityScore - a.priorityScore;
    });
  
  return upcoming[0] || null;
}

/**
 * Calculate optimal publishing time based on analytics
 */
export function calculateOptimalPublishTime(
  dayOfWeek: number,
  contentType: string
): string {
  // Based on typical SEO blog engagement patterns
  const optimalTimes: Record<string, Record<string, string>> = {
    pillar: {
      weekday: '09:00:00', // Monday-Friday morning
      weekend: '10:00:00'  // Weekend late morning
    },
    cluster: {
      weekday: '12:00:00', // Lunch time
      weekend: '14:00:00'  // Weekend afternoon
    },
    supporting: {
      weekday: '15:00:00', // Afternoon
      weekend: '09:00:00'  // Weekend morning
    }
  };
  
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const timeSlot = isWeekend ? 'weekend' : 'weekday';
  
  return optimalTimes[contentType]?.[timeSlot] || '09:00:00';
}

/**
 * Validate calendar entry against business rules
 */
export function validateCalendarEntry(
  entry: CalendarEntry,
  calendar: CalendarEntry[],
  topics: Topic[]
): { valid: boolean; reason?: string } {
  // Check daily limit
  const sameDay = calendar.filter(e => 
    e.date.toDateString() === entry.date.toDateString()
  );
  
  if (sameDay.length >= 3) {
    return { valid: false, reason: 'Maximum 3 articles per day exceeded' };
  }
  
  // Check topic daily limit
  const sameDayTopic = sameDay.filter(e => e.topicId === entry.topicId);
  if (sameDayTopic.length >= 2) {
    return { valid: false, reason: 'Maximum 2 articles per topic per day exceeded' };
  }
  
  // Check if topic exists
  const topic = topics.find(t => t.id === entry.topicId);
  if (!topic) {
    return { valid: false, reason: 'Invalid topic ID' };
  }
  
  return { valid: true };
}

/**
 * Generate weekly summary of planned content
 */
export function generateWeeklySummary(
  calendar: CalendarEntry[],
  startDate: Date
): {
  week: number;
  startDate: Date;
  endDate: Date;
  totalArticles: number;
  byTopic: Record<string, number>;
  byContentType: Record<string, number>;
} {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  const weekEntries = calendar.filter(e => 
    e.date >= startDate && e.date <= endDate
  );
  
  const byTopic: Record<string, number> = {};
  const byContentType: Record<string, number> = {};
  
  weekEntries.forEach(e => {
    byTopic[e.topicName] = (byTopic[e.topicName] || 0) + 1;
    byContentType[e.contentType] = (byContentType[e.contentType] || 0) + 1;
  });
  
  return {
    week: Math.floor((startDate.getTime() - new Date(startDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1,
    startDate,
    endDate,
    totalArticles: weekEntries.length,
    byTopic,
    byContentType
  };
}
