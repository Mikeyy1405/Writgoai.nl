# Testing Guide: Admin Stats API Migration

## Overview
This guide provides instructions for testing the migrated admin stats API endpoints after deployment.

## Prerequisites
- Deployed application with Supabase environment variables configured
- Admin account with email `info@writgo.nl` or role `admin`/`superadmin`
- Browser developer tools access

## Test 1: Admin Dashboard Page Load

### Steps
1. Navigate to `/admin` in your browser
2. Log in with admin credentials if not already logged in
3. Wait for the page to load completely

### Expected Results
- ✅ Page loads without errors
- ✅ No "Fout bij laden - Failed to fetch stats" error message
- ✅ Dashboard shows statistics cards (even if values are 0)
- ✅ No console errors related to stats API

### What to Check
```javascript
// Open browser console (F12) and check for:
- No errors containing "Failed to fetch stats"
- Successful network request to /api/admin/stats
- Response status: 200 OK
```

## Test 2: API Endpoint - /api/admin/stats

### Manual API Test
```bash
# Using curl (replace with your actual URL and session cookie)
curl -H "Cookie: your-session-cookie" https://your-domain.com/api/admin/stats
```

### Expected Response Structure
```json
{
  "stats": {
    "totalClients": 0,
    "activeSubscriptions": 0,
    "pendingFeedback": 0,
    "unreadMessages": 0,
    "unreadSupport": 0,
    "totalContentGenerated": 0,
    "creditsUsedThisMonth": 0,
    "revenueThisMonth": 0,
    "pendingPayouts": 0,
    "pendingPayoutAmount": 0
  },
  "recentActivities": {
    "recentClients": [],
    "recentFeedback": []
  }
}
```

### What to Verify
- ✅ Status code is 200
- ✅ All numeric fields are present (may be 0)
- ✅ Arrays are present (may be empty)
- ✅ No error messages in response

## Test 3: API Endpoint - /api/superadmin/stats

### Manual API Test
```bash
# Using curl (must be logged in as info@writgo.nl)
curl -H "Cookie: your-session-cookie" https://your-domain.com/api/superadmin/stats
```

### Expected Response Structure
```json
{
  "totalClients": 0,
  "activeClients": 0,
  "credits": {
    "totalPurchased": 0,
    "totalUsed": 0,
    "currentSubscription": 0,
    "currentTopUp": 0
  },
  "subscriptions": [],
  "recentActivity": [],
  "revenue": {
    "total": 0,
    "totalCredits": 0,
    "monthly": []
  }
}
```

### What to Verify
- ✅ Status code is 200
- ✅ All numeric fields are present
- ✅ Credits object has all sub-fields
- ✅ Revenue object has all sub-fields
- ✅ Arrays are present

## Test 4: Browser DevTools Network Tab

### Steps
1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to `/admin` page
4. Look for request to `/api/admin/stats`

### Expected Results
```
Request URL: /api/admin/stats
Status Code: 200 OK
Response Time: < 2 seconds

Response Preview:
{
  stats: { ... },
  recentActivities: { ... }
}
```

### What to Check
- ✅ Request completes successfully
- ✅ Response time is reasonable (< 2-3 seconds)
- ✅ No 500 Internal Server Error
- ✅ No 401 Unauthorized errors

## Test 5: Database Connection

### Using Browser Console
```javascript
// After loading admin page, check:
fetch('/api/admin/stats')
  .then(res => res.json())
  .then(data => console.log('Stats:', data))
  .catch(err => console.error('Error:', err));
```

### Expected Output
```javascript
Stats: {
  stats: {
    totalClients: 5,  // or any number
    activeSubscriptions: 3,  // or any number
    // ... other fields
  },
  recentActivities: { ... }
}
```

## Test 6: Error Handling

### Test Unauthorized Access
1. Log out or use a non-admin account
2. Try accessing `/api/admin/stats` directly
3. Expected: 401 Unauthorized response

### Test with Missing Environment Variables (Dev only)
If testing in development without Supabase configured:
- Expected: Stats with all 0 values (graceful degradation)
- No crashes or unhandled errors

## Common Issues & Solutions

### Issue 1: "Fout bij laden - Failed to fetch stats"
**Cause**: API request failing or timing out
**Check**:
- Verify Supabase environment variables are set correctly:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Check Supabase dashboard for connection issues
- Review server logs for specific errors

### Issue 2: All stats showing 0
**Cause**: Database is empty or tables don't exist yet
**Solution**: This is expected if:
- Fresh deployment
- Database was just migrated
- No clients have been created yet

### Issue 3: 401 Unauthorized
**Cause**: Session expired or user lacks permissions
**Solution**:
- Log in again with admin credentials
- Verify user has `admin` or `superadmin` role
- Check session cookie is being sent

### Issue 4: Slow response time (> 5 seconds)
**Cause**: Database queries taking too long
**Check**:
- Verify Supabase indexes are set up correctly
- Check Supabase dashboard for performance metrics
- Review the number of records in tables

## Success Criteria

All tests pass if:
- ✅ Admin dashboard loads without errors
- ✅ API endpoints return proper JSON structures
- ✅ Status codes are 200 for authorized requests
- ✅ Stats display correctly (even if 0)
- ✅ No console errors
- ✅ Response times are < 2-3 seconds

## Reporting Issues

If tests fail, provide:
1. Browser console errors (screenshots)
2. Network tab request/response (screenshots)
3. Server logs (if accessible)
4. Steps to reproduce
5. Expected vs actual behavior

---
**Document Version**: 1.0  
**Last Updated**: 2025-12-09  
**Migration**: Prisma to Supabase Stats API
