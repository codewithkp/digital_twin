'use client';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const FAULTS = [
  { key: 'bearing',   label: 'Bearing Fault',     color: 'bg-red-700 hover:bg-red-600'    },
  { key: 'alignment', label: 'Belt Misalignment',  color: 'bg-orange-700 hover:bg-orange-600' },
  { key: 'motor',     label: 'Motor Overload',     color: 'bg-purple-700 hover:bg-purple-600' },
] as const;

export function DevToolbar() {
  const [activeFault, setActiveFault] = useState<string | null>(null);

  if (process.env.NODE_ENV !== 'development') return null;

  const inject = async (faultType: string) => {
    await fetch(`${API_URL}/fault-injection/${faultType}`, { method: 'POST' });
    setActiveFault(faultType);
    // Auto-clear UI indicator after 60 s
    setTimeout(() => setActiveFault((prev) => (prev === faultType ? null : prev)), 60_000);
  };

  const clear = async () => {
    await fetch(`${API_URL}/fault-injection/off`, { method: 'POST' });
    setActiveFault(null);
  };

  return (
    <div className="flex items-center gap-2 bg-slate-800 border border-yellow-600/40 rounded-lg px-3 py-1.5">
      <span className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest shrink-0">
        DEV
      </span>
      {FAULTS.map(({ key, label, color }) => (
        <button
          key={key}
          onClick={() => inject(key)}
          className={`px-2.5 py-1 rounded text-xs font-medium text-white transition-colors ${color} ${
            activeFault === key ? 'ring-2 ring-white/40' : ''
          }`}
        >
          {label}
        </button>
      ))}
      <button
        onClick={clear}
        disabled={!activeFault}
        className="px-2.5 py-1 rounded text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 transition-colors"
      >
        Clear
      </button>
    </div>
  );
}
