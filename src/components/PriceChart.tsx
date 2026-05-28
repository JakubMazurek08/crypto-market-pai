'use client';

import { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUSD } from '@/lib/format';
import type { PricePoint, Timeframe } from '@/types';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Filler,
  Tooltip,
  Legend
);

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '1D', value: '1' },
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '1Y', value: '365' },
];

interface Props {
  coinId: string;
}

export default function PriceChart({ coinId }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>('7');
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<ChartJS<'line'> | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/coin/${coinId}/history?days=${timeframe}`)
      .then((r) => r.json())
      .then((d: PricePoint[]) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [coinId, timeframe]);

  const prices = data.map((p) => p.price);
  const labels = data.map((p) => new Date(p.timestamp));
  const isPositive = prices.length > 1 && prices[prices.length - 1] >= prices[0];
  const lineColor = isPositive ? 'rgb(52, 211, 153)' : 'rgb(251, 113, 133)';
  const fillColor = isPositive ? 'rgba(52, 211, 153, 0.08)' : 'rgba(251, 113, 133, 0.08)';

  const timeUnit: 'hour' | 'day' | 'month' =
    timeframe === '1' ? 'hour' : timeframe === '7' ? 'day' : timeframe === '30' ? 'day' : 'month';

  return (
    <div className="space-y-3">
      <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
        <TabsList className="h-8">
          {TIMEFRAMES.map((tf) => (
            <TabsTrigger key={tf.value} value={tf.value} className="text-xs px-3">
              {tf.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : (
        <div className="h-72">
          <Line
            ref={chartRef}
            data={{
              labels,
              datasets: [
                {
                  label: 'Price (USD)',
                  data: prices,
                  borderColor: lineColor,
                  borderWidth: 2,
                  pointRadius: 0,
                  pointHoverRadius: 4,
                  tension: 0.3,
                  fill: true,
                  backgroundColor: (ctx) => {
                    const chart = ctx.chart;
                    const { ctx: canvasCtx, chartArea } = chart;
                    if (!chartArea) return fillColor;
                    const gradient = canvasCtx.createLinearGradient(
                      0, chartArea.top, 0, chartArea.bottom
                    );
                    gradient.addColorStop(0, isPositive ? 'rgba(52,211,153,0.25)' : 'rgba(251,113,133,0.25)');
                    gradient.addColorStop(1, 'rgba(0,0,0,0)');
                    return gradient;
                  },
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: 'rgba(0,0,0,0.85)',
                  titleColor: '#a1a1aa',
                  bodyColor: '#f4f4f5',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                  callbacks: {
                    label: (ctx) => `  ${formatUSD(ctx.parsed.y ?? 0)}`,
                  },
                },
              },
              scales: {
                x: {
                  type: 'time',
                  time: { unit: timeUnit },
                  grid: { color: 'rgba(255,255,255,0.05)' },
                  ticks: { color: '#71717a', maxTicksLimit: 8 },
                  border: { display: false },
                },
                y: {
                  position: 'right',
                  grid: { color: 'rgba(255,255,255,0.05)' },
                  ticks: {
                    color: '#71717a',
                    callback: (v) => formatUSD(Number(v), false),
                    maxTicksLimit: 6,
                  },
                  border: { display: false },
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
