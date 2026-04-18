import { create } from 'zustand';
import { TelemetryFrame, SensorHealth, computeHealth } from '@shared/types';

const MAX_HISTORY = 60;

interface SensorStore {
  latest: TelemetryFrame | null;
  history: TelemetryFrame[];
  health: SensorHealth | null;
  connected: boolean;
  faultInjection: boolean;
  addFrame: (frame: TelemetryFrame) => void;
  setConnected: (v: boolean) => void;
  setFaultInjection: (v: boolean) => void;
}

export const useSensorStore = create<SensorStore>((set) => ({
  latest: null,
  history: [],
  health: null,
  connected: false,
  faultInjection: false,
  addFrame: (frame) =>
    set((state) => ({
      latest: frame,
      health: computeHealth(frame.sensors),
      history: [...state.history.slice(-(MAX_HISTORY - 1)), frame],
    })),
  setConnected: (connected) => set({ connected }),
  setFaultInjection: (faultInjection) => set({ faultInjection }),
}));
