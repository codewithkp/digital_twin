import { useEffect } from 'react';
import { useReplayStore } from '@/store/useReplayStore';
import { useConveyorStore } from '@/store/useConveyorStore';

export function useReplayEngine() {
  const isPlaying = useReplayStore((s) => s.isPlaying);
  const speed = useReplayStore((s) => s.speed);

  useEffect(() => {
    if (!isPlaying) return;

    const ms = Math.round(1000 / speed);
    const id = setInterval(() => {
      const { currentIndex, rows, setCurrentIndex, pause } = useReplayStore.getState();
      const next = currentIndex + 1;
      if (next >= rows.length) {
        pause();
        return;
      }
      useConveyorStore.getState().addFrame(rows[next]);
      useConveyorStore.getState().setConnectionStatus('connected');
      setCurrentIndex(next);
    }, ms);

    return () => clearInterval(id);
  }, [isPlaying, speed]);
}
