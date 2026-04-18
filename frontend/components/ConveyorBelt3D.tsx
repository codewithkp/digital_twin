'use client';
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { healthForValue, THRESHOLDS } from '@shared/types';

const STATUS_COLORS = { GREEN: '#22c55e', AMBER: '#f59e0b', RED: '#ef4444' } as const;

function AnimatedRollers({ speed }: { speed: number }) {
  const refs = [
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
  ];
  useFrame((_, delta) => {
    refs.forEach((r) => {
      if (r.current) r.current.rotation.x += delta * speed * 3;
    });
  });
  const xs = [-3, -1.5, 0, 1.5, 3];
  return (
    <>
      {xs.map((x, i) => (
        <mesh key={x} ref={refs[i]} position={[x, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 1.7, 20]} />
          <meshStandardMaterial color="#6b7280" metalness={0.85} roughness={0.25} />
        </mesh>
      ))}
    </>
  );
}

function BearingDot({
  position,
  temp,
}: {
  position: [number, number, number];
  temp: number;
}) {
  const status = healthForValue(temp, THRESHOLDS.bearingTemp);
  const color = STATUS_COLORS[status];
  const pulse = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (pulse.current && status !== 'GREEN') {
      const s = 1 + 0.15 * Math.sin(clock.elapsedTime * 4);
      pulse.current.scale.setScalar(s);
    }
  });
  return (
    <mesh ref={pulse} position={position}>
      <sphereGeometry args={[0.11, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
    </mesh>
  );
}

interface ConveyorBelt3DProps {
  beltSpeed: number;
  bearingTemps: [number, number, number, number];
}

const BEARING_XS: [number, number, number, number] = [-3, -1, 1, 3];

export function ConveyorBelt3D({ beltSpeed, bearingTemps }: ConveyorBelt3DProps) {
  return (
    <div className="w-full h-52 rounded-xl overflow-hidden bg-slate-900 border border-slate-700">
      <Canvas camera={{ position: [0, 3.5, 7], fov: 38 }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 10, 5]} intensity={1.1} castShadow />

        {/* Belt surface */}
        <mesh position={[0, 0.07, 0]}>
          <boxGeometry args={[8, 0.06, 1.65]} />
          <meshStandardMaterial color="#111827" />
        </mesh>

        {/* Side rails */}
        {([0.9, -0.9] as number[]).map((z) => (
          <mesh key={z} position={[0, 0.12, z]}>
            <boxGeometry args={[8.2, 0.18, 0.07]} />
            <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}

        <AnimatedRollers speed={beltSpeed} />

        {BEARING_XS.map((x, i) => (
          <BearingDot
            key={x}
            position={[x, 0.27, 0.95]}
            temp={bearingTemps[i]}
          />
        ))}

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.6}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>
    </div>
  );
}
