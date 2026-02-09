import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/documents/[id]/sign-request — create signature requests for signers
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: documentId } = await params;

  try {
    const body = await request.json();
    const { signerIds, deadlineAt } = body;

    if (!signerIds || !Array.isArray(signerIds) || signerIds.length === 0) {
      return NextResponse.json({ error: 'signerIds array is required' }, { status: 400 });
    }

    // Verify document exists
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Create signature requests for each signer
    const requests = await Promise.all(
      signerIds.map((signerId: string) =>
        prisma.signatureRequest.upsert({
          where: { documentId_signerId: { documentId, signerId } },
          create: {
            documentId,
            signerId,
            deadlineAt: deadlineAt ? new Date(deadlineAt) : null
          },
          update: {
            status: 'Pending',
            deadlineAt: deadlineAt ? new Date(deadlineAt) : null,
            signedAt: null,
            rejectedAt: null,
            rejectReason: null
          },
          include: {
            signer: { select: { id: true, name: true, email: true } }
          }
        })
      )
    );

    // Update document status to SignRequested
    await prisma.document.update({
      where: { id: documentId },
      data: { signatureStatus: 'SignRequested' }
    });

    return NextResponse.json({ signatureRequests: requests }, { status: 201 });
  } catch (error: any) {
    console.error(`API ERROR [POST /api/documents/${documentId}/sign-request]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// GET /api/documents/[id]/sign-request — get signature requests for a document
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: documentId } = await params;

  try {
    const requests = await prisma.signatureRequest.findMany({
      where: { documentId },
      include: {
        signer: { select: { id: true, name: true, email: true } },
        document: { select: { id: true, fileName: true, documentType: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error(`API ERROR [GET /api/documents/${documentId}/sign-request]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
