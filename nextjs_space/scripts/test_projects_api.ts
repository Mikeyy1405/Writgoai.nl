import { config } from 'dotenv';
config();

async function testProjectsAPI() {
  console.log('🧪 Testing /api/client/projects endpoint...\n');
  
  try {
    // Simulate an API call to the projects endpoint
    const response = await fetch('http://localhost:3000/api/client/projects', {
      headers: {
        'Cookie': 'next-auth.session-token=test'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ API response successful!');
      console.log('Projects count:', data.projects?.length || 0);
      console.log('Owned count:', data.ownedCount);
      console.log('Collaborator count:', data.collaboratorCount);
      
      if (data.projects && data.projects.length > 0) {
        console.log('\n📁 First 3 projects:');
        data.projects.slice(0, 3).forEach((proj: any, idx: number) => {
          console.log(`${idx + 1}. ${proj.name} (${proj.websiteUrl})`);
        });
      }
    } else {
      console.log('\n⚠️  API returned status:', response.status);
      const text = await response.text();
      console.log('Response:', text.substring(0, 200));
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  }
}

testProjectsAPI();
