Create an AssetDetailPanel component that slides in from the right
when a component is clicked in the 3D scene. It should show:

1. HEADER: Component name (e.g. 'Idler Group 3'), asset tag ID,
   current health status badge, and a close button.

2. SENSOR READINGS: Real-time values specific to this component
   (e.g. bearingTemp[2] and vibrationRMS[2] for Idler Group 3),
   with mini trend sparklines.

3. ASSET METADATA (from hardcoded JSON data/assets.json):
   - Installation date
   - Last maintenance date + type performed
   - Total operating hours
   - Bearing model number + rated life (hours)
   - Next scheduled maintenance date

4. HEALTH HISTORY: A simple Recharts AreaChart showing a simulated
   'health score' (0–100) for this component over the last 30 days.
   Generate this from a seeded random walk so it looks realistic.

5. MAINTENANCE LOG: A scrollable list of past maintenance events
   loaded from data/maintenance-log.json (create sample data for
   6 months). Each entry: date, technician, work performed, parts used.

6. ACTION BUTTONS: 'Flag for Maintenance' (POST to API),
   'Download Asset Report' (client-side PDF using jsPDF — include
   current sensor values + metadata + last 5 alerts).

Use Framer Motion for the slide-in animation.
