/**
 * AI Email Analysis Service
 * Analyzes emails for category, priority, sentiment, and generates suggested replies
 */

import { callAIMLAgent } from './aiml-agent';

export interface EmailAnalysis {
  summary: string;
  category: 'support' | 'sales' | 'invoice' | 'newsletter' | 'spam' | 'general';
  priority: 'high' | 'medium' | 'low';
  sentiment: 'positive' | 'neutral' | 'negative';
  suggestedReply?: string;
  isInvoice: boolean;
  invoiceData?: {
    amount?: number;
    vendor?: string;
    dueDate?: string;
  };
}

/**
 * Analyze email with AI
 */
export async function analyzeEmail(email: {
  from: string;
  subject: string;
  body: string;
  attachments?: string[];
}): Promise<EmailAnalysis> {
  try {
    const prompt = `Analyze this email and provide structured information:

From: ${email.from}
Subject: ${email.subject}
Body:
${email.body.substring(0, 2000)}
${email.attachments && email.attachments.length > 0 ? `\nAttachments: ${email.attachments.join(', ')}` : ''}

Provide a JSON response with:
1. summary: A brief 1-2 sentence summary of the email
2. category: One of: support, sales, invoice, newsletter, spam, general
3. priority: One of: high, medium, low (high for urgent matters, invoices, complaints)
4. sentiment: One of: positive, neutral, negative
5. isInvoice: boolean - true if this is an invoice or payment request
6. invoiceData: If isInvoice is true, extract:
   - amount: numeric value if found
   - vendor: company name
   - dueDate: date in ISO format if found
7. suggestedReply: A professional reply (only if it's a support or sales email that needs response)

Return ONLY valid JSON, no markdown or extra text.`;

    const response = await callAIMLAgent(prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 500,
    });

    // Parse AI response
    let analysis: EmailAnalysis;
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[AI Analyzer] Failed to parse AI response:', parseError);
      // Return default analysis
      analysis = {
        summary: email.subject,
        category: 'general',
        priority: 'medium',
        sentiment: 'neutral',
        isInvoice: false,
      };
    }

    return analysis;
  } catch (error: any) {
    console.error('[AI Analyzer] Error analyzing email:', error.message);
    
    // Return basic analysis based on keywords
    return analyzeEmailBasic(email);
  }
}

/**
 * Basic keyword-based analysis as fallback
 */
function analyzeEmailBasic(email: {
  from: string;
  subject: string;
  body: string;
  attachments?: string[];
}): EmailAnalysis {
  const text = `${email.subject} ${email.body}`.toLowerCase();
  const hasAttachments = email.attachments && email.attachments.length > 0;

  // Detect category
  let category: EmailAnalysis['category'] = 'general';
  let isInvoice = false;
  
  if (text.match(/factuur|invoice|betaling|payment|rekening|bill/i)) {
    category = 'invoice';
    isInvoice = true;
  } else if (text.match(/help|probleem|vraag|support|issue|bug/i)) {
    category = 'support';
  } else if (text.match(/offerte|quote|kopen|aankoop|purchase|order/i)) {
    category = 'sales';
  } else if (text.match(/nieuwsbrief|newsletter|unsubscribe|afmelden/i)) {
    category = 'newsletter';
  } else if (text.match(/spam|winner|prize|viagra|casino/i)) {
    category = 'spam';
  }

  // Detect priority
  let priority: EmailAnalysis['priority'] = 'medium';
  if (text.match(/urgent|spoed|asap|belangrijk|critical|emergency/i) || isInvoice) {
    priority = 'high';
  } else if (text.match(/fyi|info|update|notificatie/i)) {
    priority = 'low';
  }

  // Detect sentiment
  let sentiment: EmailAnalysis['sentiment'] = 'neutral';
  if (text.match(/klacht|probleem|teleurgesteld|slecht|complaint|problem|disappointed|bad/i)) {
    sentiment = 'negative';
  } else if (text.match(/bedankt|geweldig|perfect|blij|thank|great|excellent|happy/i)) {
    sentiment = 'positive';
  }

  // Extract invoice data if applicable
  let invoiceData: EmailAnalysis['invoiceData'] = undefined;
  if (isInvoice) {
    const amountMatch = text.match(/€\s*(\d+[\.,]\d{2})|(\d+[\.,]\d{2})\s*euro/i);
    const amount = amountMatch ? parseFloat(amountMatch[1] || amountMatch[2].replace(',', '.')) : undefined;
    
    invoiceData = {
      amount,
      vendor: email.from.split('@')[0],
      dueDate: undefined, // Would need more sophisticated parsing
    };
  }

  return {
    summary: `Email from ${email.from} regarding ${email.subject}`,
    category,
    priority,
    sentiment,
    isInvoice,
    invoiceData,
    suggestedReply: category === 'support' || category === 'sales' 
      ? 'Bedankt voor uw bericht. We hebben uw email ontvangen en nemen zo spoedig mogelijk contact met u op.'
      : undefined,
  };
}

/**
 * Generate AI reply for email
 */
export async function generateEmailReply(email: {
  from: string;
  subject: string;
  body: string;
  tone?: 'professional' | 'friendly' | 'concise';
}): Promise<string> {
  try {
    const tone = email.tone || 'professional';
    
    const toneInstructions = {
      professional: 'Write a professional and formal reply',
      friendly: 'Write a friendly and warm reply',
      concise: 'Write a brief and to-the-point reply',
    };

    const prompt = `${toneInstructions[tone]} to this email:

From: ${email.from}
Subject: ${email.subject}
Body:
${email.body.substring(0, 1500)}

Guidelines:
- Write in Dutch if the email is in Dutch, otherwise in English
- Be helpful and courteous
- Address the main points
- Keep it ${tone === 'concise' ? 'brief (max 3 sentences)' : 'appropriate length'}
- Do not use a signature or closing (we'll add that automatically)

Reply:`;

    const response = await callAIMLAgent(prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 300,
    });

    return response.trim();
  } catch (error: any) {
    console.error('[AI Analyzer] Error generating reply:', error.message);
    return 'Bedankt voor uw bericht. We hebben uw email ontvangen en nemen zo spoedig mogelijk contact met u op.';
  }
}
