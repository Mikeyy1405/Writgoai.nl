import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://utursgxvfhhfheeoewfn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dXJzZ3h2ZmhoZmhlZW9ld2ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI1NTY1NSwiZXhwIjoyMDc5ODMxNjU1fQ.OWt_8505zYGOGY3UohKVx7GSxRDiWNYqilRYHTTfPYg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  console.log('Checking project_knowledge_base table...');
  
  // Try to fetch one row to see the schema
  const { data, error } = await supabase
    .from('project_knowledge_base')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Success! Table exists.');
  if (data && data.length > 0) {
    console.log('Sample row columns:', Object.keys(data[0]));
    console.log('Sample row:', data[0]);
  } else {
    console.log('Table is empty. Cannot determine columns from data.');
  }
}

checkTable();
