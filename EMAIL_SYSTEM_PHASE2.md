# Email Management Systeem - Fase 2: Email Composer & Verzenden

**Status:** ✅ Compleet  
**Datum:** 11 december 2024  
**Branch:** `feature/email-management-phase2`

---

## Overzicht

Fase 2 breidt het email management systeem uit met volledige email composer functionaliteit, inclusief verzenden, reply/forward, en draft management. Dit bouwt voort op Fase 1 (inbox en IMAP integratie) en completeert de email workflow.

---

## Geïmplementeerde Features

### 1. **Email Composer** 📝
- **Pagina:** `/admin/email/compose`
- **Functionaliteit:**
  - Nieuwe email schrijven
  - Reply naar bestaande email (`?reply=[uid]`)
  - Forward email (`?forward=[uid]`)
  - Edit draft (`?draft=[id]`)
  - Mailbox selectie (van welk account verzenden)
  - To, CC, BCC velden
  - Subject en rich text body
  - Auto-save elke 30 seconden
  - Send en Save Draft knoppen

### 2. **Rich Text Editor** ✨
- **Component:** `components/email/RichTextEditor.tsx`
- **Library:** TipTap
- **Features:**
  - Bold, Italic, Underline
  - Bullet & Numbered lists
  - Links toevoegen
  - Undo/Redo
  - Dark theme optimized
  - HTML output

### 3. **SMTP Client** 📧
- **File:** `lib/email/smtp-client.ts`
- **Library:** nodemailer
- **Functionaliteit:**
  - Send email via SMTP
  - HTML/text body support
  - CC, BCC support
  - Threading headers (In-Reply-To, References)
  - Connection verification
  - Password decryption
  - Error handling

### 4. **Draft Management** 💾
- **Pagina:** `/admin/email/drafts`
- **Database:** `EmailDraft` tabel
- **Features:**
  - List alle opgeslagen drafts
  - Preview van draft inhoud
  - Edit draft
  - Delete draft
  - Auto-save vanuit composer
  - Draft wordt verwijderd na verzenden

### 5. **Reply & Forward** 🔄
- **Reply:**
  - Pre-fill "To" met sender
  - Subject: "Re: [original]"
  - Quote original email
  - Threading headers
  - Knop in email detail
- **Forward:**
  - Empty "To" field
  - Subject: "Fwd: [original]"
  - Include original email
  - Knop in email detail

### 6. **Navigation Updates** 🧭
- "Nieuwe Email" knop in inbox (oranje, prominent)
- "Concepten" menu item in Email sectie
- "Beantwoorden" en "Doorsturen" knoppen in email detail

---

## Database Schema

### EmailDraft Table
```sql
CREATE TABLE IF NOT EXISTS "EmailDraft" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "mailboxId" TEXT NOT NULL,
  
  -- Recipients
  "to" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "cc" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "bcc" TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Content
  "subject" TEXT NOT NULL DEFAULT '',
  "bodyHtml" TEXT NOT NULL DEFAULT '',
  "bodyText" TEXT NOT NULL DEFAULT '',
  
  -- Threading
  "inReplyTo" TEXT,
  "references" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "isReply" BOOLEAN NOT NULL DEFAULT false,
  "isForward" BOOLEAN NOT NULL DEFAULT false,
  "originalMessageId" TEXT,
  
  -- Metadata
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("mailboxId") REFERENCES "MailboxConnection"("id")
);
```

**Indexes:**
- `userId_idx`
- `mailboxId_idx`
- `createdAt_idx`
- `updatedAt_idx`

**Auto-update trigger:** `updatedAt` wordt automatisch bijgewerkt

---

## API Routes

### Send Email
**POST** `/api/admin/email/send`

**Request Body:**
```json
{
  "mailboxId": "string",
  "to": ["email@example.com"],
  "cc": ["email@example.com"], // optional
  "bcc": ["email@example.com"], // optional
  "subject": "string",
  "bodyHtml": "string",
  "bodyText": "string", // optional
  "inReplyTo": "string", // optional, for threading
  "references": ["string"], // optional, for threading
  "draftId": "string" // optional, draft ID to delete after sending
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "string",
  "message": "Email succesvol verzonden"
}
```

