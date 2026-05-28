# Plan 01 — API Integration (CoinGecko)

## Why CoinGecko

- Completely free for basic usage (no API key required)
- Generous rate limits on the public tier (~10–30 req/min)
- Endpoints cover everything we need: list, current prices, OHLC/history

## Key Endpoints Used

### 1. Coin List with Market Data
```
GET https://api.coingecko.com/api/v3/coins/markets
  ?vs_currency=usd
  &order=market_cap_desc
  &per_page=100
  &page=1
  &sparkline=true
  &price_change_percentage=24h
```
Returns: id, name, symbol, current_price, market_cap, price_change_24h, image, sparkline_in_7d

### 2. Coin Price History (for charts)
```
GET https://api.coingecko.com/api/v3/coins/{id}/market_chart
  ?vs_currency=usd
  &days=7          # 1 / 7 / 30 / 365
  &interval=daily  # omit for hourly on small ranges
```
Returns: { prices: [[timestamp, price], ...] }

### 3. Coin Detail
```
GET https://api.coingecko.com/api/v3/coins/{id}
  ?localization=false
  &tickers=false
  &market_data=true
  &community_data=false
```

## API Wrapper (`src/lib/coingecko.ts`)

```ts
const BASE = 'https://api.coingecko.com/api/v3'

export async function getMarkets(page = 1): Promise<CoinMarket[]>
export async function getCoinHistory(id: string, days: number): Promise<PricePoint[]>
export async function getCoinDetail(id: string): Promise<CoinDetail>
```

## Next.js Route Handlers (server-side proxy)

To avoid CORS issues and cache responses:

```
app/api/markets/route.ts          GET  → CoinGecko /coins/markets
app/api/coin/[id]/history/route.ts GET → CoinGecko /coins/{id}/market_chart
app/api/coin/[id]/detail/route.ts  GET → CoinGecko /coins/{id}
```

Next.js `fetch` built-in caching will be used:
- Markets: `revalidate: 60` (1 min)
- History: `revalidate: 300` (5 min)

## Error Handling

- Retry once on 429 (rate limit)
- Show skeleton loaders while fetching
- Toast notification on persistent failure
