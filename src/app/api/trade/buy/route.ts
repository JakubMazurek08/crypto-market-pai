import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getUserFromRequest } from '@/lib/auth';
import { getPortfolio, updatePortfolio, addTrade } from '@/lib/db';
import type { BuyRequest, Trade, Holding } from '@/types';

export async function POST(request: Request) {
  try {
    // Auth check
    const auth = await getUserFromRequest();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as BuyRequest;
    const { coinId, symbol, name, image, priceUSD, amountUSD } = body;

    // Validate input
    if (!coinId || !symbol || !name || !priceUSD || !amountUSD) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amountUSD <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    if (priceUSD <= 0) {
      return NextResponse.json(
        { success: false, error: 'Price must be positive' },
        { status: 400 }
      );
    }

    // Get portfolio
    const portfolio = await getPortfolio(auth.userId);
    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Check sufficient funds
    if (amountUSD > portfolio.cashUSD) {
      return NextResponse.json(
        { success: false, error: 'Insufficient funds' },
        { status: 400 }
      );
    }

    // Calculate quantity
    const quantity = amountUSD / priceUSD;
    const existing = portfolio.holdings[coinId];

    // Update or create holding
    const newHolding: Holding = existing
      ? {
          ...existing,
          quantity: existing.quantity + quantity,
          avgBuyPrice:
            (existing.avgBuyPrice * existing.quantity + amountUSD) /
            (existing.quantity + quantity),
        }
      : { coinId, symbol, name, image, quantity, avgBuyPrice: priceUSD };

    const newHoldings = { ...portfolio.holdings, [coinId]: newHolding };
    const newCash = portfolio.cashUSD - amountUSD;

    // Create trade record
    const trade: Trade = {
      id: nanoid(),
      type: 'buy',
      coinId,
      symbol,
      name,
      quantity,
      priceUSD,
      totalUSD: amountUSD,
      timestamp: Date.now(),
    };

    // Persist changes
    await updatePortfolio(auth.userId, { cashUSD: newCash, holdings: newHoldings });
    await addTrade(auth.userId, trade);

    return NextResponse.json({
      success: true,
      trade,
      portfolio: { cashUSD: newCash, holdings: newHoldings },
    });
  } catch (error) {
    console.error('Buy error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
