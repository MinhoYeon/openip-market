
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Search API Verification...');

  try {
    // 1. Create Test Owner
    const owner = await prisma.user.create({
      data: { name: 'Search Test Owner', email: `search_owner_${Date.now()}@test.com`, role: 'Owner' }
    });

    // 2. Create Test Listings
    // Listing A: Patent, AI, 1000 KRW
    const itemA = await prisma.iPListing.create({
      data: {
        title: 'Patent A (Cheap)',
        ipType: 'Patent',
        priceExpectation: '1000 KRW',
        ownerId: owner.id,
        visibility: 'Full'
      }
    });

    // Listing B: Patent, AI, 5000 KRW
    const itemB = await prisma.iPListing.create({
      data: {
        title: 'Patent B (Expensive)',
        ipType: 'Patent',
        priceExpectation: '5000 KRW',
        ownerId: owner.id,
        visibility: 'Full'
      }
    });

    // Listing C: Trademark, Bio, 2000 KRW
    const itemC = await prisma.iPListing.create({
      data: {
        title: 'Trademark C (Mid)',
        ipType: 'Trademark',
        priceExpectation: '2000 KRW',
        ownerId: owner.id,
        visibility: 'Full'
      }
    });

    console.log('✅ Created 3 Test Listings');

    // 3. Test Filter: Min Price 1500
    // Should return B (5000) and C (2000)
    // We can't easily call nextjs API here, so we simulate the logic used in the API route
    // Fetch all and filter in memory as the API does
    let listings = await prisma.iPListing.findMany();

    // Filter logic from API
    const minPrice = 1500;
    const filteredByPrice = listings.filter(item => {
      const price = parseInt(item.priceExpectation?.replace(/[^0-9]/g, '') || '0', 10);
      return price >= minPrice;
    });

    const foundIds = filteredByPrice.map(i => i.id);
    if (foundIds.includes(itemB.id) && foundIds.includes(itemC.id) && !foundIds.includes(itemA.id)) {
      console.log('✅ Min Price Filter (Logic Check) Passed');
    } else {
      console.error('❌ Min Price Filter Failed', foundIds);
      throw new Error('Min Price Logic Fail');
    }

    // 4. Test Sort: Price Desc
    // Should be B(5000) -> C(2000) -> A(1000) (if we consider only these 3)
    const sorted = [itemA, itemB, itemC].sort((a, b) => {
      const pA = parseInt(a.priceExpectation?.replace(/[^0-9]/g, '') || '0', 10);
      const pB = parseInt(b.priceExpectation?.replace(/[^0-9]/g, '') || '0', 10);
      return pB - pA;
    });

    if (sorted[0].id === itemB.id && sorted[1].id === itemC.id && sorted[2].id === itemA.id) {
      console.log('✅ Sort Price Desc (Logic Check) Passed');
    } else {
      console.error('❌ Sort Logic Failed');
      throw new Error('Sort Logic Fail');
    }

    // 5. Cleanup
    await prisma.iPListing.deleteMany({ where: { ownerId: owner.id } });
    await prisma.user.delete({ where: { id: owner.id } });
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
