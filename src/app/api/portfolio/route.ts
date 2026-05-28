import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPortfolio, getTransactions } from '@/lib/db';

export async function GET() {
  try {
    // Auth check
    const auth = await getUserFromRequest();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get portfolio and transactions
    const portfolio = await getPortfolio(auth.userId);
    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    const trades = await getTransactions(auth.userId);

    return NextResponse.json({
      cashUSD: portfolio.cashUSD,
      holdings: portfolio.holdings,
      trades,
    });
  } catch (error) {
    console.error('Portfolio error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
