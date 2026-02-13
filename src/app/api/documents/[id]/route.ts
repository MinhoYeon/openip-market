
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // In real app, get from session

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: userId required' }, { status: 401 });
    }

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { signatureRequests: true }
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Permission check: Only uploader or Admin can delete
    // Also, if it's already Signed, maybe prevent deletion?
    // User requested "before signing", so if Signed, we block.
    if (doc.signatureStatus === 'Signed') {
      return NextResponse.json({ error: 'Cannot delete a signed document' }, { status: 400 });
    }

    if (doc.uploaderId !== userId) {
      // Allow if admin? For now, strict ownership.
      return NextResponse.json({ error: 'Only the uploader can delete this document' }, { status: 403 });
    }

    // Delete
    await prisma.document.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`API ERROR [DELETE /api/documents/${id}]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
