In the Next.js frontend, create a React component ConveyorScene
using React Three Fiber. The scene should:

1. GEOMETRY: Build a procedural conveyor belt from Three.js primitives
   (no external GLTF needed yet). Use:
   - A long flat BoxGeometry for the belt frame (20 units long, 2 wide)
   - 8 CylinderGeometry idler rollers spaced evenly underneath
   - 2 larger CylinderGeometry drive pulleys at head + tail
   - A thin animated plane representing the belt surface (use a
     scrolling texture or UV offset animation to simulate movement)
   - A BoxGeometry drive motor housing at the head end

2. HEALTH COLOURS: Each idler group (pairs of 2 rollers) should
   accept a healthStatus prop: 'green' | 'amber' | 'red' and
   change its MeshStandardMaterial emissive colour accordingly.
   Green = #00c853, Amber = #ff6f00, Red = #d32f2f.

3. INTERACTION: Use @react-three/drei OrbitControls for pan/zoom/rotate.
   Make each idler group clickable — onClick emits the group ID.
   Clicking a component opens an info panel in the parent page.

4. ANIMATION: Belt surface scrolls at a speed proportional to the
   beltSpeed sensor value received via props.

5. LIGHTING: Use a warm directional light from above-right, ambient
   light at 0.4 intensity, and a subtle point light on the drive motor.

6. CAMERA: Default isometric-ish view showing the full belt length.
   Add a 'Reset View' button outside the canvas.

Export as <ConveyorScene sensorData={...} onComponentClick={...} />