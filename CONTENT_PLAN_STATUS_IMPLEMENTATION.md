# Content Plan Status System Implementation

## Overview

This document describes the implementation of a status tracking system for the content plan feature in Writgoai.nl. The system allows users to track the progress of their content articles through different stages: todo, in progress, review, published, and update needed.

## Features Implemented

### 1. Database Schema

**File**: `supabase_content_plan_status_migration.sql`

- Added `status` column to `content_plans` table for overall plan status
- Individual article status stored in the `plan` JSONB field
- Created indexes for better query performance
- Added trigger for automatic `updated_at` timestamp

**Status Values for Individual Articles**:
- `todo` - Article not started yet (default)
- `in_progress` - Article is being written
- `review` - Article ready for review
- `published` - Article published to WordPress
- `update_needed` - Article needs to be updated

### 2. Type Definitions

**File**: `app/dashboard/content-plan/page.tsx`

Updated `ContentIdea` interface:
```typescript
interface ContentIdea {
  title: string;
  category: string;
  description: string;
  keywords: string[];
  contentType: string;
  cluster: string;
  priority: string;
  difficulty?: string;
  searchIntent?: string;
  searchVolume?: number | null;
  competition?: string | null;
  status?: 'todo' | 'in_progress' | 'review' | 'published' | 'update_needed';
}
```

### 3. UI Components

#### Status Badges

Each article displays a status badge with:
- Icon (📝, 🔄, 👀, ✅, 🔁)
- Color-coded background based on status
- Label in Dutch

**Badge Styling**:
- `todo`: Gray background (`bg-gray-800 text-gray-300`)
- `in_progress`: Blue background (`bg-blue-900/50 text-blue-300`)
- `review`: Yellow background (`bg-yellow-900/50 text-yellow-300`)
- `published`: Green background (`bg-green-900/50 text-green-300`)
- `update_needed`: Orange background (`bg-orange-900/50 text-orange-300`)

#### Status Filter

Added to the filter bar:
```html
<select name="status">
  <option value="all">Alle Statussen</option>
  <option value="todo">📝 Te doen</option>
  <option value="in_progress">🔄 In progress</option>
  <option value="review">👀 Review</option>
  <option value="published">✅ Gepubliceerd</option>
  <option value="update_needed">🔁 Update nodig</option>
</select>
```

#### Status Dropdown per Article

Each article has a dropdown menu to change its status:
- Positioned between "Schrijven" button and delete button
- Changes are saved immediately to database
- Shows toast notification on successful update

#### Status Statistics

New stats section showing count per status:
- 📝 Te doen
- 🔄 In progress
- 👀 Review
- ✅ Gepubliceerd
- 🔁 Update nodig

### 4. Functionality

#### Automatic Status Updates

**When "Schrijven" button is clicked**:
- Status automatically changes to `in_progress`
- Skips update if already `published`
- Saves to database before navigation

**When article is published** (future enhancement):
- Status should change to `published`
- Requires content plan integration with WordPress publish

#### Manual Status Changes

Users can manually change status via dropdown:
```typescript
const updateArticleStatus = async (
  index: number, 
  newStatus: ContentIdea['status']
) => {
  // Updates local state
  // Saves to database
  // Shows toast notification
}
```

#### Backwards Compatibility

- Existing articles without status automatically get `todo` status
- Applied when loading saved plan
- Applied when completing new plan generation

### 5. API Integration

The existing API routes already support the status field:

**GET `/api/content-plan`**:
- Returns plan with all article statuses from JSONB field

**POST `/api/content-plan`**:
- Saves plan including article statuses in JSONB field

**GET `/api/content-plan/article`**:
- Returns individual article with its status

No API changes were required due to flexible JSONB structure.

## Usage Guide

### For Users

1. **View Status**: Each article shows its current status with a badge
2. **Filter by Status**: Use the status dropdown in the filter bar
3. **Change Status**: Click the status dropdown next to each article
4. **Track Progress**: View status statistics in the overview cards

### For Developers

#### Adding a New Status

1. Update the type definition in `ContentIdea` interface
2. Add badge styling in `getStatusBadgeClass()`
3. Add icon in `getStatusIcon()`
4. Add label in `getStatusLabel()`
5. Update filter dropdown options
6. Update `getStatusStats()` to include new status

#### Integrating Status Updates

To trigger status updates from other parts of the application:

```typescript
// Example: Update status when article is completed
const updateContentPlanStatus = async (
  projectId: string,
  articleIndex: number,
  newStatus: 'published' | 'review' | 'update_needed'
) => {
  // Fetch current plan
  const response = await fetch(`/api/content-plan?project_id=${projectId}`);
  const data = await response.json();
  
  if (data.plan?.plan) {
    // Update specific article
    const updatedPlan = [...data.plan.plan];
    updatedPlan[articleIndex] = {
      ...updatedPlan[articleIndex],
      status: newStatus
    };
    
    // Save back to database
    await fetch('/api/content-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        plan: updatedPlan,
        // ... other fields
      })
    });
  }
};
```

## Database Migration

To apply the migration to your Supabase database:

1. Go to Supabase SQL Editor
2. Copy the contents of `supabase_content_plan_status_migration.sql`
3. Execute the SQL
4. Verify the migration with the included verification queries

## Testing Checklist

- [ ] Status badges display correctly for each status type
- [ ] Status filter filters articles correctly
- [ ] Status dropdown updates article status
- [ ] Toast notification appears on status change
- [ ] Status statistics calculate correctly
- [ ] Backwards compatibility: old articles get 'todo' status
- [ ] Status persists after page reload
- [ ] "Schrijven" button updates status to 'in_progress'
- [ ] Responsive design works on mobile
- [ ] Multiple filters work together (status + cluster + type)

## Future Enhancements

1. **WordPress Integration**: Auto-update status to 'published' when published to WordPress
2. **Bulk Status Updates**: Select multiple articles and update their status at once
3. **Status History**: Track when status was changed and by whom
4. **Notifications**: Alert when articles are in review or need updates
5. **Custom Statuses**: Allow users to define their own custom statuses
6. **Status-based Workflows**: Enforce rules (e.g., must be in review before publishing)

## Files Modified

1. `supabase_content_plan_status_migration.sql` - New migration file
2. `app/dashboard/content-plan/page.tsx` - Main implementation
   - Updated `ContentIdea` interface
   - Added status filter state and logic
   - Added status display helper functions
   - Added status update function
   - Updated UI to show status badges and dropdowns
   - Added status statistics section

## Notes

- Status is stored in the JSONB `plan` field, not as a separate column, for flexibility
- The system uses optimistic updates - UI updates immediately, then saves to database
- Toast notifications use a simple implementation that could be enhanced with a proper toast library
- The status field is optional, ensuring backwards compatibility
