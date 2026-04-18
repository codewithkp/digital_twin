Create a dashboard page at /dashboard in the Next.js app that:

1. WEBSOCKET CONNECTION: Connects to ws://localhost:8000/ws/conveyor-01
   on mount using a custom useConveyorData hook (Zustand store).
   The hook maintains: latestReading, last300Readings (circular buffer),
   connectionStatus ('connected'|'reconnecting'|'disconnected'),
   activeAlerts[].

2. LAYOUT: Two-column layout (sidebar 30% + main 70%).
   Sidebar: asset tree (Conveyor C-01 > Idler Groups > Drive System),
   active alerts list, connection status badge.
   Main: grid of sensor cards + trend charts.

3. SENSOR CARDS: For each sensor value, create a SensorCard component
   showing: sensor name, current value + unit, min/max in last 5 min,
   a small sparkline (last 60 readings), health status badge
   (GREEN/AMBER/RED), and the threshold values.

4. TREND CHARTS: Below the sensor cards, show 4 Recharts LineCharts:
   - Belt Speed + Motor Current (dual axis)
   - Bearing Temperatures (all 4 on one chart, different colours)
   - Vibration RMS (all 4 on one chart)
   - Tonnes Per Hour + Alignment Deviation (dual axis)
   All charts show last 5 minutes of data, auto-scroll in real time.

5. ALERT PANEL: When any sensor crosses threshold, an AlertCard
   appears with: timestamp, sensor name, current value, threshold,
   severity icon, and a 'Flag for Maintenance' button that writes
   to a /api/maintenance-flags POST endpoint and marks the component
   in the 3D scene (pass flagged IDs as prop to ConveyorScene).

6. FAULT INJECTION: Add a dev toolbar (only visible in dev mode)
   with buttons: 'Inject Bearing Fault', 'Inject Belt Misalignment',
   'Inject Motor Overload'. Each calls a backend endpoint that
   switches the mock generator into fault mode for 60 seconds.
   This is critical for demos — lets you show the alerting live.

Style everything with Tailwind. Dark industrial theme:
bg-slate-900, card bg-slate-800, accent text-blue-400.
