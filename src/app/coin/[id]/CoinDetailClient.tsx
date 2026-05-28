'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, ShoppingCart, TrendingDown as SellIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PriceChart from '@/components/PriceChart';
import TradeModal from '@/components/TradeModal';
import { usePortfolio } from '@/lib/store';
import { formatUSD, formatPct, formatNumber } from '@/lib/format';
import type { CoinDetail } from '@/types';

interface Props {
  coin: CoinDetail;
}

export default function CoinDetailClient({ coin }: Props) {
  const [tradeOpen, setTradeOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<'buy' | 'sell'>('buy');
  const { holdings } = usePortfolio();
  const holding = holdings[coin.id];

  const md = coin.market_data;
  const change24h = md.price_change_percentage_24h;
  const isPos = change24h >= 0;
  const currentPrice = md.current_price.usd;

  function openTrade(tab: 'buy' | 'sell') {
    setDefaultTab(tab);
    setTradeOpen(true);
  }

  const stats = [
    { label: 'Market Cap', value: formatUSD(md.market_cap.usd, true) },
    { label: '24h Volume', value: formatUSD(md.total_volume.usd, true) },
    { label: '24h High', value: formatUSD(md.high_24h.usd) },
    { label: '24h Low', value: formatUSD(md.low_24h.usd) },
    { label: 'All-Time High', value: formatUSD(md.ath.usd) },
    { label: 'ATH Change', value: formatPct(md.ath_change_percentage.usd) },
    { label: 'Circulating Supply', value: formatNumber(md.circulating_supply, 0) + ' ' + coin.symbol.toUpperCase() },
    { label: '7d Change', value: formatPct(md.price_change_percentage_7d) },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Back */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Markets
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Image
            src={coin.image.large}
            alt={coin.name}
            width={64}
            height={64}
            className="rounded-full"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{coin.name}</h1>
              <span className="rounded bg-accent px-2 py-0.5 text-sm uppercase text-muted-foreground font-mono">
                {coin.symbol}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-2xl font-semibold font-mono">
                {formatUSD(currentPrice)}
              </span>
              <Badge
                variant="outline"
                className={
                  isPos
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                }
              >
                {isPos ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                {formatPct(change24h)} (24h)
              </Badge>
            </div>
          </div>
        </div>

        {/* Trade buttons */}
        <div className="flex items-center gap-2">
          {holding && (
            <div className="text-right text-sm mr-2">
              <p className="text-muted-foreground">Your holdings</p>
              <p className="font-semibold font-mono">{formatUSD(holding.quantity * currentPrice)}</p>
            </div>
          )}
          <Button
            onClick={() => openTrade('buy')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <ShoppingCart className="mr-1 h-4 w-4" />
            Buy
          </Button>
          {holding && (
            <Button
              onClick={() => openTrade('sell')}
              variant="outline"
              className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
            >
              <SellIcon className="mr-1 h-4 w-4" />
              Sell
            </Button>
          )}
        </div>
      </div>

      {/* Chart */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <PriceChart coinId={coin.id} />
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-mono font-semibold text-sm">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trade modal */}
      <TradeModal
        open={tradeOpen}
        onOpenChange={setTradeOpen}
        coinId={coin.id}
        coinName={coin.name}
        coinSymbol={coin.symbol}
        coinImage={coin.image.large}
        currentPrice={currentPrice}
        defaultTab={defaultTab}
      />
    </div>
  );
}
