import { HealthStatus } from '@shared/types';

const BG: Record<HealthStatus, string> = {
  GREEN: 'bg-green-500',
  AMBER: 'bg-amber-400',
  RED:   'bg-red-500',
};

export function StatusBadge({ status }: { status: HealthStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${BG[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-white/60 ${status === 'GREEN' ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  );
}
