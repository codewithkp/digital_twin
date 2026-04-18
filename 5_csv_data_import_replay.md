Add a Data Import page at /import in the Next.js app.

1. FILE UPLOAD: A drag-and-drop CSV uploader (react-dropzone).
   The expected CSV columns are:
   timestamp, belt_speed, motor_current, bearing_temp_1,
   bearing_temp_2, bearing_temp_3, bearing_temp_4,
   vibration_rms_1, vibration_rms_2, vibration_rms_3,
   vibration_rms_4, tonnes_per_hour, alignment_deviation

2. PREVIEW TABLE: After upload, show first 20 rows in a table.
   Highlight any rows where values exceed thresholds in red.
   Show data quality stats: total rows, missing values per column,
   date range, any duplicate timestamps.

3. REPLAY CONTROLS: A player bar with Play/Pause/Stop,
   playback speed selector (1x, 5x, 10x, 60x),
   a scrubber timeline, and current timestamp display.
   When playing, the replay feeds data row-by-row into the
   same Zustand store that live WebSocket data uses — so the
   dashboard, 3D scene, and alerts all respond identically.

4. ANNOTATION: During replay, allow clicking 'Mark Event' to
   add a timestamped annotation (text + severity) visible as
   a vertical line on all trend charts.

5. SAMPLE DATA: Generate a sample CSV file (1000 rows, 10-second
   intervals) that includes a realistic bearing degradation sequence
   over 3 hours — gradual temperature rise then sudden vibration spike.
   Save as public/sample-conveyor-data.csv and add a
   'Load Sample Data' button to skip the upload step.
