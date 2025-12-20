# 🔐 Authentication Setup Guide

## ✅ What's Included

Your WritGo AI app now has **full authentication** with:
- ✅ Email/Password login & registration
- ✅ Google OAuth (ready to configure)
- ✅ NextAuth v4 integration
- ✅ Supabase PostgreSQL database
- ✅ Bcrypt password hashing
- ✅ JWT sessions

---

## 🚀 Deployment Setup (Render)

### Step 1: Environment Variables

Add these to your Render environment variables:

```bash
# Database (from Supabase)
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"

# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-generated-secret-here"

# NextAuth URL (your production domain)
NEXTAUTH_URL="https://writgo.nl"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

## 🔑 Google OAuth Setup

### Step 1: Create Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**

### Step 2: Configure OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Choose **External** (unless you have Google Workspace)
3. Fill in:
   - **App name:** WritGo AI
   - **User support email:** your@email.com
   - **Developer contact:** your@email.com
4. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Save

### Step 3: Configure Authorized URLs

In your OAuth client settings, add:

**Authorized JavaScript origins:**
```
https://writgo.nl
```

**Authorized redirect URIs:**
```
https://writgo.nl/api/auth/callback/google
```

### Step 4: Get Credentials

Copy your:
- **Client ID** → `GOOGLE_CLIENT_ID`
- **Client Secret** → `GOOGLE_CLIENT_SECRET`

Add these to Render environment variables.

---

## 🗄️ Database Migration

### Run Prisma Migration on Supabase

Your Prisma schema is already set up. To apply it to Supabase:

```bash
# Generate Prisma Client
yarn prisma generate

# Push schema to database
yarn prisma db push
```

This will create the `User`, `Project`, and `Article` tables in your Supabase database.

---

## 📊 Database Schema

### User Table
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  projects  Project[]
}
```

### Project Table
```prisma
model Project {
  id          String   @id @default(cuid())
  userId      String
  name        String
  websiteUrl  String
  
  wpUrl       String?
  wpUsername  String?
  wpPassword  String?
  
  articles    Article[]
}
```

### Article Table
```prisma
model Article {
  id          String   @id @default(cuid())
  projectId   String
  title       String
  content     String   @db.Text
  status      String   @default("draft")
  
  wpPostId    Int?
  wpUrl       String?
}
```

---

## 🧪 Testing Authentication

### Test Email/Password Registration

1. Go to `https://writgo.nl/register`
2. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: testpassword123
3. Click "Account aanmaken"
4. You should be redirected to `/dashboard` (to be created)

### Test Email/Password Login

1. Go to `https://writgo.nl/login`
2. Enter your credentials
3. Click "Inloggen"
4. You should be redirected to `/dashboard`

### Test Google OAuth

1. Go to `https://writgo.nl/login`
2. Click "Doorgaan met Google"
3. Select your Google account
4. You should be redirected to `/dashboard`

---

## 🔒 Security Features

### Password Hashing
- ✅ Bcrypt with 12 rounds
- ✅ Passwords never stored in plain text

### Session Management
- ✅ JWT tokens
- ✅ Secure HTTP-only cookies
- ✅ CSRF protection

### Database Security
- ✅ Prepared statements (Prisma)
- ✅ SQL injection prevention
- ✅ Connection pooling

---

## 📝 Next Steps

### 1. Create Dashboard Page

Create `/app/dashboard/page.tsx`:
```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }
  
  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      {/* Dashboard content */}
    </div>
  );
}
```

### 2. Protect Routes

Use middleware to protect routes:
```tsx
// middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*"]
};
```

### 3. Add User Menu

Add logout button to navigation:
```tsx
import { signOut } from "next-auth/react";

<button onClick={() => signOut()}>
  Uitloggen
</button>
```

---

## 🐛 Troubleshooting

### "Invalid credentials" error
- Check if user exists in database
- Verify password is correct
- Check DATABASE_URL is correct

### Google OAuth not working
- Verify redirect URI matches exactly
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Ensure OAuth consent screen is published

### Database connection error
- Verify DATABASE_URL format
- Check Supabase is running
- Run `yarn prisma db push` to sync schema

---

## 📚 Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Documentation](https://supabase.com/docs)

---

**Your authentication is now fully set up! 🎉**

Users can register, login, and use Google OAuth once you configure the environment variables.
