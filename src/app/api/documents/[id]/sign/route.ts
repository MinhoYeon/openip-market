import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/documents/[id]/sign — sign or reject a document
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: documentId } = await params;

  try {
    const body = await request.json();
    const { signerId, action, rejectReason, signatureData } = body;

    if (!signerId || !action) {
      return NextResponse.json({ error: 'signerId and action are required' }, { status: 400 });
    }

    if (!['sign', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "sign" or "reject"' }, { status: 400 });
    }

    // Find the signature request
    const sigReq = await prisma.signatureRequest.findUnique({
      where: { documentId_signerId: { documentId, signerId } },
      include: { document: true }
    });

    if (!sigReq) {
      return NextResponse.json({ error: 'No signature request found for this signer' }, { status: 404 });
    }

    if (sigReq.status !== 'Pending') {
      return NextResponse.json({ error: `Signature already ${sigReq.status}` }, { status: 400 });
    }

    if (action === 'sign') {
      await prisma.signatureRequest.update({
        where: { id: sigReq.id },
        data: { status: 'Signed', signedAt: new Date(), signatureData }
      });

      // Check if all signers have signed → update document to Signed
      const allRequests = await prisma.signatureRequest.findMany({
        where: { documentId }
      });
      console.log(`[DEBUG] Document ${documentId}: Found ${allRequests.length} sig requests.`);
      allRequests.forEach(r => console.log(` - Signer ${r.signerId}: ${r.status} (ID: ${r.id})`));

      // Check strictly against DB state since we just updated current one
      const allSigned = allRequests.every(r => r.status === 'Signed');
      console.log(`[DEBUG] All Signed? ${allSigned}`);

      if (allSigned) {
        // 1. Update Document Status
        await prisma.document.update({
          where: { id: documentId },
          data: { signatureStatus: 'Signed' }
        });

        // 2. Trigger Settlement if Contract
        // We assume 'License' or 'Assignment' types imply a Deal.
        // We need to find the Room and Accepted Offer.
        const room = await prisma.room.findUnique({
          where: { id: sigReq.document.roomId }, // need to fetch doc if not avail
          include: {
            offers: { where: { status: 'Accepted' }, orderBy: { createdAt: 'desc' }, take: 1 }
          }
        });

        if (room && room.offers.length > 0) {
          const offer = room.offers[0];
          // Determine Payer/Payee
          // Buyer (Payer) -> Platform (Payee/Escrow)
          // Find Buyer participant
          const buyerPart = await prisma.roomParticipant.findFirst({ where: { roomId: room.id, role: 'Buyer' } });
          const payerId = buyerPart?.userId;
          const payeeId = 'PLATFORM_WALLET'; // Placeholder or Admin User ID

          if (payerId) {
            // Fetch Active Fee Policy
            const policy = await prisma.feePolicy.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
            const feeJson = policy ? JSON.stringify(policy) : '{"default": true}';

            await prisma.settlement.create({
              data: {
                roomId: room.id,
                payerId: payerId!,
                payeeId,
                amount: offer.price || '0', // e.g. "10000000"
                paymentType: 'Escrow',
                status: 'Pending',
                note: `Auto-created from Contract. Policy: ${policy?.name || 'Default'} (${policy?.ratePercent || 10}%)`
              }
            });

            // Log Fee Application
            await prisma.auditLog.create({
              data: {
                roomId: room.id,
                actorId: 'SYSTEM',
                action: 'FeePolicyApplied',
                targetType: 'Settlement',
                detail: feeJson
              }
            });

            // CRITICAL: Update Room Status to 'Settling'
            await prisma.room.update({
              where: { id: room.id },
              data: { status: 'Settling' }
            });
          }
        }
      }
    } else {
      // reject
      await prisma.signatureRequest.update({
        where: { id: sigReq.id },
        data: { status: 'Rejected', rejectedAt: new Date(), rejectReason }
      });

      await prisma.document.update({
        where: { id: documentId },
        data: { signatureStatus: 'Rejected' }
      });
    }

    // Fetch updated document with all sig requests
    const updatedDoc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        signatureRequests: {
          include: {
            signer: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    // Notify if Fully Signed or Rejected
    if (updatedDoc && (updatedDoc.signatureStatus === 'Signed' || updatedDoc.signatureStatus === 'Rejected')) {
      const { createNotification } = await import('@/lib/notification');
      const msg = updatedDoc.signatureStatus === 'Signed'
        ? `Document "${updatedDoc.fileName}" has been fully signed.`
        : `Document "${updatedDoc.fileName}" was rejected.`;

      const recipients = new Set<string>();
      if (updatedDoc.uploaderId) recipients.add(updatedDoc.uploaderId);
      updatedDoc.signatureRequests.forEach(r => recipients.add(r.signerId));

      for (const uid of Array.from(recipients)) {
        await createNotification(uid, 'DOCUMENT', msg, `/documents?id=${updatedDoc.id}`);
      }
    }

    return NextResponse.json(updatedDoc);
  } catch (error: any) {
    console.error(`API ERROR [POST /api/documents/${documentId}/sign]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
