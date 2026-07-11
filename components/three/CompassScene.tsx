"use client";

import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { Island, PassionScore } from "@/lib/types";
import { useCompassData } from "@/lib/compass-utils";
import { OceanPlane } from "./OceanPlane";
import { CompassRing } from "./CompassRing";
import { Needle } from "./Needle";
import { IslandMarker } from "./IslandMarker";
import { Skeleton } from "@/components/ui/Skeleton";

interface CompassSceneProps {
  islands: Island[];
  scores: PassionScore[];
  focusedIslandId?: string;
  onIslandClick?: (id: string) => void;
  onNavigate?: (id: string) => void;
}

function SceneCamera({
  focusedIslandId,
  islands,
  reducedMotion,
}: {
  focusedIslandId?: string;
  islands: Island[];
  reducedMotion: boolean;
}) {
  const controlsRef = useRef<CameraControls>(null);

  useEffect(() => {
    if (!controlsRef.current) return;
    if (focusedIslandId) {
      const idx = islands.findIndex((i) => i.islandId === focusedIslandId);
      if (idx !== -1) {
        // Calculate where the island is
        const { computeIslandAngle } = require("@/lib/compass-utils");
        const angleDeg = computeIslandAngle(idx, islands.length);
        const angleRad = (angleDeg * Math.PI) / 180;
        const radius = 1.6;
        const x = Math.sin(angleRad) * radius;
        const z = Math.cos(angleRad) * radius;

        // Move camera slightly towards the island, but keep it looking at the center
        controlsRef.current.setLookAt(x * 1.5, 3.5, z * 1.5 + 4, 0, 0, 0, true);
      }
    } else {
      // Reset to default
      controlsRef.current.setLookAt(0, 4.5, 5.5, 0, 0, 0, true);
    }
  }, [focusedIslandId, islands]);

  useFrame((_, delta) => {
    if (!reducedMotion && !focusedIslandId && controlsRef.current) {
      controlsRef.current.azimuthAngle += delta * 0.06;
    }
  });

  return (
    <CameraControls
      ref={controlsRef}
      minPolarAngle={Math.PI / 4.5}
      maxPolarAngle={Math.PI / 2.4}
      mouseButtons={{ left: 1, middle: 0, right: 0, wheel: 0 }}
      touches={{ one: 32, two: 0, three: 0 }}
    />
  );
}

function SceneContent({
  islands,
  scores,
  focusedIslandId,
  onIslandClick,
  onNavigate,
  reducedMotion,
}: CompassSceneProps & { reducedMotion: boolean }) {
  const { normalized, needleAngle, leadingId } = useCompassData(islands, scores);
  const scoreMap = new Map(scores.map((s) => [s.islandId, s]));
  const leadingScore = leadingId ? (normalized.get(leadingId) ?? 0) : 0;

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 3]} intensity={0.9} color="#c8d8e8" castShadow />
      <directionalLight position={[-4, 6, -2]} intensity={0.25} color="#8899aa" />
      <pointLight
        position={[0, 2.5, 0]}
        intensity={leadingId ? 0.7 + leadingScore * 0.5 : 0}
        color="#FF6B4A"
        distance={10}
      />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      <OceanPlane />
      <CompassRing />
      <Needle
        targetAngleDeg={needleAngle}
        reducedMotion={reducedMotion}
        intensity={leadingScore}
      />
      {islands.map((island, i) => {
        const score = scoreMap.get(island.islandId);
        return (
          <IslandMarker
            key={island.islandId}
            island={island}
            index={i}
            total={islands.length}
            normalizedScore={normalized.get(island.islandId) ?? 0}
            hoursSinceLast={score?.mostRecentHoursAgo ?? 999}
            isLeading={island.islandId === leadingId}
            isFocused={island.islandId === focusedIslandId}
            anyFocused={!!focusedIslandId}
            onClick={onIslandClick}
            onNavigate={onNavigate}
          />
        );
      })}
      <SceneCamera
        focusedIslandId={focusedIslandId}
        islands={islands}
        reducedMotion={reducedMotion}
      />
    </>
  );
}

export function CompassScene(props: CompassSceneProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="h-full w-full min-h-[320px]">
      <Canvas
        camera={{ position: [0, 4.5, 5.5], fov: 42 }}
        shadows
        gl={{ antialias: true }}
        onPointerMissed={() => props.onIslandClick?.("")}
      >
        <Suspense fallback={null}>
          <SceneContent {...props} reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export function CompassSceneFallback() {
  return <Skeleton className="h-full w-full min-h-[320px] rounded-xl" />;
}
