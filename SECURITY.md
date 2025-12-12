# Security Documentation

This document outlines the security measures implemented in the WritgoAI database and provides guidelines for maintaining security best practices.

## Table of Contents
- [Row-Level Security (RLS) Policies](#row-level-security-rls-policies)
- [Database Function Security](#database-function-security)
- [Password Security](#password-security)
- [Security Audit Compliance](#security-audit-compliance)

---

## Row-Level Security (RLS) Policies

Row-Level Security (RLS) is enabled on all public tables to ensure that users can only access data they are authorized to view or modify.

### User Table

**RLS Status:** ✅ Enabled

**Policies:**
- **Admins can manage all users** (ALL operations)
  - Applies to: Users with role `admin` or `superadmin`
  - Permissions: Full CRUD access to all user records
  
- **Users can view own profile** (SELECT)
  - Applies to: Any authenticated user
  - Permissions: Can view their own user record only
  
- **Users can update own profile** (UPDATE)
  - Applies to: Any authenticated user
  - Permissions: Can update their own user record only

**Security Notes:**
- Users cannot create new user accounts through the API (only admins)
- Users cannot delete their own accounts
- Password changes should be handled through Supabase Auth, not direct table updates

### Client Table

**RLS Status:** ✅ Enabled

**Policies:**
- **Admins can manage all clients** (ALL operations)
  - Applies to: Users with role `admin` or `superadmin` in the User table
  - Permissions: Full CRUD access to all client records
  
- **Clients can view their own data** (SELECT)
  - Applies to: Authenticated clients
  - Permissions: Can view their own client record (where `id = auth.uid()`)
  
- **Clients can update their own data** (UPDATE)
  - Applies to: Authenticated clients
  - Permissions: Can update their own client record

**Security Notes:**
- Client registration should use Supabase Auth
- Sensitive fields (e.g., API keys, tokens) should be handled with additional care
- WordPress and social media credentials are stored encrypted when possible

### BrandSettings Table

**RLS Status:** ✅ Enabled

**Policies:**
- **Public read access for brand settings** (SELECT)
  - Applies to: Everyone (authenticated and anonymous users)
  - Permissions: Read-only access to branding information
  - Rationale: Branding information needs to be publicly visible for the application UI
  
- **Admin update access for brand settings** (UPDATE)
  - Applies to: Users with role `admin` or `superadmin`
  - Permissions: Can update branding settings
  
- **Admin insert access for brand settings** (INSERT)
  - Applies to: Users with role `admin` or `superadmin`
  - Permissions: Can create new branding configurations

**Security Notes:**
- Only one default branding configuration exists (id = 'default')
- Public read access is intentional for displaying brand context across the application
- All modifications are restricted to admins only

### Project Table

**RLS Status:** ✅ Enabled

**Policies:**
- **Admins can manage all projects** (ALL operations)
  - Applies to: Users with role `admin` or `superadmin`
  - Permissions: Full CRUD access to all projects
  
- **Clients can view their own projects** (SELECT)
  - Applies to: Authenticated clients
  - Permissions: Can view projects where `clientId` matches their user ID
  
- **Clients can update their own projects** (UPDATE)
  - Applies to: Authenticated clients
  - Permissions: Can update projects where `clientId` matches their user ID

**Security Notes:**
- Projects are always linked to a client via the `clientId` foreign key
- WordPress credentials stored in projects should be encrypted
- Autopilot settings are client-specific and cannot be accessed by other clients

---

## Database Function Security

All database functions have been secured with immutable search paths to prevent SQL injection and search path manipulation attacks.

### Functions with Fixed Search Paths

| Function Name | Purpose | Search Path |
|---------------|---------|-------------|
| `update_updated_at_column()` | Auto-update `updatedAt` timestamps | `public` |
| `update_social_strategy_timestamp()` | Update `SocialMediaStrategy.updatedAt` | `public` |
| `update_autopilot_timestamp()` | Update `AutopilotConfig.updatedAt` | `public` |

**Implementation:**
```sql
ALTER FUNCTION "public"."function_name"() SET search_path = 'public';
```

**Security Benefit:**
- Prevents attackers from manipulating the search path to execute malicious code
- Ensures functions always reference the correct schema
- Complies with Supabase database linter recommendations

---

## Password Security

### Supabase Auth Configuration

WritgoAI uses Supabase Auth for authentication, which provides industry-standard security features.

#### Leaked Password Protection (HaveIBeenPwned Integration)

**Status:** ⚠️ Requires Manual Configuration

**How to Enable:**

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to your project
3. Go to **Authentication** → **Settings** (or **Policies**)
4. Find the **Password Security** section
5. Enable **"Leaked Password Protection"**
   - This feature checks user passwords against the HaveIBeenPwned database
   - Prevents users from using passwords that have been exposed in data breaches
6. Save the changes

**Recommended Settings:**
- ✅ Enable Leaked Password Protection
- ✅ Minimum password length: 8 characters (Supabase default)
- ✅ Require strong passwords (mix of uppercase, lowercase, numbers)

**Additional Security Recommendations:**
- Enable Multi-Factor Authentication (MFA) for admin accounts
- Set up email verification for all new accounts
- Implement password reset flows using Supabase Auth
- Use JWT tokens with appropriate expiration times
- Regularly rotate API keys and service role keys

---

## Security Audit Compliance

This section documents compliance with Supabase database linter security checks.

### ✅ Resolved Issues

| Issue ID | Severity | Description | Resolution |
|----------|----------|-------------|------------|
| 0013 | ERROR | RLS disabled on `User` table | RLS enabled with appropriate policies |
| 0013 | ERROR | RLS disabled on `BrandSettings` table | RLS was already enabled in previous migration |
| 0013 | ERROR | RLS disabled on `Client` table | RLS was already enabled in previous migration |
| 0011 | WARNING | Mutable search path on `update_updated_at_column()` | Search path set to `public` |
| 0011 | WARNING | Mutable search path on `update_social_strategy_timestamp()` | Search path set to `public` |
| 0011 | WARNING | Mutable search path on `update_autopilot_timestamp()` | Search path set to `public` |

### ⚠️ Manual Configuration Required

| Issue | Severity | Action Required |
|-------|----------|-----------------|
| Leaked Password Protection | WARNING | Enable in Supabase Dashboard (see instructions above) |

### ❌ Not Found in Codebase

The following items mentioned in the original audit were not found in the database schema:

- `package_limits` view - No such view exists in the current schema
- `reset_monthly_post_counts()` function - No such function exists

If these items are required, they should be created with proper security measures from the start.

---

## Maintenance and Monitoring

### Regular Security Checks

1. **Run Supabase Database Linter** regularly:
   ```bash
   # From Supabase Dashboard → Database → Linter
   # Or use Supabase CLI
   supabase db lint
   ```

2. **Review RLS Policies** when adding new tables:
   - Always enable RLS on new public tables
   - Create appropriate policies for user access
   - Test policies with different user roles

3. **Audit Function Security**:
   - New functions should have `SET search_path = 'public'`
   - Functions with SECURITY DEFINER should be carefully reviewed
   - Avoid dynamic SQL in functions when possible

4. **Monitor Authentication Events**:
   - Review failed login attempts
   - Check for unusual access patterns
   - Monitor password reset requests

### Emergency Response

If a security vulnerability is discovered:

1. **Immediate Action**: Disable affected endpoints or features
2. **Assessment**: Determine scope and impact
3. **Remediation**: Apply security patches via migration
4. **Testing**: Verify the fix in a staging environment
5. **Deployment**: Apply to production
6. **Documentation**: Update this document with lessons learned

---

## Contact

For security concerns or to report vulnerabilities, please contact:
- Email: info@writgo.nl (recommended)
- GitHub Security Advisory: Use "Security" tab in the repository

**Do not** disclose security vulnerabilities in public issues or pull requests.

---

## References

- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/security.html)
- [OWASP Database Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)
