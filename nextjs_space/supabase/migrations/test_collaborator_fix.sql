-- Test queries to verify ProjectCollaborator fix

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'ProjectCollaborator'
) as table_exists;

-- 2. Count columns (should be 14 after migration)
SELECT COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'ProjectCollaborator';

-- 3. List all columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'ProjectCollaborator'
ORDER BY ordinal_position;

-- 4. Check indices (should have 6)
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'ProjectCollaborator'
ORDER BY indexname;

-- 5. Check constraints
SELECT conname, contype, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'ProjectCollaborator'
ORDER BY conname;

-- Expected columns after migration:
-- id, projectId, userId, email, name, role, status, accessToken,
-- invitedAt, acceptedAt, lastAccessAt, revokedAt, notifyOnPublish,
-- createdAt, updatedAt

-- Expected indices:
-- 1. ProjectCollaborator_pkey (PRIMARY KEY on id)
-- 2. ProjectCollaborator_projectId_idx
-- 3. ProjectCollaborator_userId_idx
-- 4. ProjectCollaborator_role_idx
-- 5. ProjectCollaborator_email_idx
-- 6. ProjectCollaborator_status_idx
-- 7. ProjectCollaborator_accessToken_idx

-- Expected constraints:
-- 1. ProjectCollaborator_pkey (PRIMARY KEY)
-- 2. ProjectCollaborator_projectId_fkey (FOREIGN KEY to Project)
-- 3. ProjectCollaborator_projectId_email_unique (UNIQUE)
-- 4. ProjectCollaborator_accessToken_unique (UNIQUE)
