# Content Hub Architecture - Before and After

## Before the Fix

```
┌─────────────────────────────────────────────────────────────┐
│                     Content Hub UI                          │
│              /dashboard/agency/content-hub                  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ GET /api/admin/projects
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               API: /api/admin/projects                      │
│                                                             │
│   ┌─────────────────────────────────────────────┐          │
│   │  ONLY queries AdminProject table            │          │
│   │                                             │          │
│   │  const projects = await prisma.adminProject │          │
│   │    .findMany({ ... })                       │          │
│   └─────────────────────────────────────────────┘          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │  AdminProject │  ← Only these projects visible
                  │     Table     │
                  └───────────────┘

        ┌───────────────┐
        │   Project     │  ← Client projects NOT visible
        │     Table     │     (including computerstartgids.nl)
        └───────────────┘
```

**Problem:** Client projects with WordPress (like computerstartgids.nl) exist in the `Project` table but are not accessible in Content Hub.

---

## After the Fix

```
┌─────────────────────────────────────────────────────────────┐
│                     Content Hub UI                          │
│              /dashboard/agency/content-hub                  │
│                                                             │
│   Project Dropdown now shows:                              │
│   ┌─────────────────────────────────────────────┐          │
│   │ ○ Writgo.nl (standaard)                     │          │
│   │ ○ Admin Project 1         [WP]              │          │
│   │ ○ Admin Project 2         [WP]              │          │
│   │ ○ computerstartgids.nl    [WP] [Client] ← NEW!        │
│   │   └─ Client Name                            │          │
│   │ ○ Another Client Project  [WP] [Client]     │          │
│   │   └─ Another Client                         │          │
│   └─────────────────────────────────────────────┘          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ GET /api/admin/projects
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               API: /api/admin/projects                      │
│                                                             │
│   ┌─────────────────────────────────────────────┐          │
│   │  Queries BOTH tables:                       │          │
│   │                                             │          │
│   │  1. AdminProject.findMany()                 │          │
│   │     → projectType: 'admin'                  │          │
│   │                                             │          │
│   │  2. Project.findMany({                      │          │
│   │      where: {                               │          │
│   │        wordpressUrl: { not: null }          │          │
│   │      }                                      │          │
│   │    })                                       │          │
│   │     → projectType: 'client'                 │          │
│   │     → includes clientName, clientEmail      │          │
│   │                                             │          │
│   │  3. Combine both lists                      │          │
│   └─────────────────────────────────────────────┘          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
        ┌───────────────────────────────────────┐
        │                                       │
        │  ┌───────────────┐                   │
        │  │  AdminProject │  ← Still included │
        │  │     Table     │                   │
        │  └───────────────┘                   │
        │                                       │
        │  ┌───────────────┐                   │
        │  │   Project     │  ← NOW included   │
        │  │     Table     │     (with WP)     │
        │  │  (WordPress)  │                   │
        │  └───────────────┘                   │
        │                                       │
        └───────────────────────────────────────┘
```

**Solution:** Content Hub now shows projects from both tables, making client projects with WordPress visible.

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Admin User                               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ 1. Opens Content Hub
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Content Hub Component                         │
│                                                                 │
│  useEffect(() => {                                              │
│    loadProjects(); // Calls API                                 │
│  })                                                             │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ 2. GET /api/admin/projects
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Route Handler                          │
│                                                                 │
│  1. Check authentication                                        │
│  2. Verify admin role                                           │
│  3. Query AdminProject table ─────────┐                         │
│  4. Query Project table (with WP) ────┤                         │
│  5. Transform & combine results       │                         │
│  6. Return unified response           │                         │
└───────────────────────────┬───────────┼─────────────────────────┘
                            │           │
                            │           │ 3. Database queries
                            │           │
                            ▼           ▼
