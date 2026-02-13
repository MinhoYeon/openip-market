
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Expert Profile Verification...');

  try {
    // 1. Create a Test User
    const email = `expert_test_${Date.now()}@test.com`;
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Test Expert',
        role: 'Valuator'
      }
    });
    console.log(`✅ Created User: ${user.email} (${user.role})`);

    // 2. Create/Update Expert Profile (Simulate API logic)
    const profileData = {
      expertType: 'PatentAttorney',
      specializations: JSON.stringify(['AI', 'Blockchain']),
      bio: 'Expert in software patents.',
      experience: '10 Years',
      hourlyRate: '300,000 KRW',
      availability: 'Available'
    };

    const profile = await prisma.expertProfile.upsert({
      where: { userId: user.id },
      update: profileData,
      create: {
        userId: user.id,
        ...profileData
      }
    });
    console.log('✅ Created Expert Profile:', profile);

    // 3. Verify Fetch (Public Profile)
    const fetchedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { expertProfile: true }
    });

    if (!fetchedUser?.expertProfile) {
      throw new Error('Failed to fetch expert profile via User relation');
    }

    const specs = JSON.parse(fetchedUser.expertProfile.specializations || '[]');
    if (!specs.includes('AI')) {
      throw new Error('Specializations not saved correctly');
    }

    console.log('✅ Verified Public Profile Fetch');
    console.log(`   - Name: ${fetchedUser.name}`);
    console.log(`   - Type: ${fetchedUser.expertProfile.expertType}`);
    console.log(`   - Specs: ${specs.join(', ')}`);

    // 4. Cleanup
    await prisma.expertProfile.delete({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('✅ Cleanup Complete');

    console.log('🎉 VERIFICATION SUCCESSFUL');
  } catch (e) {
    console.error('❌ Verification Failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
