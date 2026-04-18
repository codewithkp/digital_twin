# Steel Plant Digital Twin — Prototype v1

Real-time conveyor belt health monitoring with a 3D asset viewer, live sensor dashboard, historical data replay, and stakeholder-ready deployment.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Application Pages](#application-pages)
   - [Landing Page](#landing-page)
   - [Live Dashboard](#live-dashboard)
   - [3D Asset Viewer](#3d-asset-viewer)
   - [Asset Detail Panel](#asset-detail-panel)
   - [Data Import & Replay](#data-import--replay)
   - [About](#about)
3. [Feature Reference](#feature-reference)
4. [Fault Injection (Demo)](#fault-injection-demo)
5. [Health Thresholds](#health-thresholds)
6. [Sensor Schema](#sensor-schema)
7. [API Reference](#api-reference)
8. [Tech Stack](#tech-stack)
9. [Deployment](#deployment)

---

## Quick Start

### Prerequisites

- Python 3.12+ (backend)
- Node.js 20+ (frontend)

### Local Development

```bash
# Terminal 1 — Backend
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Mac / Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

```bash
# Terminal 2 — Frontend
cd frontend
cp .env.example .env.local    # copy environment variables
npm install
npm run dev
```

Open **http://localhost:3000**. API docs at **http://localhost:8000/docs**.

### Docker (full stack)

```bash
docker compose up --build
```

| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:3000        |
| API docs  | http://localhost:8000/docs   |

---

## Application Pages

### Landing Page

**URL:** `/`

The entry point for stakeholders. Shows:

- **Hero section** — project title and a brief description
- **Backend status indicator** — live green/red dot showing whether the API is reachable
- **Three feature cards** — quick links to Live Monitoring, 3D Asset View, and Data Import
- **Launch Dashboard** button — opens the full sensor dashboard
- **Import Data** button — opens the CSV replay tool

The top navigation bar (present on all pages) shows:
- Navigation links to all sections
- A live WebSocket **connection status dot** (green = connected, amber = reconnecting, red = disconnected)
- A **Demo Mode** badge so stakeholders know data is simulated

---

### Live Dashboard

**URL:** `/dashboard`

The main operational screen. Layout: sidebar (left, 30%) + main area (right, 70%).

#### Sidebar

| Element | Description |
|---|---|
| **Asset Tree** | Hierarchical view: Conveyor C-01 → Idler Groups 1–4 → Drive System (Motor, Head/Tail Pulley). Each node shows a coloured health dot. |
| **Active Alerts** | Real-time list of sensors that have crossed AMBER or RED thresholds. Sorted by severity. Each card shows the sensor name, current value vs threshold, and a **Flag for Maintenance** button. |

#### Main Area

| Element | Description |
|---|---|
| **3D Conveyor Scene** | Interactive 3D model of the conveyor belt. Drag to orbit, scroll to zoom, click **Reset View** to return to default. Idler groups glow green / amber / red based on bearing health. Orange torus rings float above components that have been flagged for maintenance. Click an idler group to open the Asset Detail Panel. |
| **Sensor Cards (12)** | One card per sensor channel: 4 scalar sensors (Belt Speed, Motor Current, Throughput, Alignment Deviation) + 4 Bearing Temps + 4 Vibration RMS readings. Each card shows the current value, a health badge, a 60-point sparkline, and min/max over the last 5 minutes. |
| **Trend Charts (4)** | Recharts line charts showing the last 5 minutes of data. Belt Speed + Motor Current (dual axis), Bearing Temperatures, Vibration RMS, and Throughput + Alignment Deviation. AMBER and RED threshold reference lines are drawn on each chart. |

#### Dev Toolbar (Development mode only)

A yellow-bordered toolbar appears below the navigation bar when running `npm run dev`. It provides fault injection buttons for demo scenarios:

| Button | Effect |
|---|---|
| **Bearing Fault** | Ramps Bearing 3 temperature and vibration toward RED over ~30 s |
| **Belt Misalignment** | Ramps alignment deviation toward RED over ~20 s |
| **Motor Overload** | Ramps motor current toward RED and drops belt speed over ~25 s |
| **Clear** | Resets all faults immediately |

All faults auto-clear after 60 seconds.

---

### 3D Asset Viewer

**URL:** `/viewer`

A standalone 3D scene connected to the live WebSocket, ideal for use on a secondary display or TV during walkthroughs.

- Full-screen interactive 3D conveyor model
- Idler groups colour-coded by bearing health in real time
- Click any idler group to see live bearing temp + vibration in a popup
- **Inject Fault** button to trigger a bearing fault for demos
- Belt texture animates at the real belt speed

#### Controls

| Action | How |
|---|---|
| Orbit | Left-click drag |
| Zoom | Scroll wheel |
| Pan | Right-click drag |
| Reset | Click **Reset View** button |

---

### Asset Detail Panel

**Trigger:** Click any idler group in the 3D scene on `/dashboard`

A slide-in panel (Framer Motion animation) with full asset context:

| Section | Content |
|---|---|
| **Header** | Component name, asset tag ID (e.g. `IDL-C01-003`), current health badge, close button |
| **Live Sensor Readings** | Real-time values for the sensors specific to this component (e.g. Bearing Temp 3 + Vibration RMS 3 for Idler Group 3), with mini sparklines |
| **Asset Metadata** | Installation date, last maintenance date + type, total operating hours, bearing model + rated life, next scheduled maintenance date |
| **Health Score Chart** | 30-day simulated health score trend (0–100) as an area chart |
| **Maintenance Log** | Scrollable list of past maintenance events: date, technician, work performed, parts used |
| **Flag for Maintenance** | Posts a maintenance flag to the API and marks the component in the 3D scene with an orange torus ring |
| **Download Report** | Generates a PDF (client-side via jsPDF) containing current sensor values, asset metadata, and recent alerts |

---

### Data Import & Replay

**URL:** `/import`

Load historical CSV data and replay it through the full dashboard at adjustable speed.

#### Step 1 — Load Data

Two options:

1. **Drag & drop** a CSV file onto the upload zone, or click to browse
2. Click **Load Sample Data** to use the included 1 000-row bearing degradation scenario (10-second intervals, ~2.8 hours)

**Expected CSV columns:**

```
timestamp, belt_speed, motor_current,
bearing_temp_1, bearing_temp_2, bearing_temp_3, bearing_temp_4,
vibration_rms_1, vibration_rms_2, vibration_rms_3, vibration_rms_4,
tonnes_per_hour, alignment_deviation
```

#### Step 2 — Review Data Quality

After loading, a **Data Preview** section shows:

- Total row count, date range, duplicate timestamp count, missing values per column
- First 20 rows in a table — cells are highlighted amber/red when values exceed thresholds

#### Step 3 — Replay

The **Replay Controls** bar provides:

| Control | Description |
|---|---|
| **▶ Play / ⏸ Pause** | Start or pause frame-by-frame playback |
| **⏹ Stop** | Reset to the first frame |
| **Speed selector** | 1× · 5× · 10× · 60× — number of CSV rows advanced per second |
| **Scrubber** | Drag to seek to any point in the dataset |
| **Timestamp display** | Shows the current frame's real timestamp |

Replay feeds data directly into the same Zustand store as the live WebSocket, so the trend charts below respond in real time.

#### Step 4 — Annotate Events

Click **🖊 Mark Event** at any moment during replay to add a timestamped annotation:

- Enter a label and choose a severity (Info / Warning / Critical)
- The annotation appears as a coloured vertical line on all four trend charts
- Small tick marks appear on the scrubber timeline at each annotation position

---

### About

**URL:** `/about`

Tech stack, feature list, and a data notice confirming that all values are synthetically generated.

---

## Feature Reference

| Feature | Where |
|---|---|
| Live 1 Hz WebSocket telemetry | Dashboard, 3D Viewer |
| Health scoring (GREEN / AMBER / RED) | All pages |
| 3D conveyor with animated belt | Dashboard, 3D Viewer |
| 12 sensor cards with sparklines | Dashboard |
| 4 dual-axis trend charts | Dashboard, Import |
| Asset tree with health dots | Dashboard sidebar |
| Alert panel with maintenance flagging | Dashboard sidebar |
| Asset detail panel (slide-in) | Dashboard → click idler group |
| jsPDF asset report download | Asset detail panel |
| Maintenance log (6 months history) | Asset detail panel |
| 30-day health score chart | Asset detail panel |
| Fault injection (3 fault types) | Dev toolbar on Dashboard |
| CSV drag-and-drop upload | Import page |
| Data quality stats + preview table | Import page |
| Variable-speed replay (1×–60×) | Import page |
| Timestamped event annotations | Import page → trend charts |
| WebGL fallback (2D SVG schematic) | Dashboard, 3D Viewer |
| Responsive layout (iPad 768px+) | All pages |

---

## Fault Injection (Demo)

Three fault modes, each auto-clears after 60 seconds:

| Fault | API endpoint | What ramps |
|---|---|---|
| Bearing fault | `POST /fault-injection/bearing` | Bearing 3 temp → ~83 °C (RED), Vibration 3 → ~7.2 mm/s (RED) |
| Belt misalignment | `POST /fault-injection/alignment` | Alignment deviation → ~20 mm (RED) |
| Motor overload | `POST /fault-injection/motor` | Motor current → ~101 A (RED), belt speed drops |
| Clear all | `POST /fault-injection/off` | All sensors return to normal |

In the UI, use the **Dev Toolbar** buttons on the Dashboard (development mode only).

---

## Health Thresholds

| Sensor | AMBER | RED | Direction |
|---|---|---|---|
| Belt Speed | ≥ 1.5 m/s | ≥ 2.0 m/s | Higher = worse |
| Motor Current | ≥ 80 A | ≥ 95 A | Higher = worse |
| Bearing Temp | ≥ 60 °C | ≥ 80 °C | Higher = worse |
| Vibration RMS | ≥ 3 mm/s | ≥ 7 mm/s | Higher = worse |
| Throughput | < 800 t/h | < 600 t/h | Lower = worse |
| Alignment Deviation | ≥ 5 mm | ≥ 15 mm | Higher = worse |

Per-bearing health is evaluated independently; the worst reading across all four bearings drives the overall status.

---

## Sensor Schema

The WebSocket streams JSON frames at 1 Hz to both `/ws/telemetry` and `/ws/conveyor-01`:

```json
{
  "timestamp": "2026-04-19T10:30:00.000Z",
  "assetId": "conveyor-01",
  "sensors": {
    "beltSpeed": 1.18,
    "motorCurrent": 64.2,
    "bearingTemp": [44.1, 45.8, 44.3, 43.7],
    "vibrationRMS": [1.42, 1.61, 1.48, 1.35],
    "tonnesPerHour": 947,
    "alignmentDeviation": 2.1
  }
}
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check → `{"status":"ok"}` |
| `GET` | `/fault-injection` | Current fault state + remaining seconds |
| `POST` | `/fault-injection/{type}` | Inject fault: `bearing`, `alignment`, `motor`, or `off` |
| `GET` | `/api/maintenance-flags` | List all flagged components |
| `POST` | `/api/maintenance-flags` | Flag a component for maintenance |
| `WS` | `/ws/telemetry` | Legacy telemetry stream (3D Viewer) |
| `WS` | `/ws/conveyor-01` | Dashboard telemetry stream |

Interactive docs: **http://localhost:8000/docs**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 16 (App Router, Turbopack) |
| UI language | React 19 + TypeScript |
| 3D engine | React Three Fiber v9 + Three.js 0.176 |
| Charts | Recharts 2 |
| State management | Zustand 4 |
| Animation | Framer Motion |
| Styling | Tailwind CSS 3 |
| CSV parsing | PapaParse |
| PDF export | jsPDF |
| File upload | react-dropzone |
| Backend | FastAPI + Uvicorn |
| WebSocket | FastAPI native WebSocket |
| Deployment (API) | Railway |
| Deployment (UI) | Vercel |

---

## Deployment

See **[DEPLOY.md](./DEPLOY.md)** for full Railway + Vercel instructions.

For the stakeholder presentation script, see **[DEMO_SCRIPT.md](./DEMO_SCRIPT.md)**.

### Environment Variables (frontend)

Copy `frontend/.env.example` to `frontend/.env.local` and fill in values:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/telemetry
NEXT_PUBLIC_CONVEYOR_WS_URL=ws://localhost:8000/ws/conveyor-01
```

### Environment Variables (backend)

| Variable | Default | Purpose |
|---|---|---|
| `CORS_ORIGINS` | `*` | Comma-separated list of allowed frontend origins |
| `PORT` | `8000` | Set automatically by Railway |