┌──────────────────┐     ┌──────────────────────┐
│  AdminProject    │     │      Project         │
│                  │     │                      │
│  - id            │     │  - id                │
│  - name          │     │  - name              │
│  - wordpressUrl  │     │  - wordpressUrl ✓    │
│  - ...           │     │  - clientId          │
│                  │     │  - ...               │
│  [Admin Only]    │     │  [Clients' Projects] │
└──────────────────┘     └──────────────────────┘
                            │
                            │ 4. Returns combined data
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Response                               │
│                                                                 │
│  {                                                              │
│    "projects": [                                                │
│      {                                                          │
│        "id": "...",                                             │
│        "name": "Admin Project",                                 │
│        "projectType": "admin",     ← Identifies source          │
│        ...                                                      │
│      },                                                         │
│      {                                                          │
│        "id": "...",                                             │
│        "name": "computerstartgids.nl",                          │
│        "projectType": "client",    ← Identifies source          │
│        "clientName": "John Doe",   ← Client info                │
│        "clientEmail": "john@...",                               │
│        ...                                                      │
│      }                                                          │
│    ],                                                           │
│    "count": 5,                                                  │
│    "adminCount": 2,                                             │
│    "clientCount": 3                                             │
│  }                                                              │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ 5. Updates UI state
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Content Hub UI                                │
│                                                                 │
│  projects.map((project) => (                                    │
│    <SelectItem key={project.id} value={project.id}>            │
│      <div className="flex items-center gap-2">                 │
│        {project.name}                                           │
│        {project.wordpressUrl && <Badge>WP</Badge>}              │
│        {project.projectType === 'client' &&                     │
│          <Badge>Client</Badge>}        ← Visual indicator       │
│      </div>                                                     │
│      {project.clientName &&                                     │
│        <span>{project.clientName}</span>} ← Shows client        │
│    </SelectItem>                                                │
│  ))                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Type Identification

### Admin Projects
- **Source Table**: `AdminProject`
- **Purpose**: Agency-managed blog content (e.g., Writgo.nl blog)
- **Indicator**: `projectType: 'admin'`
- **Badge**: No special badge (default)
- **Access**: Created and managed by admins

### Client Projects  
- **Source Table**: `Project`
- **Filter**: `wordpressUrl IS NOT NULL AND wordpressUrl != ''`
- **Purpose**: Client-owned websites with WordPress integration
- **Indicator**: `projectType: 'client'`
- **Badge**: "Client" badge in orange
- **Additional Info**: Shows client name and email
- **Access**: Created by clients, visible to admins in Content Hub

---

## Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     Request Flow                                │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Authentication │
                    │      Check       │
                    └─────────┬────────┘
                              │
                              │ Is user authenticated?
                              │
                    ┌─────────▼─────────┐
                    │    Yes  │   No    │
                    │         │         │
            ┌───────▼─────┐   │   ┌────▼────┐
            │ Check Role  │   │   │  401    │
            │             │   │   │ Reject  │
            └──────┬──────┘   │   └─────────┘
                   │          │
                   │          │
        Is user admin?        │
                   │          │
        ┌──────────▼──────────▼──────┐
        │                            │
    ┌───▼───┐                  ┌─────▼────┐
    │  Yes  │                  │    No    │
    │       │                  │          │
┌───▼───────▼───┐          ┌───▼──────────▼───┐
│  Return both  │          │       403        │
│  Admin &      │          │   Unauthorized   │
│  Client       │          │                  │
│  projects     │          └──────────────────┘
│  with WP      │
└───────────────┘

Admin projects: Full access
Client projects: Only those with WordPress configured
WordPress credentials: Encrypted in database, included in response for admins
Client data: Only name and email exposed (non-sensitive)
```

---

## Key Design Decisions

### 1. Filter Client Projects by WordPress URL
**Why?** Content Hub is specifically for managing WordPress content. Only showing client projects with WordPress configured keeps the list relevant.

```typescript
where: {
  AND: [
    { wordpressUrl: { not: null } },
    { wordpressUrl: { not: '' } }
  ]
}
```

### 2. Add `projectType` Field
**Why?** Allows UI to distinguish between admin and client projects for proper display and handling.

```typescript
projectType: 'admin' | 'client'
```

### 3. Include Client Information
**Why?** Helps admins identify which client owns each project for better tracking and management.

```typescript
clientName: project.client?.name
clientEmail: project.client?.email
```

### 4. Maintain Backward Compatibility
**Why?** Ensures existing consumers of the API continue to work without changes.

- All existing fields remain in the same format
- New fields are optional and additive
- No breaking changes to response structure

---

## Testing Strategy

### Unit Tests (Conceptual)
```typescript
describe('GET /api/admin/projects', () => {
  it('should return admin projects', async () => {
    // Test admin project retrieval
  });

  it('should return client projects with WordPress', async () => {
    // Test client project retrieval with filter
  });

  it('should exclude client projects without WordPress', async () => {
    // Test filtering logic
  });

  it('should include client information for client projects', async () => {
    // Test client data inclusion
  });

  it('should require admin authentication', async () => {
    // Test auth requirements
  });
});
```

### Integration Test Script
See `test_content_hub_projects.mjs` for database-level verification.

### Manual Testing Checklist
- [ ] Admin can see admin projects
- [ ] Admin can see client projects with WordPress
- [ ] Client badge appears on client projects
- [ ] Client name appears under client projects
- [ ] Selecting a client project works correctly
- [ ] Content generation works with client projects
- [ ] WordPress publishing works with client projects (if applicable)
