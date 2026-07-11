"use client";

import { useMemo } from "react";
import { a, useSpring } from "@react-spring/three";

interface NeedleProps {
  targetAngleDeg: number;
  reducedMotion?: boolean;
  intensity?: number; // 0–1 glow intensity based on leading score
}

export function Needle({
  targetAngleDeg,
  reducedMotion = false,
  intensity = 0.5,
}: NeedleProps) {
  const targetRad = useMemo(
    () => (targetAngleDeg * Math.PI) / 180,
    [targetAngleDeg]
  );

  const springConfig = reducedMotion
    ? { tension: 300, friction: 30, mass: 1 }
    : { tension: 80, friction: 18, mass: 1.2 };

  const { rotation } = useSpring({
    rotation: [0, targetRad, 0] as [number, number, number],
    config: springConfig,
  });

  const emissiveIntensity = 0.5 + intensity * 0.8;
  const glowOpacity = 0.25 + intensity * 0.35;

  return (
    <a.group rotation={rotation as unknown as [number, number, number]}>
      {/* Outer glow halo — wide soft trail */}
      <mesh position={[0, 0.01, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.18, 0.9]} />
        <meshBasicMaterial
          color="#FF6B4A"
          transparent
          opacity={glowOpacity * 0.4}
          blending={2}
          depthWrite={false}
        />
      </mesh>
      {/* Ember glow trail — tight inner */}
      <mesh position={[0, 0.02, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.07, 0.85]} />
        <meshBasicMaterial
          color="#FF6B4A"
          transparent
          opacity={glowOpacity}
          blending={2}
          depthWrite={false}
        />
      </mesh>
      {/* Needle tip (forward — +Z direction) */}
      <mesh position={[0, 0.06, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.055, 1.05, 8]} />
        <meshStandardMaterial
          color="#FF6B4A"
          emissive="#FF6B4A"
          emissiveIntensity={emissiveIntensity}
          metalness={0.6}
          roughness={0.25}
        />
      </mesh>
      {/* Needle tail (backward — -Z direction) */}
      <mesh position={[0, 0.06, -0.42]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.04, 0.72, 8]} />
        <meshStandardMaterial
          color="#8B6914"
          metalness={0.85}
          roughness={0.3}
        />
      </mesh>
      {/* Center pivot jewel */}
      <mesh position={[0, 0.07, 0]}>
        <sphereGeometry args={[0.085, 16, 16]} />
        <meshStandardMaterial
          color="#C9973B"
          emissive="#C9973B"
          emissiveIntensity={0.3}
          metalness={0.95}
          roughness={0.1}
        />
      </mesh>
      {/* Pivot base ring */}
      <mesh position={[0, 0.025, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.015, 8, 24]} />
        <meshStandardMaterial
          color="#8B6914"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
    </a.group>
  );
}
