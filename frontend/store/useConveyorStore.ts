import { create } from 'zustand';
import { TelemetryFrame, HealthStatus, healthForValue, THRESHOLDS } from '@shared/types';

export interface Alert {
  id: string;
  timestamp: string;
  sensor: string;
  currentValue: number;
  threshold: number;
  severity: HealthStatus;
  unit: string;
  groupId?: string;
  flagged: boolean;
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

const MAX_READINGS = 300; // 5 minutes at 1 Hz

// ─── Alert computation ────────────────────────────────────────────────────────

function makeAlert(
  id: string,
  sensor: string,
  value: number,
  thresholds: { amber: number; red: number },
  unit: string,
  timestamp: string,
  flaggedIds: string[],
  inverted = false,
  groupId?: string,
): Alert | null {
  const status = healthForValue(value, thresholds, inverted);
  if (status === 'GREEN') return null;
  return {
    id,
    timestamp,
    sensor,
    currentValue: value,
    threshold: status === 'RED' ? thresholds.red : thresholds.amber,
    severity: status,
    unit,
    groupId,
    flagged: flaggedIds.includes(id),
  };
}

function computeAlerts(frame: TelemetryFrame, flaggedIds: string[]): Alert[] {
  const { sensors, timestamp } = frame;
  const raw: (Alert | null)[] = [
    makeAlert('beltSpeed',        'Belt Speed',  sensors.beltSpeed,        THRESHOLDS.beltSpeed,        'm/s', timestamp, flaggedIds),
    makeAlert('motorCurrent',     'Motor Current', sensors.motorCurrent,   THRESHOLDS.motorCurrent,     'A',   timestamp, flaggedIds),
    makeAlert('alignmentDeviation','Alignment',  sensors.alignmentDeviation, THRESHOLDS.alignmentDeviation, 'mm', timestamp, flaggedIds),
    makeAlert('tonnesPerHour',    'Throughput',  sensors.tonnesPerHour,    THRESHOLDS.tonnesPerHour,    't/h', timestamp, flaggedIds, true),
    ...(sensors.bearingTemp as number[]).map((t, i) =>
      makeAlert(`bearingTemp-${i}`, `Bearing Temp ${i + 1}`, t, THRESHOLDS.bearingTemp, '°C', timestamp, flaggedIds, false, `group-${i}`),
    ),
    ...(sensors.vibrationRMS as number[]).map((v, i) =>
      makeAlert(`vibrationRMS-${i}`, `Vibration RMS ${i + 1}`, v, THRESHOLDS.vibrationRMS, 'mm/s', timestamp, flaggedIds, false, `group-${i}`),
    ),
  ];
  return (raw.filter(Boolean) as Alert[]).sort((a, b) => {
    const rank: Record<HealthStatus, number> = { RED: 0, AMBER: 1, GREEN: 2 };
    return rank[a.severity] - rank[b.severity];
  });
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface ConveyorStore {
  latestReading: TelemetryFrame | null;
  last300Readings: TelemetryFrame[];
  connectionStatus: ConnectionStatus;
  activeAlerts: Alert[];
  flaggedAlertIds: string[];
  flaggedGroupIds: string[];

  addFrame: (frame: TelemetryFrame) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  flagAlert: (alertId: string, groupId?: string) => void;
}

export const useConveyorStore = create<ConveyorStore>((set, get) => ({
  latestReading: null,
  last300Readings: [],
  connectionStatus: 'disconnected',
  activeAlerts: [],
  flaggedAlertIds: [],
  flaggedGroupIds: [],

  addFrame: (frame) =>
    set((state) => {
      const readings = [...state.last300Readings.slice(-(MAX_READINGS - 1)), frame];
      return {
        latestReading: frame,
        last300Readings: readings,
        activeAlerts: computeAlerts(frame, state.flaggedAlertIds),
      };
    }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  flagAlert: (alertId, groupId) =>
    set((state) => ({
      flaggedAlertIds: state.flaggedAlertIds.includes(alertId)
        ? state.flaggedAlertIds
        : [...state.flaggedAlertIds, alertId],
      flaggedGroupIds:
        groupId && !state.flaggedGroupIds.includes(groupId)
          ? [...state.flaggedGroupIds, groupId]
          : state.flaggedGroupIds,
    })),
}));
