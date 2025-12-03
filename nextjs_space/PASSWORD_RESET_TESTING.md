# Password Reset Feature - Testing Guide

## Overview
This document describes how to test the password reset feature end-to-end.

## Prerequisites
- Database migration applied: `20251203184203_add_password_reset_token`
- Email service configured (MailerLite)
- NEXTAUTH_URL environment variable set

## Test Scenarios

### 1. Successful Password Reset Flow

**Steps:**
1. Navigate to `/inloggen`
2. Click "Wachtwoord vergeten?" link
3. Enter a valid email address that exists in the database
4. Click "Verstuur reset link"
5. Check email inbox for reset link
6. Click the reset link (opens `/wachtwoord-resetten?token=...`)
7. Enter new password (min 6 characters)
8. Confirm password (must match)
9. Click "Wachtwoord wijzigen"
10. Verify redirect to login page
11. Login with new password

**Expected Results:**
- User receives email within minutes
- Reset link is valid and loads the reset page
- Password is successfully updated
- Old password no longer works
- New password allows login

### 2. Rate Limiting Test

**Steps:**
1. Navigate to `/wachtwoord-vergeten`
2. Submit the same email address 4 times within an hour
3. Observe the response on the 4th attempt

**Expected Results:**
- First 3 attempts: Success message shown
- 4th attempt: Still shows success message (to prevent email enumeration)
- No email sent on 4th attempt
- Rate limit resets after 1 hour

### 3. Token Expiration Test

**Steps:**
1. Request a password reset
2. Wait more than 1 hour
3. Try to use the expired token

**Expected Results:**
- Error message: "Deze reset link is verlopen. Vraag een nieuwe aan."
- Token is deleted from database
- User must request a new reset link

### 4. Invalid Token Test

**Steps:**
1. Navigate to `/wachtwoord-resetten?token=invalid-token-12345`
2. Try to submit a new password

**Expected Results:**
- Error message: "Ongeldige of verlopen reset link. Vraag een nieuwe aan."
- Option to request new reset link shown

### 5. Email Enumeration Protection

**Steps:**
1. Navigate to `/wachtwoord-vergeten`
2. Enter an email that does NOT exist in the database
3. Submit the form

**Expected Results:**
- Same success message as valid emails
- No email is actually sent
- Cannot determine if email exists in system

### 6. Password Validation

**Steps:**
1. Request password reset with valid email
2. Click reset link
3. Try to set password with less than 6 characters
4. Try to set mismatched passwords

**Expected Results:**
- Error: "Wachtwoord moet minimaal 6 tekens bevatten"
- Error: "Wachtwoorden komen niet overeen"
- Form does not submit until validation passes

### 7. Single-Use Token Test

**Steps:**
1. Request password reset
2. Use the reset link to change password
3. Try to use the same reset link again

**Expected Results:**
- First use: Password changed successfully
- Second use: "Ongeldige of verlopen reset link" error
- Token is deleted after first successful use

## API Testing

### Forgot Password Endpoint
```bash
curl -X POST http://localhost:3000/api/client-auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een e-mail met instructies."
}
```

### Reset Password Endpoint
```bash
curl -X POST http://localhost:3000/api/client-auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123...",
    "password": "newpassword123"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Je wachtwoord is succesvol gewijzigd. Je kunt nu inloggen met je nieuwe wachtwoord."
}
```

**Expected Response (Invalid Token):**
```json
{
  "error": "Ongeldige of verlopen reset link. Vraag een nieuwe aan."
}
```

## Database Verification

### Check Token Creation
```sql
SELECT * FROM "PasswordResetToken" WHERE email = 'test@example.com';
```

### Check Token Expiration
```sql
SELECT id, email, expires, expires < NOW() as is_expired 
FROM "PasswordResetToken" 
WHERE email = 'test@example.com';
```

### Verify Token Deletion After Use
```sql
-- Should return 0 rows after successful password reset
SELECT COUNT(*) FROM "PasswordResetToken" WHERE email = 'test@example.com';
```

## Security Checklist

- [x] Tokens are cryptographically secure (32 bytes)
- [x] Tokens expire after 1 hour
- [x] Tokens are single-use (deleted after reset)
- [x] Rate limiting prevents abuse (3 per hour per email)
- [x] Generic error messages prevent email enumeration
- [x] Passwords are hashed with bcrypt (10 rounds)
- [x] No token information in logs
- [x] HTTPS required for production (NEXTAUTH_URL)
- [x] Email contains security warnings

## Troubleshooting

### Email Not Received
- Check email service configuration (MailerLite API key)
- Check spam folder
- Verify email exists in Client or User table
- Check email logs in database

### Token Invalid Immediately
- Verify system clock is correct
- Check token expiration in database
- Ensure token wasn't already used

### Rate Limiting Too Strict
- Wait 1 hour for limit to reset
- Check rate limiter configuration in `lib/rate-limiter.ts`

## Production Deployment Notes

1. Ensure `NEXTAUTH_URL` is set to production domain
2. Verify email service is configured and working
3. Test with real email addresses
4. Monitor rate limiting logs for abuse
5. Set up alerts for failed password reset attempts
6. Regular cleanup of expired tokens (optional cron job)

## Cleanup Script (Optional)

To remove expired tokens from database:
```sql
DELETE FROM "PasswordResetToken" WHERE expires < NOW();
```

Consider adding this as a daily cron job if needed.
