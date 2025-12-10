# Content Hub UI Preview - What You'll See

## Project Selector Dropdown - Before Fix

```
┌─────────────────────────────────────────────┐
│ Selecteer een project                    ▼ │
└─────────────────────────────────────────────┘
        ↓ Click to open
┌─────────────────────────────────────────────┐
│ 🌍  Writgo.nl (standaard)                   │
├─────────────────────────────────────────────┤
│ 📁  Admin Blog Project         [WP]         │
├─────────────────────────────────────────────┤
│ 📁  Test Project                [WP]         │
└─────────────────────────────────────────────┘

❌ computerstartgids.nl NOT visible
```

## Project Selector Dropdown - After Fix

```
┌─────────────────────────────────────────────┐
│ Selecteer een project                    ▼ │
└─────────────────────────────────────────────┘
        ↓ Click to open
┌─────────────────────────────────────────────┐
│ 🌍  Writgo.nl (standaard)                   │
├─────────────────────────────────────────────┤
│ 📁  Admin Blog Project         [WP]         │
├─────────────────────────────────────────────┤
│ 📁  Test Project                [WP]         │
├─────────────────────────────────────────────┤
│ 📁  computerstartgids.nl    [WP] [Client] ← NEW!
│     └─ Client Name                          │
├─────────────────────────────────────────────┤
│ 📁  another-client-site.nl  [WP] [Client]   │
│     └─ Another Client                       │
└─────────────────────────────────────────────┘

✅ computerstartgids.nl NOW visible with Client badge
```

## Detailed View

### Admin Project Entry
```
┌─────────────────────────────────────────────┐
│ 📁  Admin Blog Project         [WP]         │
│                                             │
│ • No extra badges (default admin project)   │
│ • Shows WP badge if WordPress configured    │
└─────────────────────────────────────────────┘
```

### Client Project Entry (NEW!)
```
┌─────────────────────────────────────────────┐
│ 📁  computerstartgids.nl    [WP] [Client]   │
│     └─ John Doe (client name)               │
│                                             │
│ • WP badge: Has WordPress configured        │
│ • Client badge: Owned by a client           │
│ • Client name: Shows who owns it            │
└─────────────────────────────────────────────┘
```

## Badge Legend

| Badge | Meaning | Color |
|-------|---------|-------|
| [WP] | WordPress configured | Gray outline |
| [Client] | Client-owned project | Orange/secondary |

## Complete Content Hub View

```
┌───────────────────────────────────────────────────────────────┐
│  ✨ Writgo.nl Blog Content Hub                                │
│                                                               │
│  Beheer en genereer content voor de Writgo.nl blog           │
│                                                               │
│  [Publiceer Alle Concepten] [+ Nieuw Artikel Genereren]      │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  📁 Project selecteren:                                       │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Selecteer een project                            ▼ │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  💡 Content wordt gegenereerd voor het geselecteerde         │
│     project en kan automatisch naar WordPress worden          │
│     gepubliceerd                                              │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  🌍  https://writgo.nl/blog                   [Verversen]     │
│                                                               │
│  Writgo.nl Blog Management                                    │
│                                                               │
│  ┌──────────┬──────────────┬──────────┬──────────────┐      │
│  │ Totaal   │ Gepubliceerd │ Concept  │ Gepland      │      │
│  │   12     │      8       │    3     │     1        │      │
│  │ artikelen│  artikelen   │ artikelen│   artikelen  │      │
│  └──────────┴──────────────┴──────────┴──────────────┘      │
└───────────────────────────────────────────────────────────────┘
```

## When computerstartgids.nl is Selected

```
┌───────────────────────────────────────────────────────────────┐
│  ✨ Writgo.nl Blog Content Hub                                │
│                                                               │
│  Beheer en genereer content voor de Writgo.nl blog           │
│                                                               │
│  [Publiceer Alle Concepten] [+ Nieuw Artikel Genereren]      │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  📁 Project selecteren:                                       │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📁 computerstartgids.nl [WP] [Client]            ▼ │ ← Selected!
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  💡 Content wordt gegenereerd voor het geselecteerde         │
│     project en kan automatisch naar WordPress worden          │
│     gepubliceerd                                              │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  🌍  https://computerstartgids.nl            [Verversen]      │
│                                                               │
│  Client Project: John Doe                                     │
│                                                               │
│  (Stats for this project would be shown here)                │
└───────────────────────────────────────────────────────────────┘
```

