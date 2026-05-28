'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import SparklineChart from '@/components/SparklineChart';
import { formatUSD, formatPct, formatNumber } from '@/lib/format';
import type { CoinMarket } from '@/types';

type SortKey = 'market_cap_rank' | 'current_price' | 'price_change_percentage_24h' | 'market_cap' | 'total_volume';

export default function CoinTable() {
  const [coins, setCoins] = useState<CoinMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('market_cap_rank');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    fetch('/api/markets')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCoins(data);
        else setError(data.error ?? 'Failed to load');
        setLoading(false);
      })
      .catch(() => { setError('Network error'); setLoading(false); });
  }, []);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  const filtered = coins
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.symbol.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

  const SortHeader = ({
    k,
    children,
  }: {
    k: SortKey;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search coins…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium">
                  <SortHeader k="market_cap_rank">#</SortHeader>
                </th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-right font-medium">
                  <SortHeader k="current_price">Price</SortHeader>
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <SortHeader k="price_change_percentage_24h">24h %</SortHeader>
                </th>
                <th className="hidden px-4 py-3 text-right font-medium md:table-cell">
                  <SortHeader k="market_cap">Market Cap</SortHeader>
                </th>
                <th className="hidden px-4 py-3 text-right font-medium lg:table-cell">
                  <SortHeader k="total_volume">Volume</SortHeader>
                </th>
                <th className="hidden px-4 py-3 text-right font-medium xl:table-cell">
                  7d Chart
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 20 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-6" /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-12" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                      <td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-4 w-24 ml-auto" /></td>
                      <td className="hidden px-4 py-3 lg:table-cell"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="hidden px-4 py-3 xl:table-cell"><Skeleton className="h-10 w-24 ml-auto" /></td>
                    </tr>
                  ))
                : filtered.map((coin) => {
                    const pos = coin.price_change_percentage_24h >= 0;
                    return (
                      <tr
                        key={coin.id}
                        className="border-b border-border/50 transition-colors hover:bg-accent/30"
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {coin.market_cap_rank}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/coin/${coin.id}`}
                            className="flex items-center gap-3 hover:underline"
                          >
                            <Image
                              src={coin.image}
                              alt={coin.name}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                            <div>
                              <p className="font-medium">{coin.name}</p>
                              <p className="text-xs text-muted-foreground uppercase">
                                {coin.symbol}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium">
                          {formatUSD(coin.current_price)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge
                            variant="outline"
                            className={
                              pos
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                            }
                          >
                            {formatPct(coin.price_change_percentage_24h)}
                          </Badge>
                        </td>
                        <td className="hidden px-4 py-3 text-right font-mono text-muted-foreground md:table-cell">
                          {formatUSD(coin.market_cap, true)}
                        </td>
                        <td className="hidden px-4 py-3 text-right font-mono text-muted-foreground lg:table-cell">
                          {formatUSD(coin.total_volume, true)}
                        </td>
                        <td className="hidden px-4 py-3 xl:table-cell">
                          <div className="flex justify-end">
                            {coin.sparkline_in_7d?.price?.length > 0 && (
                              <SparklineChart
                                data={coin.sparkline_in_7d.price}
                                positive={pos}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              No coins match &quot;{search}&quot;
            </p>
          )}
        </div>
      </div>
      {!loading && (
        <p className="text-xs text-muted-foreground text-center">
          {formatNumber(filtered.length, 0)} coins · Data from CoinGecko · Refreshes every 60s
        </p>
      )}
    </div>
  );
}
