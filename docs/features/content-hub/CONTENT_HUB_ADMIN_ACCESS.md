# Content Hub Admin Access Fix

## Problem
Admin users were unable to see projects in the Content Hub (`/dashboard/content-hub`) page. The issue was that admins have 13 active projects, but the Content Hub API returned a 404 error because:

- The API `/api/client/projects` only searched for projects linked to a **Client** record
- Admins have a **User** record with `role: 'admin'`, not a **Client** record
- This caused the API to return "Client niet gevonden" (Client not found) error

## Solution Implemented

### Changes Made to `/nextjs_space/app/api/client/projects/route.ts`

1. **Added Admin Check**: Before looking for a Client record, the API now checks if the logged-in user exists in the User table with `role: 'admin'`

2. **Admin Path**: If the user is an admin:
   - Fetches ALL projects from the database using `prisma.project.findMany()`
   - Includes client information (name and email) for each project
   - Returns projects with counts for saved content and knowledge base items
   - Returns `isAdmin: true` in the response

3. **Client Path**: If the user is not an admin (regular client):
   - Maintains the existing behavior
   - Returns only their own projects and projects where they are a collaborator
   - Returns `isAdmin: false` in the response

### Response Structure

#### For Admin Users:
```json
{
  "projects": [
    {
      "id": "...",
      "name": "...",
      "websiteUrl": "...",
      "clientName": "Client Name",
      "clientEmail": "client@example.com",
      "knowledgeBaseCount": 5,
      "savedContentCount": 10,
      "isOwner": false,
      "isCollaborator": false,
      ...
    }
  ],
  "ownedCount": 0,
  "collaboratorCount": 0,
  "isAdmin": true
}
```

#### For Client Users (unchanged):
```json
{
  "projects": [...],
  "ownedCount": 5,
  "collaboratorCount": 2,
  "isAdmin": false
}
```

## Acceptance Criteria Met

✅ Admin users can now see all projects in the Content Hub  
✅ Client users still see only their own projects (existing functionality preserved)  
✅ No breaking changes for other parts of the application using this API  
✅ Security: CodeQL scan found no vulnerabilities  
✅ Build: Project builds successfully with the changes  

## Technical Details

- **File Modified**: `nextjs_space/app/api/client/projects/route.ts`
- **Database Tables Used**: 
  - `User` table (for admin check via `role` field)
  - `Client` table (for regular client users)
  - `Project` table (for fetching all projects)
  - `ProjectCollaborator` table (for collaborator projects)
- **Authentication**: Uses `getServerSession(authOptions)` from NextAuth
- **Database Access**: Uses Prisma client via `@/lib/db`

## Backward Compatibility

The changes are fully backward compatible:
- The response structure includes all existing fields
- Client users experience no change in behavior
- The optional `isAdmin` field allows frontend code to conditionally handle admin views if needed
- All existing code consuming this API continues to work without modification
