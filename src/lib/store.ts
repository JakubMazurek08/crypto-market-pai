'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Holding, Trade } from '@/types';

const STARTING_CASH = 10_000;

interface PortfolioState {
  cashUSD: number;
  holdings: Record<string, Holding>;
  trades: Trade[];
  buy: (
    coinId: string,
    symbol: string,
    name: string,
    image: string,
    priceUSD: number,
    amountUSD: number
  ) => string | null; // returns error string or null on success
  sell: (
    coinId: string,
    symbol: string,
    name: string,
    priceUSD: number,
    quantityCoins: number
  ) => string | null;
  reset: () => void;
}

export const usePortfolio = create<PortfolioState>()(
  persist(
    (set, get) => ({
      cashUSD: STARTING_CASH,
      holdings: {},
      trades: [],

      buy(coinId, symbol, name, image, priceUSD, amountUSD) {
        const { cashUSD, holdings } = get();
        if (amountUSD <= 0) return 'Amount must be positive';
        if (amountUSD > cashUSD) return 'Insufficient funds';

        const quantity = amountUSD / priceUSD;
        const existing = holdings[coinId];

        const newHolding: Holding = existing
          ? {
              ...existing,
              quantity: existing.quantity + quantity,
              avgBuyPrice:
                (existing.avgBuyPrice * existing.quantity + amountUSD) /
                (existing.quantity + quantity),
            }
          : { coinId, symbol, name, image, quantity, avgBuyPrice: priceUSD };

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

        set({
          cashUSD: cashUSD - amountUSD,
          holdings: { ...holdings, [coinId]: newHolding },
          trades: [trade, ...get().trades],
        });
        return null;
      },

      sell(coinId, symbol, name, priceUSD, quantityCoins) {
        const { cashUSD, holdings } = get();
        const holding = holdings[coinId];
        if (!holding) return 'No position to sell';
        if (quantityCoins <= 0) return 'Quantity must be positive';
        if (quantityCoins > holding.quantity) return 'Insufficient holdings';

        const totalUSD = quantityCoins * priceUSD;
        const newQuantity = holding.quantity - quantityCoins;
        const newHoldings = { ...holdings };

        if (newQuantity < 1e-10) {
          delete newHoldings[coinId];
        } else {
          newHoldings[coinId] = { ...holding, quantity: newQuantity };
        }

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

        set({
          cashUSD: cashUSD + totalUSD,
          holdings: newHoldings,
          trades: [trade, ...get().trades],
        });
        return null;
      },

      reset() {
        set({ cashUSD: STARTING_CASH, holdings: {}, trades: [] });
      },
    }),
    {
      name: 'cryptoview-portfolio',
    }
  )
);
