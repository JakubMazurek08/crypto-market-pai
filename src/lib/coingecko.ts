import type { CoinMarket, PricePoint, CoinDetail } from '@/types';

const BASE = 'https://api.coingecko.com/api/v3';

async function fetchCG<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate },
    headers: { Accept: 'application/json' },
  });

  if (res.status === 429) {
    // Simple retry after 2s on rate limit
    await new Promise((r) => setTimeout(r, 2000));
    const retry = await fetch(`${BASE}${path}`, {
      next: { revalidate },
      headers: { Accept: 'application/json' },
    });
    if (!retry.ok) throw new Error(`CoinGecko error: ${retry.status}`);
    return retry.json() as Promise<T>;
  }

  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getMarkets(page = 1): Promise<CoinMarket[]> {
  const params = new URLSearchParams({
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: '100',
    page: String(page),
    sparkline: 'true',
    price_change_percentage: '7d',
  });
  return fetchCG<CoinMarket[]>(`/coins/markets?${params}`, 60);
}

export async function getCoinHistory(
  id: string,
  days: number
): Promise<PricePoint[]> {
  const params = new URLSearchParams({
    vs_currency: 'usd',
    days: String(days),
    ...(days >= 30 ? { interval: 'daily' } : {}),
  });
  const data = await fetchCG<{ prices: [number, number][] }>(
    `/coins/${id}/market_chart?${params}`,
    300
  );
  return data.prices.map(([timestamp, price]) => ({ timestamp, price }));
}

export async function getCoinDetail(id: string): Promise<CoinDetail> {
  const params = new URLSearchParams({
    localization: 'false',
    tickers: 'false',
    market_data: 'true',
    community_data: 'false',
    developer_data: 'false',
  });
  return fetchCG<CoinDetail>(`/coins/${id}?${params}`, 60);
}
