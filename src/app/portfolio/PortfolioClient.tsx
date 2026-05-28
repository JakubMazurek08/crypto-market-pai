'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Briefcase, RotateCcw, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import TradeModal from '@/components/TradeModal';
import { usePortfolio } from '@/lib/store';
import { formatUSD, formatPct, formatCoinAmount, formatDate } from '@/lib/format';
import type { CoinMarket, Holding } from '@/types';

export default function PortfolioClient() {
  const { cashUSD, holdings, trades, reset } = usePortfolio();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [resetOpen, setResetOpen] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell'>('sell');

  const holdingsList = Object.values(holdings);

  useEffect(() => {
    if (holdingsList.length === 0) { setLoadingPrices(false); return; }
    fetch('/api/markets')
      .then((r) => r.json())
      .then((data: CoinMarket[]) => {
        const map: Record<string, number> = {};
        data.forEach((c) => { map[c.id] = c.current_price; });
        setPrices(map);
        setLoadingPrices(false);
      })
      .catch(() => setLoadingPrices(false));
  }, [holdingsList.length]);

  const holdingsValue = holdingsList.reduce((sum, h) => {
    const price = prices[h.coinId] ?? h.avgBuyPrice;
    return sum + h.quantity * price;
  }, 0);

  const costBasis = holdingsList.reduce(
    (sum, h) => sum + h.quantity * h.avgBuyPrice,
    0
  );

  const totalValue = cashUSD + holdingsValue;
  const totalPnL = holdingsValue - costBasis;
  const totalPnLPct = costBasis > 0 ? (totalPnL / costBasis) * 100 : 0;

  const summaryCards = [
    {
      label: 'Total Portfolio Value',
      value: formatUSD(totalValue),
      icon: Briefcase,
      sub: `${holdingsList.length} position${holdingsList.length !== 1 ? 's' : ''}`,
      color: 'text-foreground',
    },
    {
      label: 'Unrealized P&L',
      value: (totalPnL >= 0 ? '+' : '') + formatUSD(totalPnL),
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
      sub: formatPct(totalPnLPct),
      color: totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400',
    },
    {
      label: 'Cash Available',
      value: formatUSD(cashUSD),
      icon: DollarSign,
      sub: totalValue > 0 ? `${((cashUSD / totalValue) * 100).toFixed(1)}% of portfolio` : '100% of portfolio',
      color: 'text-emerald-400',
    },
    {
      label: 'Holdings Value',
      value: loadingPrices ? '...' : formatUSD(holdingsValue),
      icon: RefreshCw,
      sub: `Cost basis: ${formatUSD(costBasis)}`,
      color: 'text-foreground',
    },
  ];

  function openSell(h: Holding) {
    setSelectedHolding(h);
    setTradeTab('sell');
    setTradeOpen(true);
  }

  function openBuy(h: Holding) {
    setSelectedHolding(h);
    setTradeTab('buy');
    setTradeOpen(true);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="mt-1 text-muted-foreground">
            Your virtual trading portfolio — starting with $10,000
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-rose-400 hover:border-rose-500/50"
          onClick={() => setResetOpen(true)}
        >
          <RotateCcw className="h-4 w-4" />
          Reset Portfolio
        </Button>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <c.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className={`mt-2 text-2xl font-bold font-mono ${c.color}`}>{c.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Holdings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Holdings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {holdingsList.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No open positions.</p>
              <Link href="/" className="mt-2 inline-block text-sm text-emerald-400 hover:underline">
                Browse markets to start trading →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coin</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Avg Buy</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">P&amp;L</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdingsList.map((h) => {
                    const price = prices[h.coinId] ?? h.avgBuyPrice;
                    const value = h.quantity * price;
                    const pnl = (price - h.avgBuyPrice) * h.quantity;
                    const pnlPct = ((price - h.avgBuyPrice) / h.avgBuyPrice) * 100;
                    const pos = pnl >= 0;
                    return (
                      <TableRow key={h.coinId}>
                        <TableCell>
                          <Link href={`/coin/${h.coinId}`} className="flex items-center gap-2 hover:underline">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={h.image} alt={h.name} className="h-7 w-7 rounded-full" />
                            <div>
                              <p className="font-medium">{h.name}</p>
                              <p className="text-xs text-muted-foreground uppercase">{h.symbol}</p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCoinAmount(h.quantity)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">
                          {formatUSD(h.avgBuyPrice)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {loadingPrices ? '…' : formatUSD(price)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {loadingPrices ? '…' : formatUSD(value)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`text-sm font-mono font-medium ${pos ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {pos ? '+' : ''}{formatUSD(pnl)}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${pos ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}
                          >
                            {formatPct(pnlPct)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => openBuy(h)}
                            >
                              <ShoppingCart className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                              onClick={() => openSell(h)}
                            >
                              Sell
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trade history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trade History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {trades.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No trades yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Coin</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(t.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            t.type === 'buy'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                          }
                        >
                          {t.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/coin/${t.coinId}`} className="flex items-center gap-1.5 hover:underline">
                          <span className="font-medium">{t.name}</span>
                          <span className="text-xs text-muted-foreground uppercase">{t.symbol}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCoinAmount(t.quantity)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {formatUSD(t.priceUSD)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        {t.type === 'sell' ? (
                          <span className="text-emerald-400">+{formatUSD(t.totalUSD)}</span>
                        ) : (
                          <span className="text-rose-400">-{formatUSD(t.totalUSD)}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset confirmation */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Portfolio?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will clear all holdings and trade history, resetting your portfolio to $10,000 cash. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button
              className="bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => { reset(); setResetOpen(false); }}
            >
              Reset
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trade modal */}
      {selectedHolding && (
        <TradeModal
          open={tradeOpen}
          onOpenChange={setTradeOpen}
          coinId={selectedHolding.coinId}
          coinName={selectedHolding.name}
          coinSymbol={selectedHolding.symbol}
          coinImage={selectedHolding.image}
          currentPrice={prices[selectedHolding.coinId] ?? selectedHolding.avgBuyPrice}
          defaultTab={tradeTab}
        />
      )}
    </div>
  );
}
