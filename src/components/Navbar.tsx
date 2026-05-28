'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Wallet, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortfolio } from '@/lib/store';
import { formatUSD } from '@/lib/format';

const links = [
  { href: '/', label: 'Markets', icon: BarChart2 },
  { href: '/portfolio', label: 'Portfolio', icon: Wallet },
];

export default function Navbar() {
  const pathname = usePathname();
  const { cashUSD, holdings } = usePortfolio();

  const holdingsCount = Object.keys(holdings).length;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            CryptoView
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {label === 'Portfolio' && holdingsCount > 0 && (
                <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-400">
                  {holdingsCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Cash display */}
        <div className="hidden items-center gap-1.5 text-sm sm:flex">
          <span className="text-muted-foreground">Cash:</span>
          <span className="font-semibold text-emerald-400">{formatUSD(cashUSD)}</span>
        </div>
      </div>
    </header>
  );
}
