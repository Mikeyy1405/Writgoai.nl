import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testContentHubProjects() {
  console.log('🔍 Testing Content Hub Projects API Logic...\n');

  try {
    // Test 1: Fetch admin projects
    console.log('1. Fetching admin projects...');
    const adminProjects = await prisma.adminProject.findMany({
      include: {
        _count: {
          select: {
            blogPosts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`   ✓ Found ${adminProjects.length} admin projects`);
    if (adminProjects.length > 0) {
      adminProjects.forEach((p, i) => {
        console.log(`     ${i + 1}. ${p.name} (${p.wordpressUrl || 'No WP'})`);
      });
    }

    // Test 2: Fetch client projects with WordPress
    console.log('\n2. Fetching client projects with WordPress...');
    const clientProjectsWithWordPress = await prisma.project.findMany({
      where: {
        AND: [
          { wordpressUrl: { not: null } },
          { wordpressUrl: { not: '' } }
        ]
      },
      include: {
        client: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            savedContent: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`   ✓ Found ${clientProjectsWithWordPress.length} client projects with WordPress`);
    if (clientProjectsWithWordPress.length > 0) {
      clientProjectsWithWordPress.forEach((p, i) => {
        console.log(`     ${i + 1}. ${p.name} (${p.wordpressUrl})`);
        console.log(`        Client: ${p.client?.name || 'Unknown'} (${p.client?.email || 'Unknown'})`);
      });
    }

    // Test 3: Check for specific project (computerstartgids.nl)
    console.log('\n3. Searching for "computerstartgids" project...');
    const specificProject = clientProjectsWithWordPress.find(p => 
      p.name.toLowerCase().includes('computerstartgids') || 
      p.websiteUrl?.toLowerCase().includes('computerstartgids') ||
      p.wordpressUrl?.toLowerCase().includes('computerstartgids')
    );
    
    if (specificProject) {
      console.log('   ✓ Found computerstartgids project!');
      console.log(`     Name: ${specificProject.name}`);
      console.log(`     Website: ${specificProject.websiteUrl}`);
      console.log(`     WordPress URL: ${specificProject.wordpressUrl}`);
      console.log(`     Client: ${specificProject.client?.name}`);
      console.log(`     Has WordPress Credentials: ${specificProject.wordpressUsername ? 'Yes' : 'No'}`);
    } else {
      console.log('   ⚠️  computerstartgids project not found in client projects with WordPress');
      
      // Check if it exists without WordPress configured
      const allClientProjects = await prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: 'computerstartgids', mode: 'insensitive' } },
            { websiteUrl: { contains: 'computerstartgids', mode: 'insensitive' } }
          ]
        },
        include: {
          client: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });
      
      if (allClientProjects.length > 0) {
        console.log('   📝 Found computerstartgids projects (but without WordPress configured):');
        allClientProjects.forEach((p, i) => {
          console.log(`     ${i + 1}. ${p.name}`);
          console.log(`        Website: ${p.websiteUrl}`);
          console.log(`        WordPress URL: ${p.wordpressUrl || 'NOT SET'}`);
          console.log(`        Client: ${p.client?.name}`);
        });
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total projects that will appear in Content Hub: ${adminProjects.length + clientProjectsWithWordPress.length}`);
    console.log(`   - Admin projects: ${adminProjects.length}`);
    console.log(`   - Client projects with WordPress: ${clientProjectsWithWordPress.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testContentHubProjects()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
