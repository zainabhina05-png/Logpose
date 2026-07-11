"use client";

import { useRef, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Island } from "@/lib/types";
import { computeIslandAngle, normalizeIcon } from "@/lib/compass-utils";

interface IslandMarkerProps {
  island: Island;
  index: number;
  total: number;
  normalizedScore: number;
  hoursSinceLast: number;
  isLeading: boolean;
  isFocused: boolean;
  anyFocused: boolean;
  onClick?: (id: string) => void;
  onNavigate?: (id: string) => void;
}

export function IslandMarker({
  island,
  index,
  total,
  normalizedScore,
  hoursSinceLast,
  isLeading,
  isFocused,
  anyFocused,
  onClick,
  onNavigate,
}: IslandMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<THREE.Mesh>(null);

  const angleDeg = computeIslandAngle(index, total);
  const angleRad = (angleDeg * Math.PI) / 180;
  const radius = 1.6;
  const x = Math.sin(angleRad) * radius;
  const z = Math.cos(angleRad) * radius;

  const neglectFactor = Math.min(hoursSinceLast / 72, 1);

  const baseColor = island.colorHex;
  const emissiveIntensity =
    normalizedScore * (1 - neglectFactor * 0.5) * (isLeading ? 1.8 : 0.8);
  
  // Adjusted scale to be less aggressive ("only a fraction")
  const scale = Math.log(normalizedScore * 100 + 1) * 0.05 + 0.28;

  // If another island is focused, this one should blur/fade out
  const isBlurred = anyFocused && !isFocused;
  const opacity = isBlurred ? 0.1 : 1 - neglectFactor * 0.35;

  useFrame(({ clock }) => {
    if (meshRef.current) {
      if (isLeading) {
        meshRef.current.position.y =
          0.18 + Math.sin(clock.elapsedTime * 1.6) * 0.05;
        meshRef.current.rotation.y = clock.elapsedTime * 0.5;
      } else if (neglectFactor > 0.3) {
        meshRef.current.position.y =
          0.15 + Math.sin(clock.elapsedTime * 0.6 + index) * 0.025 * neglectFactor;
      }
    }
    // Halo pulsing for leading island
    if (haloRef.current && isLeading) {
      const pulse = 0.85 + Math.sin(clock.elapsedTime * 2.4) * 0.15;
      haloRef.current.scale.set(pulse, pulse, pulse);
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.15 + Math.sin(clock.elapsedTime * 2.4) * 0.1;
    }
  });

  const handleClick = useCallback(
    (e: THREE.Event) => {
      (e as unknown as { stopPropagation: () => void }).stopPropagation();
      onClick?.(island.islandId);
    },
    [island.islandId, onClick]
  );

  return (
    <group position={[x, 0.15, z]}>
      {/* Pulsing halo ring for leading island */}
      {isLeading && (
        <mesh ref={haloRef} position={[0, 0, 0]}>
          <sphereGeometry args={[scale * 2.2, 16, 16]} />
          <meshBasicMaterial
            color={baseColor}
            transparent
            opacity={0.2}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Main island body */}
      <mesh
        ref={meshRef}
        scale={[scale, scale, scale]}
        onClick={handleClick}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={Math.max(emissiveIntensity, 0.08)}
          metalness={isLeading ? 0.3 : 0.4}
          roughness={isLeading ? 0.3 : 0.55}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Tiny crown gem on top for leading */}
      {isLeading && !isBlurred && (
        <mesh position={[0, scale * 1.3, 0]}>
          <octahedronGeometry args={[scale * 0.3, 0]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={1.2}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      )}

      {/* Name label plane — rendered as a flat plane with the island color stripe */}
      <mesh ref={labelRef} position={[0, scale * 1.6 + (isLeading ? 0.35 : 0), 0]}>
        <planeGeometry args={[0.01, 0.01]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Floating HTML Popup when Focused */}
      {isFocused && (
        <Html
          position={[0, scale * 2.5, 0]}
          center
          zIndexRange={[100, 0]}
          className="pointer-events-auto"
        >
          <div
            className="flex flex-col items-center animate-in fade-in zoom-in duration-300 drop-shadow-xl"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate?.(island.islandId);
            }}
          >
            <div className="bg-ocean/90 backdrop-blur-md border border-brass/50 text-parchment px-4 py-2.5 rounded-xl cursor-pointer hover:bg-ocean transition-colors group flex items-center gap-3">
              <span className="text-xl">{normalizeIcon(island.icon)}</span>
              <div>
                <p className="font-display text-base font-bold text-brass leading-none mb-1">
                  {island.name}
                </p>
                <p className="text-xs font-mono text-parchment/60 group-hover:text-brass/80 transition-colors">
                  Open Logs ➔
                </p>
              </div>
            </div>
            {/* Pointer triangle */}
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-brass/50" />
          </div>
        </Html>
      )}
    </group>
  );
}
