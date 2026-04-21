'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NavBar } from './NavBar';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const FEATURES = [
  {
    icon: '📡',
    title: 'Live Monitoring',
    desc: 'Real-time sensor telemetry at 1 Hz — bearing temps, vibration RMS, motor current, throughput — with GREEN/AMBER/RED health alerts.',
    href: '/dashboard',
    cta: 'Open Dashboard',
    accent: 'border-blue-500/40 hover:border-blue-400/60',
    btn: 'bg-blue-700 hover:bg-blue-600',
  },
  {
    icon: '🏗',
    title: '3D Asset View',
    desc: 'Interactive 3D conveyor model with health-coloured idler groups, animated belt, clickable components, and real-time asset detail panels.',
    href: '/viewer',
    cta: 'Open 3D Viewer',
    accent: 'border-violet-500/40 hover:border-violet-400/60',
    btn: 'bg-violet-700 hover:bg-violet-600',
  },
  {
    icon: '📂',
    title: 'Data Import & Replay',
    desc: 'Upload historical CSV data and replay it through the full dashboard at up to 60× speed, with timestamped event annotations.',
    href: '/import',
    cta: 'Import Data',
    accent: 'border-emerald-500/40 hover:border-emerald-400/60',
    btn: 'bg-emerald-700 hover:bg-emerald-600',
  },
];

function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(4000) })
      .then((r) => setStatus(r.ok ? 'ok' : 'error'))
      .catch(() => setStatus('error'));
  }, []);

  const map = {
    checking: { dot: 'bg-slate-500 animate-pulse', text: 'Checking backend…',  color: 'text-slate-500 dark:text-slate-400' },
    ok:       { dot: 'bg-green-400 animate-pulse',  text: 'Backend connected',  color: 'text-green-600 dark:text-green-400' },
    error:    { dot: 'bg-red-500',                  text: 'Backend unreachable', color: 'text-red-600 dark:text-red-400'    },
  }[status];

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${map.dot}`} />
      <span className={`text-sm ${map.color}`}>{map.text}</span>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <NavBar />

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 flex-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-600/40 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-widest mb-8">
          ⚠ Prototype — Simulated Data
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
          Steel Plant Digital Twin
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mb-4">
          Prototype v1 — Real-time conveyor belt health monitoring, 3D asset visualisation, and historical data replay.
        </p>

        <div className="mb-10">
          <BackendStatus />
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base transition-colors shadow-lg shadow-blue-900/20 dark:shadow-blue-900/40"
          >
            Launch Dashboard →
          </Link>
          <Link
            href="/import"
            className="px-8 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-base transition-colors border border-slate-300 dark:border-slate-700"
          >
            Import Data
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-6 pb-20 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 flex flex-col gap-4 transition-colors ${f.accent}`}
            >
              <div className="text-4xl">{f.icon}</div>
              <div>
                <h3 className="text-slate-900 dark:text-white font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
              <Link
                href={f.href}
                className={`mt-auto self-start px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${f.btn}`}
              >
                {f.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 text-center text-slate-400 dark:text-slate-600 text-xs">
        Steel Plant Digital Twin — Prototype v1 &nbsp;·&nbsp; Built with Next.js 16 + FastAPI
      </footer>
    </div>
  );
}
