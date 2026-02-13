
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting License & Royalty Verification...');

  try {
    // 1. Create Mock Users
    const licensor = await prisma.user.create({
      data: { name: 'Licensor User', email: `licensor_${Date.now()}@test.com`, role: 'Owner' }
    });

    const licensee = await prisma.user.create({
      data: { name: 'Licensee User', email: `licensee_${Date.now()}@test.com`, role: 'Buyer' }
    });

    // 2. Create Mock IP Listing
    const ip = await prisma.iPListing.create({
      data: {
        title: 'Licensed IP Asset',
        ipType: 'Patent',
        ownerId: licensor.id,
        visibility: 'Full'
      }
    });

    // 3. Create Mock Room (Required for License in Schema)
    const room = await prisma.room.create({
      data: {
        type: 'Deal',
        status: 'Active',
        title: ip.title
      }
    });

    // 4. Create License
    const license = await prisma.license.create({
      data: {
        roomId: room.id,
        ipListingId: ip.id,
        licensorId: licensor.id,
        licenseeId: licensee.id,
        licenseType: 'Exclusive',
        status: 'Active',
        royaltyRate: '5%',
        duration: '3 years'
      }
    });
    console.log('✅ Created License:', license.id);

    // 5. Simulate API: Get Licenses for Licensee
    const userLicenses = await prisma.license.findMany({
      where: {
        OR: [{ licensorId: licensee.id }, { licenseeId: licensee.id }]
      }
    });
    if (userLicenses.length > 0 && userLicenses[0].id === license.id) {
      console.log('✅ API Logic: Fetch User Licenses Passed');
    } else {
      throw new Error('API Logic: Fetch User Licenses Failed');
    }

    // 6. Simulate API: Submit Royalty Report
    const report = await prisma.royaltyReport.create({
      data: {
        licenseId: license.id,
        period: '2026-Q1',
        grossRevenue: '100,000,000',
        royaltyAmount: '5,000,000',
        status: 'Pending'
      }
    });
    console.log('✅ Submitted Royalty Report:', report.id);

    // 7. Verification: Check Reports
    const savedReports = await prisma.royaltyReport.findMany({
      where: { licenseId: license.id }
    });

    if (savedReports.length === 1 && savedReports[0].grossRevenue === '100,000,000') {
      console.log('✅ Verified Report Persistence');
    } else {
      throw new Error('Report Verification Failed');
    }

    // 8. Cleanup
    await prisma.royaltyReport.deleteMany({ where: { licenseId: license.id } });
    await prisma.license.delete({ where: { id: license.id } });
    await prisma.room.delete({ where: { id: room.id } });
    await prisma.iPListing.delete({ where: { id: ip.id } });
    await prisma.user.delete({ where: { id: licensor.id } });
    await prisma.user.delete({ where: { id: licensee.id } });

    console.log('🎉 VERIFICATION SUCCESSFUL');

  } catch (e) {
    console.error('❌ Verification Failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