## User Journey - Step by Step

### Step 1: Admin Opens Content Hub
```
Admin → Dashboard → Agency → Content Hub
```

### Step 2: Click Project Selector
```
Click dropdown to open list of projects
```

### Step 3: See All Projects (Including Client Projects!)
```
✅ Admin projects (as before)
✅ Client projects with WordPress (NEW!)
   - computerstartgids.nl appears!
   - Shows [Client] badge
   - Shows client name underneath
```

### Step 4: Select computerstartgids.nl
```
Click on computerstartgids.nl
Dropdown closes
Project selected
```

### Step 5: Use Content Hub Features
```
Now all Content Hub features work with computerstartgids.nl:
• Generate new articles
• Publish to WordPress
• Manage content
• View statistics
```

## Key Visual Changes

### 1. Client Badge
- **Color**: Orange/secondary theme color
- **Position**: After WP badge, before client name
- **Text**: "Client"
- **Purpose**: Immediately identifies client-owned projects

### 2. Client Name Display
- **Position**: Below project name, indented
- **Style**: Smaller text, muted color
- **Format**: "└─ [Client Name]"
- **Purpose**: Shows project ownership

### 3. Project List Structure
```
Main Row:
┌──────────────────────────────────────────┐
│ 📁 Project Name  [Badge1] [Badge2]       │  ← Main info
│    └─ Additional Info                    │  ← Secondary info
└──────────────────────────────────────────┘
```

## Responsive Behavior

### Desktop View
- Full project names visible
- Badges displayed inline
- Client names shown on second line

### Mobile View
- Project names may truncate
- Badges remain visible
- Client names wrap to new line

## Color Scheme

```
┌─────────────────────────────────────────┐
│ Background: Dark (zinc-900)             │
│ Text: White                             │
│ WP Badge: Gray outline                  │
│ Client Badge: Orange (theme color)      │
│ Client Name: Muted gray (muted-foreground)
└─────────────────────────────────────────┘
```

## Accessibility

- All badges have proper contrast ratios
- Screen readers announce project type
- Keyboard navigation works as expected
- Focus indicators remain visible

## What This Means for the User

**Before:**
- ❌ Could not find computerstartgids.nl in Content Hub
- ❌ Could not generate content for client projects
- ❌ Forced to use separate tools for client projects

**After:**
- ✅ computerstartgids.nl appears in dropdown
- ✅ Can select and work with client projects
- ✅ Unified workflow for all WordPress projects
- ✅ Clear identification of project ownership
- ✅ One-click access to client project content management

## Example Scenarios

### Scenario 1: Admin Managing Multiple Client Sites
```
Morning: Generate content for computerstartgids.nl
  └─ Select project → Generate articles → Publish

Afternoon: Generate content for another-client.nl
  └─ Select project → Generate articles → Publish

Evening: Update Writgo.nl blog
  └─ Select Writgo.nl (standaard) → Generate articles → Publish
```

### Scenario 2: Finding a Specific Client Project
```
Open Content Hub
  ↓
Click project dropdown
  ↓
Scroll through list
  ↓
Look for [Client] badge
  ↓
Read client name to confirm
  ↓
Select project
```

### Scenario 3: Distinguishing Admin vs Client Projects
```
Admin projects: No special badge
  → These are agency-managed

Client projects: [Client] badge + client name
  → These belong to specific clients
  → Handle with appropriate care
  → May have different requirements
```

## Important Notes

1. **Only WordPress-Enabled Projects Show**
   - Client projects without WordPress configured won't appear
   - This keeps the list relevant to Content Hub's purpose

2. **Admin Access Only**
   - Only users with admin role can see this view
   - Clients see their own projects in their portal

3. **Real-Time Updates**
   - Projects update immediately after changes
   - No cache issues with project list

4. **No Breaking Changes**
   - Existing admin projects work exactly as before
   - Just adds client projects to the mix
