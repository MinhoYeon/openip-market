import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // In real app, get from session
    const status = searchParams.get('status'); // 'Pending', 'Signed', 'All'

    // Mock session - verify with user ID provided or default (in real auth, use session)
    // For this phase, we accept userId as query param for testing, or assume a fixed test user if not provided?
    // Better: use the test seller ID if not provided, for verification convenience.
    const targetUserId = userId || '6372eab1-5a32-4360-bda4-4c236ce03b55'; // Default to Test Seller

    const whereClause: any = {
      OR: [
        { uploaderId: targetUserId },
        // Documents where user is a participant in the room? 
        // Or better: Documents where user has a SignatureRequest
        { signatureRequests: { some: { signerId: targetUserId } } },
        // Or documents in rooms where user is a participant (mock access scope)
        { room: { participants: { some: { userId: targetUserId } } } }
      ]
    };

    if (status && status !== 'All') {
      if (status === 'Action Required') {
        // Documents where I have a PENDING signature request
        whereClause.signatureRequests = {
          some: {
            signerId: targetUserId,
            status: 'Pending'
          }
        };
        // Remove the OR clause if we strictly want "Action Required"
        delete whereClause.OR;
        // Wait, if I am uploader, I don't necessarily need to sign. 
        // Action Required usually means "I need to sign".
      } else if (status === 'Completed') {
        whereClause.signatureStatus = 'Signed';
      }
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        room: { select: { id: true, title: true } },
        uploadedBy: { select: { id: true, name: true } },
        signatureRequests: {
          include: {
            signer: { select: { id: true, name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(documents);
  } catch (error: any) {
    console.error('API ERROR [GET /api/documents]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, uploaderId, fileName, fileData } = body;

    if (!roomId || !uploaderId || !fileName) {
      return NextResponse.json({ error: 'roomId, uploaderId, fileName are required' }, { status: 400 });
    }

    // Creating a new Document record for manual upload
    const doc = await prisma.document.create({
      data: {
        roomId,
        uploaderId,
        fileName,
        fileUrl: `mock://uploaded/${fileName.replace(/\s+/g, '_')}`,
        documentType: 'Other', // General type
        signatureStatus: 'Draft',
        version: 1,
        confidential: 'Private',
        accessScope: '["Buyer", "Seller", "Broker"]'
      }
    });

    // Optionally create Audit Log
    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    console.error('API ERROR [POST /api/documents]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
