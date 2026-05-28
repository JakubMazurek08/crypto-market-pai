'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Holding, Trade } from '@/types';

const STARTING_CASH = 10_000;

interface AuthUser {
  id: string;
  email: string;
}

interface PortfolioState {
  // Auth state
  user: AuthUser | null;
  isAuthenticated: boolean;
  authLoading: boolean;

  // Portfolio state
  cashUSD: number;
  holdings: Record<string, Holding>;
  trades: Trade[];

  // Auth actions
  register: (email: string, password: string) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;

  // Trade actions (now calls API)
  buy: (
    coinId: string,
    symbol: string,
    name: string,
    image: string,
    priceUSD: number,
    amountUSD: number
  ) => Promise<string | null>;
  sell: (
    coinId: string,
    symbol: string,
    name: string,
    priceUSD: number,
    quantityCoins: number
  ) => Promise<string | null>;

  // Portfolio sync
  fetchPortfolio: () => Promise<void>;
  reset: () => void;
}

export const usePortfolio = create<PortfolioState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      authLoading: true,
      cashUSD: STARTING_CASH,
      holdings: {},
      trades: [],

      // ---- Auth actions ----

      async register(email, password) {
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();

          if (!data.success) return data.error || 'Registration failed';

          set({
            user: data.user,
            isAuthenticated: true,
            authLoading: false,
          });

          // Fetch portfolio after register
          await get().fetchPortfolio();
          return null;
        } catch {
          return 'Network error';
        }
      },

      async login(email, password) {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();

          if (!data.success) return data.error || 'Login failed';

          set({
            user: data.user,
            isAuthenticated: true,
            authLoading: false,
          });

          // Fetch portfolio after login
          await get().fetchPortfolio();
          return null;
        } catch {
          return 'Network error';
        }
      },

      async logout() {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
          // Ignore logout errors
        }
        set({
          user: null,
          isAuthenticated: false,
          authLoading: false,
          cashUSD: STARTING_CASH,
          holdings: {},
          trades: [],
        });
      },

      async checkAuth() {
        try {
          const res = await fetch('/api/auth/me');
          const data = await res.json();

          if (data.success && data.user) {
            set({
              user: data.user,
              isAuthenticated: true,
              authLoading: false,
            });
            await get().fetchPortfolio();
          } else {
            set({
              user: null,
              isAuthenticated: false,
              authLoading: false,
            });
          }
        } catch {
          set({
            user: null,
            isAuthenticated: false,
            authLoading: false,
          });
        }
      },

      // ---- Trade actions (API-backed) ----

      async buy(coinId, symbol, name, image, priceUSD, amountUSD) {
        if (!get().isAuthenticated) return 'Please log in to trade';

        try {
          const res = await fetch('/api/trade/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coinId, symbol, name, image, priceUSD, amountUSD }),
          });
          const data = await res.json();

          if (!data.success) return data.error || 'Buy failed';

          // Update local state from server response
          set({
            cashUSD: data.portfolio.cashUSD,
            holdings: data.portfolio.holdings,
            trades: [data.trade, ...get().trades],
          });

          return null;
        } catch {
          return 'Network error';
        }
      },

      async sell(coinId, symbol, name, priceUSD, quantityCoins) {
        if (!get().isAuthenticated) return 'Please log in to trade';

        try {
          const res = await fetch('/api/trade/sell', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coinId, symbol, name, priceUSD, quantityCoins }),
          });
          const data = await res.json();

          if (!data.success) return data.error || 'Sell failed';

          // Update local state from server response
          set({
            cashUSD: data.portfolio.cashUSD,
            holdings: data.portfolio.holdings,
            trades: [data.trade, ...get().trades],
          });

          return null;
        } catch {
          return 'Network error';
        }
      },

      // ---- Portfolio sync ----

      async fetchPortfolio() {
        try {
          const res = await fetch('/api/portfolio');
          const data = await res.json();

          if (data.cashUSD !== undefined) {
            set({
              cashUSD: data.cashUSD,
              holdings: data.holdings || {},
              trades: data.trades || [],
            });
          }
        } catch {
          // Silently fail — cached data will be shown
        }
      },

      reset() {
        set({ cashUSD: STARTING_CASH, holdings: {}, trades: [] });
      },
    }),
    {
      name: 'cryptoview-portfolio',
      // Only persist auth + portfolio state, not loading flags
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        cashUSD: state.cashUSD,
        holdings: state.holdings,
        trades: state.trades,
      }),
    }
  )
);
