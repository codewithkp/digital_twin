'use client';
import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TelemetryFrame, HealthStatus, healthForValue, THRESHOLDS } from '@shared/types';
import { Alert } from '@/store/useConveyorStore';
import { StatusBadge } from './StatusBadge';
import { useTheme } from '@/contexts/ThemeContext';
import assetsRaw from '@/data/assets.json';
import maintLogRaw from '@/data/maintenance-log.json';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssetMeta {
  name: string;
  assetTag: string;
  installDate: string;
  lastMaintDate: string;
  lastMaintType: string;
  operatingHours: number;
  bearingModel: string;
  bearingRatedLife: number;
  nextMaintDate: string;
}

interface MaintEntry {
  id: string;
  assetId: string;
  date: string;
  technician: string;
  work: string;
  parts: string[];
}

const ASSETS = assetsRaw as Record<string, AssetMeta>;
const MAINT_LOG = maintLogRaw as MaintEntry[];

// ─── Seeded pseudo-random health history ─────────────────────────────────────

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateHealthHistory(assetId: string): { day: string; score: number }[] {
  const seed = assetId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = seededRand(seed);
  const today = new Date('2026-04-19');
  const points: { day: string; score: number }[] = [];
  let score = 82 + rand() * 12;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    score += (rand() - 0.48) * 4;
    score = Math.max(45, Math.min(99, score));
    points.push({
      day: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      score: Math.round(score),
    });
  }
  return points;
}

// ─── Sensor readings per component ───────────────────────────────────────────

interface SensorRow {
  label: string;
  value: number;
  unit: string;
  status: HealthStatus;
  sparkValues: number[];
}

function getSensorRows(
  assetId: string,
  frame: TelemetryFrame | null,
  readings: TelemetryFrame[],
): SensorRow[] {
  if (!frame) return [];
  const { sensors } = frame;

  const spark = (extractor: (f: TelemetryFrame) => number) =>
    readings.slice(-60).map(extractor);

  const groupMatch = assetId.match(/^group-(\d)$/);
  if (groupMatch) {
    const i = parseInt(groupMatch[1]);
    const bt = (sensors.bearingTemp as number[])[i];
    const vr = (sensors.vibrationRMS as number[])[i];
    return [
      {
        label: `Bearing Temp ${i + 1}`,
        value: bt,
        unit: '°C',
        status: healthForValue(bt, THRESHOLDS.bearingTemp),
        sparkValues: spark((f) => (f.sensors.bearingTemp as number[])[i]),
      },
      {
        label: `Vibration RMS ${i + 1}`,
        value: vr,
        unit: 'mm/s',
        status: healthForValue(vr, THRESHOLDS.vibrationRMS),
        sparkValues: spark((f) => (f.sensors.vibrationRMS as number[])[i]),
      },
    ];
  }

  if (assetId === 'motor') {
    return [
      {
        label: 'Motor Current',
        value: sensors.motorCurrent,
        unit: 'A',
        status: healthForValue(sensors.motorCurrent, THRESHOLDS.motorCurrent),
        sparkValues: spark((f) => f.sensors.motorCurrent),
      },
      {
        label: 'Belt Speed',
        value: sensors.beltSpeed,
        unit: 'm/s',
        status: healthForValue(sensors.beltSpeed, THRESHOLDS.beltSpeed),
        sparkValues: spark((f) => f.sensors.beltSpeed),
      },
    ];
  }

  if (assetId === 'head-pulley') {
    return [
      {
        label: 'Alignment Deviation',
        value: sensors.alignmentDeviation,
        unit: 'mm',
        status: healthForValue(sensors.alignmentDeviation, THRESHOLDS.alignmentDeviation),
        sparkValues: spark((f) => f.sensors.alignmentDeviation),
      },
      {
        label: 'Belt Speed',
        value: sensors.beltSpeed,
        unit: 'm/s',
        status: healthForValue(sensors.beltSpeed, THRESHOLDS.beltSpeed),
        sparkValues: spark((f) => f.sensors.beltSpeed),
      },
    ];
  }

  if (assetId === 'tail-pulley') {
    return [
      {
        label: 'Throughput',
        value: sensors.tonnesPerHour,
        unit: 't/h',
        status: healthForValue(sensors.tonnesPerHour, THRESHOLDS.tonnesPerHour, true),
        sparkValues: spark((f) => f.sensors.tonnesPerHour),
      },
      {
        label: 'Belt Speed',
        value: sensors.beltSpeed,
        unit: 'm/s',
        status: healthForValue(sensors.beltSpeed, THRESHOLDS.beltSpeed),
        sparkValues: spark((f) => f.sensors.beltSpeed),
      },
    ];
  }

  return [];
}

