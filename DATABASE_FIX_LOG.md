# Database Connection Fix - Dec 3, 2024

## Problem
User reported database connection error during login:
```
Can't reach database server at `localhost:5432`
```

The app was trying to connect to localhost instead of the Abacus production database.

## Root Cause
The `.env` file contained a hardcoded localhost database URL:
```
DATABASE_URL=postgresql://localhost:5432/writgo_build
```

## Solution Implemented

### 1. Updated .env file
Changed DATABASE_URL to point to the Abacus database:
```bash
DATABASE_URL=postgresql://role_660998b92:rtnUeIerDQmGCoPTTRSjuAGdgxVifMxH@db-660998b92.db002.hosteddb.reai.io:5432/660998b92?connect_timeout=15
```

### 2. Regenerated Prisma Client
```bash
npx prisma generate
```

### 3. Verified Database Connection
```bash
npx prisma db push --skip-generate
# Output: The database is already in sync with the Prisma schema.
```

### 4. Fixed Build Directory Issue
The build was outputting to `.build` directory instead of `.next`. Created symlink:
```bash
ln -s .build .next
```

### 5. Installed Missing Dependencies
Fixed originality scanner build errors by installing missing @tiptap packages:
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-underline @tiptap/extension-text-align --legacy-peer-deps
```

### 6. Rebuilt and Deployed
```bash
npm run build
npm run start
```

## Verification
✅ Database connection successful
✅ Can query database (8 clients found)
✅ App running on http://localhost:3000
✅ NextJS production mode active

## Files Changed
- `.env` (DATABASE_URL updated)
- `package.json` (@tiptap dependencies added)
- `package-lock.json` (dependency lock updated)
- `.next` (symlink to .build created)

## Notes
- The `.env` file is gitignored for security reasons
- The correct DATABASE_URL must be manually set in production environment
- The Prisma schema already uses `env("DATABASE_URL")` correctly
- No hardcoded database URLs found in codebase (only in .env)
