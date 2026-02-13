
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');

  if (!documentId) {
    // List all documents with signature requests
    const docs = await prisma.document.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        signatureRequests: {
          select: { id: true, signerId: true, status: true, signedAt: true }
        }
      }
    });
    return NextResponse.json(docs);
  }

  // Detailed Analysis for a specific document
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      signatureRequests: {
        include: {
          signer: { select: { id: true, name: true, email: true } }
        }
      }
    }
  });

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const allRequests = doc.signatureRequests;
  const allSigned = allRequests.length > 0 && allRequests.every(r => r.status === 'Signed');
  const docStatus = doc.signatureStatus;

  const analysis = {
    documentId: doc.id,
    fileName: doc.fileName,
    currentStatus: docStatus,
    allRequestsSigned: allSigned,
    statusDataConsisent: (docStatus === 'Signed') === allSigned,
    requests: allRequests.map(r => ({
      id: r.id,
      signer: r.signer.name,
      signerId: r.signerId,
      status: r.status,
      signedAt: r.signedAt
    }))
  };

  // Auto-heal logic if requested
  const shouldHeal = searchParams.get('heal') === 'true';
  let healingResult = null;

  if (shouldHeal && allSigned && docStatus !== 'Signed') {
    await prisma.document.update({
      where: { id: documentId },
      data: { signatureStatus: 'Signed' }
    });
    healingResult = 'Updated document status to Signed';
  } else if (shouldHeal && !allSigned && docStatus === 'Signed') {
    // Revert if incorrect? Maybe risky. Let's just create log.
    healingResult = 'Status says Signed but requests are not all Signed. Manual intervention might be needed.';
  }

  return NextResponse.json({ ...analysis, healingResult });
}