### Drafts - List
**GET** `/api/admin/email/drafts`

**Response:**
```json
{
  "drafts": [
    {
      "id": "string",
      "to": ["email@example.com"],
      "subject": "string",
      "bodyHtml": "string",
      "isReply": false,
      "isForward": false,
      "mailbox": {
        "email": "string",
        "displayName": "string"
      },
      "createdAt": "2024-12-11T...",
      "updatedAt": "2024-12-11T..."
    }
  ],
  "count": 5
}
```

### Drafts - Create
**POST** `/api/admin/email/drafts`

**Request Body:** (Same as EmailDraft schema)

**Response:**
```json
{
  "success": true,
  "draft": { ... },
  "message": "Concept opgeslagen"
}
```

### Drafts - Get Single
**GET** `/api/admin/email/drafts/[id]`

**Response:**
```json
{
  "draft": {
    "id": "string",
    ...
    "mailbox": { ... }
  }
}
```

### Drafts - Update
**PUT** `/api/admin/email/drafts/[id]`

**Request Body:** (Partial EmailDraft data)

**Response:**
```json
{
  "success": true,
  "draft": { ... },
  "message": "Concept bijgewerkt"
}
```

### Drafts - Delete
**DELETE** `/api/admin/email/drafts/[id]`

**Response:**
```json
{
  "success": true,
  "message": "Concept verwijderd"
}
```

---

## User Flow

### Nieuwe Email Schrijven
1. Klik "Nieuwe Email" in inbox
2. Selecteer mailbox (van account)
3. Vul To, CC, BCC in
4. Vul subject in
5. Schrijf email body (rich text)
6. Klik "Versturen" of "Concept Opslaan"
7. Auto-save werkt elke 30 seconden

### Reply naar Email
1. Open email in inbox
2. Klik "Beantwoorden"
3. Composer opent met:
   - To: pre-filled met sender
   - Subject: "Re: [original]"
   - Body: quoted original
   - Threading headers
4. Schrijf reply
5. Verstuur

### Forward Email
1. Open email in inbox
2. Klik "Doorsturen"
3. Composer opent met:
   - To: empty
   - Subject: "Fwd: [original]"
   - Body: included original
4. Voeg ontvangers toe
5. Verstuur

### Draft Beheren
1. Ga naar "Concepten" in menu
2. Zie lijst van alle drafts
3. Klik draft om te bewerken
4. Of verwijder draft

---

## Technical Details

### Dependencies
```json
{
  "nodemailer": "^7.0.11",
  "@types/nodemailer": "^6.4.15",
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-link": "^2.x"
}
```

### SMTP Configuration
- Gebruikt `MailboxConnection` SMTP settings
- Password decryptie via `lib/encryption.ts`
- Support voor TLS/SSL
- Verification voor verzenden

### Auto-save Logic
- Timer: 30 seconden
- Conditie: alleen als to, subject, of body gevuld is
- Silent: geen toast bij auto-save
- Draft ID wordt toegevoegd aan URL na eerste save

### Threading
- `inReplyTo`: Message-ID van origineel
- `references`: Array van thread Message-IDs
- Email clients herkennen thread relaties
- Belangrijk voor conversation view

---

## Files Changed/Created

### Created Files
```
✅ supabase/migrations/20251211_email_drafts_table.sql
✅ lib/email/smtp-client.ts
✅ components/email/RichTextEditor.tsx
✅ app/api/admin/email/send/route.ts
✅ app/api/admin/email/drafts/route.ts
✅ app/api/admin/email/drafts/[id]/route.ts
✅ app/admin/email/compose/page.tsx
✅ app/admin/email/drafts/page.tsx
```

### Modified Files
```
✅ nextjs_space/package.json (dependencies)
✅ nextjs_space/lib/admin-navigation-config.ts (Concepten menu)
✅ nextjs_space/app/admin/email/inbox/page.tsx (Nieuwe Email button)
✅ nextjs_space/app/admin/email/inbox/[uid]/page.tsx (Reply/Forward buttons)
```

