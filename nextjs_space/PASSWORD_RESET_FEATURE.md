# Password Reset via Email - Implementation Summary

## Overview
This document describes the complete password reset feature implementation for WritGo AI platform.

## Feature Description
Users can reset their password by requesting a reset link via email. The system sends a secure, time-limited link that allows users to set a new password.

## Architecture

### Database Schema
**Model: `PasswordResetToken`**
```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expires   DateTime
  createdAt DateTime @default(now())
  
  @@index([email])
  @@index([token])
}
```

**Migration:** `20251203184203_add_password_reset_token`

### API Endpoints

#### 1. POST `/api/client-auth/forgot-password`
Initiates password reset process.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een e-mail met instructies."
}
```

**Features:**
- Validates email format
- Checks Client and User tables
- Generates 32-byte cryptographically secure token
- Stores token with 1-hour expiration
- Sends password reset email via MailerLite
- Rate limiting: 3 requests per email per hour
- Generic response to prevent email enumeration

**Security:**
- Uses centralized rate limiter from `lib/rate-limiter.ts`
- Logs warning without exposing email details
- Always returns success message (even for non-existent emails)

#### 2. POST `/api/client-auth/reset-password`
Validates token and updates password.

**Request:**
```json
{
  "token": "abc123...",
  "password": "newpassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Je wachtwoord is succesvol gewijzigd. Je kunt nu inloggen met je nieuwe wachtwoord."
}
```

**Response (Error):**
```json
{
  "error": "Ongeldige of verlopen reset link. Vraag een nieuwe aan."
}
```

**Features:**
- Validates token exists and is not expired
- Validates password length (minimum 6 characters)
- Hashes password with bcrypt (10 salt rounds)
- Updates password in Client or User table
- Deletes used token (single-use)
- Handles edge cases (expired token, non-existent user)

**Security:**
- No token information in logs
- Automatic cleanup of expired/used tokens
- Secure password hashing

### Email Template
**File:** `lib/password-reset-email.ts`

**Function:** `sendPasswordResetEmail({ to, name, resetLink })`

**Features:**
- Professional Dutch email template
- Responsive HTML design
- Security warnings
- Expiration notice (1 hour)
- Fallback text link
- Branded styling matching WritGo AI

**Email Content Includes:**
- Personalized greeting
- Clear call-to-action button
- Warning box with key information:
  - Link expires in 1 hour
  - Single-use link
  - Ignore if not requested
- Plain text link as fallback
- Company contact information

### Frontend Pages

#### 1. `/wachtwoord-vergeten` (Forgot Password)
**File:** `app/wachtwoord-vergeten/page.tsx`

**Features:**
- Email input form
- Loading state during submission
- Success state with instructions
- Error handling with toast notifications
- Link back to login page
- Dark theme matching `/inloggen`
- Responsive design

**UI Components:**
- Email input with icon
- Submit button with loading spinner
- Success screen with checkmark icon
- Tips for checking spam folder
- Options to retry or go to login

#### 2. `/wachtwoord-resetten` (Reset Password)
**File:** `app/wachtwoord-resetten/page.tsx`

**Features:**
- Token validation from URL parameter
- Password input (new + confirm)
- Client-side validation (match + length)
- Loading state during submission
- Success state with confirmation
- Error state for invalid/expired tokens
- Suspense boundary for loading
- Dark theme matching design system

**Validation:**
- Passwords must match
- Minimum 6 characters
- Clear error messages
- Form disabled while loading

**UI States:**
1. Loading: Spinner while checking token
2. Form: Password input fields with tips
3. Success: Checkmark with redirect button
4. Error: Alert with options to retry/request new link

### Login Page Update
**File:** `app/inloggen/page.tsx`

**Change:** Added "Wachtwoord vergeten?" link next to password field label

```tsx
<div className="flex items-center justify-between">
  <Label htmlFor="login-password" className="text-zinc-200">Wachtwoord</Label>
  <Link
    href="/wachtwoord-vergeten"
    className="text-sm text-zinc-400 hover:text-white transition-colors"
  >
    Wachtwoord vergeten?
  </Link>
