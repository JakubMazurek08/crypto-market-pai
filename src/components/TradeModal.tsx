'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePortfolio } from '@/lib/store';
import { formatUSD, formatCoinAmount } from '@/lib/format';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  coinId: string;
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  currentPrice: number;
  defaultTab?: 'buy' | 'sell';
}

export default function TradeModal({
  open,
  onOpenChange,
  coinId,
  coinName,
  coinSymbol,
  coinImage,
  currentPrice,
  defaultTab = 'buy',
}: Props) {
  const { cashUSD, holdings, buy, sell } = usePortfolio();
  const holding = holdings[coinId];

  const [tab, setTab] = useState<'buy' | 'sell'>(defaultTab);
  const [usdInput, setUsdInput] = useState('');
  const [coinInput, setCoinInput] = useState('');
  const [inputMode, setInputMode] = useState<'usd' | 'coin'>('usd');

  const usdAmount = useMemo(() => {
    if (inputMode === 'usd') return parseFloat(usdInput) || 0;
    return (parseFloat(coinInput) || 0) * currentPrice;
  }, [inputMode, usdInput, coinInput, currentPrice]);

  const coinAmount = useMemo(() => {
    if (inputMode === 'coin') return parseFloat(coinInput) || 0;
    return usdAmount / currentPrice;
  }, [inputMode, coinInput, usdAmount, currentPrice]);

  async function handleBuy() {
    const err = await buy(coinId, coinSymbol, coinName, coinImage, currentPrice, usdAmount);
    if (err) { toast.error(err); return; }
    toast.success(`Bought ${formatCoinAmount(coinAmount)} ${coinSymbol.toUpperCase()} for ${formatUSD(usdAmount)}`);
    setUsdInput(''); setCoinInput('');
    onOpenChange(false);
  }

  async function handleSell() {
    const err = await sell(coinId, coinSymbol, coinName, currentPrice, coinAmount);
    if (err) { toast.error(err); return; }
    toast.success(`Sold ${formatCoinAmount(coinAmount)} ${coinSymbol.toUpperCase()} for ${formatUSD(usdAmount)}`);
    setUsdInput(''); setCoinInput('');
    onOpenChange(false);
  }

  const buyDisabled = usdAmount <= 0 || usdAmount > cashUSD;
  const sellDisabled = coinAmount <= 0 || !holding || coinAmount > holding.quantity;

  const pnl = holding
    ? (currentPrice - holding.avgBuyPrice) * holding.quantity
    : null;
  const pnlPct = holding
    ? ((currentPrice - holding.avgBuyPrice) / holding.avgBuyPrice) * 100
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coinImage} alt={coinName} className="h-7 w-7 rounded-full" />
            Trade {coinName}
            <Badge variant="outline" className="ml-auto font-mono text-xs">
              {formatUSD(currentPrice)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'buy' | 'sell')}>
          <TabsList className="w-full">
            <TabsTrigger value="buy" className="flex-1">Buy</TabsTrigger>
            <TabsTrigger value="sell" className="flex-1">Sell</TabsTrigger>
          </TabsList>

          {/* BUY TAB */}
          <TabsContent value="buy" className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Available cash</span>
              <span className="font-semibold text-emerald-400">{formatUSD(cashUSD)}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setInputMode('usd')}
                className={`flex-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${inputMode === 'usd' ? 'border-primary bg-accent' : 'border-border text-muted-foreground hover:bg-accent/50'}`}
              >
                USD
              </button>
              <button
                onClick={() => setInputMode('coin')}
                className={`flex-1 rounded-lg border px-3 py-1.5 text-xs uppercase transition-colors ${inputMode === 'coin' ? 'border-primary bg-accent' : 'border-border text-muted-foreground hover:bg-accent/50'}`}
              >
                {coinSymbol}
              </button>
            </div>

            {inputMode === 'usd' ? (
              <div className="space-y-1.5">
                <Label>Amount (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-7 font-mono"
                    value={usdInput}
                    onChange={(e) => setUsdInput(e.target.value)}
                  />
                </div>
                <div className="flex gap-1">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setUsdInput(String(((cashUSD * pct) / 100).toFixed(2)))}
                      className="flex-1 rounded border border-border py-1 text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Amount ({coinSymbol.toUpperCase()})</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  className="font-mono"
                  value={coinInput}
                  onChange={(e) => setCoinInput(e.target.value)}
                />
              </div>
            )}

            {usdAmount > 0 && (
              <>
                <Separator />
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You&apos;ll receive</span>
                    <span className="font-mono font-medium">{formatCoinAmount(coinAmount)} {coinSymbol.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total cost</span>
                    <span className="font-mono font-medium">{formatUSD(usdAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining cash</span>
                    <span className={`font-mono font-medium ${usdAmount > cashUSD ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatUSD(cashUSD - usdAmount)}
                    </span>
                  </div>
                </div>
              </>
            )}

            <Button
              onClick={handleBuy}
              disabled={buyDisabled}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
            >
              Buy {coinSymbol.toUpperCase()}
            </Button>
          </TabsContent>

          {/* SELL TAB */}
          <TabsContent value="sell" className="space-y-4 pt-2">
            {holding ? (
              <>
                <div className="rounded-lg border border-border bg-accent/30 p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Holdings</span>
                    <span className="font-mono font-medium">{formatCoinAmount(holding.quantity)} {coinSymbol.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg buy price</span>
                    <span className="font-mono">{formatUSD(holding.avgBuyPrice)}</span>
                  </div>
                  {pnl !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unrealized P&amp;L</span>
                      <span className={`font-mono font-medium ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pnl >= 0 ? '+' : ''}{formatUSD(pnl)} ({pnlPct!.toFixed(2)}%)
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setInputMode('usd')}
                    className={`flex-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${inputMode === 'usd' ? 'border-primary bg-accent' : 'border-border text-muted-foreground hover:bg-accent/50'}`}
                  >
                    USD
                  </button>
                  <button
                    onClick={() => setInputMode('coin')}
                    className={`flex-1 rounded-lg border px-3 py-1.5 text-xs uppercase transition-colors ${inputMode === 'coin' ? 'border-primary bg-accent' : 'border-border text-muted-foreground hover:bg-accent/50'}`}
                  >
                    {coinSymbol}
                  </button>
                </div>

                {inputMode === 'coin' ? (
                  <div className="space-y-1.5">
                    <Label>Quantity ({coinSymbol.toUpperCase()})</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="font-mono"
                      value={coinInput}
                      onChange={(e) => setCoinInput(e.target.value)}
                    />
                    <div className="flex gap-1">
                      {[25, 50, 75, 100].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => setCoinInput(String(((holding.quantity * pct) / 100).toFixed(8)))}
                          className="flex-1 rounded border border-border py-1 text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>Amount (USD)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-7 font-mono"
                        value={usdInput}
                        onChange={(e) => setUsdInput(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {coinAmount > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Selling</span>
                        <span className="font-mono font-medium">{formatCoinAmount(coinAmount)} {coinSymbol.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">You&apos;ll receive</span>
                        <span className="font-mono font-medium">{formatUSD(usdAmount)}</span>
                      </div>
                    </div>
                  </>
                )}

                <Button
                  onClick={handleSell}
                  disabled={sellDisabled}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                >
                  Sell {coinSymbol.toUpperCase()}
                </Button>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">
                You don&apos;t hold any {coinName}. Buy some first!
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
