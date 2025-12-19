// Admin API voor het testen van WordPress connectie

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/admin/wordpress-sites/[id]/test
 * Test de verbinding met een WordPress site
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Haal de WordPress site op
    const site = await prisma.wordPressSite.findUnique({
      where: { id: params.id }
    });
    
    if (!site) {
      return NextResponse.json({ error: 'WordPress site not found' }, { status: 404 });
    }
    
    // Maak credentials voor WordPress REST API
    const credentials = Buffer.from(`${site.username}:${site.applicationPassword}`).toString('base64');
    
    // Test de connectie door de WordPress REST API te benaderen
    try {
      const response = await fetch(`${site.apiEndpoint}/wp/v2/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        // Update de site met test resultaten
        await prisma.wordPressSite.update({
          where: { id: params.id },
          data: {
            lastTestedAt: new Date(),
            testStatus: 'success',
            testMessage: `Succesvol verbonden als ${userData.name || userData.username}`
          }
        });
        
        return NextResponse.json({
          success: true,
          message: `Succesvol verbonden als ${userData.name || userData.username}`,
          userData: {
            id: userData.id,
            name: userData.name,
            username: userData.username,
            email: userData.email
          }
        });
      } else {
        const errorText = await response.text();
        let errorMessage = 'Verbinding mislukt';
        
        if (response.status === 401) {
          errorMessage = 'Authenticatie mislukt. Controleer je gebruikersnaam en application password.';
        } else if (response.status === 404) {
          errorMessage = 'WordPress REST API niet gevonden. Controleer de site URL.';
        } else {
          errorMessage = `Verbinding mislukt (${response.status}): ${errorText.substring(0, 100)}`;
        }
        
        // Update de site met test resultaten
        await prisma.wordPressSite.update({
          where: { id: params.id },
          data: {
            lastTestedAt: new Date(),
            testStatus: 'failed',
            testMessage: errorMessage
          }
        });
        
        return NextResponse.json({
          success: false,
          message: errorMessage
        }, { status: 400 });
      }
    } catch (fetchError: any) {
      const errorMessage = `Kan geen verbinding maken met WordPress site: ${fetchError.message}`;
      
      // Update de site met test resultaten
      await prisma.wordPressSite.update({
        where: { id: params.id },
        data: {
          lastTestedAt: new Date(),
          testStatus: 'failed',
          testMessage: errorMessage
        }
      });
      
      return NextResponse.json({
        success: false,
        message: errorMessage
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Failed to test WordPress connection:', error);
    return NextResponse.json({ error: 'Failed to test WordPress connection' }, { status: 500 });
  }
}
