export interface SensorReadings {
  beltSpeed: number;
  motorCurrent: number;
  bearingTemp: [number, number, number, number];
  vibrationRMS: [number, number, number, number];
  tonnesPerHour: number;
  alignmentDeviation: number;
}

export interface TelemetryFrame {
  timestamp: string;
  assetId: string;
  sensors: SensorReadings;
}

export type HealthStatus = 'GREEN' | 'AMBER' | 'RED';

export interface SensorHealth {
  beltSpeed: HealthStatus;
  motorCurrent: HealthStatus;
  bearingTemp: HealthStatus;
  vibrationRMS: HealthStatus;
  tonnesPerHour: HealthStatus;
  alignmentDeviation: HealthStatus;
}

export const THRESHOLDS = {
  beltSpeed:          { amber: 1.5,  red: 2.0  },
  motorCurrent:       { amber: 80,   red: 95   },
  bearingTemp:        { amber: 60,   red: 80   },
  vibrationRMS:       { amber: 3,    red: 7    },
  tonnesPerHour:      { amber: 800,  red: 600  }, // inverted – lower is worse
  alignmentDeviation: { amber: 5,    red: 15   },
} as const;

const STATUS_ORDER: HealthStatus[] = ['GREEN', 'AMBER', 'RED'];

export function healthForValue(
  value: number,
  thresholds: { amber: number; red: number },
  inverted = false,
): HealthStatus {
  if (inverted) {
    if (value < thresholds.red)   return 'RED';
    if (value < thresholds.amber) return 'AMBER';
    return 'GREEN';
  }
  if (value >= thresholds.red)   return 'RED';
  if (value >= thresholds.amber) return 'AMBER';
  return 'GREEN';
}

function worst(statuses: HealthStatus[]): HealthStatus {
  return statuses.reduce((a, b) =>
    STATUS_ORDER.indexOf(b) > STATUS_ORDER.indexOf(a) ? b : a,
  );
}

export function computeHealth(sensors: SensorReadings): SensorHealth {
  return {
    beltSpeed:          healthForValue(sensors.beltSpeed,          THRESHOLDS.beltSpeed),
    motorCurrent:       healthForValue(sensors.motorCurrent,       THRESHOLDS.motorCurrent),
    bearingTemp:        worst(sensors.bearingTemp.map(t => healthForValue(t, THRESHOLDS.bearingTemp))),
    vibrationRMS:       worst(sensors.vibrationRMS.map(v => healthForValue(v, THRESHOLDS.vibrationRMS))),
    tonnesPerHour:      healthForValue(sensors.tonnesPerHour,      THRESHOLDS.tonnesPerHour, true),
    alignmentDeviation: healthForValue(sensors.alignmentDeviation, THRESHOLDS.alignmentDeviation),
  };
}
