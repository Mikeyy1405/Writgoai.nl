import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

interface ContentItem {
  id: string;
  title: string;
  type: string;
  category: string;
  keywords: string[];
  searchIntent: string;
  selected: boolean;
  priority: string;
  estimatedWords: number;
  productKeyword?: string;
}

interface ScheduleConfig {
  mode: 'bulk' | 'daily' | 'weekly' | 'custom';
  articlesPerDay?: number;
  articlesPerWeek?: number;
  publishDays?: string[];
  publishTime?: string;
  autoPublish: boolean;
  startDate?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }
    
    const body = await request.json();
    const { projectId, contentItems, schedule, bolcomEnabled, bolcomAffiliateId } = body as {
      projectId?: string;
      contentItems: ContentItem[];
      schedule: ScheduleConfig;
      bolcomEnabled?: boolean;
      bolcomAffiliateId?: string;
    };
    
    if (!contentItems || contentItems.length === 0) {
      return NextResponse.json({ error: 'Geen content items geselecteerd' }, { status: 400 });
    }
    
    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }
    
    // Get or create project
    let project = null;
    if (projectId) {
      project = await prisma.project.findFirst({
        where: { id: projectId, clientId: client.id }
      });
    }
    
    // Calculate schedule timing
    const now = new Date();
    let scheduledItems: Array<{
      item: ContentItem;
      scheduledFor: Date;
      status: string;
    }> = [];
    
    if (schedule.mode === 'bulk') {
      // All items scheduled for now
      scheduledItems = contentItems.map((item, index) => ({
        item,
        scheduledFor: new Date(now.getTime() + index * 60000), // 1 minute apart
        status: 'queued'
      }));
    } else if (schedule.mode === 'daily') {
      // Distribute items across days
      const articlesPerDay = schedule.articlesPerDay || 2;
      let currentDate = new Date(schedule.startDate || now);
      let dailyCount = 0;
      
      scheduledItems = contentItems.map((item) => {
        if (dailyCount >= articlesPerDay) {
          currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
          dailyCount = 0;
        }
        
        const scheduledTime = new Date(currentDate);
        const [hours, minutes] = (schedule.publishTime || '09:00').split(':').map(Number);
        scheduledTime.setHours(hours, minutes + dailyCount * 30, 0, 0); // 30 min apart
        
        dailyCount++;
        
        return {
          item,
          scheduledFor: scheduledTime,
          status: 'scheduled'
        };
      });
    } else if (schedule.mode === 'weekly') {
      // Distribute items across weeks/days
      const articlesPerWeek = schedule.articlesPerWeek || 10;
      const publishDays = schedule.publishDays || ['monday', 'wednesday', 'friday'];
      const dayMap: Record<string, number> = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      };
      
      let currentDate = new Date(schedule.startDate || now);
      let weeklyCount = 0;
      let dayIndex = 0;
      
      // Find next publish day
      const findNextPublishDay = (date: Date): Date => {
        const result = new Date(date);
        for (let i = 0; i < 7; i++) {
          const dayName = Object.entries(dayMap).find(([, v]) => v === result.getDay())?.[0];
          if (dayName && publishDays.includes(dayName)) {
            return result;
          }
          result.setDate(result.getDate() + 1);
        }
        return result;
      };
      
      currentDate = findNextPublishDay(currentDate);
      
      scheduledItems = contentItems.map((item) => {
        const scheduledTime = new Date(currentDate);
        const [hours, minutes] = (schedule.publishTime || '09:00').split(':').map(Number);
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        weeklyCount++;
        
        // Move to next publish day
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate = findNextPublishDay(currentDate);
        
        if (weeklyCount >= articlesPerWeek) {
          // Skip to next week
          currentDate.setDate(currentDate.getDate() + 7);
          currentDate = findNextPublishDay(currentDate);
          weeklyCount = 0;
        }
        
        return {
          item,
          scheduledFor: scheduledTime,
          status: 'scheduled'
        };
      });
    }
    
    // Save content queue to database
    const contentQueue = await prisma.contentQueue.createMany({
      data: scheduledItems.map((scheduled, index) => ({
        clientId: client.id,
        projectId: project?.id || null,
        title: scheduled.item.title,
        type: scheduled.item.type,
        category: scheduled.item.category,
        keywords: scheduled.item.keywords,
        searchIntent: scheduled.item.searchIntent,
        priority: scheduled.item.priority,
        estimatedWords: scheduled.item.estimatedWords,
        productKeyword: scheduled.item.productKeyword || null,
        scheduledFor: scheduled.scheduledFor,
        status: scheduled.status,
        autoPublish: schedule.autoPublish,
        bolcomEnabled: bolcomEnabled || false,
        bolcomAffiliateId: bolcomAffiliateId || null,
        position: index
      }))
    });
    
    // If bulk mode, start processing immediately
    if (schedule.mode === 'bulk') {
      // Trigger background processing (first 5 items)
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/client/content-wizard/process-queue`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({ clientId: client.id, limit: 5 })
      }).catch(console.error);
    }
    
    // Calculate estimated completion time
    const lastScheduled = scheduledItems[scheduledItems.length - 1];
    const estimatedCompletion = lastScheduled?.scheduledFor || now;
    
    return NextResponse.json({
      success: true,
      queuedItems: contentItems.length,
      schedule: schedule.mode,
      autoPublish: schedule.autoPublish,
      estimatedCompletion: estimatedCompletion.toISOString(),
      firstItemScheduledFor: scheduledItems[0]?.scheduledFor?.toISOString(),
      message: schedule.mode === 'bulk' 
        ? 'Content generatie is gestart! Check je Content Library voor de voortgang.'
        : `${contentItems.length} artikelen ingepland. Eerste artikel op ${scheduledItems[0]?.scheduledFor?.toLocaleDateString('nl-NL')}`
    });
    
  } catch (error: any) {
    console.error('Error starting content generation:', error);
    return NextResponse.json(
      { error: error.message || 'Starten mislukt' },
      { status: 500 }
    );
  }
}
