'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler);

interface Props {
  data: number[];
  positive: boolean;
}

export default function SparklineChart({ data, positive }: Props) {
  const color = positive ? 'rgb(52, 211, 153)' : 'rgb(251, 113, 133)';

  return (
    <div style={{ width: 100, height: 40 }}>
      <Line
        data={{
          labels: data.map((_, i) => i),
          datasets: [
            {
              data,
              borderColor: color,
              borderWidth: 1.5,
              pointRadius: 0,
              tension: 0.3,
              fill: false,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        }}
      />
    </div>
  );
}
