'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useConveyorStore } from '@/store/useConveyorStore';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/viewer',    label: '3D View'   },
  { href: '/import',    label: 'Import'    },
  { href: '/about',     label: 'About'     },
];

export function NavBar() {
  const pathname    = usePathname();
  const connStatus  = useConveyorStore((s) => s.connectionStatus);

  const dotClass =
    connStatus === 'connected'
      ? 'bg-green-400 animate-pulse'
      : connStatus === 'reconnecting'
      ? 'bg-amber-400 animate-pulse'
      : 'bg-slate-500';

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 h-12 bg-slate-950 border-b border-slate-800 shrink-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <span className="text-blue-400 font-bold tracking-tight text-sm">⚙ Steel Plant Digital Twin</span>
      </Link>

      {/* Nav links */}
      <div className="hidden sm:flex items-center gap-1">
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              pathname === href
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Right: Demo badge + connection status */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-amber-900/40 text-amber-400 border border-amber-600/30">
          Demo Mode
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${dotClass}`} />
          <span className="text-slate-500 text-xs capitalize hidden sm:inline">{connStatus}</span>
        </div>
      </div>
    </nav>
  );
}
