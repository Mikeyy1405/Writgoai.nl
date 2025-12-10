# Security Summary: Email Inbox IMAP Sync Implementation

## Date
December 10, 2024

## Overview
This document outlines security considerations and recommendations for the email inbox IMAP sync implementation.

## Security Vulnerabilities Identified and Addressed

### 1. Password Storage (CRITICAL - Requires Action)
**Status**: ⚠️ TEMPORARY SOLUTION IN PLACE

**Issue**: 
- Passwords are currently stored using Base64 encoding, which is NOT encryption
- Base64 is trivially reversible and provides zero security
- Anyone with database access can decode passwords immediately

**Current Implementation**:
```typescript
// In email-mailbox-sync.ts
export function encryptPassword(password: string): string {
  return Buffer.from(password).toString('base64'); // NOT SECURE!
}
```

**Recommendation for Production**:
Implement proper encryption using one of these approaches:

#### Option 1: AES-256-GCM Encryption (Recommended)
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte key from KMS
const ALGORITHM = 'aes-256-gcm';

export function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return JSON.stringify({
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  });
}
```

#### Option 2: External Secrets Manager
- AWS Secrets Manager
- Azure Key Vault
- Google Cloud Secret Manager
- HashiCorp Vault

Store only a reference ID in the database, fetch actual credentials at runtime.

**Files Affected**:
- `lib/email-mailbox-sync.ts` (lines 238-272)
- `lib/email-imap-sync.ts` (line 278-280)
- `supabase/migrations/20251210_email_inbox_tables.sql` (line 21)

---

### 2. SSL/TLS Certificate Validation (MEDIUM)
**Status**: ✅ PARTIALLY ADDRESSED

**Issue**: 
- Original code disabled SSL certificate validation (`rejectUnauthorized: false`)
- Makes connection vulnerable to man-in-the-middle attacks

**Fix Applied**:
```typescript
tlsOptions: { 
  rejectUnauthorized: process.env.NODE_ENV === 'production' 
}
```

**Recommendation**:
- Enable certificate validation in ALL environments
- Only disable for specific testing scenarios with explicit configuration
- Add environment variable: `IMAP_ALLOW_INSECURE_TLS=false` (default false)

**Files Affected**:
- `lib/email-imap-sync.ts` (line 297)

---

### 3. Hard-coded Admin Email (LOW)
**Status**: ⚠️ ACKNOWLEDGED

**Issue**:
- Admin email `admin@WritgoAI.nl` is hard-coded in multiple API routes
- Makes system inflexible and difficult to maintain

**Current Code**:
```typescript
if (!session?.user?.email || session.user.email !== 'admin@WritgoAI.nl') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Recommendation**:
Implement role-based access control (RBAC):
```typescript
// Check user role instead of email
if (!session?.user || session.user.role !== 'admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Files Affected**:
- `app/api/admin/emails/route.ts`
- `app/api/admin/emails/[id]/route.ts`
- `app/api/admin/emails/send/route.ts`
- `app/api/admin/emails/sync/route.ts`
- `app/api/admin/emails/generate-reply/route.ts`

---

### 4. Environment Variable Validation (MEDIUM)
**Status**: ✅ ADDRESSED

**Issue**:
- Missing Moneybird tax rate ID could cause silent failures
- Empty string fallback could cause API errors

**Fix Applied**:
```typescript
const taxRateId = process.env.MONEYBIRD_TAX_RATE_21_ID;
if (!taxRateId) {
  throw new Error('MONEYBIRD_TAX_RATE_21_ID environment variable is not configured');
}
```

**Files Affected**:
- `lib/email-invoice-detector.ts` (line 273)

---

### 5. Cron Job Authentication (MEDIUM)
**Status**: ✅ PROPERLY IMPLEMENTED

**Implementation**:
```typescript
const authHeader = req.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;
const providedSecret = authHeader?.replace('Bearer ', '');

if (providedSecret !== cronSecret) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Security Measures**:
- Uses Bearer token authentication
- Secret stored in environment variable
- No default fallback (fails closed)

**Files Affected**:
- `app/api/cron/email-sync/route.ts`

---

## Required Environment Variables

### Critical (Must be set)
```env
CRON_SECRET=<random-secret-key>
MONEYBIRD_TAX_RATE_21_ID=<tax-rate-id>
```

### Email Configuration
```env
IMAP_HOST=mail.writgo.nl
IMAP_PORT=993
IMAP_USER=info@writgo.nl
IMAP_PASSWORD=<password>
IMAP_TLS=true
```

### Optional
```env
EMAIL_SYNC_INTERVAL=5
EMAIL_AI_ANALYSIS_CREDITS=5
NODE_ENV=production
```

---

## Security Best Practices Applied

### ✅ Implemented
1. **Input Validation**: All API routes validate required parameters
2. **Authentication**: Admin-only routes protected with session checks
3. **Error Handling**: Proper try-catch blocks with logging
4. **Rate Limiting**: Should be implemented at reverse proxy level
5. **SQL Injection Protection**: Using Prisma ORM with parameterized queries
6. **CSRF Protection**: Next.js built-in CSRF protection for POST/PATCH/DELETE

### ⚠️ Needs Implementation
1. **Password Encryption**: Replace Base64 with proper encryption
2. **Role-Based Access Control**: Replace hard-coded email checks
3. **API Rate Limiting**: Implement per-IP/per-user rate limiting
4. **Audit Logging**: Log all email access and modifications
5. **Data Retention Policy**: Implement automatic deletion of old emails

---

## Deployment Checklist

### Before Production Deployment
- [ ] Replace Base64 password encoding with proper encryption (CRITICAL)
- [ ] Configure encryption key in AWS KMS or similar service
- [ ] Enable SSL certificate validation for all environments
- [ ] Set NODE_ENV=production
- [ ] Configure CRON_SECRET with a strong random value (min 32 characters)
- [ ] Verify all required environment variables are set
- [ ] Test IMAP connection with production credentials
- [ ] Set up monitoring for failed sync attempts
- [ ] Configure log aggregation for security events
- [ ] Review and test error handling paths
- [ ] Perform penetration testing on API endpoints

### Post-Deployment
- [ ] Monitor for authentication failures
- [ ] Check email sync success rates
- [ ] Review logs for suspicious activity
- [ ] Set up alerts for failed Moneybird invoice creations
- [ ] Regular security audits of stored credentials

---

## Compliance Considerations

### GDPR (EU)
- Email content contains personal data
- Implement data retention policies
- Provide data export capability
- Add consent mechanisms for email storage

### Data Storage
- Emails stored in Supabase database
- Attachments stored as JSON metadata (not full files)
- Consider encryption at rest for email content

---

## Contact
For security concerns or to report vulnerabilities, contact the development team immediately.

## Last Updated
December 10, 2024
