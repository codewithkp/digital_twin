# Deployment Guide

## Architecture

```
GitHub repo
├── backend/   →  Railway  (FastAPI + WebSocket)
└── frontend/  →  Vercel   (Next.js 16)
```

---

## Step 1 — Deploy Backend to Railway

### Prerequisites
- [Railway account](https://railway.app) (free tier works)
- GitHub repo connected to Railway

### Steps

1. **Create a new project** in Railway → "Deploy from GitHub repo"
2. Select this repository and choose the **`backend/`** folder as the root directory  
   *(Railway auto-detects `Procfile` and `requirements.txt`)*
3. Set environment variables in Railway → Variables tab:

   | Variable | Value |
   |---|---|
   | `CORS_ORIGINS` | `https://your-app.vercel.app` (set after Vercel deploy) |
   | `PORT` | *Railway sets this automatically* |

4. Click **Deploy**. Wait for the health check at `/health` to return `{"status":"ok"}`.
5. Note your Railway public URL, e.g. `https://digital-twin-api.up.railway.app`

---

## Step 2 — Deploy Frontend to Vercel

### Prerequisites
- [Vercel account](https://vercel.com) (free tier works)
- GitHub repo connected to Vercel

### Steps

1. **New Project** in Vercel → Import from GitHub
2. Set **Root Directory** to `frontend/`
3. Framework preset: **Next.js** (auto-detected)
4. Add Environment Variables:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://digital-twin-api.up.railway.app` |
   | `NEXT_PUBLIC_WS_URL` | `wss://digital-twin-api.up.railway.app/ws/telemetry` |
   | `NEXT_PUBLIC_CONVEYOR_WS_URL` | `wss://digital-twin-api.up.railway.app/ws/conveyor-01` |

5. Click **Deploy**. Note your Vercel URL, e.g. `https://digital-twin.vercel.app`

---

## Step 3 — Update CORS on Railway

1. Go back to Railway → Variables
2. Update `CORS_ORIGINS` to your Vercel URL:
   ```
   https://digital-twin.vercel.app
   ```
3. Railway auto-redeploys with the new value.

---

## Local Development

```bash
# Backend (Python 3.12+)
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows
# source .venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (Node 20+)
cd frontend
cp .env.example .env.local
npm install
npm run dev
# → http://localhost:3000
```

---

## Environment Variables Reference

See `frontend/.env.example` for all supported variables.

| Variable | Used by | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | DevToolbar, LandingPage | REST API base URL |
| `NEXT_PUBLIC_WS_URL` | Viewer WebSocket | Legacy telemetry stream |
| `NEXT_PUBLIC_CONVEYOR_WS_URL` | Dashboard WebSocket | Main conveyor telemetry |
| `CORS_ORIGINS` | Backend (Railway) | Allowed frontend origins |