// ─── Mini sparkline ───────────────────────────────────────────────────────────

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  const data = values.map((v) => ({ v }));
  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={color} fillOpacity={0.15} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Health score chart ────────────────────────────────────────────────────────

function HealthChart({ assetId }: { assetId: string }) {
  const { isDark } = useTheme();
  const data = useMemo(() => generateHealthHistory(assetId), [assetId]);

  const healthTooltip = {
    contentStyle: {
      background: isDark ? '#1e293b' : '#ffffff',
      border: isDark ? 'none' : '1px solid #e2e8f0',
      borderRadius: 6,
      fontSize: 11,
    },
    labelStyle: { color: isDark ? '#64748b' : '#94a3b8' },
  };
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const tickFill = isDark ? '#64748b' : '#94a3b8';

  return (
    <ResponsiveContainer width="100%" height={100}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#34d399" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#34d399" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey="day" tick={{ fontSize: 9, fill: tickFill }} interval={6} />
        <YAxis domain={[40, 100]} tick={{ fontSize: 9, fill: tickFill }} />
        <Tooltip {...healthTooltip} formatter={(v: number) => [`${v}`, 'Health Score']} />
        <Area type="monotone" dataKey="score" stroke="#34d399" strokeWidth={1.5} fill="url(#hg)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── PDF download ─────────────────────────────────────────────────────────────

async function downloadReport(
  meta: AssetMeta,
  rows: SensorRow[],
  alerts: Alert[],
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(`Asset Report — ${meta.name}`, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Asset Tag: ${meta.assetTag}`, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text('Sensor Readings', 14, 48);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  rows.forEach((r, i) => {
    doc.text(`${r.label}: ${r.value.toFixed(2)} ${r.unit}  [${r.status}]`, 14, 56 + i * 7);
  });

  const metaStart = 56 + rows.length * 7 + 6;
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text('Asset Metadata', 14, metaStart);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const metaLines = [
    `Install Date: ${meta.installDate}`,
    `Last Maintenance: ${meta.lastMaintDate} (${meta.lastMaintType})`,
    `Operating Hours: ${meta.operatingHours.toLocaleString()} h`,
    `Bearing Model: ${meta.bearingModel}  (Rated life: ${meta.bearingRatedLife.toLocaleString()} h)`,
    `Next Maintenance: ${meta.nextMaintDate}`,
  ];
  metaLines.forEach((l, i) => doc.text(l, 14, metaStart + 8 + i * 7));

  const alertStart = metaStart + 8 + metaLines.length * 7 + 6;
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text('Recent Alerts', 14, alertStart);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const relevantAlerts = alerts.slice(0, 5);
  if (relevantAlerts.length === 0) {
    doc.text('No active alerts.', 14, alertStart + 8);
  } else {
    relevantAlerts.forEach((a, i) => {
      doc.text(
        `${a.severity}  ${a.sensor}: ${a.currentValue.toFixed(2)} ${a.unit}  (threshold: ${a.threshold} ${a.unit})`,
        14,
        alertStart + 8 + i * 7,
      );
    });
  }

  doc.save(`${meta.assetTag}-report.pdf`);
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AssetDetailPanelProps {
  assetId: string | null;
  latestReading: TelemetryFrame | null;
  last300Readings: TelemetryFrame[];
  activeAlerts: Alert[];
  onClose: () => void;
  onFlagMaintenance: (alertId: string, groupId?: string) => void;
}

export function AssetDetailPanel({
  assetId,
  latestReading,
  last300Readings,
  activeAlerts,
  onClose,
  onFlagMaintenance,
}: AssetDetailPanelProps) {
  const meta = assetId ? ASSETS[assetId] : null;
  const maintEntries = useMemo(
    () => (assetId ? MAINT_LOG.filter((e) => e.assetId === assetId) : []),
    [assetId],
  );
  const sensorRows = useMemo(
    () => (assetId ? getSensorRows(assetId, latestReading, last300Readings) : []),
    [assetId, latestReading, last300Readings],
  );

  const overallStatus: HealthStatus = sensorRows.some((r) => r.status === 'RED')
    ? 'RED'
    : sensorRows.some((r) => r.status === 'AMBER')
    ? 'AMBER'
    : 'GREEN';

  const assetAlerts = activeAlerts.filter(
    (a) => a.groupId === assetId || a.id === assetId,
  );

  const flagged = assetAlerts.length > 0 && assetAlerts.every((a) => a.flagged);

  const handleFlag = async () => {
    await fetch('/api/maintenance-flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        componentId: assetId,
        sensor: sensorRows[0]?.label ?? 'unknown',
        timestamp: latestReading?.timestamp ?? new Date().toISOString(),
      }),
    });
    assetAlerts.forEach((a) => onFlagMaintenance(a.id, a.groupId));
  };

  const sparkColor: Record<HealthStatus, string> = {
    GREEN: '#34d399',
    AMBER: '#fbbf24',
    RED:   '#f87171',
  };

  return (
    <AnimatePresence>
      {assetId && meta && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/40 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            className="fixed top-0 right-0 h-full w-[420px] max-w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 z-30 flex flex-col shadow-2xl"
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* ── Header ── */}
            <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-slate-900 dark:text-white font-semibold text-base">{meta.name}</h2>
                  <StatusBadge status={overallStatus} />
                </div>
                <p className="text-slate-500 text-xs font-mono">{meta.assetTag}</p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xl leading-none mt-0.5 transition-colors"
                aria-label="Close panel"
              >
                ✕
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* Sensor Readings */}
              <section>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Live Sensor Readings</p>
                <div className="space-y-3">
                  {sensorRows.map((row) => (
                    <div key={row.label} className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-500 dark:text-slate-400 text-xs">{row.label}</span>
                        <StatusBadge status={row.status} />
                      </div>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                          {row.value.toFixed(row.value < 10 ? 2 : 1)}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">{row.unit}</span>
                      </div>
                      <MiniSparkline values={row.sparkValues} color={sparkColor[row.status]} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Asset Metadata */}
              <section>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Asset Metadata</p>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-700">
                  {[
                    ['Install Date',       meta.installDate],
                    ['Last Maintenance',   `${meta.lastMaintDate} · ${meta.lastMaintType}`],
                    ['Operating Hours',    `${meta.operatingHours.toLocaleString()} h`],
                    ['Bearing Model',      meta.bearingModel],
                    ['Bearing Rated Life', `${meta.bearingRatedLife.toLocaleString()} h`],
                    ['Next Maintenance',   meta.nextMaintDate],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between px-3 py-2 text-xs">
                      <span className="text-slate-500">{label}</span>
                      <span className="text-slate-700 dark:text-slate-200 text-right max-w-[60%]">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Health History */}
              <section>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Health Score — Last 30 Days</p>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                  <HealthChart assetId={assetId} />
                </div>
              </section>

              {/* Maintenance Log */}
              <section>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">
                  Maintenance Log ({maintEntries.length} entries)
                </p>
                {maintEntries.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-600 text-xs">No maintenance records for this asset.</p>
                ) : (
                  <div className="space-y-2">
                    {maintEntries.map((e) => (
                      <div key={e.id} className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{e.date}</span>
                          <span className="text-slate-500">{e.technician}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-1">{e.work}</p>
                        {e.parts.length > 0 && (
                          <p className="text-slate-500 dark:text-slate-600">
                            Parts: {e.parts.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* ── Action Buttons ── */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 shrink-0 flex gap-3">
              <button
                onClick={handleFlag}
                disabled={flagged}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  flagged
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                {flagged ? '✓ Flagged for Maintenance' : 'Flag for Maintenance'}
              </button>
              <button
                onClick={() => downloadReport(meta, sensorRows, activeAlerts)}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-blue-700 hover:bg-blue-600 text-white transition-colors"
              >
                Download Report
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
