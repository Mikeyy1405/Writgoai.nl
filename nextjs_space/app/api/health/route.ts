import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Health Check Endpoint
 * Used by Render and other monitoring services to verify application health
 * 
 * Returns:
 * - 200: Application is healthy (database accessible)
 * - 503: Service unavailable (database connection issue)
 */
export async function GET() {
  try {
    // Check database connectivity with a simple query
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      service: 'writgoai',
    }, { status: 200 });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      service: 'writgoai',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  }
}
