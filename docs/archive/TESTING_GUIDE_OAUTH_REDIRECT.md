# Testing Guide - OAuth Auto-Redirect Fix

**Date**: 2025-12-06  
**PR**: copilot/fix-social-media-redirects  
**Status**: Ready for Testing

## Prerequisites

Before testing, ensure:
1. You have access to the WritgoAI platform
2. You have a valid account with client-portal access
3. You have access to social media accounts to test with (LinkedIn, Instagram, Facebook, Twitter)
4. The `LATE_DEV_API_KEY` environment variable is configured
5. Browser allows popups from writgoai.nl domain

## Test Scenarios

### Scenario 1: LinkedIn Connection (Primary Test)

#### Steps:
1. Navigate to `/client-portal/social-media-studio`
2. Click on the "Verbindingen" (Connections) tab
3. Click the "Verbind" button for LinkedIn
4. **Expected**: OAuth popup window opens with Late.dev authorization page

#### What to Check:
- [ ] Popup opens successfully (not blocked)
- [ ] Popup shows LinkedIn OAuth flow
- [ ] Console shows: `[LinkedIn Connect] Request for project: ...`
- [ ] Console shows: `[LinkedIn Connect] Creating platform invite for: linkedin`
- [ ] No error messages in console

#### After OAuth Authorization:
5. Complete the LinkedIn authorization in the popup
6. **Expected**: Redirected to `/client-portal/social-connect-success?platform=linkedin`

#### Success Page Behavior:
- [ ] Shows "Verbinding Geslaagd!" success message
- [ ] Shows LinkedIn icon and name
- [ ] Shows "Volgende stappen" section
- [ ] Console shows: `[Social Connect Success] Sent success message to parent window`

#### Auto-Redirect:
7. Wait or click "Terug naar Social Media Suite" button
8. **Expected**:
- [ ] Popup closes (either immediately on click or after 5 seconds)
- [ ] Parent window shows toast: "linkedin succesvol verbonden!"
- [ ] Parent window automatically switches to "Verbindingen" tab
- [ ] LinkedIn account appears in connected accounts list
- [ ] Account shows as "Actief" with green badge

### Scenario 2: Instagram Connection

Repeat the same steps as Scenario 1 but for Instagram:
1. Click "Verbind" for Instagram
2. Complete Instagram OAuth
3. Verify success page and auto-redirect
4. Check Instagram appears in accounts list

**Expected Console Logs**:
```
[Social Connect] Connect request for platform: instagram
[Late.dev] Creating platform invite for: instagram on profile: ...
[Late.dev] Platform invite created: instagram -> URL: https://...
[Social Connect Success] Sent success message to parent window
[Social Media Studio] Received connection success for: instagram
```

### Scenario 3: Error Handling - Unsupported Platform

#### Steps:
1. Open browser developer console
2. In console, manually call:
```javascript
fetch('/api/social-media/connect-account', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ platform: 'invalid_platform' })
}).then(r => r.json()).then(console.log)
```

#### Expected:
- [ ] Response status: 400
- [ ] Error message in Dutch: "Platform 'invalid_platform' wordt niet ondersteund"
- [ ] Details list supported platforms

### Scenario 4: Error Handling - LinkedIn Connection Failure

To test error handling (requires simulating API failure):

#### Option A: Network Tab Testing
1. Open Developer Tools → Network tab
2. Start connecting LinkedIn
3. Cancel/block the API request to Late.dev
4. **Expected**: Error message in Dutch displayed

#### Option B: Check Console Logs
When an error occurs, console should show:
```
[LinkedIn Connect] Error creating invite: ...
[LinkedIn Connect] Dit kan duiden op een probleem met de LinkedIn OAuth configuratie
```

Error toast should show:
- Dutch error message
- Clear explanation of the problem
- No technical stack traces visible to user

### Scenario 5: Multiple Account Connections

#### Steps:
1. Connect LinkedIn (follow Scenario 1)
2. Connect Instagram (follow Scenario 2)
3. Connect Facebook
4. Connect Twitter

