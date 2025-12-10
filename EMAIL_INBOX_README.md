# Email Inbox IMAP Sync System

## Overview
Complete email inbox system with IMAP synchronization, AI-powered analysis, and automatic invoice detection for Moneybird integration.

## Features

### ✅ IMAP Email Sync
- Real IMAP connection using `imap-simple` library
- Support for standard IMAP and OAuth providers (Gmail, Outlook)
- Automatic email fetching with configurable intervals
- Retry logic with exponential backoff for failed connections
- Email parsing with `mailparser` for headers, body, and attachments

### ✅ Email Management API
- **GET /api/admin/emails** - List emails with pagination, filtering, and search
- **GET /api/admin/emails/[id]** - Get single email with full content
- **PATCH /api/admin/emails/[id]** - Update email status (read/star/archive)
- **DELETE /api/admin/emails/[id]** - Delete email
- **POST /api/admin/emails/send** - Send new email
- **POST /api/admin/emails/sync** - Manually trigger sync
- **POST /api/cron/email-sync** - Automated sync endpoint (cron)

### ✅ AI-Powered Email Analysis
- **Category Detection**: support, sales, invoice, newsletter, spam, general
- **Priority Detection**: high, medium, low
- **Sentiment Analysis**: positive, neutral, negative
- **Auto-Reply Suggestions**: AI-generated professional responses
- **Smart Summarization**: Quick email summaries

### ✅ Invoice Detection & Moneybird Integration
- Automatic invoice detection from email content
- Extract invoice data (amount, vendor, due date, reference)
- Auto-create purchase invoices in Moneybird
- Link emails to Moneybird entries for easy reference

### ✅ Thread Management
- Group related emails into conversations
- Track thread status (open, closed, archived)
- Priority-based organization

### ✅ Database Schema
```sql
- InboxEmail: Store all email data
- MailboxConnection: IMAP/SMTP configuration
- EmailThread: Group related emails
- EmailAutoReplyConfig: Auto-reply settings
```

## Installation

### 1. Database Setup
Run the migration to create required tables:

```sql
-- Execute in Supabase SQL Editor
supabase/migrations/20251210_email_inbox_tables.sql
```

### 2. Environment Configuration
Add to your `.env` file:

```env
# Email IMAP Configuration
IMAP_HOST=mail.writgo.nl
IMAP_PORT=993
IMAP_USER=info@writgo.nl
IMAP_PASSWORD=your_imap_password_here
IMAP_TLS=true

# Email sync settings
EMAIL_SYNC_INTERVAL=5
EMAIL_AI_ANALYSIS_CREDITS=5

# Cron job authentication
CRON_SECRET=your-random-secret-key-here

# Moneybird (for invoice detection)
MONEYBIRD_ACCESS_TOKEN=your-token
MONEYBIRD_ADMINISTRATION_ID=your-admin-id
MONEYBIRD_TAX_RATE_21_ID=your-tax-rate-id
```

### 3. Install Dependencies
Dependencies are already in package.json:
- `imap-simple` - IMAP client
- `mailparser` - Email parsing
- `@types/mailparser` - TypeScript types

## Usage

### Testing IMAP Connection
Test your IMAP configuration:

```bash
npx tsx nextjs_space/scripts/test-imap-sync.ts
```

This will:
1. Validate your IMAP credentials
2. Test connection to the mail server
3. Fetch recent emails (last 7 days)
4. Parse a sample email
5. Verify database tables exist

### Manual Sync
Trigger email sync manually via API:

```bash
curl -X POST https://your-domain.nl/api/admin/emails/sync \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### Automated Sync (Cron)
Set up a cron job to sync every 5 minutes:

**On Render.com:**
```yaml
# render.yaml
services:
  - type: web
    name: writgo-app
    cron:
      - name: email-sync
        schedule: "*/5 * * * *"
        command: "curl -X POST https://your-app.onrender.com/api/cron/email-sync -H 'Authorization: Bearer YOUR_CRON_SECRET'"
```

**External Cron Service (e.g., cron-job.org):**
```
URL: https://your-domain.nl/api/cron/email-sync
Method: POST
Headers: Authorization: Bearer YOUR_CRON_SECRET
Schedule: Every 5 minutes
```

### Creating a Mailbox Connection

```typescript
// Create via admin panel or API
const mailbox = await prisma.mailboxConnection.create({
  data: {
    clientId: 'your-client-id',
    provider: 'imap',
    email: 'info@writgo.nl',
    displayName: 'Writgo Support',
    imapHost: 'mail.writgo.nl',
    imapPort: 993,
    imapTls: true,
    smtpHost: 'mail.writgo.nl',
    smtpPort: 587,
    smtpTls: true,
    // WARNING: Base64 is NOT secure - implement proper encryption!
    password: Buffer.from('your-password').toString('base64'),
    isActive: true,
  },
});
```

## API Examples

### List Emails
```typescript
GET /api/admin/emails?folder=inbox&page=1&limit=50

