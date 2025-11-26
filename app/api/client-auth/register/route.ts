
// Client registratie API

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { withRateLimit } from '@/lib/rate-limiter';
import { validateInput, signupSchema } from '@/lib/validation';
import { log, logError } from '@/lib/logger';
import { sendAdminNotification } from '@/lib/notification-helper';
import { sendWelcomeEmail, sendOnboardingEmail } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // 🛡️ Rate limiting - Max 3 registraties per uur per IP
    const rateLimitResult = await withRateLimit(request, 'signup');
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    
    // 🛡️ Input validation
    const validation = validateInput(signupSchema, body);
    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: validation.error || 'Ongeldige input' }, { status: 400 });
    }

    const { email, password, name, companyName, website } = validation.data;
    
    // Check for affiliate referral code
    const { searchParams } = new URL(request.url);
    const referralCode = searchParams.get('ref') || body.referralCode;
    
    // Find referrer if referral code is provided
    let referrerClient = null;
    if (referralCode) {
      referrerClient = await prisma.client.findFirst({
        where: { 
          affiliateCode: referralCode.toUpperCase(),
          affiliateEnabled: true,
        },
        select: { id: true, name: true },
      });
    }
    
    // Check if client already exists
    const existingClient = await prisma.client.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existingClient) {
      log('warn', 'Registration attempt with existing email', {
        email: email.toLowerCase(),
        ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json({ error: 'Dit email adres is al in gebruik' }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create client with 1000 free welcome credits (≈ 20 blogs)
    const client = await prisma.client.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        companyName,
        website,
        automationActive: false,
        topUpCredits: 1000, // 🎁 1000 gratis trial credits (≈ 20 blogs)
        referredBy: referrerClient?.id || null, // Track who referred this user
      }
    });

    // Log the welcome credits
    await prisma.creditTransaction.create({
      data: {
        clientId: client.id,
        amount: 1000,
        type: 'bonus',
        description: '🎁 Welkomst bonus - 1000 gratis credits',
        balanceAfter: 1000,
      }
    });
    
    // Create affiliate referral record if there's a referrer
    if (referrerClient) {
      try {
        await prisma.affiliateReferral.create({
          data: {
            referrerClientId: referrerClient.id,
            referredClientId: client.id,
            referralCode: referralCode.toUpperCase(),
            signupIp: request.ip || request.headers.get('x-forwarded-for') || null,
            signupSource: 'registration',
            status: 'active',
            isVerified: false, // Will be verified when they make first purchase
          },
        });
        
        log('info', 'Affiliate referral created', {
          referrerId: referrerClient.id,
          referredId: client.id,
          referralCode: referralCode.toUpperCase(),
        });
      } catch (error) {
        console.error('Failed to create affiliate referral:', error);
        // Don't block registration if referral tracking fails
      }
    }
    
    log('info', 'Client registered successfully', {
      clientId: client.id,
      email: client.email,
      welcomeCredits: 1000,
      referredBy: referrerClient?.id || null,
    });

    // 📧 Stuur admin notificatie (asynchroon - mag falen zonder het proces te blokkeren)
    sendAdminNotification({
      type: 'new_client',
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      details: {
        companyName: client.companyName,
        website: client.website,
        welcomeCredits: 1000,
      },
    }).catch((err) => {
      console.error('Failed to send admin notification:', err);
      // Blokkeer niet de response als email faalt
    });

    // 🎉 Stuur welkomst email (asynchroon - mag falen zonder het proces te blokkeren)
    sendWelcomeEmail({
      to: client.email,
      name: client.name,
      email: client.email,
    }).catch((err) => {
      console.error('Failed to send welcome email:', err);
      // Blokkeer niet de response als email faalt
    });

    // 📬 Start onboarding email reeks (eerste email direct)
    const dashboardUrl = 'https://WritgoAI.nl/client-portal';
    sendOnboardingEmail(
      client.email,
      client.name,
      1, // Email 1: Welkom & Eerste Stappen
      dashboardUrl
    ).catch((err) => {
      console.error('Failed to send first onboarding email:', err);
      // Blokkeer niet de response als email faalt
    });

    return NextResponse.json({
      success: true,
      message: 'Account succesvol aangemaakt! Je hebt 1000 gratis credits ontvangen (≈ 20 blogs) 🎉',
      client: {
        id: client.id,
        email: client.email,
        name: client.name,
        credits: 1000,
      }
    });
  } catch (error: any) {
    logError(error, { endpoint: '/api/client-auth/register' });
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Er ging iets mis bij het aanmaken van je account' }, { status: 500 });
  }
}
