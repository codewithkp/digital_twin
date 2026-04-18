'use client';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TelemetryFrame, THRESHOLDS } from '@shared/types';

type ScalarSensorKey = 'beltSpeed' | 'motorCurrent' | 'tonnesPerHour' | 'alignmentDeviation';

interface SensorChartProps {
  history: TelemetryFrame[];
  sensorKey: ScalarSensorKey;
  label: string;
  unit: string;
  color?: string;
}

export function SensorChart({ history, sensorKey, label, unit, color = '#60a5fa' }: SensorChartProps) {
  const data = history.map((f) => ({ v: f.sensors[sensorKey] }));
  const thresh = THRESHOLDS[sensorKey];

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <p className="text-slate-400 text-xs uppercase tracking-wide mb-3">{label}</p>
      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={data}>
          <YAxis width={36} tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [`${v.toFixed(2)} ${unit}`, label]}
            labelFormatter={() => ''}
          />
          <ReferenceLine y={thresh.amber} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.7} />
          <ReferenceLine y={thresh.red}   stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.7} />
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