Response:
{
  "emails": [...],
  "total": 156,
  "unread": 12,
  "page": 1,
  "limit": 50,
  "totalPages": 4
}
```

### Get Single Email
```typescript
GET /api/admin/emails/email-id-here

Response:
{
  "id": "...",
  "from": "customer@example.com",
  "subject": "Question about service",
  "textBody": "...",
  "aiSummary": "Customer inquiry about pricing...",
  "aiCategory": "support",
  "aiPriority": "medium",
  "aiSentiment": "neutral",
  "aiSuggestedReply": "Bedankt voor uw bericht..."
}
```

### Mark as Read
```typescript
PATCH /api/admin/emails/email-id-here
Body: { "isRead": true }
```

### Send Email
```typescript
POST /api/admin/emails/send
Body: {
  "to": "customer@example.com",
  "subject": "Re: Your inquiry",
  "body": "Thank you for contacting us...",
  "html": "<p>Thank you for contacting us...</p>"
}
```

## Architecture

### Sync Flow
```
1. Cron triggers /api/cron/email-sync every 5 minutes
2. syncAllMailboxes() iterates through active mailboxes
3. For each mailbox:
   - Connect to IMAP server
   - Fetch new emails since last sync
   - Parse email content with mailparser
   - Save to InboxEmail table
   - Trigger AI analysis
   - Detect invoices and create in Moneybird
   - Update lastSyncAt timestamp
```

### AI Analysis Flow
```
1. New email saved to database
2. processInboxEmail() triggered
3. analyzeEmail() calls AIML API
4. Extract:
   - Category (support, sales, invoice, etc.)
   - Priority (high, medium, low)
   - Sentiment (positive, neutral, negative)
   - Summary and suggested reply
5. Update email with AI data
6. Check for invoice patterns
7. If invoice detected:
   - Extract invoice data
   - Create purchase invoice in Moneybird
   - Link email to Moneybird entry
```

### Error Handling
- **Connection Failures**: Retry up to 3 times with exponential backoff
- **Parsing Errors**: Log error, continue with next email
- **AI API Errors**: Fall back to keyword-based analysis
- **Moneybird Errors**: Mark as invoice but skip Moneybird sync

## Security Considerations

⚠️ **CRITICAL**: See `SECURITY_SUMMARY_EMAIL_INBOX.md` for detailed security information.

### Key Points:
1. **Password Storage**: Current Base64 encoding is NOT secure - implement proper encryption before production
2. **SSL/TLS**: Certificate validation enabled for production environments
3. **Authentication**: Admin-only routes protected with session checks
4. **Cron Jobs**: Protected with CRON_SECRET bearer token

## UI Integration

The existing `/admin/emails/page.tsx` provides:
- Email list with filtering
- Thread view with conversation history
- AI-generated reply suggestions
- Star/archive/delete actions
- Manual sync trigger

## Monitoring

Monitor these metrics:
- Email sync success rate
- Failed IMAP connections
- AI analysis errors
- Moneybird invoice creation failures
- Average sync duration
- Unread email count

## Troubleshooting

### "IMAP connection failed"
- Verify IMAP credentials in .env
- Check firewall allows outbound port 993/143
- Verify IMAP is enabled on mail server
- Check logs for specific error message

### "No emails synced"
- Check lastSyncAt timestamp in database
- Verify mailbox isActive = true
- Check if emails exist on server since last sync
- Review IMAP server logs

### "Invoice not created in Moneybird"
- Verify MONEYBIRD_TAX_RATE_21_ID is set
- Check Moneybird API credentials
- Review invoice detection keywords
- Check Moneybird logs for API errors

### "AI analysis not working"
- Verify AIML_API_KEY is configured
- Check API quota/rate limits
- Review aiml-agent.ts logs
- Confirm credits are available

## Development

### Running Tests
```bash
# Test IMAP connection
npx tsx nextjs_space/scripts/test-imap-sync.ts

# Test AI analysis
node -e "import('./nextjs_space/lib/email-ai-analyzer').then(m => console.log(m))"
```

### Debugging
Enable detailed logging:
```typescript
// In email-imap-sync.ts
console.log('[IMAP] Message:', message);
console.log('[IMAP] Parsed:', parsed);
```

## Roadmap

### Future Enhancements
- [ ] Full attachment storage and preview
- [ ] Email templates management
- [ ] Bulk operations (mark multiple as read)
- [ ] Email forwarding rules
- [ ] Spam detection training
- [ ] Multi-language support for AI analysis
- [ ] Email search with Elasticsearch
- [ ] Mobile app integration
- [ ] Calendar integration for meeting emails
- [ ] Contact management

## Support

For issues or questions:
1. Check `SECURITY_SUMMARY_EMAIL_INBOX.md` for security concerns
2. Review troubleshooting section above
3. Check application logs for errors
4. Contact development team

## License

Part of the Writgo AI platform - proprietary software.
