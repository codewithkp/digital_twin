import { HealthStatus } from '@shared/types';
import { StatusBadge } from './StatusBadge';

const BORDER: Record<HealthStatus, string> = {
  GREEN: 'border-green-500/30',
  AMBER: 'border-amber-400/50',
  RED:   'border-red-500/60',
};

interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
  status: HealthStatus;
}

export function MetricCard({ label, value, unit, status }: MetricCardProps) {
  return (
    <div className={`bg-slate-800 rounded-xl p-4 border ${BORDER[status]}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-400 text-xs uppercase tracking-wide">{label}</span>
        <StatusBadge status={status} />
      </div>
      <p className="text-2xl font-bold text-white">
        {value}{' '}
        <span className="text-sm font-normal text-slate-400">{unit}</span>
      </p>
    </div>
  );
}
