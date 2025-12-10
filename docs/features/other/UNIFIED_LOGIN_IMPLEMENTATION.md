# Unified Login System Implementation

## Overview

This document describes the implementation of a unified login system that allows both **Client** users and **Admin** users (from the User table) to authenticate through the same login endpoint.

## Problem Statement

Previously, the login route at `app/api/client-auth/login/route.ts` only checked the **Client** table. Admin users stored in the **User** table could not log in through the same `/login` page.

## Solution

The login route now checks **both** tables sequentially:

1. **First**, tries to find the user in the **Client** table
2. If not found, **then** tries to find in the **User** table
3. Returns appropriate role in the JWT token:
   - Client table → `role: 'client'` and `userType: 'client'`
   - User table → `role` from the User.role field (e.g., `'admin'`) and `userType: 'user'`

## Files Modified

### 1. `/nextjs_space/app/api/client-auth/login/route.ts`

**Changes:**
- Modified authentication logic to check both Client and User tables
- Added `role` and `userType` fields to JWT token payload
- Enhanced logging to distinguish between client and admin logins
- Maintained all existing security features (rate limiting, validation, password hashing)

**Response Structure for Client:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "userType": "client",
  "role": "client",
  "user": {
    "id": "client_id",
    "email": "client@example.com",
    "name": "Client Name",
    "companyName": "Company Name",
    "automationActive": false
  }
}
```

**Response Structure for Admin:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "userType": "user",
  "role": "admin",
  "user": {
    "id": "user_id",
    "email": "admin@example.com",
    "name": "Admin Name",
    "role": "admin"
  }
}
```

### 2. `/nextjs_space/app/api/client-auth/session/route.ts`

**Changes:**
- Updated to decode and return both `userType` and `role` from JWT
- Handles both `clientId` and `userId` for backwards compatibility
- Fixed JWT secret fallback to match login route for consistency
- Defaults to `'client'` for backwards compatibility with existing tokens

**Response Structure:**
```json
{
  "authenticated": true,
  "userType": "client" | "user",
  "role": "client" | "admin" | string,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "client" | "admin" | string
  }
}
```

## JWT Token Payload

The JWT token now includes the following fields:

**For Clients:**
```javascript
{
  clientId: string,
  email: string,
  role: 'client',
  userType: 'client'
}
```

**For Admins:**
```javascript
{
  userId: string,
  email: string,
  role: string, // e.g., 'admin'
  userType: 'user'
}
```

## Database Schema

### User Table (Admins)
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("admin")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // ... other fields
}
```

### Client Table
```prisma
model Client {
  id                String   @id @default(cuid())
  email             String   @unique
  password          String
  name              String
  companyName       String?
  automationActive  Boolean  @default(false)
  // ... other fields
}
```

## Authentication Flow

```
1. User submits email + password
   ↓
2. Rate limiting check (5 attempts per 15 min)
   ↓
3. Input validation (Zod schema)
   ↓
4. Check Client table by email
   ├─ Found? → Verify password → Generate JWT with role='client'
   └─ Not found? → Continue to step 5
   ↓
5. Check User table by email
   ├─ Found? → Verify password → Generate JWT with role from User.role
   └─ Not found? → Return 401 error
   ↓
6. Return success response with token and user data
```

## Security Features Maintained

✅ **Rate Limiting**: Maximum 5 login attempts per 15 minutes  
✅ **Input Validation**: Zod schema validation for email and password  
✅ **Password Hashing**: bcryptjs with proper salt rounds  
✅ **JWT Tokens**: 7-day expiration with secure signing  
✅ **Logging**: Failed login attempts are logged with IP addresses  
✅ **Error Messages**: Generic error messages to prevent user enumeration

## Testing

### Test Script
Run the test script to verify both user types exist in the database:

```bash
cd nextjs_space
npx tsx scripts/test-unified-login.ts
```

### Seed Test Data
To create test users for both tables:

```bash
cd nextjs_space
npx tsx scripts/seed-simple.ts
```

This creates:
- **Admin User**: `admin@WritgoAI.nl` / `admin123`
- **Test Client**: `test@client.nl` / `test123`

### Manual Testing

**Test Client Login:**
```bash
curl -X POST http://localhost:3000/api/client-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@client.nl", "password": "test123"}'
```

Expected response: `userType: "client"`, `role: "client"`

**Test Admin Login:**
```bash
curl -X POST http://localhost:3000/api/client-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@WritgoAI.nl", "password": "admin123"}'
```

Expected response: `userType: "user"`, `role: "admin"`

## Backwards Compatibility

✅ **Existing Client Tokens**: Continue to work with session route  
✅ **Existing Client Data**: No changes to Client table structure  
✅ **API Response Format**: Extended but backwards compatible  
✅ **Frontend**: Can check `userType` field to determine user type

## Frontend Integration

To distinguish between user types in the frontend:

```typescript
// After successful login
const { token, userType, role, user } = response.data;

if (userType === 'client') {
  // Redirect to client dashboard
  // Access client-specific fields: user.companyName, user.automationActive
  router.push('/client/dashboard');
} else if (userType === 'user') {
  // Redirect to admin dashboard
  // Access admin role: user.role
  router.push('/admin/dashboard');
}
```

## Security Considerations

1. **User Enumeration**: The system maintains generic error messages ("Ongeldige inloggegevens") whether the user doesn't exist or the password is wrong
2. **Timing Attacks**: Both password verifications use bcrypt.compare() with constant-time comparison
3. **JWT Secrets**: Uses environment variables with proper fallback chain
4. **Rate Limiting**: Applied before any database queries to prevent abuse
5. **Password Requirements**: Minimum 6 characters enforced by validation schema

## Code Review Results

✅ No security vulnerabilities detected by CodeQL  
✅ Code review passed with 1 minor fix (JWT secret consistency)  
✅ All existing security features maintained

## Future Enhancements

Potential improvements for consideration:

1. Add role-based access control (RBAC) middleware
2. Implement different token expiration times for different user types
3. Add multi-factor authentication (MFA) support
4. Implement refresh token mechanism
5. Add audit logging for admin actions

## Support

For questions or issues related to this implementation, please refer to:
- This documentation
- Code comments in the modified files
- Test script: `scripts/test-unified-login.ts`
