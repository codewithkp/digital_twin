import { useSensorStore } from '@/store/useSensorStore';
import { TelemetryFrame } from '@shared/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws/telemetry';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function connectWS() {
  if (ws?.readyState === WebSocket.OPEN) return;

  ws = new WebSocket(WS_URL);

  ws.onopen  = () => useSensorStore.getState().setConnected(true);
  ws.onerror = () => ws?.close();
  ws.onclose = () => {
    useSensorStore.getState().setConnected(false);
    reconnectTimer = setTimeout(connectWS, 3000);
  };
  ws.onmessage = (e: MessageEvent) => {
    const frame = JSON.parse(e.data as string) as TelemetryFrame;
    useSensorStore.getState().addFrame(frame);
  };
}

export function disconnectWS() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
}
