'use client';
import {
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TelemetryFrame, THRESHOLDS } from '@shared/types';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 11 },
  labelStyle: { color: '#64748b' },
};
const AXIS_TICK = { fontSize: 10, fill: '#64748b' };
const GRID = { strokeDasharray: '3 3', stroke: '#1e293b' };

function ChartContainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">{title}</p>
      {children}
    </div>
  );
}

export interface ChartAnnotation {
  index: number;
  label: string;
  color: string;
}

interface TrendChartsProps {
  readings: TelemetryFrame[];
  annotations?: ChartAnnotation[];
}

export function TrendCharts({ readings, annotations = [] }: TrendChartsProps) {
  // Build chart data arrays once
  const beltMotorData = readings.map((f, i) => ({
    i,
    t: new Date(f.timestamp).toLocaleTimeString(),
    beltSpeed: f.sensors.beltSpeed,
    motorCurrent: f.sensors.motorCurrent,
  }));

  const bearingData = readings.map((f, i) => ({
    i,
    t: new Date(f.timestamp).toLocaleTimeString(),
    b1: (f.sensors.bearingTemp as number[])[0],
    b2: (f.sensors.bearingTemp as number[])[1],
    b3: (f.sensors.bearingTemp as number[])[2],
    b4: (f.sensors.bearingTemp as number[])[3],
  }));

  const vibData = readings.map((f, i) => ({
    i,
    t: new Date(f.timestamp).toLocaleTimeString(),
    v1: (f.sensors.vibrationRMS as number[])[0],
    v2: (f.sensors.vibrationRMS as number[])[1],
    v3: (f.sensors.vibrationRMS as number[])[2],
    v4: (f.sensors.vibrationRMS as number[])[3],
  }));

  const tphAlignData = readings.map((f, i) => ({
    i,
    t: new Date(f.timestamp).toLocaleTimeString(),
    tph: f.sensors.tonnesPerHour,
    alignment: f.sensors.alignmentDeviation,
  }));

  const lineProps = {
    dot: false as const,
    isAnimationActive: false,
    strokeWidth: 1.8,
  };

  const annotationLines = (yAxisId?: string) =>
    annotations.map((ann) => (
      <ReferenceLine
        key={ann.index}
        x={ann.index}
        stroke={ann.color}
        strokeWidth={1.5}
        strokeDasharray="4 2"
        {...(yAxisId ? { yAxisId } : {})}
        label={{ value: ann.label, position: 'insideTopRight', fontSize: 9, fill: ann.color }}
      />
    ));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chart 1: Belt Speed + Motor Current (dual axis) */}
      <ChartContainer title="Belt Speed &amp; Motor Current">
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={beltMotorData}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="i" hide />
            <YAxis yAxisId="l" tick={AXIS_TICK} width={32} label={{ value: 'm/s', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
            <YAxis yAxisId="r" orientation="right" tick={AXIS_TICK} width={32} label={{ value: 'A', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 10 }} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine yAxisId="l" y={THRESHOLDS.beltSpeed.amber} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.6} />
            <ReferenceLine yAxisId="r" y={THRESHOLDS.motorCurrent.amber} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.6} />
            <ReferenceLine yAxisId="r" y={THRESHOLDS.motorCurrent.red}   stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.6} />
            <Line yAxisId="l" dataKey="beltSpeed"    name="Belt Speed (m/s)"    stroke="#60a5fa" {...lineProps} />
            <Line yAxisId="r" dataKey="motorCurrent" name="Motor Current (A)"  stroke="#a78bfa" {...lineProps} />
            {annotationLines('l')}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Chart 2: Bearing Temperatures */}
      <ChartContainer title="Bearing Temperatures (°C)">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={bearingData}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="i" hide />
            <YAxis tick={AXIS_TICK} width={32} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={THRESHOLDS.bearingTemp.amber} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.6} />
            <ReferenceLine y={THRESHOLDS.bearingTemp.red}   stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.6} />
            <Line dataKey="b1" name="Bearing 1" stroke="#f87171" {...lineProps} />
            <Line dataKey="b2" name="Bearing 2" stroke="#fbbf24" {...lineProps} />
            <Line dataKey="b3" name="Bearing 3" stroke="#fb923c" {...lineProps} />
            <Line dataKey="b4" name="Bearing 4" stroke="#f43f5e" {...lineProps} />
            {annotationLines()}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Chart 3: Vibration RMS */}
      <ChartContainer title="Vibration RMS (mm/s)">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={vibData}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="i" hide />
            <YAxis tick={AXIS_TICK} width={32} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={THRESHOLDS.vibrationRMS.amber} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.6} />
            <ReferenceLine y={THRESHOLDS.vibrationRMS.red}   stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.6} />
            <Line dataKey="v1" name="Vib 1" stroke="#c084fc" {...lineProps} />
            <Line dataKey="v2" name="Vib 2" stroke="#e879f9" {...lineProps} />
            <Line dataKey="v3" name="Vib 3" stroke="#f472b6" {...lineProps} />
            <Line dataKey="v4" name="Vib 4" stroke="#a78bfa" {...lineProps} />
            {annotationLines()}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Chart 4: Throughput + Alignment (dual axis) */}
      <ChartContainer title="Throughput &amp; Alignment">
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={tphAlignData}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="i" hide />
            <YAxis yAxisId="l" tick={AXIS_TICK} width={36} label={{ value: 't/h', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
            <YAxis yAxisId="r" orientation="right" tick={AXIS_TICK} width={32} label={{ value: 'mm', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 10 }} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine yAxisId="l" y={THRESHOLDS.tonnesPerHour.amber} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.6} />
            <ReferenceLine yAxisId="l" y={THRESHOLDS.tonnesPerHour.red}   stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.6} />
            <ReferenceLine yAxisId="r" y={THRESHOLDS.alignmentDeviation.amber} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.6} />
            <ReferenceLine yAxisId="r" y={THRESHOLDS.alignmentDeviation.red}   stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.6} />
            <Line yAxisId="l" dataKey="tph"       name="Throughput (t/h)" stroke="#34d399" {...lineProps} />
            <Line yAxisId="r" dataKey="alignment" name="Alignment (mm)"   stroke="#fb923c" {...lineProps} />
            {annotationLines('l')}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
