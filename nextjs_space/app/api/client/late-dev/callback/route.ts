
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProfileAccounts } from '@/lib/latedev';

export const dynamic = 'force-dynamic';

/**
 * Handle Late.dev OAuth callback
 * This is called when a client successfully connects their social accounts
 * GET /api/client/latedev/callback
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profileId');
    const externalId = searchParams.get('externalId'); // Our client ID
    const status = searchParams.get('status') || 'success'; // Default to success when coming from Late.dev
    const platform = searchParams.get('platform'); // Platform that was connected

    console.log('Late.dev callback received:', { profileId, externalId, status, platform });

    // If we have profileId and externalId, consider it a success
    if ((status === 'success' || !status) && profileId && externalId) {
      // Update client with Late.dev profile ID if not already set
      const client = await prisma.client.findUnique({
        where: { id: externalId },
      });

      if (client && !client.lateDevProfileId) {
        await prisma.client.update({
          where: { id: externalId },
          data: { lateDevProfileId: profileId },
        });
      }

      // Sync connected accounts immediately
      try {
        const lateDevAccounts = await getProfileAccounts(profileId);
        
        for (const account of lateDevAccounts) {
          // Check if account already exists
          const existing = await prisma.lateDevAccount.findUnique({
            where: { lateDevProfileId: account._id },
          });

          if (existing) {
            // Update existing account
            await prisma.lateDevAccount.update({
              where: { id: existing.id },
              data: {
                username: account.username,
                displayName: account.displayName,
                isActive: true,
                connectedAt: new Date(),
              },
            });
          } else {
            // Create new account
            await prisma.lateDevAccount.create({
              data: {
                clientId: externalId,
                lateDevProfileId: account._id,
                platform: account.platform,
                username: account.username,
                displayName: account.displayName,
                avatar: account.avatar,
                isActive: true,
                connectedAt: new Date(),
              },
            });
          }
        }
      } catch (syncError) {
        console.error('Error syncing accounts:', syncError);
        // Don't fail the callback if sync fails
      }

      // Redirect to client portal with success message
      const redirectUrl = new URL('/client-portal', process.env.NEXTAUTH_URL!);
      redirectUrl.searchParams.set('latedev', 'connected');
      if (platform) {
        redirectUrl.searchParams.set('platform', platform);
      }
      
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect with error
    return NextResponse.redirect(
      new URL('/client-portal?latedev=error', process.env.NEXTAUTH_URL!)
    );
  } catch (error) {
    console.error('Late.dev callback error:', error);
    return NextResponse.redirect(
      new URL('/client-portal?latedev=error', process.env.NEXTAUTH_URL!)
    );
  }
}
