'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSensorStore } from '@/store/useSensorStore';
import { connectWS, disconnectWS } from '@/lib/websocket';
import { MetricCard } from './MetricCard';
import { SensorChart } from './SensorChart';
import { StatusBadge } from './StatusBadge';
import type { SensorReadings } from '@shared/types';
import { healthForValue, THRESHOLDS } from '@shared/types';

const ConveyorScene = dynamic(
  () => import('./ConveyorScene').then((m) => m.ConveyorScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-72 rounded-xl bg-slate-900 border border-slate-700 animate-pulse" />
    ),
  },
);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ─── Idler group info panel ────────────────────────────────────────────────────

function GroupInfoPanel({
  groupId,
  sensors,
  onClose,
}: {
  groupId: string;
  sensors: SensorReadings;
  onClose: () => void;
}) {
  const idx = parseInt(groupId.replace('group-', ''), 10);
  const bearingTemp = (sensors.bearingTemp as number[])[idx];
  const vibration   = (sensors.vibrationRMS as number[])[idx];
  const tempStatus  = healthForValue(bearingTemp, THRESHOLDS.bearingTemp);
  const vibStatus   = healthForValue(vibration,   THRESHOLDS.vibrationRMS);

  return (
    <div className="flex items-center justify-between gap-6 bg-slate-800 border border-slate-600 rounded-xl px-5 py-3">
      <div className="shrink-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">
          Idler Group {idx + 1}
        </p>
        <p className="text-white font-semibold text-sm">
          Rollers {idx * 2 + 1} &amp; {idx * 2 + 2}
        </p>
      </div>

      <div className="flex gap-8 flex-1">
        <div>
          <p className="text-slate-400 text-xs mb-1">Bearing Temp</p>
          <div className="flex items-center gap-2">
            <span className="text-white font-mono text-sm">{bearingTemp.toFixed(1)} °C</span>
            <StatusBadge status={tempStatus} />
          </div>
        </div>
        <div>
          <p className="text-slate-400 text-xs mb-1">Vibration RMS</p>
          <div className="flex items-center gap-2">
            <span className="text-white font-mono text-sm">{vibration.toFixed(2)} mm/s</span>
            <StatusBadge status={vibStatus} />
          </div>
        </div>
        <div>
          <p className="text-slate-400 text-xs mb-1">Position</p>
          <span className="text-slate-300 text-sm font-mono">
            {idx === 0 ? 'Tail' : idx === 3 ? 'Head' : `Mid-${idx}`}
          </span>
        </div>
      </div>

      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white text-xl leading-none shrink-0"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { latest, history, health, connected, faultInjection, setFaultInjection } =
    useSensorStore();

  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => {
    connectWS();
    return () => disconnectWS();
  }, []);

  const handleComponentClick = (id: string) =>
    setSelectedGroup((prev) => (prev === id ? null : id));

  const toggleFault = async () => {
    const next = !faultInjection;
    await fetch(`${API_URL}/fault-injection/${next}`, { method: 'POST' });
    setFaultInjection(next);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Steel Industry Digital Twin</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {latest?.assetId ?? 'Connecting…'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span className="text-slate-400">{connected ? 'Live' : 'Disconnected'}</span>
          </div>
          <button
            onClick={toggleFault}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              faultInjection
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {faultInjection ? '⚠ Fault Active' : 'Inject Fault'}
          </button>
        </div>
      </header>

      {latest && health ? (
        <>
          {/* 3-D conveyor scene */}
          <div className="mb-3">
            <ConveyorScene
              sensorData={latest}
              onComponentClick={handleComponentClick}
            />
          </div>

          {/* Idler group info panel (shown on click) */}
          {selectedGroup && (
            <div className="mb-4">
              <GroupInfoPanel
                groupId={selectedGroup}
                sensors={latest.sensors}
                onClose={() => setSelectedGroup(null)}
              />
            </div>
          )}

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
            <MetricCard
              label="Belt Speed"
              value={latest.sensors.beltSpeed.toFixed(2)}
              unit="m/s"
              status={health.beltSpeed}
            />
            <MetricCard
              label="Motor Current"
              value={latest.sensors.motorCurrent.toFixed(1)}
              unit="A"
              status={health.motorCurrent}
            />
            <MetricCard
              label="Bearing Temp"
              value={Math.max(...latest.sensors.bearingTemp).toFixed(1)}
              unit="°C"
              status={health.bearingTemp}
            />
            <MetricCard
              label="Vibration RMS"
              value={Math.max(...latest.sensors.vibrationRMS).toFixed(2)}
              unit="mm/s"
              status={health.vibrationRMS}
            />
            <MetricCard
              label="Throughput"
              value={latest.sensors.tonnesPerHour.toFixed(0)}
              unit="t/h"
              status={health.tonnesPerHour}
            />
            <MetricCard
              label="Alignment"
              value={latest.sensors.alignmentDeviation.toFixed(1)}
              unit="mm"
              status={health.alignmentDeviation}
            />
          </div>

          {/* Time-series charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SensorChart
              history={history}
              sensorKey="beltSpeed"
              label="Belt Speed"
              unit="m/s"
              color="#60a5fa"
            />
            <SensorChart
              history={history}
              sensorKey="motorCurrent"
              label="Motor Current"
              unit="A"
              color="#a78bfa"
            />
            <SensorChart
              history={history}
              sensorKey="tonnesPerHour"
              label="Throughput"
              unit="t/h"
              color="#34d399"
            />
            <SensorChart
              history={history}
              sensorKey="alignmentDeviation"
              label="Alignment Deviation"
              unit="mm"
              color="#fb923c"
            />
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-64 text-slate-500">
          Waiting for first telemetry frame…
        </div>
      )}
    </div>
  );
}
