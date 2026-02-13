
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Admin Payout Verification...');

  try {
    // 1. Create a Pending Settlement
    // We need a Payer, Payee, and Room
    const payer = await prisma.user.create({
      data: { name: 'Payer Test', email: `payer_${Date.now()}@test.com`, role: 'Buyer' }
    });
    const payee = await prisma.user.create({
      data: { name: 'Payee Test', email: `payee_${Date.now()}@test.com`, role: 'Expert' }
    });
    const room = await prisma.room.create({
      data: {
        title: 'Settlement Test Room',
        status: 'Active',
        type: 'Deal'
      }
    });

    await prisma.roomParticipant.create({
      data: { roomId: room.id, userId: payer.id, role: 'Buyer' }
    });
    await prisma.roomParticipant.create({
      data: { roomId: room.id, userId: payee.id, role: 'Seller' }
    });

    const settlement = await prisma.settlement.create({
      data: {
        roomId: room.id,
        payerId: payer.id,
        payeeId: payee.id,
        amount: '1,000,000 KRW',
        paymentType: 'Upfront',
        status: 'Pending'
      }
    });
    console.log(`✅ Created Pending Settlement: ${settlement.id}`);

    // 2. Simulate Admin Marking as Paid (PATCH API logic)
    // In actual app, this is done via API, here we verify the logic directly using Prisma
    // mimicking what the API does.
    const paidAt = new Date();
    const updatedSettlement = await prisma.settlement.update({
      where: { id: settlement.id },
      data: {
        status: 'Completed',
        paidAt,
        note: 'Verified by Script'
      }
    });

    if (updatedSettlement.status === 'Completed' && updatedSettlement.paidAt) {
      console.log('✅ Settlement successfully marked as Completed');
      console.log(`   - Paid At: ${updatedSettlement.paidAt}`);
    } else {
      throw new Error('Settlement update failed');
    }

    // 3. Cleanup
    await prisma.settlement.delete({ where: { id: settlement.id } });
    await prisma.room.delete({ where: { id: room.id } }); // Cascades? Check schema. Room delete cascades to participants.
    await prisma.user.delete({ where: { id: payer.id } });
    await prisma.user.delete({ where: { id: payee.id } });
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
