import { Alert } from '@/store/useConveyorStore';
import { HealthStatus } from '@shared/types';

const DOT: Record<HealthStatus, string> = {
  GREEN: 'bg-green-400',
  AMBER: 'bg-amber-400',
  RED:   'bg-red-500',
};

function groupSeverity(groupId: string, alerts: Alert[]): HealthStatus {
  const relevant = alerts.filter((a) => a.groupId === groupId);
  if (relevant.some((a) => a.severity === 'RED'))   return 'RED';
  if (relevant.some((a) => a.severity === 'AMBER')) return 'AMBER';
  return 'GREEN';
}

function motorSeverity(alerts: Alert[]): HealthStatus {
  const motor = alerts.find((a) => a.id === 'motorCurrent');
  return motor?.severity ?? 'GREEN';
}

interface AssetTreeProps {
  alerts: Alert[];
}

interface TreeRowProps {
  label: string;
  status: HealthStatus;
  indent?: boolean;
  flagged?: boolean;
}

function TreeRow({ label, status, indent = false, flagged }: TreeRowProps) {
  return (
    <div className={`flex items-center gap-2 py-1 ${indent ? 'pl-5' : ''}`}>
      <span className="text-slate-600 select-none">{indent ? '├─' : '└─'}</span>
      <span className={`w-2 h-2 rounded-full shrink-0 ${DOT[status]}`} />
      <span className="text-slate-300 text-xs">{label}</span>
      {flagged && <span className="text-amber-400 text-[10px] ml-auto">🔧</span>}
    </div>
  );
}

export function AssetTree({ alerts }: AssetTreeProps) {
  const groups = [0, 1, 2, 3].map((i) => ({
    label: `Idler Group ${i + 1}`,
    groupId: `group-${i}`,
    status: groupSeverity(`group-${i}`, alerts),
  }));

  const overallStatus: HealthStatus =
    alerts.some((a) => a.severity === 'RED')
      ? 'RED'
      : alerts.some((a) => a.severity === 'AMBER')
      ? 'AMBER'
      : 'GREEN';

  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Asset Tree</p>

      {/* Root */}
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${DOT[overallStatus]}`} />
        <span className="text-blue-400 text-sm font-semibold">Conveyor C-01</span>
      </div>

      {/* Idler Groups */}
      <div className="pl-3 border-l border-slate-700">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider py-1">Idler Groups</div>
        {groups.map((g) => (
          <TreeRow key={g.groupId} label={g.label} status={g.status} indent />
        ))}
      </div>

      {/* Drive System */}
      <div className="pl-3 border-l border-slate-700 mt-1">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider py-1">Drive System</div>
        <TreeRow label="Motor" status={motorSeverity(alerts)} indent />
        <TreeRow label="Head Pulley" status="GREEN" indent />
        <TreeRow label="Tail Pulley" status="GREEN" indent />
      </div>
    </div>
  );
}
