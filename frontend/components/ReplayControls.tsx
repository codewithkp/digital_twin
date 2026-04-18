'use client';
import { useState } from 'react';
import { useReplayStore, Annotation, SEV_COLOR } from '@/store/useReplayStore';

const SPEEDS = [1, 5, 10, 60] as const;

interface ReplayControlsProps {
  onSeek: (index: number) => void;
}

export function ReplayControls({ onSeek }: ReplayControlsProps) {
  const { rows, currentIndex, isPlaying, speed, annotations, play, pause, stop, setSpeed, addAnnotation } =
    useReplayStore();

  const [showAnnotForm, setShowAnnotForm] = useState(false);
  const [annotLabel, setAnnotLabel] = useState('');
  const [annotSev, setAnnotSev] = useState<Annotation['severity']>('info');

  const total = rows.length;
  const currentFrame = rows[currentIndex];
  const pct = total > 1 ? (currentIndex / (total - 1)) * 100 : 0;

  const handleMarkEvent = () => {
    if (!annotLabel.trim() || !currentFrame) return;
    addAnnotation({
      rowIndex: currentIndex,
      timestamp: currentFrame.timestamp,
      label: annotLabel.trim(),
      severity: annotSev,
    });
    setAnnotLabel('');
    setShowAnnotForm(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
      {/* Timeline scrubber */}
      <div className="flex items-center gap-3">
        <span className="text-slate-500 text-[10px] font-mono whitespace-nowrap">
          {currentFrame ? new Date(currentFrame.timestamp).toLocaleString() : '--'}
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(0, total - 1)}
          value={currentIndex}
          onChange={(e) => onSeek(parseInt(e.target.value))}
          className="flex-1 accent-blue-500 h-1.5"
        />
        <span className="text-slate-500 text-[10px] font-mono whitespace-nowrap">
          {currentIndex}/{total}
        </span>
      </div>

      {/* Annotation ticks on scrubber */}
      {annotations.length > 0 && total > 1 && (
        <div className="relative h-2 -mt-2">
          {annotations.map((ann) => (
            <div
              key={ann.id}
              title={ann.label}
              className="absolute top-0 w-0.5 h-2 rounded"
              style={{
                left: `${(ann.rowIndex / (total - 1)) * 100}%`,
                background: SEV_COLOR[ann.severity],
              }}
            />
          ))}
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Transport buttons */}
        <div className="flex gap-1">
          <button
            onClick={isPlaying ? pause : play}
            disabled={total === 0 || currentIndex >= total - 1}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-colors"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={stop}
            disabled={total === 0}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white transition-colors"
          >
            ⏹
          </button>
        </div>

        {/* Speed selector */}
        <div className="flex gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                speed === s ? 'bg-blue-700 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="flex-1 min-w-[80px] bg-slate-700 rounded-full h-1.5">
          <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>

        {/* Mark Event */}
        <button
          onClick={() => setShowAnnotForm((v) => !v)}
          disabled={total === 0}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white transition-colors"
        >
          🖊 Mark Event
        </button>
      </div>

      {/* Annotation form */}
      {showAnnotForm && (
        <div className="flex gap-2 items-end pt-1">
          <div className="flex-1">
            <input
              autoFocus
              value={annotLabel}
              onChange={(e) => setAnnotLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMarkEvent()}
              placeholder="Annotation label…"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={annotSev}
            onChange={(e) => setAnnotSev(e.target.value as Annotation['severity'])}
            className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <button
            onClick={handleMarkEvent}
            disabled={!annotLabel.trim()}
            className="px-3 py-1.5 rounded text-sm font-medium bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {/* Annotations list */}
      {annotations.length > 0 && (
        <div className="border-t border-slate-700 pt-3 space-y-1">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Annotations</p>
          {annotations.map((ann) => (
            <div key={ann.id} className="flex items-center gap-2 text-xs">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: SEV_COLOR[ann.severity] }}
              />
              <span className="text-slate-400 font-mono">
                {new Date(ann.timestamp).toLocaleTimeString()}
              </span>
              <span className="text-slate-300">{ann.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
