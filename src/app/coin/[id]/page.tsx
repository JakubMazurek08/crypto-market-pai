import { getCoinDetail } from '@/lib/coingecko';
import CoinDetailClient from './CoinDetailClient';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export default async function CoinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let coin;
  try {
    coin = await getCoinDetail(id);
  } catch {
    notFound();
  }

  return <CoinDetailClient coin={coin} />;
}
