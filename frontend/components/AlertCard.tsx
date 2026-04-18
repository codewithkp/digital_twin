'use client';
import { Alert } from '@/store/useConveyorStore';

interface AlertCardProps {
  alert: Alert;
  onFlag: (alertId: string, groupId?: string) => void;
}

const SEV_STYLES = {
  RED:   { icon: '🔴', border: 'border-red-500/50',   bg: 'bg-red-900/10'   },
  AMBER: { icon: '🟡', border: 'border-amber-400/40', bg: 'bg-amber-900/10' },
  GREEN: { icon: '🟢', border: 'border-green-500/30', bg: ''                },
};

export function AlertCard({ alert, onFlag }: AlertCardProps) {
  const { icon, border, bg } = SEV_STYLES[alert.severity];

  const handleFlag = async () => {
    await fetch('/api/maintenance-flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        componentId: alert.groupId ?? alert.id,
        sensor: alert.sensor,
        timestamp: alert.timestamp,
      }),
    });
    onFlag(alert.id, alert.groupId);
  };

  return (
    <div className={`rounded-lg border p-3 ${border} ${bg} text-sm`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="flex items-center gap-1.5 font-medium text-white">
          {icon} {alert.sensor}
        </span>
        <span className="text-slate-500 text-[10px] shrink-0">
          {new Date(alert.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div className="text-slate-300 text-xs mb-2">
        <span className="font-mono">{alert.currentValue.toFixed(2)}</span>
        <span className="text-slate-500"> {alert.unit} </span>
        <span className="text-slate-500">(threshold: {alert.threshold} {alert.unit})</span>
      </div>
      <button
        onClick={handleFlag}
        disabled={alert.flagged}
        className={`w-full py-1 rounded text-xs font-medium transition-colors ${
          alert.flagged
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-amber-600 hover:bg-amber-500 text-white'
        }`}
      >
        {alert.flagged ? '✓ Flagged for Maintenance' : 'Flag for Maintenance'}
      </button>
    </div>
  );
}
