# Plan 03 — Trading Simulation (Phase 2)

## Concept

Users get a virtual wallet of **$10,000 USD** and can buy/sell any coin at the current live price. No real money involved — state persists in `localStorage`.

---

## State Shape (Zustand)

```ts
interface PortfolioStore {
  cashUSD: number                          // remaining cash
  holdings: Record<string, Holding>        // coinId → holding
  trades: Trade[]                          // full history

  buy(coinId: string, coinSymbol: string, priceUSD: number, amountUSD: number): void
  sell(coinId: string, coinSymbol: string, priceUSD: number, amountCoins: number): void
  reset(): void
}

interface Holding {
  coinId: string
  symbol: string
  name: string
  image: string
  quantity: number        // coins held
  avgBuyPrice: number     // weighted average
}

interface Trade {
  id: string
  type: 'buy' | 'sell'
  coinId: string
  symbol: string
  quantity: number
  priceUSD: number
  totalUSD: number
  timestamp: number
}
```

---

## TradeModal Component

Triggered by "Buy" / "Sell" buttons on the coin detail page.

### Buy flow
1. User enters USD amount (or coin amount — toggle)
2. Shows: "You'll receive X BTC at $Y/BTC"
3. Validates: insufficient funds check
4. On confirm: deducts cash, adds to holdings

### Sell flow
1. User enters coin quantity (or USD value — toggle)
2. Shows available balance, current P&L
3. Validates: can't sell more than held
4. On confirm: removes from holdings, adds cash

### UI
- shadcn `Dialog`
- `Tabs` for Buy / Sell
- `Input` with currency formatting
- Real-time calculation preview
- `Button` disabled until valid

---

## `/portfolio` — Portfolio Dashboard

### Summary cards (top row)
- Total Portfolio Value (cash + holdings at live price)
- Total P&L ($) and P&L (%)
- Cash Available
- Number of positions

### Holdings table
Columns: Coin | Qty | Avg Buy | Current Price | Current Value | P&L $ | P&L % | Actions (Sell)

### Trade History
- Full log table: Date | Type | Coin | Qty | Price | Total
- Sortable by date
- Color-coded: green rows for buys, red for sells (inverted intuition? No — buys are entries, show neutral; sells show P&L)

### Portfolio Value Chart
- Line chart showing total portfolio value over time (calculated from trade history + price snapshots)
- Simulated by replaying trades at historical prices (best effort, using history API)

---

## Reset

A "Reset Portfolio" button (with confirmation dialog) resets everything to $10,000 cash.

---

## Pages Summary

| Route | Component | Description |
|---|---|---|
| `/` | `MarketPage` | Coin table |
| `/coin/[id]` | `CoinPage` | Chart + Buy/Sell |
| `/portfolio` | `PortfolioPage` | Dashboard |
