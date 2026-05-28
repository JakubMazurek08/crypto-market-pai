# Plan 02 — Chart Viewing (Phase 1)

## Pages

### `/` — Market Overview
- Full-width `CoinTable` component
- Columns: Rank | Logo + Name | Symbol | Price | 24h % | 7d Sparkline | Market Cap | Volume
- Search/filter input
- Clicking a row navigates to `/coin/[id]`

### `/coin/[id]` — Coin Detail + Chart
- Header: logo, name, symbol, current price, 24h change badge
- `PriceChart` component (main feature)
- Stats grid: market cap, volume, circulating supply, all-time high

## PriceChart Component

Uses `react-chartjs-2` Line chart.

### Timeframe tabs
| Label | `days` param | Interval |
|---|---|---|
| 1D | 1 | hourly (auto) |
| 7D | 7 | hourly |
| 30D | 30 | daily |
| 1Y | 365 | daily |

### Chart config
```ts
{
  type: 'line',
  options: {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { type: 'time', ... },
      y: { position: 'right', ticks: { callback: formatUSD } }
    }
  }
}
```

### Color logic
- If price now > price at start of period → green gradient fill
- Else → red gradient fill

### Sparklines in table
- Mini inline Chart.js line chart (no axes) using `sparkline_in_7d` data
- 100×40px canvas

## Components Breakdown

```
CoinTable
  ├── SearchBar
  ├── CoinTableRow (map)
  │     └── SparklineChart (mini Chart.js)
  └── Pagination

CoinDetailHeader
  ├── CoinLogo
  ├── PriceBadge (current price + % change)
  └── StatGrid

PriceChart
  ├── TimeframeSelector (tabs: 1D / 7D / 30D / 1Y)
  └── LineChart (react-chartjs-2)
```

## Skeleton Loading

Each component has a `Skeleton` placeholder (shadcn `Skeleton`) shown while data loads.

## Styling Notes

- Dark theme by default (Tailwind `dark` class on `<html>`)
- Chart background: transparent, grid lines subtle (`zinc-800`)
- Positive change: `emerald-400`, negative: `rose-400`
- Card wrapper: `bg-zinc-900 rounded-2xl border border-zinc-800`
