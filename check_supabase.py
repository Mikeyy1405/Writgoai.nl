#!/usr/bin/env python3
import requests
import json

SUPABASE_URL = "https://utursgxvfhhfheeoewfn.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dXJzZ3h2ZmhoZmhlZW9ld2ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI1NTY1NSwiZXhwIjoyMDc5ODMxNjU1fQ.OWt_8505zYGOGY3UohKVx7GSxRDiWNYqilRYHTTfPYg"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

# Check tables
tables = [
    "articles",
    "article_categories", 
    "article_tags",
    "writgo_autopilot_config",
    "writgo_keywords",
    "writgo_activity_logs"
]

for table in tables:
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/{table}?select=*&limit=1",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {table}: EXISTS ({len(data)} rows in first fetch)")
        else:
            print(f"❌ {table}: ERROR {response.status_code} - {response.text[:100]}")
    except Exception as e:
        print(f"❌ {table}: EXCEPTION - {str(e)}")

# Check autopilot config specifically
print("\n--- WritGo AutoPilot Config ---")
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/writgo_autopilot_config?select=*",
    headers=headers
)
if response.status_code == 200:
    data = response.json()
    print(f"Config rows: {len(data)}")
    if len(data) > 0:
        print(json.dumps(data[0], indent=2))
    else:
        print("⚠️ No config found! Need to insert default.")
else:
    print(f"Error: {response.status_code} - {response.text}")
