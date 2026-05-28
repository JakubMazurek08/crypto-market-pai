export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  sparkline_in_7d: { price: number[] };
  circulating_supply: number;
  ath: number;
  ath_change_percentage: number;
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  image: { thumb: string; small: string; large: string };
  market_data: {
    current_price: { usd: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    market_cap: { usd: number };
    total_volume: { usd: number };
    circulating_supply: number;
    ath: { usd: number };
    ath_change_percentage: { usd: number };
    high_24h: { usd: number };
    low_24h: { usd: number };
  };
  description: { en: string };
}

export type Timeframe = '1' | '7' | '30' | '365';

// ---- Portfolio / Trading ----

export interface Holding {
  coinId: string;
  symbol: string;
  name: string;
  image: string;
  quantity: number;
  avgBuyPrice: number;
}

export interface Trade {
  id: string;
  type: 'buy' | 'sell';
  coinId: string;
  symbol: string;
  name: string;
  quantity: number;
  priceUSD: number;
  totalUSD: number;
  timestamp: number;
}
