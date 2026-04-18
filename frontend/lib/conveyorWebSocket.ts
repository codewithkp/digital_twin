import { useConveyorStore } from '@/store/useConveyorStore';
import { TelemetryFrame } from '@shared/types';

const WS_URL =
  process.env.NEXT_PUBLIC_CONVEYOR_WS_URL ?? 'ws://localhost:8000/ws/conveyor-01';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;

export function connectConveyorWS() {
  if (ws?.readyState === WebSocket.OPEN) return;

  const { setConnectionStatus, addFrame } = useConveyorStore.getState();
  setConnectionStatus('reconnecting');

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    reconnectAttempts = 0;
    setConnectionStatus('connected');
  };

  ws.onmessage = (e: MessageEvent) => {
    const frame = JSON.parse(e.data as string) as TelemetryFrame;
    addFrame(frame);
  };

  ws.onerror = () => ws?.close();

  ws.onclose = () => {
    setConnectionStatus(reconnectAttempts === 0 ? 'reconnecting' : 'disconnected');
    reconnectAttempts += 1;
    const delay = Math.min(1000 * 2 ** reconnectAttempts, 30_000);
    reconnectTimer = setTimeout(connectConveyorWS, delay);
  };
}

export function disconnectConveyorWS() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
}
