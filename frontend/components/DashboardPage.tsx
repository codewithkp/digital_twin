'use client';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useConveyorData } from '@/hooks/useConveyorData';
import { healthForValue, THRESHOLDS } from '@shared/types';
import { SensorCard } from './SensorCard';
import { AlertCard } from './AlertCard';
import { AssetTree } from './AssetTree';
import { TrendCharts } from './TrendCharts';
import { DevToolbar } from './DevToolbar';
import { AssetDetailPanel } from './AssetDetailPanel';
import { NavBar } from './NavBar';

const ConveyorScene = dynamic(() => import('./ConveyorScene').then((m) => m.ConveyorScene), {
  ssr: false,
  loading: () => <div className="w-full h-52 bg-slate-900 rounded-xl animate-pulse" />,
});

function sparkline(readings: { value: number }[]) {
  return readings.slice(-60).map((r) => r.value);
}

export function DashboardPage() {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const {
    latestReading,
    last300Readings,
    activeAlerts,
    flaggedGroupIds,
    flagAlert,
  } = useConveyorData();

  const sensors = latestReading?.sensors;

  // Derive per-sensor sparkline arrays from last300Readings
  const derived = useMemo(() => {
    const beltSpark    = last300Readings.map((f) => ({ value: f.sensors.beltSpeed }));
    const motorSpark   = last300Readings.map((f) => ({ value: f.sensors.motorCurrent }));
    const tphSpark     = last300Readings.map((f) => ({ value: f.sensors.tonnesPerHour }));
    const alignSpark   = last300Readings.map((f) => ({ value: f.sensors.alignmentDeviation }));
    const bearingSpark = [0, 1, 2, 3].map((i) =>
      last300Readings.map((f) => ({ value: (f.sensors.bearingTemp as number[])[i] })),
    );
    const vibSpark = [0, 1, 2, 3].map((i) =>
      last300Readings.map((f) => ({ value: (f.sensors.vibrationRMS as number[])[i] })),
    );

    const vals = (arr: { value: number }[]) => arr.map((r) => r.value);

    return { beltSpark, motorSpark, tphSpark, alignSpark, bearingSpark, vibSpark, vals };
  }, [last300Readings]);

  const minMax = (arr: { value: number }[]) => {
    if (!arr.length) return { min: 0, max: 0 };
    const vs = arr.map((r) => r.value);
    return { min: Math.min(...vs), max: Math.max(...vs) };
  };

  const beltMM    = minMax(derived.beltSpark);
  const motorMM   = minMax(derived.motorSpark);
  const tphMM     = minMax(derived.tphSpark);
  const alignMM   = minMax(derived.alignSpark);
  const bearingMMs = derived.bearingSpark.map(minMax);
  const vibMMs     = derived.vibSpark.map(minMax);

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col">
      <NavBar />

      {/* Dev toolbar subheader — DevToolbar returns null in production */}
      <div className="flex items-center px-4 py-1.5 border-b border-yellow-900/20 empty:hidden">
        <DevToolbar />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ── Sidebar — hidden on mobile, visible at md (768px+) ─────────── */}
        <aside className="hidden md:flex w-72 xl:w-80 border-r border-slate-700 flex-col overflow-hidden shrink-0">
          {/* Asset Tree */}
          <div className="p-4 border-b border-slate-700">
            <AssetTree alerts={activeAlerts} />
          </div>

          {/* Alert Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">
              Active Alerts ({activeAlerts.length})
            </p>
            {activeAlerts.length === 0 ? (
              <p className="text-slate-600 text-xs">All sensors within thresholds.</p>
            ) : (
              activeAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onFlag={(alertId, groupId) => flagAlert(alertId, groupId)}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── Main ───────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 3D Conveyor Scene */}
          <div className="h-52">
            <ConveyorScene
              sensorData={latestReading}
              onComponentClick={(id) => setSelectedAssetId(id)}
              flaggedIds={flaggedGroupIds}
            />
          </div>

          {/* Sensor Cards Grid */}
          <section>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Sensor Readings</p>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {/* Scalar sensors */}
              <SensorCard
                label="Belt Speed"
                value={sensors?.beltSpeed ?? 0}
                unit="m/s"
                status={healthForValue(sensors?.beltSpeed ?? 0, THRESHOLDS.beltSpeed)}
                thresholds={THRESHOLDS.beltSpeed}
                sparklineValues={sparkline(derived.beltSpark)}
                minVal={beltMM.min}
                maxVal={beltMM.max}
                color="#60a5fa"
              />
              <SensorCard
                label="Motor Current"
                value={sensors?.motorCurrent ?? 0}
                unit="A"
                status={healthForValue(sensors?.motorCurrent ?? 0, THRESHOLDS.motorCurrent)}
                thresholds={THRESHOLDS.motorCurrent}
                sparklineValues={sparkline(derived.motorSpark)}
                minVal={motorMM.min}
                maxVal={motorMM.max}
                color="#a78bfa"
              />
              <SensorCard
                label="Throughput"
                value={sensors?.tonnesPerHour ?? 0}
                unit="t/h"
                status={healthForValue(sensors?.tonnesPerHour ?? 0, THRESHOLDS.tonnesPerHour, true)}
                thresholds={THRESHOLDS.tonnesPerHour}
                sparklineValues={sparkline(derived.tphSpark)}
                minVal={tphMM.min}
                maxVal={tphMM.max}
                color="#34d399"
                inverted
              />
              <SensorCard
                label="Alignment Deviation"
                value={sensors?.alignmentDeviation ?? 0}
                unit="mm"
                status={healthForValue(sensors?.alignmentDeviation ?? 0, THRESHOLDS.alignmentDeviation)}
                thresholds={THRESHOLDS.alignmentDeviation}
                sparklineValues={sparkline(derived.alignSpark)}
                minVal={alignMM.min}
                maxVal={alignMM.max}
                color="#fb923c"
              />

              {/* Bearing Temps */}
              {[0, 1, 2, 3].map((i) => {
                const val = sensors ? (sensors.bearingTemp as number[])[i] : 0;
                return (
                  <SensorCard
                    key={`b${i}`}
                    label={`Bearing Temp ${i + 1}`}
                    value={val}
                    unit="°C"
                    status={healthForValue(val, THRESHOLDS.bearingTemp)}
                    thresholds={THRESHOLDS.bearingTemp}
                    sparklineValues={sparkline(derived.bearingSpark[i])}
                    minVal={bearingMMs[i].min}
                    maxVal={bearingMMs[i].max}
                    color="#f87171"
                  />
                );
              })}

              {/* Vibration RMS */}
              {[0, 1, 2, 3].map((i) => {
                const val = sensors ? (sensors.vibrationRMS as number[])[i] : 0;
                return (
                  <SensorCard
                    key={`v${i}`}
                    label={`Vibration RMS ${i + 1}`}
                    value={val}
                    unit="mm/s"
                    status={healthForValue(val, THRESHOLDS.vibrationRMS)}
                    thresholds={THRESHOLDS.vibrationRMS}
                    sparklineValues={sparkline(derived.vibSpark[i])}
                    minVal={vibMMs[i].min}
                    maxVal={vibMMs[i].max}
                    color="#c084fc"
                  />
                );
              })}
            </div>
          </section>

          {/* Trend Charts */}
          <section>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Trend Charts (last 5 min)</p>
            <TrendCharts readings={last300Readings} />
          </section>
        </main>
      </div>

      {/* Asset Detail Panel (slide-in from right) */}
      <AssetDetailPanel
        assetId={selectedAssetId}
        latestReading={latestReading}
        last300Readings={last300Readings}
        activeAlerts={activeAlerts}
        onClose={() => setSelectedAssetId(null)}
        onFlagMaintenance={flagAlert}
      />
    </div>
  );
}
