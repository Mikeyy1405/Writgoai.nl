# WritgoAI Command Center - Quick Start Guide

## 🚀 Getting Started

### Access the Dashboard
1. Navigate to: `/admin` or `/admin/page`
2. Must be logged in as admin
3. Dashboard loads automatically

### First Time Setup
No setup required! The dashboard is ready to use immediately after deployment.

## 📊 Dashboard Sections

### Header
- **Title**: Shows "WritgoAI Command Center" with rocket emoji
- **Last Updated**: Displays time since last refresh
- **Sync Button**: Manual refresh of all data
- **Settings Button**: Quick access to admin settings

### KPI Cards (Top Row)
Quick overview of 4 key metrics:
1. **📧 Inbox** - Unread emails (coming soon)
2. **💰 Financiën** - MRR from Moneybird
3. **📝 Content** - Draft blog posts
4. **📱 Social** - Scheduled social media posts (coming soon)

### Left Column (60%)
**AI Assistant Widget**
- Chat interface for future AIML integration
- Quick action suggestions
- Coming soon notification

**Activity Feed**
- Real-time updates from all systems
- Shows recent payments
- Shows new subscriptions
- Auto-updates every 30 seconds

### Right Column (40%)
**Todo Widget**
- Automatically generated tasks
- Shows pending invoices to send
- Highlights overdue items
- Click to mark as complete

**Quick Actions**
- 📝 Nieuwe Blog → Create new blog post
- 💰 Factuur Versturen → Send invoice
- 📅 Social Post → Schedule social media
- 📧 Email Beantwoorden → Respond to email

### Integration Widgets (Bottom)

**Moneybird Widget**
- Shows MRR (Monthly Recurring Revenue)
- Shows ARR (Annual Recurring Revenue)
- Lists active subscriptions
- Highlights late invoices
- Shows recent transactions
- Link to full financial dashboard

**Social Media Widget**
- Displays connected accounts
- Shows platform icons (X, Facebook, Instagram, etc.)
- Number of scheduled posts
- Link to content hub

**Content Widget**
- Shows draft count
- Shows scheduled articles
- Shows published count
- Lists recent blog posts
- Quick action to write new article

**Email Inbox Widget**
- Coming soon placeholder
- Link to email management

## 🔄 Auto-Refresh

The dashboard automatically refreshes every 30 seconds to keep data current.

**Manual Refresh**: Click the "Sync" button in the header at any time.

**Last Updated**: Check the timestamp under the header to see when data was last refreshed.

## 🎯 Common Tasks

### Check Financial Status
1. Look at "Financiën" KPI card for quick MRR
2. Scroll to Moneybird Widget for details
3. Click "Bekijk financiën" for full view

### Review Pending Work
1. Check Todo Widget (top right)
2. Review highlighted high-priority items
3. Click tasks to mark as complete

### Create New Content
**Blog Post**:
- Click "Nieuwe Blog" in Quick Actions, OR
- Scroll to Content Widget → "Nieuw artikel schrijven"

**Social Media**:
- Click "Social Post" in Quick Actions, OR
- Scroll to Social Media Widget → "Plan nieuwe post"

### Send Invoice
1. Check Todo Widget for pending invoices
2. Click "Factuur Versturen" in Quick Actions
3. Or go to Moneybird Widget → "Bekijk financiën"

### View Activity
Scroll to Activity Feed (left column) to see:
- Recent payments
- New subscriptions
- Latest system events

## 📱 Mobile Usage

The dashboard is fully responsive:

**Mobile View**:
- Single column layout
- Stacked widgets
- Full functionality maintained
- Touch-friendly buttons

**Tablet View**:
- Two column layout
- Optimized spacing
- Easy navigation

**Desktop View**:
- Full multi-column layout
- Maximum information density
- Side-by-side widgets

## 🔐 Access Control

### Who Can Access
- Users with `role: 'admin'`
- Email: `info@writgo.nl`

### What Happens If Not Authorized
- Automatically redirected to `/client-login` if not logged in
- Automatically redirected to `/client-portal` if not admin

## ⚠️ Error Handling

### Widget Fails to Load
Each widget handles errors independently:
1. Shows error icon and message
2. Displays "Opnieuw proberen" (Retry) button
3. Other widgets continue to work normally

### Manual Retry
Click the retry button on any failed widget to attempt reload.

### Full Dashboard Reload
Click "Sync" in header to refresh all data.

## 🎨 Interface Colors

- **Primary**: Orange (#FF6B35) - Action buttons, highlights
- **Success**: Green - Completed tasks, paid invoices
- **Warning**: Yellow - Pending items, overdue notices
- **Error**: Red - Late payments, critical alerts
- **Info**: Blue - General information

## 💡 Tips & Tricks

### Keyboard Shortcuts
- AI Assistant: Press Enter to send message
- Todo items: Click anywhere on task to toggle

### Best Practices
1. Check dashboard at start of day
2. Review todo list first
3. Address high-priority items (red)
4. Use quick actions for common tasks
5. Monitor activity feed for real-time updates

### Customization
Currently showing all available integrations. Future versions may allow:
- Widget reordering
- Hide/show widgets
- Custom KPI selection

## 🆘 Troubleshooting

### Dashboard Not Loading
1. Check internet connection
2. Verify admin login status
3. Try manual refresh (Sync button)
4. Clear browser cache if needed

### Widget Shows Error
1. Click retry button on widget
2. Check if API service is running
3. Verify API credentials in settings
4. Contact support if persists

### Data Not Updating
1. Check "Last Updated" timestamp
2. Click manual Sync button
3. Verify auto-refresh is enabled (every 30 seconds)

### Can't Complete Tasks
Todo list is dynamic - tasks regenerate based on actual data. Complete the underlying action (e.g., send the invoice) and it will disappear.

## 📞 Support

For issues or questions:
1. Check documentation files in repository
2. Review API integration guides
3. Contact admin support

## 🔮 Coming Soon

Features in development:
- 🤖 AI Assistant with AIML API
- 📧 Email inbox integration
- 📊 Social media analytics
- 📈 Custom KPI selection
- 🔔 Real-time notifications
- 📱 Mobile app

## 📚 Additional Resources

- **Implementation Guide**: `ADMIN_COMMAND_CENTER_IMPLEMENTATION.md`
- **Visual Guide**: `ADMIN_COMMAND_CENTER_VISUAL_GUIDE.md`
- **Security Summary**: `SECURITY_SUMMARY_ADMIN_COMMAND_CENTER.md`
- **PR Summary**: `PR_SUMMARY_ADMIN_COMMAND_CENTER.md`

---

**Version**: 1.0
**Last Updated**: December 10, 2025
**Status**: Production Ready
