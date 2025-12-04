/**
 * AI Email Assistant Library
 * AI-powered email analysis, summarization, sentiment analysis, and reply generation
 */

import { prisma } from './db';

/**
 * Analyze email with AI
 * Generates summary, sentiment, category, priority, and suggested reply
 */
export async function analyzeEmailWithAI(
  emailContent: string,
  subject: string,
  from: string,
  clientId: string
): Promise<{
  summary: string;
  sentiment: string;
  category: string;
  priority: string;
  suggestedReply: string;
}> {
  try {
    // Use AIML API for analysis
    const aimlApiKey = process.env.AIML_API_KEY;
    
    if (!aimlApiKey) {
      throw new Error('AIML API key not configured');
    }

    const analysisPrompt = `Analyze this email and provide:
1. A brief summary (2-3 sentences)
2. Sentiment (positive, negative, neutral, or urgent)
3. Category (support, sales, newsletter, spam, or personal)
4. Priority level (high, normal, or low)
5. A suggested professional reply

Email Details:
From: ${from}
Subject: ${subject}
Content: ${emailContent}

Respond in JSON format:
{
  "summary": "...",
  "sentiment": "...",
  "category": "...",
  "priority": "...",
  "suggestedReply": "..."
}`;

    const response = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aimlApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI email assistant that analyzes emails and provides structured insights.',
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`AIML API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON response
    const analysis = JSON.parse(content);

    // Deduct credits (5 credits for AI analysis)
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true,
      },
    });

    if (client && !client.isUnlimited) {
      const totalCredits = client.subscriptionCredits + client.topUpCredits;
      
      if (totalCredits >= 5) {
        const subscriptionDeduct = Math.min(5, client.subscriptionCredits);
        const topUpDeduct = 5 - subscriptionDeduct;

        await prisma.client.update({
          where: { id: clientId },
          data: {
            subscriptionCredits: { decrement: subscriptionDeduct },
            topUpCredits: { decrement: topUpDeduct },
            totalCreditsUsed: { increment: 5 },
          },
        });

        await prisma.creditTransaction.create({
          data: {
            clientId,
            amount: -5,
            type: 'deduction',
            description: 'AI email analysis',
            balanceAfter: totalCredits - 5,
          },
        });
      }
    }

    return {
      summary: analysis.summary || 'No summary available',
      sentiment: analysis.sentiment || 'neutral',
      category: analysis.category || 'personal',
      priority: analysis.priority || 'normal',
      suggestedReply: analysis.suggestedReply || '',
    };
  } catch (error: any) {
    console.error('Error analyzing email with AI:', error);
    
    // Return default values on error
    return {
      summary: emailContent.substring(0, 200) + '...',
      sentiment: 'neutral',
      category: 'personal',
      priority: 'normal',
      suggestedReply: '',
    };
  }
}

/**
 * Generate AI reply for email
 */
export async function generateAIReply(
  emailContent: string,
  subject: string,
  from: string,
  tone: string,
  customInstructions: string | null,
  clientId: string
): Promise<{ reply: string; creditsUsed: number }> {
  try {
    const aimlApiKey = process.env.AIML_API_KEY;
    
    if (!aimlApiKey) {
      throw new Error('AIML API key not configured');
    }

    // Check credits first
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true,
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    const totalCredits = client.subscriptionCredits + client.topUpCredits;

    if (!client.isUnlimited && totalCredits < 10) {
      throw new Error('Insufficient credits. Need 10 credits to generate AI reply.');
    }

    const replyPrompt = `Generate a ${tone} email reply to this email.

Original Email:
From: ${from}
Subject: ${subject}
Content: ${emailContent}

${customInstructions ? `Additional Instructions: ${customInstructions}` : ''}

Generate a well-structured, ${tone} reply that addresses the main points in the email.`;

    const response = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aimlApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional email assistant that writes ${tone} email replies.`,
          },
          {
            role: 'user',
            content: replyPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`AIML API error: ${response.statusText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error('No response from AI');
    }

    // Deduct credits (10 credits for AI reply generation)
    if (!client.isUnlimited) {
      const subscriptionDeduct = Math.min(10, client.subscriptionCredits);
      const topUpDeduct = 10 - subscriptionDeduct;

      await prisma.client.update({
        where: { id: clientId },
        data: {
          subscriptionCredits: { decrement: subscriptionDeduct },
          topUpCredits: { decrement: topUpDeduct },
          totalCreditsUsed: { increment: 10 },
        },
      });

      await prisma.creditTransaction.create({
        data: {
          clientId,
          amount: -10,
          type: 'deduction',
          description: 'AI email reply generation',
          balanceAfter: totalCredits - 10,
        },
      });
    }

    return {
      reply,
      creditsUsed: 10,
    };
  } catch (error: any) {
    console.error('Error generating AI reply:', error);
    throw error;
  }
}

/**
 * Check if auto-reply should be sent based on configuration
 */
export async function shouldAutoReply(
  config: any,
  email: {
    from: string;
    receivedAt: Date;
    category: string;
  }
): Promise<boolean> {
  // Check if auto-reply is active
  if (!config.isActive) {
    return false;
  }

  // Check if sender is in exclude list
  if (config.excludedSenders.includes(email.from.toLowerCase())) {
    return false;
  }

  // Check if category is allowed
  if (
    config.allowedCategories.length > 0 &&
    !config.allowedCategories.includes(email.category)
  ) {
    return false;
  }

  // Check business hours if enabled
  if (config.businessHoursOnly) {
    const receivedDate = new Date(email.receivedAt);
    const dayOfWeek = receivedDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Check if day is in business days
    if (!config.businessDays.includes(dayOfWeek)) {
      return false;
    }

    // Check if time is within business hours
    const currentTime = receivedDate.toTimeString().substring(0, 5); // HH:mm
    
    if (
      config.businessHoursStart &&
      config.businessHoursEnd &&
      (currentTime < config.businessHoursStart || currentTime > config.businessHoursEnd)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Generate and send auto-reply
 */
export async function sendAutoReply(
  inboxEmail: any,
  config: any,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate AI reply with configured tone
    const { reply } = await generateAIReply(
      inboxEmail.body,
      inboxEmail.subject,
      inboxEmail.from,
      config.tone,
      config.replyTemplate || null,
      clientId
    );

    // Add signature if enabled
    let finalReply = reply;
    if (config.includeSignature && config.signature) {
      finalReply += '\n\n' + config.signature;
    }

    // Here you would integrate with SMTP to actually send the email
    // For now, we'll just log it and create a record
    
    // Create auto-reply record (credits already deducted, but we log 8 for auto-reply)
    await prisma.emailAutoReply.create({
      data: {
        configId: config.id,
        inboxEmailId: inboxEmail.id,
        recipientEmail: inboxEmail.from,
        recipientName: inboxEmail.fromName || '',
        subject: `Re: ${inboxEmail.subject}`,
        replyContent: finalReply,
        tone: config.tone,
        creditsUsed: 8, // Auto-reply is 8 credits
        success: true,
      },
    });

    // Mark inbox email as auto-replied
    await prisma.inboxEmail.update({
      where: { id: inboxEmail.id },
      data: {
        isAutoReplied: true,
        repliedAt: new Date(),
      },
    });

    // Deduct 8 credits for auto-reply (separate from the 10 credits already used for AI reply generation)
    // Note: This does NOT include the 5 credits for email analysis which happens separately
    // Total cost for auto-reply with new email: 5 (analysis) + 8 (auto-reply) = 13 credits
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true,
      },
    });

    if (client && !client.isUnlimited) {
      const totalCredits = client.subscriptionCredits + client.topUpCredits;
      
      if (totalCredits >= 8) {
        const subscriptionDeduct = Math.min(8, client.subscriptionCredits);
        const topUpDeduct = 8 - subscriptionDeduct;

        await prisma.client.update({
          where: { id: clientId },
          data: {
            subscriptionCredits: { decrement: subscriptionDeduct },
            topUpCredits: { decrement: topUpDeduct },
            totalCreditsUsed: { increment: 8 },
          },
        });

        await prisma.creditTransaction.create({
          data: {
            clientId,
            amount: -8,
            type: 'deduction',
            description: 'AI auto-reply',
            balanceAfter: totalCredits - 8,
          },
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending auto-reply:', error);

    // Create failed auto-reply record
    await prisma.emailAutoReply.create({
      data: {
        configId: config.id,
        inboxEmailId: inboxEmail.id,
        recipientEmail: inboxEmail.from,
        recipientName: inboxEmail.fromName || '',
        subject: `Re: ${inboxEmail.subject}`,
        replyContent: '',
        tone: config.tone,
        creditsUsed: 0,
        success: false,
        errorMessage: error.message,
      },
    });

    return { success: false, error: error.message };
  }
}
