import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET documents for a room
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  try {
    const documents = await prisma.document.findMany({
      where: { roomId },
      include: {
        uploadedBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(documents);
  } catch (error: any) {
    console.error(`API ERROR [GET /api/rooms/${roomId}/documents]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST upload a document record
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  try {
    const body = await request.json();
    const { uploaderId, fileName, fileUrl, fileSize, documentType, confidential } = body;

    if (!uploaderId || !fileName || !fileUrl || !documentType) {
      return NextResponse.json(
        { error: 'uploaderId, fileName, fileUrl, and documentType are required' },
        { status: 400 }
      );
    }

    const document = await prisma.document.create({
      data: {
        roomId,
        uploaderId,
        fileName,
        fileUrl,
        fileSize: fileSize || 0,
        documentType,
        confidential: confidential || 'Private'
      },
      include: {
        uploadedBy: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error(`API ERROR [POST /api/rooms/${roomId}/documents]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
