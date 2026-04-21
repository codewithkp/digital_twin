'use client';
import { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { TelemetryFrame, HealthStatus } from '@shared/types';
import { healthForValue, THRESHOLDS } from '@shared/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMISSIVE: Record<HealthStatus, string> = {
  GREEN: '#00c853',
  AMBER: '#ff6f00',
  RED:   '#d32f2f',
};

const EMISSIVE_INTENSITY: Record<HealthStatus, number> = {
  GREEN: 0.15,
  AMBER: 0.55,
  RED:   0.9,
};

// 8 idlers evenly spaced −8 → +8, grouped into 4 pairs (step ≈ 2.29)
const IDLER_PAIRS: [number, number][] = [
  [-8.00, -5.71],
  [-3.43, -1.14],
  [ 1.14,  3.43],
  [ 5.71,  8.00],
];

// ─── Belt surface with scrolling UV ───────────────────────────────────────────

function BeltSurface({ beltSpeed }: { beltSpeed: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 256, 32);
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#2b2b2b' : '#1d1d1d';
      ctx.fillRect(i * 16, 0, 16, 32);
      // plate edge
      ctx.fillStyle = '#383838';
      ctx.fillRect(i * 16, 0, 1, 32);
    }
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(12, 1);
    return t;
  }, []);

  useFrame((_, delta) => {
    texture.offset.x -= delta * beltSpeed * 0.06;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.17, 0]}>
      <planeGeometry args={[20, 2]} />
      <meshStandardMaterial map={texture} roughness={0.85} metalness={0.1} />
    </mesh>
  );
}

// ─── Idler group (2 rollers) ───────────────────────────────────────────────────

interface IdlerGroupProps {
  xPositions: [number, number];
  healthStatus: HealthStatus;
  groupId: string;
  onClick: (id: string) => void;
}

