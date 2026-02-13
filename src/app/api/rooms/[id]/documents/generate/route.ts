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
    if (!room.ipListing) return NextResponse.json({ error: 'IP Listing not found in room' }, { status: 400 });

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
    } else if (templateType === 'License') {
      title = `License Agreement - ${room.ipListing.title}`;
      content = `
# 기술이전(라이선스) 계약서

**계약일:** ${effectiveDate}
**대상 IP:** ${room.ipListing.title}

**갑 (권리자):** ${seller.name} (${seller.email})
**을 (실시권자):** ${buyer.name} (${buyer.email})

제1조 (목적)
본 계약은 "갑"이 보유한 지식재산권의 실시권을 "을"에게 허락하고, "을"은 이에 대한 대가를 지급함에 있어 필요한 제반 사항을 규정함에 있다.

제2조 (실시권의 범위)
1. "갑"은 "을"에게 대상 IP에 대한 [독점적/비독점적] 통상실시권을 허락한다.
2. 실시 지역은 [전세계/대한민국]으로 한다.

제3조 (기술료)
"을"은 "갑"에게 합의된 기술료를 정해진 기한 내에 현금으로 지급한다.

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
