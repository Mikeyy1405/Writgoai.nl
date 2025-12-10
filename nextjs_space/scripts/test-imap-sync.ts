/**
 * Test IMAP Sync
 * Tests the IMAP connection and email synchronization
 * 
 * Usage: npx tsx scripts/test-imap-sync.ts
 */

import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { testImapConnection, connectToIMAP, fetchNewEmails, parseEmail, IMAPConfig } from '../lib/email-imap-sync';
import { prisma } from '../lib/db';

async function main() {
  console.log('='.repeat(60));
  console.log('EMAIL IMAP SYNC TEST');
  console.log('='.repeat(60));
  console.log();

  // Check environment variables
  const imapHost = process.env.IMAP_HOST;
  const imapPort = parseInt(process.env.IMAP_PORT || '993');
  const imapUser = process.env.IMAP_USER;
  const imapPassword = process.env.IMAP_PASSWORD;
  const imapTls = process.env.IMAP_TLS !== 'false';

  console.log('Configuration:');
  console.log(`  Host: ${imapHost}`);
  console.log(`  Port: ${imapPort}`);
  console.log(`  User: ${imapUser}`);
  console.log(`  TLS:  ${imapTls}`);
  console.log();

  if (!imapHost || !imapUser || !imapPassword) {
    console.error('❌ Missing IMAP configuration!');
    console.error('Please set IMAP_HOST, IMAP_USER, and IMAP_PASSWORD in .env');
    process.exit(1);
  }

  const config: IMAPConfig = {
    host: imapHost,
    port: imapPort,
    user: imapUser,
    password: imapPassword,
    tls: imapTls,
    tlsOptions: { rejectUnauthorized: false },
  };

  // Test 1: Connection test
  console.log('[Test 1] Testing IMAP connection...');
  try {
    const result = await testImapConnection(config);
    if (result.success) {
      console.log('✅ IMAP connection successful!');
    } else {
      console.error('❌ IMAP connection failed:', result.error);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Connection test error:', error.message);
    process.exit(1);
  }
  console.log();

  // Test 2: Fetch emails
  console.log('[Test 2] Fetching recent emails...');
  try {
    const connection = await connectToIMAP(config);
    
    // Fetch emails from last 7 days
    const since = new Date();
    since.setDate(since.getDate() - 7);
    
    const messages = await fetchNewEmails(connection, since);
    console.log(`✅ Found ${messages.length} emails from last 7 days`);
    
    if (messages.length > 0) {
      console.log();
      console.log('[Test 3] Parsing first email...');
      const parsed = await parseEmail(messages[0]);
      
      if (parsed) {
        console.log('✅ Email parsed successfully:');
        console.log(`  From:    ${parsed.fromName || parsed.from}`);
        console.log(`  Subject: ${parsed.subject}`);
        console.log(`  Date:    ${parsed.receivedAt}`);
        console.log(`  Has attachments: ${parsed.hasAttachments}`);
        console.log(`  Snippet: ${parsed.textBody?.substring(0, 100)}...`);
      } else {
        console.log('⚠️  Could not parse email');
      }
    }
    
    await connection.end();
  } catch (error: any) {
    console.error('❌ Error fetching emails:', error.message);
  }
  console.log();

  // Test 3: Check database tables
  console.log('[Test 4] Checking database tables...');
  try {
    const mailboxCount = await prisma.mailboxConnection.count();
    const emailCount = await prisma.inboxEmail.count();
    
    console.log(`✅ Database tables exist:`);
    console.log(`  Mailboxes: ${mailboxCount}`);
    console.log(`  Emails:    ${emailCount}`);
    
    if (mailboxCount === 0) {
      console.log();
      console.log('💡 No mailboxes configured yet.');
      console.log('   Create a mailbox connection in the admin panel to enable sync.');
    }
  } catch (error: any) {
    console.error('❌ Database error:', error.message);
    console.error('   Make sure to run the migration: supabase/migrations/20251210_email_inbox_tables.sql');
  }
  console.log();

  console.log('='.repeat(60));
  console.log('✅ IMAP sync test completed!');
  console.log('='.repeat(60));
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