function IdlerGroup({ xPositions, healthStatus, groupId, onClick }: IdlerGroupProps) {
  return (
    <group
      onClick={(e) => { e.stopPropagation(); onClick(groupId); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      {xPositions.map((x) => (
        <mesh key={x} position={[x, -0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 2.35, 20]} />
          <meshStandardMaterial
            color="#4a5568"
            emissive={EMISSIVE[healthStatus]}
            emissiveIntensity={EMISSIVE_INTENSITY[healthStatus]}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Drive pulley ─────────────────────────────────────────────────────────────

function DrivePulley({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.38, 0.38, 2.4, 24]} />
      <meshStandardMaterial color="#718096" metalness={0.85} roughness={0.2} />
    </mesh>
  );
}

// ─── Drive motor housing ───────────────────────────────────────────────────────

function MotorHousing({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main casing */}
      <mesh>
        <boxGeometry args={[2.2, 1.2, 1.6]} />
        <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Drive shaft stub */}
      <mesh position={[-1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.5, 16]} />
        <meshStandardMaterial color="#a0aec0" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Cooling fins (decorative thin boxes) */}
      {[-0.4, 0, 0.4].map((z) => (
        <mesh key={z} position={[0.3, 0.7, z]}>
          <boxGeometry args={[1.6, 0.08, 0.25]} />
          <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Scene content (must live inside <Canvas>) ────────────────────────────────

// Centre X of each idler group (average of pair positions)
const GROUP_CENTER_X = IDLER_PAIRS.map(([a, b]) => (a + b) / 2);

interface SceneProps {
  sensorData: TelemetryFrame | null;
  onComponentClick: (id: string) => void;
  controlsRef: React.RefObject<unknown>;
  flaggedIds: string[];
}

function Scene({ sensorData, onComponentClick, controlsRef, flaggedIds }: SceneProps) {
  const sensors = sensorData?.sensors;
  const beltSpeed = sensors?.beltSpeed ?? 1.2;

  const idlerHealth: HealthStatus[] = useMemo(() => {
    if (!sensors) return ['GREEN', 'GREEN', 'GREEN', 'GREEN'];
    return (sensors.bearingTemp as number[]).map((t) =>
      healthForValue(t, THRESHOLDS.bearingTemp),
    );
  }, [sensors]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 8]}
        intensity={1.6}
        color="#fff8e8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* Warm point light on motor */}
      <pointLight
        position={[13, 2, 0]}
        intensity={12}
        color="#ffa040"
        distance={10}
        decay={2}
      />

      {/* Belt frame */}
      <mesh receiveShadow>
        <boxGeometry args={[20, 0.3, 2]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.6} />
      </mesh>

      {/* Animated belt surface */}
      <BeltSurface beltSpeed={beltSpeed} />

      {/* Drive pulleys — head (x=+10) and tail (x=−10) */}
      <DrivePulley position={[10, -0.35, 0]} />
      <DrivePulley position={[-10, -0.35, 0]} />

      {/* 4 idler groups (8 rollers total) */}
      {IDLER_PAIRS.map((xPos, i) => (
        <IdlerGroup
          key={i}
          xPositions={xPos}
          healthStatus={idlerHealth[i]}
          groupId={`group-${i}`}
          onClick={onComponentClick}
        />
      ))}

      {/* Motor housing at head end */}
      <MotorHousing position={[12.5, -0.4, 0]} />

      {/* Flag markers above flagged idler groups */}
      {IDLER_PAIRS.map((_, i) =>
        flaggedIds.includes(`group-${i}`) ? (
          <FlagMarker key={i} x={GROUP_CENTER_X[i]} />
        ) : null,
      )}

      <OrbitControls
        ref={controlsRef as React.RefObject<never>}
        enableDamping
        dampingFactor={0.06}
        minDistance={6}
        maxDistance={50}
      />
    </>
  );
}

// ─── Flag marker (animated torus above a flagged idler group) ─────────────────

function FlagMarker({ x }: { x: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    ref.current.position.y = 1.4 + Math.sin(clock.elapsedTime * 2.5) * 0.15;
    ref.current.rotation.z = clock.elapsedTime * 1.2;
  });
  return (
    <mesh ref={ref} position={[x, 1.4, 0]}>
      <torusGeometry args={[0.28, 0.07, 12, 32]} />
      <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={1.2} />
    </mesh>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface ConveyorSceneProps {
  sensorData: TelemetryFrame | null;
  onComponentClick: (id: string) => void;
  flaggedIds?: string[];
}

function ConveyorSchematic({ sensorData }: { sensorData: TelemetryFrame | null }) {
  const sensors = sensorData?.sensors;
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 p-4 gap-3">
      <p className="text-slate-500 text-xs uppercase tracking-widest">2D Schematic — WebGL unavailable</p>
      <svg viewBox="0 0 400 80" className="w-full max-w-md" fill="none">
        <rect x="10" y="30" width="380" height="16" rx="4" fill="#374151" />
        {[0, 1, 2, 3].map((i) => {
          const x = 60 + i * 85;
          const bt = sensors ? (sensors.bearingTemp as number[])[i] : 0;
          const color = bt >= 80 ? '#ef4444' : bt >= 60 ? '#f59e0b' : '#4ade80';
          return <g key={i}><ellipse cx={x} cy="38" rx="14" ry="14" fill="#4a5568" stroke={color} strokeWidth="2.5" /><text x={x} y="42" textAnchor="middle" fontSize="9" fill={color}>{bt ? bt.toFixed(0) : '—'}</text></g>;
        })}
        <ellipse cx="20"  cy="38" rx="14" ry="14" fill="#718096" />
        <ellipse cx="380" cy="38" rx="14" ry="14" fill="#718096" />
        <text x="200" y="70" textAnchor="middle" fontSize="10" fill="#64748b">
          {sensors ? `${sensors.beltSpeed.toFixed(2)} m/s · ${sensors.motorCurrent.toFixed(1)} A · ${sensors.tonnesPerHour.toFixed(0)} t/h` : 'No data'}
        </text>
      </svg>
      <p className="text-slate-600 text-[10px]">Numbers show bearing temperatures (°C) · coloured by health</p>
    </div>
  );
}

export function ConveyorScene({ sensorData, onComponentClick, flaggedIds = [] }: ConveyorSceneProps) {
  const [webGLAvailable, setWebGLAvailable] = useState(true);
  const controlsRef = useRef<unknown>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl');
      if (!gl) setWebGLAvailable(false);
    } catch {
      setWebGLAvailable(false);
    }
  }, []);

  const resetView = useCallback(() => {
    (controlsRef.current as { reset?: () => void } | null)?.reset?.();
  }, []);

  if (!webGLAvailable) {
    return (
      <div className="relative w-full h-72 rounded-xl overflow-hidden">
        <ConveyorSchematic sensorData={sensorData} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-72 rounded-xl overflow-hidden bg-slate-900 border border-slate-700">
      <Canvas
        camera={{ position: [12, 10, 18], fov: 45, near: 0.1, far: 120 }}
        shadows
      >
        <Scene
          sensorData={sensorData}
          onComponentClick={onComponentClick}
          controlsRef={controlsRef}
          flaggedIds={flaggedIds}
        />
      </Canvas>

      <button
        onClick={resetView}
        className="absolute top-3 right-3 bg-slate-700/80 hover:bg-slate-600 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
      >
        Reset View
      </button>

      <p className="absolute bottom-2 left-3 text-slate-600 text-[10px] pointer-events-none">
        Click an idler group to inspect · Scroll to zoom · Drag to orbit
      </p>
    </div>
  );
}
