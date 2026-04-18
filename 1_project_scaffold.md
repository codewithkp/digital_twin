You are building a Steel Industry Digital Twin prototype. Create a
full-stack monorepo with the following structure:

FRONTEND: Next.js 14 (App Router), TypeScript, Tailwind CSS,
React Three Fiber + @react-three/drei for 3D, Recharts for charts,
Lucide React for icons, Zustand for state management.

BACKEND: Python FastAPI with WebSocket support, uvicorn server,
pydantic models, a mock sensor data generator that emits realistic
conveyor belt telemetry (belt speed, motor current, bearing temp x4,
vibration RMS x4, tonnes per hour, alignment deviation) every second
with configurable noise and a 'fault injection' mode.

Create:
- /frontend  (Next.js app)
- /backend   (FastAPI app)
- /shared    (TypeScript types + Python pydantic models that mirror each other)
- docker-compose.yml to run both services + InfluxDB
- README.md with 'npm run dev' and 'docker compose up' instructions

The mock data generator should output JSON matching this schema:
{ timestamp, assetId, sensors: { beltSpeed, motorCurrent,
  bearingTemp: [t1,t2,t3,t4], vibrationRMS: [v1,v2,v3,v4],
  tonnesPerHour, alignmentDeviation } }

Include threshold constants for each sensor and a health score
function that returns GREEN / AMBER / RED per sensor.