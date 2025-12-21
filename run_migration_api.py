#!/usr/bin/env python3
import requests
import json

# Read the SQL file
with open('supabase_blog_migration.sql', 'r') as f:
    sql_content = f.read()

SUPABASE_URL = "https://utursgxvfhhfheeoewfn.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dXJzZ3h2ZmhoZmhlZW9ld2ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI1NTY1NSwiZXhwIjoyMDc5ODMxNjU1fQ.OWt_8505zYGOGY3UohKVx7GSxRDiWNYqilRYHTTfPYg"

headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Try to execute via database REST API endpoint
print("Executing migration via Supabase REST API...")

# Use the pg_net extension or direct SQL execution endpoint
url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

try:
    response = requests.post(
        url,
        headers=headers,
        json={"query": sql_content}
    )
    
    print(f"Response status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("\n✅ Migration completed successfully!")
    else:
        print(f"\n❌ Migration failed: {response.text}")
        print("\n⚠️ Please run the migration manually in Supabase Dashboard SQL Editor")
        print("File location: /home/ubuntu/writgo/supabase_blog_migration.sql")
        
except Exception as e:
    print(f"Error: {e}")
    print("\n⚠️ REST API execution not available")
    print("Please run the migration manually in Supabase Dashboard SQL Editor:")
    print("1. Go to: https://supabase.com/dashboard/project/utursgxvfhhfheeoewfn/sql/new")
    print("2. Copy the SQL from: /home/ubuntu/writgo/supabase_blog_migration.sql")
    print("3. Paste and click 'Run'")
