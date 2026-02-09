import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/mandates/[id] — mandate detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const mandate = await prisma.mandate.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        broker: { select: { id: true, name: true, email: true, role: true } },
        ipListing: { select: { id: true, title: true, ipType: true, status: true } }
      }
    });

    if (!mandate) {
      return NextResponse.json({ error: 'Mandate not found' }, { status: 404 });
    }

    return NextResponse.json(mandate);
  } catch (error: any) {
    console.error(`API ERROR [GET /api/mandates/${id}]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/mandates/[id] — update mandate (scope change, status transitions)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { action, scope, message } = body;

    const mandate = await prisma.mandate.findUnique({ where: { id } });
    if (!mandate) {
      return NextResponse.json({ error: 'Mandate not found' }, { status: 404 });
    }

    const data: any = {};

    // Action-based status transitions
    if (action === 'accept') {
      if (mandate.status !== 'Pending') {
        return NextResponse.json({ error: 'Only Pending mandates can be accepted' }, { status: 400 });
      }
      data.status = 'Active';
    } else if (action === 'suspend') {
      if (mandate.status !== 'Active') {
        return NextResponse.json({ error: 'Only Active mandates can be suspended' }, { status: 400 });
      }
      data.status = 'Suspended';
    } else if (action === 'resume') {
      if (mandate.status !== 'Suspended') {
        return NextResponse.json({ error: 'Only Suspended mandates can be resumed' }, { status: 400 });
      }
      data.status = 'Active';
    } else if (action === 'terminate') {
      if (['Terminated'].includes(mandate.status)) {
        return NextResponse.json({ error: 'Mandate already terminated' }, { status: 400 });
      }
      data.status = 'Terminated';
    } else if (action === 'reject') {
      if (mandate.status !== 'Pending') {
        return NextResponse.json({ error: 'Only Pending mandates can be rejected' }, { status: 400 });
      }
      data.status = 'Terminated';
    }

    // Update scope if provided
    if (scope) {
      data.scope = JSON.stringify(scope);
    }

    if (message !== undefined) {
      data.message = message;
    }

    const updated = await prisma.mandate.update({
      where: { id },
      data,
      include: {
        owner: { select: { id: true, name: true, role: true } },
        broker: { select: { id: true, name: true, role: true } },
        ipListing: { select: { id: true, title: true } }
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`API ERROR [PUT /api/mandates/${id}]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
