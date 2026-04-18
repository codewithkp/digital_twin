Prepare the prototype for a stakeholder demo deployment.

1. LANDING PAGE: Create a clean landing page at / with:
   - A hero section: 'Steel Plant Digital Twin — Prototype v1'
   - Three feature cards: Live Monitoring, 3D Asset View, Data Import
   - A 'Launch Dashboard' button and 'Import Data' button
   - A status indicator showing backend connectivity

2. NAVIGATION: Add a top navigation bar with:
   - Logo/title, nav links (Dashboard, 3D View, Import, About)
   - A live connection status dot (green/red pulse animation)
   - A 'Demo Mode' badge so stakeholders know it's simulated data

3. RESPONSIVE LAYOUT: Ensure the dashboard works on iPad
   (the primary field device). Test at 768px width.
   The 3D scene should degrade gracefully on mobile (show
   a 2D schematic fallback if WebGL is unavailable).

4. DEPLOYMENT:
   - Add a Procfile and Railway deployment config for the FastAPI backend
   - Configure next.config.js to point NEXT_PUBLIC_WS_URL and
     NEXT_PUBLIC_API_URL to environment variables
   - Add a .env.example file
   - Write a DEPLOY.md with exact steps:
     a) Railway: connect GitHub repo, set env vars, deploy backend
     b) Vercel: connect GitHub repo, set NEXT_PUBLIC_WS_URL, deploy frontend
   - Ensure the backend supports CORS for the Vercel domain

5. DEMO SCRIPT: Create a DEMO_SCRIPT.md file with a 5-minute
   walkthrough script for presenting to non-technical stakeholders:
   - What to say at each screen
   - When to trigger fault injection for the 'wow moment'
   - Anticipated questions and answers
