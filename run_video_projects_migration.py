#!/usr/bin/env python3
import os
import sys
import psycopg2

# Read the SQL file
with open('supabase_video_projects_migration.sql', 'r') as f:
    sql_content = f.read()

# Split into individual statements (rough split by semicolons)
statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]

print(f"Found {len(statements)} SQL statements to execute")

# Connection string
conn = psycopg2.connect(
    host="aws-0-eu-central-1.pooler.supabase.com",
    port=5432,
    database="postgres",
    user="postgres.utursgxvfhhfheeoewfn",
    password="Writgo2025!@#$%"
)

cursor = conn.cursor()

# Execute each statement
for i, statement in enumerate(statements, 1):
    try:
        print(f"Executing statement {i}/{len(statements)}...")
        cursor.execute(statement)
        conn.commit()
        print(f"✓ Statement {i} executed successfully")
    except Exception as e:
        print(f"✗ Error in statement {i}: {e}")
        # Continue with next statement
        conn.rollback()

cursor.close()
conn.close()
print("\n✅ Migration completed!")
