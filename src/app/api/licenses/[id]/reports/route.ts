
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/licenses/[id]/reports - List reports for a license
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: licenseId } = await params;

  try {
    const reports = await prisma.royaltyReport.findMany({
      where: { licenseId },
      orderBy: { period: 'desc' }
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

// POST /api/licenses/[id]/reports - Submit a new report
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: licenseId } = await params;

  try {
    const body = await request.json();
    const { period, grossRevenue, royaltyAmount, evidenceUrl } = body;

    if (!period || !grossRevenue || !royaltyAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const report = await prisma.royaltyReport.create({
      data: {
        licenseId,
        period,
        grossRevenue,
        royaltyAmount,
        evidenceUrl,
        status: 'Pending'
      }
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
