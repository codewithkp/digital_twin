'use client';
import { useMemo } from 'react';
import { TelemetryFrame, THRESHOLDS, healthForValue } from '@shared/types';

interface DataQuality {
  totalRows: number;
  dateRange: { from: string; to: string };
  duplicateTimestamps: number;
  missingByCol: Record<string, number>;
}

interface PreviewTableProps {
  rows: TelemetryFrame[];
  quality: DataQuality;
}

const SCALAR_COLS = [
  { key: 'beltSpeed',          label: 'Belt (m/s)',   thresh: THRESHOLDS.beltSpeed,          inv: false },
  { key: 'motorCurrent',       label: 'Motor (A)',    thresh: THRESHOLDS.motorCurrent,        inv: false },
  { key: 'tonnesPerHour',      label: 'TPH',          thresh: THRESHOLDS.tonnesPerHour,       inv: true  },
  { key: 'alignmentDeviation', label: 'Align (mm)',   thresh: THRESHOLDS.alignmentDeviation,  inv: false },
] as const;

function cellClass(val: number, thresh: { amber: number; red: number }, inv: boolean) {
  const s = healthForValue(val, thresh, inv);
  if (s === 'RED')   return 'bg-red-900/40 text-red-300';
  if (s === 'AMBER') return 'bg-amber-900/30 text-amber-300';
  return '';
}

export function PreviewTable({ rows, quality }: PreviewTableProps) {
  const preview = useMemo(() => rows.slice(0, 20), [rows]);

  return (
    <div className="space-y-4">
      {/* Data quality stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Total Rows',           quality.totalRows.toLocaleString()],
          ['Date Range',           `${quality.dateRange.from} → ${quality.dateRange.to}`],
          ['Duplicate Timestamps', quality.duplicateTimestamps.toString()],
          ['Missing Values',       Object.values(quality.missingByCol).reduce((a, b) => a + b, 0).toString()],
        ].map(([label, val]) => (
          <div key={label} className="bg-slate-800 rounded-lg p-3">
            <p className="text-slate-500 text-[10px] uppercase tracking-wider">{label}</p>
            <p className="text-white font-semibold text-sm mt-1">{val}</p>
          </div>
        ))}
      </div>

      {/* Missing values per column */}
      {Object.entries(quality.missingByCol).some(([, v]) => v > 0) && (
        <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-3 text-xs text-amber-300">
          <span className="font-semibold">Missing values detected: </span>
          {Object.entries(quality.missingByCol)
            .filter(([, v]) => v > 0)
            .map(([col, v]) => `${col}: ${v}`)
            .join(' · ')}
        </div>
      )}

      {/* Preview rows */}
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">
          Preview — first {preview.length} of {quality.totalRows} rows
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800 text-slate-400">
                <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Timestamp</th>
                {SCALAR_COLS.map((c) => (
                  <th key={c.key} className="px-3 py-2 text-right font-medium whitespace-nowrap">{c.label}</th>
                ))}
                {[1, 2, 3, 4].map((n) => (
                  <th key={`bt${n}`} className="px-3 py-2 text-right font-medium whitespace-nowrap">BT{n} (°C)</th>
                ))}
                {[1, 2, 3, 4].map((n) => (
                  <th key={`vr${n}`} className="px-3 py-2 text-right font-medium whitespace-nowrap">VR{n} (mm/s)</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, idx) => (
                <tr key={idx} className="border-t border-slate-700/50 hover:bg-slate-800/50">
                  <td className="px-3 py-1.5 text-slate-400 whitespace-nowrap font-mono">
                    {new Date(row.timestamp).toLocaleTimeString()}
                  </td>
                  {SCALAR_COLS.map((c) => {
                    const val = row.sensors[c.key] as number;
                    return (
                      <td key={c.key} className={`px-3 py-1.5 text-right font-mono ${cellClass(val, c.thresh, c.inv)}`}>
                        {val.toFixed(1)}
                      </td>
                    );
                  })}
                  {(row.sensors.bearingTemp as number[]).map((v, i) => (
                    <td key={i} className={`px-3 py-1.5 text-right font-mono ${cellClass(v, THRESHOLDS.bearingTemp, false)}`}>
                      {v.toFixed(1)}
                    </td>
                  ))}
                  {(row.sensors.vibrationRMS as number[]).map((v, i) => (
                    <td key={i} className={`px-3 py-1.5 text-right font-mono ${cellClass(v, THRESHOLDS.vibrationRMS, false)}`}>
                      {v.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