---

## Testing Checklist

### ✅ Send Email
- [x] Nieuwe email schrijven en verzenden
- [x] HTML body wordt correct verzonden
- [x] CC en BCC werken
- [x] Email komt aan bij ontvanger
- [x] SMTP errors worden afgehandeld

### ✅ Reply
- [x] Reply button zichtbaar in email detail
- [x] Composer opent met pre-filled data
- [x] Original email is quoted
- [x] Threading headers correct
- [x] Reply verzendt succesvol

### ✅ Forward
- [x] Forward button zichtbaar in email detail
- [x] Composer opent met original message
- [x] Subject heeft "Fwd:" prefix
- [x] Forward verzendt succesvol

### ✅ Drafts
- [x] Draft opslaan werkt
- [x] Draft lijst toont alle drafts
- [x] Draft bewerken werkt
- [x] Draft verwijderen werkt
- [x] Auto-save werkt elke 30 seconden
- [x] Draft wordt verwijderd na verzenden

### ✅ UI/UX
- [x] "Nieuwe Email" button prominent in inbox
- [x] "Concepten" menu item zichtbaar
- [x] Rich text editor werkt smooth
- [x] Dark theme consistent
- [x] Loading states werken
- [x] Error handling met toasts

---

## Known Limitations

1. **Attachments:** Niet geïmplementeerd in Fase 2 (toekomstige feature)
2. **Email Templates:** Niet geïmplementeerd (toekomstige feature)
3. **Scheduled Send:** Niet geïmplementeerd (toekomstige feature)
4. **Signatures:** Niet geïmplementeerd (toekomstige feature)
5. **Read Receipts:** Niet ondersteund

---

## Next Steps (Fase 3)

Potentiële uitbreidingen voor Fase 3:

1. **Attachments Support**
   - File upload in composer
   - Attachment preview
   - Size limits
   - Storage (Supabase Storage)

2. **Email Templates**
   - Template library
   - Variables/placeholders
   - Quick insert in composer

3. **Advanced Features**
   - Scheduled send (later verzenden)
   - Email signatures
   - Auto-reply configuratie
   - Email analytics (open rate, clicks)

4. **AI Integration**
   - AI-generated replies
   - Sentiment analysis
   - Priority detection
   - Smart categorization

---

## Deployment Notes

### Database Migration
```bash
# Migration wordt automatisch uitgevoerd bij deployment
# Geen handmatige stappen nodig
```

### Environment Variables
Geen nieuwe environment variables nodig. Gebruikt bestaande:
- `ENCRYPTION_KEY` (voor password decryptie)
- Supabase credentials

### Dependencies
```bash
npm install nodemailer @types/nodemailer @tiptap/react @tiptap/starter-kit @tiptap/extension-link --legacy-peer-deps
```

---

## Support & Troubleshooting

### Email niet verzonden?
1. Check SMTP configuratie in `/admin/email/instellingen`
2. Test connection via test button
3. Check logs in browser console
4. Verify password is correct en encrypted

### Auto-save werkt niet?
1. Check browser console voor errors
2. Verify mailbox is geselecteerd
3. Check API route `/api/admin/email/drafts`

### Rich text editor niet zichtbaar?
1. Check TipTap dependencies geïnstalleerd
2. Verify no CSS conflicts
3. Check browser console

---

## Conclusie

Fase 2 van het Email Management Systeem is volledig geïmplementeerd en getest. Het systeem biedt nu een complete email workflow:

- ✅ Emails ontvangen (Fase 1)
- ✅ Emails verzenden (Fase 2)
- ✅ Reply & Forward (Fase 2)
- ✅ Draft management (Fase 2)
- ✅ Rich text composer (Fase 2)

Het systeem is production-ready en kan gebruikt worden door Writgo eigenaar voor professionele email communicatie.

---

**Ontwikkeld door:** Writgo Development Team  
**Laatste update:** 11 december 2024
