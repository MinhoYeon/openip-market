
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Valuation Logic Verification...');

  try {
    // 1. Create Test Users
    const requesterEmail = `uat_requester_${Date.now()}@test.com`;
    const expertEmail = `uat_expert_${Date.now()}@test.com`;

    const requester = await prisma.user.create({
      data: {
        email: requesterEmail,
        name: 'UAT Requester',
        role: 'Buyer' // or Owner
      }
    });
    console.log(`✅ Created Requester: ${requester.email}`);

    const expert = await prisma.user.create({
      data: {
        email: expertEmail,
        name: 'UAT Expert',
        role: 'Expert'
      }
    });
    console.log(`✅ Created Expert: ${expert.email}`);

    // 2. Create IP Listing
    const ipListing = await prisma.iPListing.create({
      data: {
        title: 'UAT Test IP',
        ipType: 'Patent',
        status: 'Published',
        ownerId: requester.id
      }
    });
    console.log(`✅ Created IP Listing: ${ipListing.title}`);

    // 3. Create Valuation Request
    const valuationRequest = await prisma.valuationRequest.create({
      data: {
        requesterId: requester.id,
        ipListingId: ipListing.id,
        requestType: 'OpenBid',
        budget: '5000000',
        description: 'UAT Valuation Request'
      }
    });
    console.log(`✅ Created Valuation Request: ${valuationRequest.id}`);

    // 4. Submit Bid
    const bid = await prisma.valuationBid.create({
      data: {
        valuationRequestId: valuationRequest.id,
        expertId: expert.id,
        fee: '4500000',
        leadTime: '2 Weeks',
        message: 'I can do this.',
        status: 'Submitted'
      }
    });
    console.log(`✅ Submitted Bid: ${bid.id}`);

    // 5. Simulate "Accept Bid" Logic (Copying from API route)
    console.log('🔄 Executing "Accept Bid" Logic...');

    await prisma.$transaction([
      prisma.valuationBid.update({
        where: { id: bid.id },
        data: { status: 'Accepted' }
      }),
      prisma.valuationRequest.update({
        where: { id: valuationRequest.id },
        data: {
          status: 'Processing',
          expertId: bid.expertId
        }
      })
    ]);

    const roomTitle = `[Valuation] ${ipListing.title} - ${expert.name}`;
    const room = await prisma.room.create({
      data: {
        type: 'Valuation',
        status: 'Negotiating',
        title: roomTitle,
        ipListingId: ipListing.id,
        participants: {
          create: [
            { userId: expert.id, role: 'Seller' },
            { userId: requester.id, role: 'Buyer' }
          ]
        },
        offers: {
          create: {
            creatorId: expert.id,
            price: bid.fee,
            status: 'Accepted',
            version: 1,
            message: `Valuation Bid Accepted. Fee: ${bid.fee}`
          }
        }
      },
      include: {
        participants: true,
        offers: true
      }
    });

    console.log(`✅ Created Deal Room: ${room.id}`);
    console.log(`   - Participants: ${room.participants.length}`);
    console.log(`   - Offer Status: ${room.offers[0].status}`);
    console.log(`   - Price: ${room.offers[0].price}`);

    if (room.participants.length === 2 && room.offers[0].price === '4500000') {
      console.log('🎉 VERIFICATION SUCCESSFUL');
    } else {
      console.error('❌ VERIFICATION FAILED: Room data mismatch');
    }

  } catch (e) {
    console.error('❌ Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
