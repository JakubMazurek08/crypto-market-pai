import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getUserFromRequest } from '@/lib/auth';
import { getPortfolio, updatePortfolio, addTrade } from '@/lib/db';
import type { SellRequest, Trade } from '@/types';

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

    const body = (await request.json()) as SellRequest;
    const { coinId, symbol, name, priceUSD, quantityCoins } = body;

    // Validate input
    if (!coinId || !symbol || !name || !priceUSD || !quantityCoins) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (quantityCoins <= 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be positive' },
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

    // Check holding exists
    const holding = portfolio.holdings[coinId];
    if (!holding) {
      return NextResponse.json(
        { success: false, error: 'No position to sell' },
        { status: 400 }
      );
    }

    // Check sufficient quantity
    if (quantityCoins > holding.quantity) {
      return NextResponse.json(
        { success: false, error: 'Insufficient holdings' },
        { status: 400 }
      );
    }

    // Calculate proceeds
    const totalUSD = quantityCoins * priceUSD;
    const newQuantity = holding.quantity - quantityCoins;
    const newHoldings = { ...portfolio.holdings };

    if (newQuantity < 1e-10) {
      delete newHoldings[coinId];
    } else {
      newHoldings[coinId] = { ...holding, quantity: newQuantity };
    }

    const newCash = portfolio.cashUSD + totalUSD;

    // Create trade record
    const trade: Trade = {
      id: nanoid(),
      type: 'sell',
      coinId,
      symbol,
      name,
      quantity: quantityCoins,
      priceUSD,
      totalUSD,
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
    console.error('Sell error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
