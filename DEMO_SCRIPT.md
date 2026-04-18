# Demo Script — Steel Plant Digital Twin (5 minutes)

**Audience:** Non-technical stakeholders (plant managers, operations leads, board)  
**Setup:** Open browser to `http://localhost:3000` (or Vercel URL). Backend running.

---

## 0:00 — Landing Page (30 sec)

**Say:**  
*"What you're looking at is a digital twin of our conveyor system C-01. It connects to the physical sensors in real time — belt speed, motor current, bearing temperatures, vibration — and gives us a single view of asset health that anyone can access from a browser or iPad."*

**Point to:**
- The green "Backend connected" status indicator
- The three feature cards

**Transition:** Click **"Launch Dashboard"**

---

## 0:30 — Live Dashboard (90 sec)

**Say:**  
*"This is the live monitoring dashboard. On the left is the asset tree — it shows Conveyor C-01 broken down into its idler groups and drive system. Any component that goes amber or red shows up here immediately."*

**Point to:**
- The 3D conveyor scene at the top. Slowly orbit it.
- The 12 sensor cards with live sparklines.
- *"Each card shows the current reading, the trend over the last 5 minutes, and the min/max — so you can see not just where we are, but where we've been."*

**Click an idler group in the 3D scene:**  
*"Click any component and we get a full asset detail panel — installation date, last maintenance, operating hours, bearing model, next scheduled service. It also shows the health score trend over the last 30 days."*

**Transition:** Close the panel. Press **"Bearing Fault"** in the dev toolbar.

---

## 2:00 — Fault Injection / The Wow Moment (60 sec)

**Say:**  
*"Watch what happens when bearing 3 starts to degrade."*

*[Wait 10–15 seconds for the readings to rise]*

**Point to:**
- Bearing Temp 3 card turning amber, then red
- The alert appearing in the sidebar: *"The system detected the anomaly automatically and raised an alert."*
- The idler group glowing red in the 3D scene: *"The 3D model updates in real time — no manual inspection required."*
- The trend charts showing the rise: *"And here's the bearing temperature trend — you can see exactly when it started climbing."*

**Click "Flag for Maintenance"** on the alert:  
*"The operator flags it. That writes to our maintenance log and marks the component in the 3D view with an orange indicator. The next shift lead sees it the moment they open the dashboard."*

**Clear the fault** (press Clear in toolbar).

---

## 3:00 — Data Import & Replay (60 sec)

**Navigate to Import & Replay via nav bar.**

**Say:**  
*"Now — what if you want to investigate an incident that happened last week? We can import the historian CSV export and replay it."*

**Click "Load Sample Data":**  
*"This is a 3-hour run with a bearing degradation sequence built in."*

**Press Play, then switch to 60× speed:**  
*"At 60× playback we watch 3 hours of data in under 2 minutes. The dashboard, alerts, and 3D model all respond exactly as they would live."*

**At around row 700, press "Mark Event":**  
*"We can annotate events — 'vibration threshold crossed' — and those markers appear as vertical lines on every trend chart, time-stamped, so the analysis report writes itself."*

---

## 4:00 — Wrap Up (30 sec)

**Navigate back to the landing page.**

**Say:**  
*"The full system deploys in under 10 minutes — the API on Railway, the UI on Vercel — and runs on any modern browser including iPad. No installed software, no VPN. The next step is connecting to real sensor feeds, which is a straightforward WebSocket adapter swap."*

**Anticipated questions:**

| Question | Answer |
|---|---|
| *Is this real data?* | No — all values are synthetically generated for the demo. Real integration requires a WebSocket adapter to your historian or OPC-UA server. |
| *How secure is it?* | The demo has no auth. Production deployment adds JWT/OAuth on the API and SSO on the UI — standard Vercel/Railway patterns. |
| *Can it connect to our existing SCADA?* | Yes. The backend is a thin FastAPI layer. We add an OPC-UA or Modbus reader that pushes frames to the same WebSocket — the frontend doesn't change. |
| *How long to go live?* | With real sensor access: 2–4 weeks for a single conveyor. Full plant: phased over a quarter. |
| *What does it cost to run?* | Railway hobby plan: $5/month. Vercel free tier covers the frontend. |
