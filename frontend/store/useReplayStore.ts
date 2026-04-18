import { create } from 'zustand';
import { TelemetryFrame } from '@shared/types';

export interface Annotation {
  id: string;
  rowIndex: number;
  timestamp: string;
  label: string;
  severity: 'info' | 'warning' | 'critical';
}

const SEV_COLOR = { info: '#60a5fa', warning: '#fbbf24', critical: '#f87171' };

export { SEV_COLOR };

interface ReplayStore {
  rows: TelemetryFrame[];
  filename: string;
  currentIndex: number;
  isPlaying: boolean;
  speed: 1 | 5 | 10 | 60;
  annotations: Annotation[];

  loadRows: (rows: TelemetryFrame[], filename: string) => void;
  setCurrentIndex: (i: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (s: 1 | 5 | 10 | 60) => void;
  addAnnotation: (ann: Omit<Annotation, 'id'>) => void;
}

export const useReplayStore = create<ReplayStore>((set) => ({
  rows: [],
  filename: '',
  currentIndex: 0,
  isPlaying: false,
  speed: 1,
  annotations: [],

  loadRows: (rows, filename) => set({ rows, filename, currentIndex: 0, isPlaying: false, annotations: [] }),
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  play:  () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  stop:  () => set({ isPlaying: false, currentIndex: 0 }),
  setSpeed: (speed) => set({ speed }),
  addAnnotation: (ann) =>
    set((s) => ({
      annotations: [...s.annotations, { ...ann, id: `ann-${Date.now()}` }],
    })),
}));
