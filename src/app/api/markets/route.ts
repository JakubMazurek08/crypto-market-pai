import { NextRequest, NextResponse } from 'next/server';
import { getMarkets } from '@/lib/coingecko';

export async function GET(req: NextRequest) {
  const page = Number(req.nextUrl.searchParams.get('page') ?? '1');
  try {
    const data = await getMarkets(page);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
