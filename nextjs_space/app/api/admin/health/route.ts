import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma as db } from '@/lib/db';
import { getMoneybird } from '@/lib/moneybird';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/health
 * Health check endpoint for admin APIs
 * Checks database connection, Moneybird API, and other critical services
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json(
        { 
          status: 'unauthorized',
          error: 'Unauthorized access' 
        }, 
        { status: 401 }
      );
    }

    const checks: Record<string, any> = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      services: {},
    };

    // Check database connection
    try {
      // Simple health check using Prisma - just count clients
      await db.client.findFirst();
      checks.services.database = {
        status: 'healthy',
        message: 'Database verbinding OK',
      };
    } catch (error) {
      checks.overall = 'degraded';
      checks.services.database = {
        status: 'unhealthy',
        message: 'Database verbinding mislukt',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Check Moneybird API configuration
    try {
      const hasToken = !!process.env.MONEYBIRD_ACCESS_TOKEN;
      const hasAdminId = !!process.env.MONEYBIRD_ADMINISTRATION_ID;

      if (!hasToken || !hasAdminId) {
        checks.services.moneybird = {
          status: 'not_configured',
          message: 'Moneybird API is niet geconfigureerd',
          details: {
            hasToken,
            hasAdminId,
          },
        };
      } else {
        // Try to initialize Moneybird client (doesn't make API call yet)
        try {
          const moneybird = getMoneybird();
          checks.services.moneybird = {
            status: 'configured',
            message: 'Moneybird API configuratie OK',
            note: 'Actual API connectivity test skipped to avoid rate limits',
          };
        } catch (error) {
          checks.overall = 'degraded';
          checks.services.moneybird = {
            status: 'error',
            message: 'Moneybird API configuratie fout',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }
    } catch (error) {
      checks.overall = 'degraded';
      checks.services.moneybird = {
        status: 'error',
        message: 'Fout bij controleren Moneybird configuratie',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Check admin stats API
    try {
      const clientCount = await db.client.count();
      checks.services.adminStats = {
        status: 'healthy',
        message: 'Admin stats API OK',
        details: {
          clientsInDatabase: clientCount,
        },
      };
    } catch (error) {
      checks.overall = 'degraded';
      checks.services.adminStats = {
        status: 'unhealthy',
        message: 'Admin stats API fout',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Check environment variables
    const criticalEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
    ];

    const missingEnvVars = criticalEnvVars.filter((key) => !process.env[key]);
    
    checks.services.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'degraded',
      message: missingEnvVars.length === 0 
        ? 'Alle kritieke omgevingsvariabelen zijn ingesteld'
        : `${missingEnvVars.length} kritieke omgevingsvariabelen ontbreken`,
      missingVars: missingEnvVars,
    };

    if (missingEnvVars.length > 0) {
      checks.overall = 'degraded';
    }

    // Determine HTTP status code based on overall health
    const statusCode = checks.overall === 'healthy' ? 200 : 
                      checks.overall === 'degraded' ? 207 : 500;

    return NextResponse.json(checks, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Health check mislukt',
      },
      { status: 500 }
    );
  }
}
