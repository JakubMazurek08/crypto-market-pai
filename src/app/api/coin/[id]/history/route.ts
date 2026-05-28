import { NextRequest, NextResponse } from 'next/server';
import { getCoinHistory } from '@/lib/coingecko';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const days = Number(req.nextUrl.searchParams.get('days') ?? '7');
  try {
    const data = await getCoinHistory(id, days);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
