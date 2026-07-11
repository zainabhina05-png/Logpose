"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useSpring, a } from "@react-spring/three";
import * as THREE from "three";

/* ── Needle that oscillates like a real magnetic compass ── */
function EternalNeedle({ targetDeg }: { targetDeg: number }) {
  const targetRad = (targetDeg * Math.PI) / 180;
  const phase = useRef(0);
  const settled = useRef(false);
  const groupRef = useRef<THREE.Group>(null);

  // Spring for final settling
  const { rot } = useSpring({
    rot: targetRad,
    config: { tension: 60, friction: 20, mass: 2 },
    onRest: () => { settled.current = true; },
  });

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    // Initial wild oscillation that dampens to final angle
    const damp = Math.max(0, 1 - t * 0.35);
    const oscillation = Math.sin(t * 4.5 + phase.current) * damp * 1.2;
    const baseAngle = targetRad + oscillation;
    groupRef.current.rotation.y = baseAngle;
  });

  useEffect(() => {
    phase.current = Math.random() * Math.PI * 2;
  }, []);

  return (
    <group ref={groupRef}>
      {/* Needle tip — red/ember pointing "north" (+Z) */}
      <mesh position={[0, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.028, 0.56, 8]} />
        <meshStandardMaterial
          color="#FF4422"
          emissive="#FF4422"
          emissiveIntensity={0.9}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>
      {/* Needle tail — gold */}
      <mesh position={[0, 0, -0.28]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.02, 0.44, 8]} />
        <meshStandardMaterial
          color="#C9973B"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      {/* Center pivot */}
      <mesh>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#8B6914" metalness={0.95} roughness={0.1} />
      </mesh>
    </group>
  );
}

/* ── Inner bubble / fluid dome ── */
function GlassDome() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 0.08;
    }
  });
  return (
    <>
      {/* Glass dome shell */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.82, 64, 64]} />
        <meshPhysicalMaterial
          color="#aaddff"
          transparent
          opacity={0.12}
          roughness={0}
          metalness={0}
          transmission={0.95}
          thickness={0.5}
          ior={1.45}
          reflectivity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner water fill */}
      <mesh>
        <sphereGeometry args={[0.78, 32, 32]} />
        <meshStandardMaterial
          color="#0B4060"
          transparent
          opacity={0.55}
          roughness={0.1}
          metalness={0}
        />
      </mesh>
      {/* Bubble highlight */}
      <mesh position={[-0.28, 0.35, 0.3]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.18} />
      </mesh>
    </>
  );
}

/* ── Brass outer ring / bezel ── */
function BrassBezel() {
  return (
    <group>
      {/* Main outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.88, 0.07, 24, 80]} />
        <meshStandardMaterial
          color="#C9973B"
          metalness={0.92}
          roughness={0.18}
          emissive="#C9973B"
          emissiveIntensity={0.08}
        />
      </mesh>
      {/* Inner trim ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.82, 0.02, 8, 64]} />
        <meshStandardMaterial color="#8B6914" metalness={0.95} roughness={0.1} />
      </mesh>
      {/* Cardinal tick marks */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const isMajor = deg % 90 === 0;
        return (
          <mesh
            key={deg}
            position={[Math.sin(r) * 0.85, 0, Math.cos(r) * 0.85]}
          >
            <boxGeometry args={[0.025, 0.025, isMajor ? 0.09 : 0.05]} />
            <meshStandardMaterial
              color={isMajor ? "#EDE3D0" : "#8B6914"}
              emissive={isMajor ? "#EDE3D0" : "#8B6914"}
              emissiveIntensity={isMajor ? 0.2 : 0}
            />
          </mesh>
        );
      })}
      {/* Mounting bracket top */}
      <mesh position={[0, 0, 0.95]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.1, 0.025, 12, 32]} />
        <meshStandardMaterial color="#C9973B" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* ── Rotating outer crown ring ── */
function CrownRing() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.3;
  });
  return (
    <group ref={ref}>
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return (
          <mesh
            key={deg}
            position={[Math.sin(r) * 1.0, 0, Math.cos(r) * 1.0]}
          >
            <octahedronGeometry args={[0.06, 0]} />
            <meshStandardMaterial
              color="#C9973B"
              emissive="#FFD700"
              emissiveIntensity={0.4}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/* ── Ambient glow disc under the device ── */
function GroundGlow({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.08 + Math.sin(clock.elapsedTime * 1.8) * 0.04;
    }
  });
  return (
    <mesh ref={ref} position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.4, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.1} depthWrite={false} />
    </mesh>
  );
}

/* ── Full Log Pose Scene ── */
function LogPoseScene({ targetDeg, color }: { targetDeg: number; color: string }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} color="#c8d8f8" />
      <pointLight position={[0, 2, 0]} intensity={0.8} color={color} distance={5} />
      <pointLight position={[-2, 1, 2]} intensity={0.3} color="#aaddff" distance={4} />

      <GlassDome />
      <BrassBezel />
      <CrownRing />
      <EternalNeedle targetDeg={targetDeg} />
      <GroundGlow color={color} />
    </>
  );
}

/* ── Public export ── */
interface EternalLogPoseProps {
  targetDeg?: number;
  color?: string;
  className?: string;
}

export function EternalLogPose({
  targetDeg = 0,
  color = "#C9973B",
  className = "",
}: EternalLogPoseProps) {
  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [0, 1.2, 2.8], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <LogPoseScene targetDeg={targetDeg} color={color} />
      </Canvas>
    </div>
  );
}