</div>
```

## Security Features

### 1. Token Security
- **Generation:** `crypto.randomBytes(32)` - cryptographically secure
- **Storage:** Unique constraint in database
- **Expiration:** 1 hour from creation
- **Single-use:** Deleted immediately after successful use
- **No logging:** Token values never appear in logs

### 2. Rate Limiting
- **Limit:** 3 requests per email per hour
- **Block Duration:** 1 hour
- **Implementation:** RateLimiterMemory from rate-limiter-flexible
- **Key:** Email address
- **Bypass Prevention:** Still returns success message when limited

### 3. Email Enumeration Protection
- **Same Response:** Identical message for existing and non-existent emails
- **Timing:** No observable difference in response time
- **Error Messages:** Generic, non-revealing
- **Purpose:** Prevent attackers from discovering valid email addresses

### 4. Password Security
- **Algorithm:** bcrypt
- **Salt Rounds:** 10
- **Validation:** Minimum 6 characters (matches existing system)
- **Confirmation:** Required double-entry to prevent typos

### 5. Database Security
- **Indexes:** Optimized queries on email and token
- **Cleanup:** Automatic deletion of used/expired tokens
- **Queries:** Prepared statements via Prisma (SQL injection prevention)

## User Experience

### Happy Path
1. User clicks "Wachtwoord vergeten?" on login page
2. Enters email address
3. Sees success message immediately
4. Receives email within minutes
5. Clicks reset link in email
6. Enters and confirms new password
7. Sees success confirmation
8. Clicks button to go to login
9. Logs in with new password

### Edge Cases Handled
- **Non-existent email:** Same success message, no email sent
- **Expired token:** Clear error with option to request new link
- **Used token:** Cannot be reused, must request new one
- **Invalid token:** Helpful error message
- **Rate limited:** Still appears to work, but no email sent
- **Mismatched passwords:** Clear validation error
- **Short password:** Minimum length validation
- **Network errors:** Toast notification with retry option

## Dutch Language
All user-facing text is in Dutch:
- Email templates
- Error messages
- Success messages
- Button labels
- Form labels
- Help text
- Page titles

## Design System Compliance
- Uses existing UI components from `@/components/ui/`
- Matches dark theme with zinc colors
- Consistent with `/inloggen` design
- Uses Lucide icons throughout
- Sonner toast notifications
- Responsive layout for all screen sizes

## Configuration

### Environment Variables
```bash
# Required for email sending
MAILERLITE_API_KEY=your_api_key_here

# Required for reset link URL
NEXTAUTH_URL=https://writgoai.nl
```

### Dependencies
No new dependencies added. Uses existing:
- `@prisma/client` - Database ORM
- `bcryptjs` - Password hashing
- `rate-limiter-flexible` - Rate limiting
- `crypto` (Node.js built-in) - Token generation
- `sonner` - Toast notifications
- `lucide-react` - Icons

## Testing
See `PASSWORD_RESET_TESTING.md` for comprehensive testing guide.

## Deployment Checklist

- [x] Database migration file created
- [x] Prisma client regenerated
- [x] TypeScript compilation successful
- [x] Next.js build successful
- [x] Code review passed
- [x] CodeQL security scan passed (0 vulnerabilities)
- [x] Rate limiter configured
- [x] Email template created
- [x] Frontend pages implemented
- [x] Login page updated
- [x] Documentation created

### Production Deployment Steps

1. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Environment Variables**
   - Ensure `NEXTAUTH_URL` points to production domain
   - Verify `MAILERLITE_API_KEY` is configured

3. **Verification**
   - Test with real email address
   - Verify email delivery
   - Test token expiration
   - Verify rate limiting works

4. **Monitoring**
   - Monitor failed password reset attempts
   - Check rate limiting logs for abuse
   - Monitor email delivery success rate

## Maintenance

### Token Cleanup (Optional)
While tokens are deleted after use and expire automatically, you may want to periodically clean up expired tokens:

```sql
-- Run daily via cron
DELETE FROM "PasswordResetToken" WHERE expires < NOW();
```

### Monitoring Queries
```sql
-- Active tokens
SELECT COUNT(*) FROM "PasswordResetToken" WHERE expires > NOW();

-- Expired but not cleaned up
SELECT COUNT(*) FROM "PasswordResetToken" WHERE expires < NOW();

-- Recent password resets (last 24 hours)
SELECT COUNT(*) FROM "PasswordResetToken" 
WHERE "createdAt" > NOW() - INTERVAL '24 hours';
```

## Performance Considerations

- **Email Sending:** Async, doesn't block response
- **Database Queries:** Indexed for fast lookups
- **Rate Limiting:** In-memory, very fast
- **Token Generation:** < 1ms
- **Password Hashing:** ~100ms (intentionally slow for security)

## Future Enhancements (Optional)

1. **Email Verification:**
   - Add email verification on registration
   - Use same token system

2. **Password Strength:**
   - Add password strength meter
   - Enforce stronger requirements

3. **Two-Factor Authentication:**
   - Add 2FA as additional security layer
   - Backup codes for account recovery

4. **Audit Log:**
   - Log all password reset attempts
   - Track IP addresses for security

5. **Custom Rate Limits:**
   - Per-IP rate limiting in addition to per-email
   - Configurable limits per user role

## Support

For issues or questions:
- Check `PASSWORD_RESET_TESTING.md` for testing scenarios
- Review logs for error details
- Verify environment variables are set correctly
- Ensure database migration was applied

## License
Part of the WritGo AI platform. All rights reserved.
