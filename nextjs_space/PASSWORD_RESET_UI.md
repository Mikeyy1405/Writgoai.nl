# Password Reset Feature - UI/UX Documentation

## Design Overview

The password reset flow consists of three main user interfaces, all following the WritGo AI dark theme design system with zinc colors.

## Color Scheme

- **Background:** Black (`bg-black`)
- **Cards:** Zinc-900 (`bg-zinc-900`)
- **Borders:** Zinc-800 (`border-zinc-800`)
- **Text Primary:** White
- **Text Secondary:** Zinc-400 (`text-zinc-400`)
- **Input Background:** Zinc-800 (`bg-zinc-800`)
- **Input Borders:** Zinc-700 (`border-zinc-700`)
- **Accent:** White text on black, with orange decorative blurs

## Page Layouts

### 1. Login Page Update (`/inloggen`)

**Added Element:**
```
┌─────────────────────────────────────┐
│ Wachtwoord           Wachtwoord vergeten? │
│ [Password Input Field              ] │
└─────────────────────────────────────┘
```

**Features:**
- Small link positioned next to "Wachtwoord" label
- Zinc-400 color that transitions to white on hover
- Seamlessly integrated into existing design
- Non-intrusive placement

### 2. Forgot Password Page (`/wachtwoord-vergeten`)

**Initial State:**
```
┌───────────────────────────────────────────┐
│                                           │
│          [WritGo Media Logo]              │
│                                           │
│     ┌─────────────────────────────┐       │
│     │  Wachtwoord vergeten?      │       │
│     │  Geen probleem! We sturen  │       │
│     │  je een reset link.        │       │
│     │                            │       │
│     │  Email adres               │       │
│     │  📧 [Email Input]          │       │
│     │                            │       │
│     │  [Verstuur reset link]     │       │
│     │                            │       │
│     │  ← Terug naar inloggen     │       │
│     └─────────────────────────────┘       │
│                                           │
└───────────────────────────────────────────┘
```

**Success State:**
```
┌───────────────────────────────────────────┐
│                                           │
│          [WritGo Media Logo]              │
│                                           │
│     ┌─────────────────────────────┐       │
│     │         ✅                 │       │
│     │                            │       │
│     │    Check je inbox!         │       │
│     │                            │       │
│     │  Als dit e-mailadres bij   │       │
│     │  ons bekend is, ontvang    │       │
│     │  je binnen enkele minuten  │       │
│     │  een e-mail...             │       │
│     │                            │       │
│     │  💡 Tip: Check ook je      │       │
│     │     spam folder            │       │
│     │                            │       │
│     │  [Naar inloggen]           │       │
│     │  [Opnieuw proberen]        │       │
│     └─────────────────────────────┘       │
│                                           │
└───────────────────────────────────────────┘
```

**Visual Elements:**
- Large logo at top center
- Card with rounded corners and shadow
- Email icon in input field (left side)
- White submit button with hover effect
- Success checkmark in green circle
- Secondary action as outline button

### 3. Reset Password Page (`/wachtwoord-resetten`)

**Form State:**
```
┌───────────────────────────────────────────┐
│                                           │
│          [WritGo Media Logo]              │
│                                           │
│     ┌─────────────────────────────┐       │
│     │  Nieuw wachtwoord instellen│       │
│     │  Kies een veilig wachtwoord│       │
│     │                            │       │
│     │  Nieuw wachtwoord          │       │
│     │  🔒 [Password Input]       │       │
│     │                            │       │
│     │  Bevestig wachtwoord       │       │
│     │  🔒 [Password Input]       │       │
│     │                            │       │
│     │  💡 Tip: Gebruik een       │       │
│     │     combinatie van...      │       │
│     │                            │       │
│     │  [Wachtwoord wijzigen]     │       │
│     └─────────────────────────────┘       │
│                                           │
└───────────────────────────────────────────┘
```

**Success State:**
```
┌───────────────────────────────────────────┐
│                                           │
│          [WritGo Media Logo]              │
│                                           │
│     ┌─────────────────────────────┐       │
│     │         ✅                 │       │
│     │                            │       │
│     │  Wachtwoord gewijzigd!     │       │
│     │                            │       │
│     │  Je wachtwoord is          │       │
│     │  succesvol gewijzigd.      │       │
│     │  Je kunt nu inloggen...    │       │
│     │                            │       │
│     │  [Naar inloggen]           │       │
│     └─────────────────────────────┘       │
│                                           │
└───────────────────────────────────────────┘
```

**Error State:**
```
┌───────────────────────────────────────────┐
│                                           │
│          [WritGo Media Logo]              │
│                                           │
│     ┌─────────────────────────────┐       │
│     │         ⚠️                  │       │
│     │                            │       │
│     │  Er is iets misgegaan      │       │
│     │                            │       │
│     │  Deze reset link is        │       │
│     │  verlopen. Vraag een       │       │
│     │  nieuwe aan.               │       │
│     │                            │       │
│     │  [Nieuwe reset link        │       │
│     │   aanvragen]               │       │
│     │                            │       │
│     │  Terug naar inloggen       │       │
│     └─────────────────────────────┘       │
│                                           │
└───────────────────────────────────────────┘
```

**Visual Elements:**
- Lock icons in password inputs
- Tip box with light background
- Success/error states with large icons
- Clear call-to-action buttons
- Consistent spacing and typography

