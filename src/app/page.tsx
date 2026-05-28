import CoinTable from '@/components/CoinTable';

export default function MarketPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Crypto Markets
        </h1>
        <p className="mt-1 text-muted-foreground">
          Live prices for the top 100 cryptocurrencies by market cap
        </p>
      </div>
      <CoinTable />
    </div>
  );
}
