import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/rooms/[id]/documents/generate — Generate a document (e.g. NDA)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  try {
    const body = await request.json();
    const { templateType, creatorId } = body; // templateType: 'NDA', 'License'

    if (!templateType || !creatorId) {
      return NextResponse.json({ error: 'templateType and creatorId are required' }, { status: 400 });
    }

    // 1. Fetch Room and Participants
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        ipListing: { select: { title: true, owner: { select: { name: true } } } },
        participants: { include: { user: { select: { id: true, name: true, email: true } } } }
      }
    });

    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    // 2. Identify Parties (Simplified: Buyer vs Seller/Broker)
    const buyer = room.participants.find(p => p.role === 'Buyer')?.user;
    const seller = room.participants.find(p => ['Seller', 'BrokerSeller'].includes(p.role))?.user;

    if (!buyer || !seller) {
      return NextResponse.json({ error: 'Room must have both Buyer and Seller to generate NDA' }, { status: 400 });
    }

    // 3. Generate Content (Mock Template)
    const effectiveDate = new Date().toLocaleDateString('ko-KR');
    let title = '';
    let content = '';

    if (templateType === 'NDA') {
      title = `NDA - ${room.ipListing.title}`;
      content = `
# 비밀유지계약서 (NDA)

**계약일:** ${effectiveDate}
**대상 IP:** ${room.ipListing.title}

**갑 (정보제공자):** ${seller.name} (${seller.email})
**을 (정보수령자):** ${buyer.name} (${buyer.email})

제1조 (목적)
본 계약은 "갑"이 보유한 지식재산권 관련 정보를 "을"에게 제공함에 있어, 상호간의 비밀유지 의무를 규정함을 목적으로 한다.

제2조 (비밀정보의 정의)
"비밀정보"라 함은 본 계약과 관련하여 "갑"이 "을"에게 제공하는 기술적, 경영적 정보를 말한다.

제3조 (비밀유지 의무)
"을"은 제공받은 비밀정보를 제3자에게 누설하거나 본 계약 목적 이외의 용도로 사용해서는 안 된다.

(이하 생략)
      `;
    } else {
      return NextResponse.json({ error: 'Unsupported template type' }, { status: 400 });
    }

    // 4. Create Document
    const doc = await prisma.document.create({
      data: {
        roomId,
        fileName: `${title}.txt`, // Mock file extension
        fileUrl: `mock://${title.replace(/\s/g, '_')}`, // Mock URL
        documentType: templateType,
        uploaderId: creatorId,
        version: 1,
        signatureStatus: 'SignRequested', // Immediately request signatures
        accessScope: '["Buyer", "Seller", "Broker", "BrokerSeller"]',
        effectiveDate: new Date()
      }
    });

    // 5. Create Signature Requests for both parties
    await prisma.signatureRequest.createMany({
      data: [
        { documentId: doc.id, signerId: buyer.id, status: 'Pending' },
        { documentId: doc.id, signerId: seller.id, status: 'Pending' }
      ]
    });

    // 6. Audit Log
    await prisma.auditLog.create({
      data: {
        roomId,
        actorId: creatorId,
        action: 'documentGenerated',
        targetType: 'Document',
        targetId: doc.id,
        detail: JSON.stringify({ templateType, title: doc.fileName })
      }
    });

    return NextResponse.json(doc, { status: 201 });

  } catch (error: any) {
    console.error(`API ERROR [POST /api/rooms/${roomId}/documents/generate]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
