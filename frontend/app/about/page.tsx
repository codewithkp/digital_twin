import Link from 'next/link';
import { NavBar } from '@/components/NavBar';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <NavBar />
      <div className="max-w-3xl mx-auto px-6 py-16 flex-1">
        <h1 className="text-3xl font-bold mb-2">About This Prototype</h1>
        <p className="text-slate-400 mb-10">Steel Plant Digital Twin — Prototype v1</p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-white font-semibold text-lg mb-3">What Is It?</h2>
            <p>
              A full-stack digital twin prototype for a steel plant conveyor system. It demonstrates
              real-time health monitoring, 3D asset visualisation, fault detection, and historical
              data replay — all connected to a simulated sensor backend.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Technology Stack</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Frontend',   'Next.js 16 + React 19 + Turbopack'],
                ['3D Engine',  'React Three Fiber v9 + Three.js'],
                ['Charts',     'Recharts'],
                ['Backend',    'FastAPI + WebSocket'],
                ['State',      'Zustand'],
                ['Styling',    'Tailwind CSS'],
                ['Animation',  'Framer Motion'],
                ['Deploy',     'Railway (API) + Vercel (UI)'],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-900 rounded-lg p-3">
                  <p className="text-slate-500 text-xs mb-0.5">{k}</p>
                  <p className="text-slate-200 text-sm font-medium">{v}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Key Features</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400">
              <li>1 Hz WebSocket telemetry stream — 6 sensor channels across 4 idler groups</li>
              <li>GREEN / AMBER / RED health scoring with configurable thresholds</li>
              <li>Fault injection: bearing degradation, belt misalignment, motor overload</li>
              <li>Asset detail panel with maintenance log and PDF report export</li>
              <li>CSV data import with preview, quality stats, and replay at 1×–60×</li>
              <li>Timestamped annotations overlaid on trend charts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Data Notice</h2>
            <p className="text-amber-400/80 bg-amber-900/20 border border-amber-600/30 rounded-lg px-4 py-3 text-sm">
              All sensor values are synthetically generated. No real plant data is used.
              Fault injection simulates realistic degradation scenarios for demonstration purposes.
            </p>
          </section>
        </div>

        <div className="mt-10">
          <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
