'use client';
import { useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import { TelemetryFrame } from '@shared/types';
import { useReplayStore, SEV_COLOR } from '@/store/useReplayStore';
import { useConveyorStore } from '@/store/useConveyorStore';
import { useReplayEngine } from '@/hooks/useReplayEngine';
import { CsvUploader } from './CsvUploader';
import { PreviewTable } from './PreviewTable';
import { ReplayControls } from './ReplayControls';
import { TrendCharts, ChartAnnotation } from './TrendCharts';
import { NavBar } from './NavBar';

// ─── CSV → TelemetryFrame ─────────────────────────────────────────────────────

interface CsvRow {
  timestamp: string;
  belt_speed: string;
  motor_current: string;
  bearing_temp_1: string;
  bearing_temp_2: string;
  bearing_temp_3: string;
  bearing_temp_4: string;
  vibration_rms_1: string;
  vibration_rms_2: string;
  vibration_rms_3: string;
  vibration_rms_4: string;
  tonnes_per_hour: string;
  alignment_deviation: string;
}

function csvRowToFrame(row: CsvRow): TelemetryFrame {
  return {
    timestamp: row.timestamp,
    assetId: 'conveyor-01',
    sensors: {
      beltSpeed:          parseFloat(row.belt_speed),
      motorCurrent:       parseFloat(row.motor_current),
      bearingTemp:        [parseFloat(row.bearing_temp_1), parseFloat(row.bearing_temp_2), parseFloat(row.bearing_temp_3), parseFloat(row.bearing_temp_4)],
      vibrationRMS:       [parseFloat(row.vibration_rms_1), parseFloat(row.vibration_rms_2), parseFloat(row.vibration_rms_3), parseFloat(row.vibration_rms_4)],
      tonnesPerHour:      parseFloat(row.tonnes_per_hour),
      alignmentDeviation: parseFloat(row.alignment_deviation),
    },
  };
}

function parseDataQuality(rows: TelemetryFrame[], rawRows: CsvRow[]) {
  const timestamps = rows.map((r) => r.timestamp);
  const seen = new Set<string>();
  let dupes = 0;
  timestamps.forEach((t) => { if (seen.has(t)) dupes++; else seen.add(t); });

  const COLS = ['belt_speed','motor_current','bearing_temp_1','bearing_temp_2','bearing_temp_3','bearing_temp_4','vibration_rms_1','vibration_rms_2','vibration_rms_3','vibration_rms_4','tonnes_per_hour','alignment_deviation'] as const;
  const missingByCol: Record<string, number> = {};
  COLS.forEach((col) => {
    missingByCol[col] = rawRows.filter((r) => !r[col] || isNaN(parseFloat(r[col]))).length;
  });

  return {
    totalRows: rows.length,
    dateRange: {
      from: timestamps[0] ? new Date(timestamps[0]).toLocaleDateString() : '?',
      to:   timestamps[timestamps.length - 1] ? new Date(timestamps[timestamps.length - 1]).toLocaleDateString() : '?',
    },
    duplicateTimestamps: dupes,
    missingByCol,
  };
}

// ─── ImportPage ───────────────────────────────────────────────────────────────

export function ImportPage() {
  useReplayEngine();

  const { rows, filename, currentIndex, annotations, loadRows, setCurrentIndex } = useReplayStore();
  const { last300Readings, addFrame, setConnectionStatus } = useConveyorStore();

  const quality = useMemo(() => {
    if (!rows.length) return null;
    return parseDataQuality(rows, [] as CsvRow[]);
  }, [rows]);

  const handleFile = useCallback((text: string, name: string) => {
    const result = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true });
    const frames = result.data.map(csvRowToFrame).filter((f) => !isNaN(f.sensors.beltSpeed));
    loadRows(frames, name);
    // Feed first frame immediately so charts are not empty
    if (frames.length > 0) {
      addFrame(frames[0]);
      setConnectionStatus('connected');
    }
  }, [loadRows, addFrame, setConnectionStatus]);

  const handleLoadSample = useCallback(async () => {
    const res = await fetch('/sample-conveyor-data.csv');
    const text = await res.text();
    handleFile(text, 'sample-conveyor-data.csv');
  }, [handleFile]);

  const handleSeek = useCallback((index: number) => {
    setCurrentIndex(index);
    const frame = useReplayStore.getState().rows[index];
    if (frame) {
      addFrame(frame);
      setConnectionStatus('connected');
    }
  }, [addFrame, setConnectionStatus, setCurrentIndex]);

  // Map replay annotations → chart indices within last300Readings
  const chartAnnotations = useMemo((): ChartAnnotation[] => {
    const windowStart = currentIndex - last300Readings.length + 1;
    return annotations
      .map((ann) => ({ ...ann, chartIndex: ann.rowIndex - windowStart }))
      .filter((ann) => ann.chartIndex >= 0 && ann.chartIndex < last300Readings.length)
      .map((ann) => ({
        index: ann.chartIndex,
        label: ann.label,
        color: SEV_COLOR[ann.severity],
      }));
  }, [annotations, currentIndex, last300Readings.length]);

  const hasData = rows.length > 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <NavBar />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Upload area */}
        {!hasData ? (
          <div className="space-y-4">
            <CsvUploader onFile={handleFile} />
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-slate-700" />
              <span className="text-slate-600 text-sm">or</span>
              <div className="flex-1 border-t border-slate-700" />
            </div>
            <button
              onClick={handleLoadSample}
              className="w-full py-3 rounded-xl border border-blue-600/50 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 font-medium transition-colors"
            >
              Load Sample Data (1 000 rows · 10-sec intervals · bearing degradation scenario)
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{filename}</p>
              <p className="text-slate-500 text-sm">{rows.length.toLocaleString()} rows loaded</p>
            </div>
            <button
              onClick={() => loadRows([], '')}
              className="text-slate-500 hover:text-white text-sm transition-colors"
            >
              × Clear
            </button>
          </div>
        )}

        {/* Preview table */}
        {hasData && quality && (
          <section>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Data Preview &amp; Quality</p>
            <PreviewTable rows={rows} quality={quality} />
          </section>
        )}

        {/* Replay controls */}
        {hasData && (
          <section>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Replay Controls</p>
            <ReplayControls onSeek={handleSeek} />
          </section>
        )}

        {/* Live trend charts fed by replay */}
        {hasData && last300Readings.length > 0 && (
          <section>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">
              Trend Charts — replay window (last 300 frames)
            </p>
            <TrendCharts readings={last300Readings} annotations={chartAnnotations} />
          </section>
        )}
      </div>
    </div>
  );
}
