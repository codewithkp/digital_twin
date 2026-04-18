import { useEffect } from 'react';
import { useConveyorStore } from '@/store/useConveyorStore';
import { connectConveyorWS, disconnectConveyorWS } from '@/lib/conveyorWebSocket';

export function useConveyorData() {
  const store = useConveyorStore();

  useEffect(() => {
    connectConveyorWS();
    return () => disconnectConveyorWS();
  }, []);

  return store;
}
