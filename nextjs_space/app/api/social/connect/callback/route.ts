import { NextResponse } from 'next/server';
import { getlateClient } from '@/lib/getlate/client';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * GET /api/social/connect/callback
 * OAuth callback handler - called by Getlate.dev after user authorizes
 * 
 * Query params from Getlate:
 * - connected: platform name
 * - profileId: Getlate profile ID
 * - username: connected account username (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const connected = searchParams.get('connected'); // e.g., 'linkedin'
    const profileId = searchParams.get('profileId'); // Getlate profile ID
    const username = searchParams.get('username'); // Optional

    console.log('OAuth callback:', { connected, profileId, username });

    if (!connected || !profileId) {
      return new Response(
        `<html><body><script>
          alert('OAuth callback missing required parameters');
          window.close();
        </script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Find WritGo project with this Getlate profile
    const project = await prisma.project.findFirst({
      where: { getlateProfileId: profileId }
    });

    if (!project) {
      console.error('No project found for Getlate profile:', profileId);
      return new Response(
        `<html><body><script>
          alert('Project not found for this profile');
          window.close();
        </script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Fetch connected accounts from Getlate
    try {
      const accountsData = await getlateClient.listAccounts(profileId);
      const accounts = accountsData.accounts || [];

      // Find the newly connected account
      const newAccount = accounts.find(
        acc => acc.platform === connected && acc.isActive
      );

      if (!newAccount) {
        console.warn('Newly connected account not found in Getlate response');
      } else {
        // Check if already exists in our database
        const existing = await prisma.connectedSocialAccount.findFirst({
          where: {
            projectId: project.id,
            getlateAccountId: newAccount._id
          }
        });

        if (!existing) {
          // Store in our database
          await prisma.connectedSocialAccount.create({
            data: {
              projectId: project.id,
              getlateAccountId: newAccount._id,
              getlateProfileId: profileId,
              platform: newAccount.platform,
              username: newAccount.username,
              displayName: newAccount.displayName,
              accountHandle: newAccount.username,
              profileImage: newAccount.profileImage || null,
              isActive: true,
              followersCount: newAccount.followersCount || null,
              metadata: {}
            }
          });

          console.log('✓ Saved connected account:', newAccount._id);
        } else {
          console.log('Account already exists in database');
        }
      }
    } catch (error) {
      console.error('Failed to fetch/save accounts:', error);
    }

    // Close popup window
    return new Response(
      `<html>
        <body>
          <div style="font-family: system-ui; text-align: center; padding: 40px;">
            <h1 style="color: #10b981;">✓ Succesvol gekoppeld!</h1>
            <p>Dit venster wordt automatisch gesloten...</p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 1500);
          </script>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Callback error:', error);
    return new Response(
      `<html><body><script>
        alert('Er is een fout opgetreden. Probeer het opnieuw.');
        window.close();
      </script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
