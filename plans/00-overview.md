# CryptoView — Project Overview

A Next.js crypto analysis & trading simulation app.

## Goals

1. Fetch live cryptocurrency prices from a free public API
2. Display interactive price charts (multiple timeframes)
3. Allow users to simulate buy/sell trades against a virtual portfolio
4. Track trade history and portfolio performance

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack, SSR-friendly |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS + shadcn/ui | Polished, consistent UI fast |
| Charts | Chart.js + react-chartjs-2 | Flexible, well-documented |
| Data API | CoinGecko REST API (free) | No API key required for basic endpoints |
| State | Zustand | Lightweight client state for portfolio |
| Storage | localStorage (via Zustand persist) | No backend needed for simulation |

---

## Implementation Phases

### Phase 1 — Market View
- Connect to CoinGecko API
- Coin list with live prices, 24h change, market cap
- Individual coin page with interactive Chart.js price chart
- Timeframe selector: 1D / 7D / 30D / 1Y

### Phase 2 — Trading Simulation
- Virtual wallet (starts with $10,000 USD)
- Buy / Sell modal on any coin page
- Portfolio dashboard: holdings, P&L per coin, total value
- Trade history table

---

## Directory Structure

```
src/
  app/
    page.tsx                  # Market overview (coin list)
    coin/[id]/page.tsx        # Coin detail + chart
    portfolio/page.tsx        # Portfolio dashboard
  components/
    ui/                       # shadcn primitives
    CoinTable.tsx
    PriceChart.tsx
    TradeModal.tsx
    PortfolioSummary.tsx
    Navbar.tsx
  lib/
    coingecko.ts              # API wrapper
    store.ts                  # Zustand portfolio store
    utils.ts
  types/
    index.ts
plans/
  00-overview.md
  01-api.md
  02-charts.md
  03-trading.md
```
