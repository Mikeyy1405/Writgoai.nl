#!/usr/bin/env python3
import os
import sys

# Read the SQL file
with open('supabase_blog_migration.sql', 'r') as f:
    sql_content = f.read()

# Split into individual statements (rough split by semicolons)
statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]

print(f"Found {len(statements)} SQL statements to execute")

# Use psycopg2 if available, otherwise use requests
try:
    import psycopg2
    
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
    
except ImportError:
    print("psycopg2 not available, trying with requests...")
    import requests
    import json
    
    SUPABASE_URL = "https://utursgxvfhhfheeoewfn.supabase.co"
    SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dXJzZ3h2ZmhoZmhlZW9ld2ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI1NTY1NSwiZXhwIjoyMDc5ODMxNjU1fQ.OWt_8505zYGOGY3UohKVx7GSxRDiWNYqilRYHTTfPYg"
    
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    # Try to execute via REST API (this won't work for DDL, but let's try)
    print("⚠️ REST API cannot execute DDL statements directly")
    print("Please run the migration manually in Supabase Dashboard SQL Editor")
    sys.exit(1)
