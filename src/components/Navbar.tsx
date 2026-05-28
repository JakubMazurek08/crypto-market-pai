'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Wallet, BarChart2, LogIn, LogOut, UserPlus, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePortfolio } from '@/lib/store';
import { formatUSD } from '@/lib/format';
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

const links = [
  { href: '/', label: 'Markets', icon: BarChart2 },
  { href: '/portfolio', label: 'Portfolio', icon: Wallet },
];

export default function Navbar() {
  const pathname = usePathname();
  const { cashUSD, holdings, user, isAuthenticated, authLoading, login, register, logout, checkAuth } = usePortfolio();

  const holdingsCount = Object.keys(holdings).length;
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin() {
    setLoading(true);
    const err = await login(email, password);
    setLoading(false);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success('Logged in successfully');
    setEmail('');
    setPassword('');
    setAuthOpen(false);
  }

  async function handleRegister() {
    setLoading(true);
    const err = await register(email, password);
    setLoading(false);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success('Account created successfully');
    setEmail('');
    setPassword('');
    setAuthOpen(false);
  }

  async function handleLogout() {
    await logout();
    toast.success('Logged out');
  }

  function openAuth(tab: 'login' | 'register') {
    setAuthTab(tab);
    setAuthOpen(true);
  }

  return (
    <>
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

          {/* Auth + Cash display */}
          <div className="flex items-center gap-3">
            {isAuthenticated && !authLoading && (
              <div className="hidden items-center gap-1.5 text-sm sm:flex">
                <span className="text-muted-foreground">Cash:</span>
                <span className="font-semibold text-emerald-400">{formatUSD(cashUSD)}</span>
              </div>
            )}

            {authLoading ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-accent" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-1.5 text-sm sm:flex">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs max-w-[120px] truncate">
                    {user?.email}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => openAuth('login')}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Login
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={() => openAuth('register')}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Register</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth dialog */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {authTab === 'login' ? 'Log in to CryptoView' : 'Create an Account'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as 'login' | 'register')}>
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
              <TabsTrigger value="register" className="flex-1">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <Button
                onClick={handleLogin}
                disabled={loading || !email || !password}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                You&apos;ll start with $10,000 virtual cash to trade crypto.
              </p>
              <Button
                onClick={handleRegister}
                disabled={loading || !email || !password}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