#### What to Check:
- [ ] All accounts appear in the connected accounts list
- [ ] Each account shows correct platform icon
- [ ] Each account shows "Actief" status
- [ ] No duplicate entries
- [ ] Each connection sends separate postMessage
- [ ] Parent page updates after each connection

### Scenario 6: Popup Blocked

#### Steps:
1. Configure browser to block popups
2. Try connecting LinkedIn
3. **Expected**: Toast message: "Pop-up werd geblokkeerd. Sta pop-ups toe en probeer opnieuw."

### Scenario 7: Already Connected Account

#### Steps:
1. Connect LinkedIn account (if not already connected)
2. Try connecting LinkedIn again
3. **Expected**: 
- [ ] Either replaces existing connection or shows error
- [ ] No duplicate entries in accounts list

## Console Log Verification

Throughout all tests, verify console logs show appropriate messages:

### For LinkedIn:
```
[LinkedIn Connect] Request for project: <projectId> platform: linkedin
[LinkedIn Connect] Project found: <projectName>
[LinkedIn Connect] Using existing profile: <profileId>
[LinkedIn Connect] Creating platform invite for: linkedin on profile: <profileId>
[LinkedIn Connect] Success! Invite URL created: https://...
```

### For Success Page:
```
[Social Connect Success] Sent success message to parent window
```

### For Parent Window:
```
[Social Media Studio] Received connection success for: linkedin
```

## Error Message Verification

All error messages should be:
- [ ] In Dutch language
- [ ] User-friendly (no technical jargon)
- [ ] Clear about what went wrong
- [ ] Provide actionable next steps

Examples:
- ✅ "LinkedIn verbinding maken mislukt"
- ✅ "Platform 'invalid' wordt niet ondersteund"
- ✅ "Kon geen koppellink aanmaken"
- ❌ "500 Internal Server Error"
- ❌ "TypeError: Cannot read property..."

## Performance Checks

- [ ] Popup opens within 1 second of clicking connect
- [ ] PostMessage is sent immediately on success page load
- [ ] Parent window refreshes accounts within 1 second of receiving message
- [ ] Popup closes within 5-6 seconds automatically

## Browser Compatibility

Test on:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

## Known Limitations

1. **Origin Validation**: PostMessage currently uses wildcard origin (`'*'`). This is acceptable for now but could be enhanced.
2. **Popup Blockers**: Users must allow popups for the OAuth flow to work.
3. **Manual Refresh**: If postMessage fails for any reason, users can manually refresh the accounts list.

## Debugging Tips

### If PostMessage Doesn't Work:
1. Check browser console for JavaScript errors
2. Verify `window.opener` exists in popup window
3. Check parent window has message event listener attached
4. Verify success page URL includes `?platform=` parameter

### If LinkedIn Connection Fails:
1. Check console for `[LinkedIn Connect]` logs
2. Verify `LATE_DEV_API_KEY` environment variable is set
3. Check Late.dev dashboard for API status
4. Verify LinkedIn is enabled in Late.dev settings

### If Popup Doesn't Open:
1. Check browser popup blocker settings
2. Verify toast message about popup blocking
3. Try clicking connect button again after allowing popups

## Success Criteria

All tests pass when:
- ✅ OAuth popup opens successfully
- ✅ User can complete OAuth flow
- ✅ Success page loads and sends postMessage
- ✅ Parent window receives message and updates
- ✅ Connected account appears in list
- ✅ Popup closes automatically
- ✅ All console logs show expected messages
- ✅ Error messages are in Dutch
- ✅ No JavaScript errors in console

## Reporting Issues

If you find issues, please report:
1. Browser and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Console logs (especially `[LinkedIn Connect]` messages)
5. Screenshots of error messages
6. Network tab details for API calls

---

**Last Updated**: 2025-12-06  
**Tested By**: [Your Name]  
**Test Date**: [Date]  
**Result**: ✅ Pass / ❌ Fail
