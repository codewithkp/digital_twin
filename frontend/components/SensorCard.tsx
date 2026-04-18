'use client';
import { useId } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { HealthStatus } from '@shared/types';
import { StatusBadge } from './StatusBadge';

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const uid = useId().replace(/:/g, '');
  const data = values.map((v) => ({ v }));
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${uid})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── SensorCard ───────────────────────────────────────────────────────────────

const BORDER: Record<HealthStatus, string> = {
  GREEN: 'border-slate-700',
  AMBER: 'border-amber-400/50',
  RED:   'border-red-500/60',
};

interface SensorCardProps {
  label: string;
  value: number;
  unit: string;
  status: HealthStatus;
  thresholds: { amber: number; red: number };
  sparklineValues: number[];   // last 60 readings
  minVal: number;
  maxVal: number;
  color: string;
  inverted?: boolean;
}

export function SensorCard({
  label,
  value,
  unit,
  status,
  thresholds,
  sparklineValues,
  minVal,
  maxVal,
  color,
  inverted = false,
}: SensorCardProps) {
  return (
    <div className={`bg-slate-800 rounded-xl border p-3 flex flex-col gap-2 ${BORDER[status]}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-1">
        <span className="text-slate-400 text-[11px] uppercase tracking-wide leading-tight">{label}</span>
        <StatusBadge status={status} />
      </div>

      {/* Current value */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white font-mono">{value.toFixed(value < 10 ? 2 : 1)}</span>
        <span className="text-slate-400 text-xs">{unit}</span>
      </div>

      {/* Sparkline */}
      <Sparkline values={sparklineValues} color={color} />

      {/* Min / Max */}
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>Min {minVal.toFixed(1)}</span>
        <span>Max {maxVal.toFixed(1)}</span>
      </div>

      {/* Thresholds */}
      <div className="flex gap-2 text-[10px]">
        <span className="text-amber-400">⚑ {inverted ? '<' : '≥'}{thresholds.amber} {unit}</span>
        <span className="text-red-400">● {inverted ? '<' : '≥'}{thresholds.red} {unit}</span>
      </div>
    </div>
  );
}
