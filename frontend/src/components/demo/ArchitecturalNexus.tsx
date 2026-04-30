'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

function NexusPoints() {
  const ref = useRef<THREE.Points>(null!);
  
  // Create a grid of points
  const [positions, stepData] = useMemo(() => {
    const count = 1000;
    const pos = new Float32Array(count * 3);
    const steps = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      steps[i] = Math.random();
    }
    return [pos, steps];
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    ref.current.rotation.y = time * 0.05;
    ref.current.rotation.x = time * 0.03;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#ef4444"
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

function Grid() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
            <planeGeometry args={[20, 20, 20, 20]} />
            <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.05} />
        </mesh>
    );
}

export default function ArchitecturalNexus() {
  return (
    <div className="absolute inset-0 z-0 bg-slate-950">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.5} />
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <NexusPoints />
        </Float>
        <Grid />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950 opacity-80" />
    </div>
  );
}