## Decorative Elements

All pages include subtle animated background blurs:
- Top-left: Orange blur (`#FF9933`)
- Bottom-right: Lighter orange blur (`#FFAD33`)
- Both have pulse animation with staggered timing
- Very low opacity (10%) for subtle effect
- Large blur radius (120px) for soft appearance

## Typography

- **Page Title:** 2xl, center-aligned, white
- **Description:** Center-aligned, zinc-400
- **Labels:** Zinc-200
- **Input Text:** White
- **Placeholder:** Zinc-500
- **Success/Error Titles:** lg, semibold, white
- **Body Text:** sm, zinc-400

## Icons

Using Lucide React icons:
- 📧 `Mail` - Email input
- 🔒 `Lock` - Password inputs
- ✅ `CheckCircle2` - Success states
- ⚠️ `AlertCircle` - Error states
- ⏳ `Loader2` - Loading states (with spin animation)
- ← `ArrowLeft` - Back navigation

## Button Styles

**Primary Button:**
- Background: White
- Text: Black
- Hover: Zinc-200
- Full width
- Font: Semibold

**Secondary/Outline Button:**
- Border: Zinc-700
- Text: Zinc-300
- Hover: Zinc-800 background, white text
- Full width

**Link Button:**
- Text: Zinc-400
- Hover: White
- Small font size
- Transition on color

## Loading States

All buttons show loading indicator:
```
[⏳ Loading text...]
```
- Spinner icon rotates continuously
- Button is disabled during loading
- Text changes to indicate action in progress

## Responsive Design

- **Mobile:** Full-width card with padding
- **Tablet/Desktop:** Max-width 28rem (448px)
- **Padding:** Consistent 4 units (1rem) on all sides
- **Spacing:** Generous vertical spacing between elements

## Form Validation

**Visual Feedback:**
- Red text for errors
- Red toast notifications
- Error box with red background
- Clear, helpful error messages

**Validation Rules:**
- Email: Must contain @ symbol
- Password: Minimum 6 characters
- Confirm: Must match new password

## Accessibility

- Proper label associations
- Semantic HTML structure
- Focus states on all interactive elements
- Loading states announced to screen readers
- Error messages are clear and actionable
- Sufficient color contrast ratios

## Animation

**Transitions:**
- Color transitions: 150ms ease
- Hover states: Smooth color changes
- Button states: Instant feedback

**Animations:**
- Background blurs: Pulse animation
- Loading spinner: Continuous rotation
- No jarring movements or sudden changes

## Email Template

**Desktop View:**
```
┌─────────────────────────────────────┐
│     [Dark Header: WritGo AI]        │
│     🔒 Wachtwoord Herstellen        │
└─────────────────────────────────────┘
│                                     │
│  Hallo [Name],                      │
│                                     │
│  Je hebt een verzoek ingediend...   │
│                                     │
│  [Wachtwoord Herstellen Button]    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ⚠️ Belangrijk:              │   │
│  │ • Link geldig voor 1 uur    │   │
│  │ • Kan maar één keer gebruikt│   │
│  │ • Niet jouw verzoek? Negeer │   │
│  └─────────────────────────────┘   │
│                                     │
│  Als de knop niet werkt:            │
│  [Plain text link]                  │
│                                     │
│  Met vriendelijke groet,            │
│  Team WritGo AI                     │
│                                     │
├─────────────────────────────────────┤
│     [Footer: Contact Info]          │
└─────────────────────────────────────┘
```

**Visual Design:**
- Professional gradient header (dark gray)
- Clean white content area
- Warning box with yellow background
- Large call-to-action button
- Fallback plain text link
- Branded footer
- Responsive for mobile devices

## Design Consistency

✅ Matches existing `/inloggen` page exactly
✅ Uses same card component (`@/components/ui/card`)
✅ Uses same input component (`@/components/ui/input`)
✅ Uses same button component (`@/components/ui/button`)
✅ Same color scheme throughout
✅ Same typography scale
✅ Same spacing system
✅ Same icon library (Lucide)

## User Experience Highlights

1. **Immediate Feedback:** Loading states, success messages, error handling
2. **Clear Instructions:** Every step explained clearly in Dutch
3. **Safety Warnings:** Security information provided upfront
4. **Easy Navigation:** Clear paths forward and backward
5. **Professional Look:** Consistent with brand identity
6. **Mobile-Friendly:** Works perfectly on all device sizes
7. **Accessible:** Screen reader friendly, keyboard navigable
8. **Forgiving:** Helpful error messages, easy recovery paths

## Toast Notifications

Uses Sonner for notifications:
- Success: Green checkmark
- Error: Red X
- Position: Bottom-right (default)
- Duration: Auto-dismiss after 3-5 seconds
- Non-blocking: Doesn't prevent interaction

## Dark Theme Details

The dark theme creates a professional, modern appearance:
- Easy on the eyes for extended use
- Reduces screen glare
- Matches current WritGo AI branding
- Creates visual hierarchy through subtle contrast
- Makes call-to-action buttons stand out

## Testing the UI

To see the pages in action:
1. Start development server: `npm run dev`
2. Navigate to `http://localhost:3000/inloggen`
3. Click "Wachtwoord vergeten?" link
4. Experience the complete flow

The pages are fully functional and ready for production use!
