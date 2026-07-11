"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave1 = sin(pos.x * 0.3 + uTime * 0.8) * 0.15;
    float wave2 = sin(pos.y * 0.25 + uTime * 0.6) * 0.12;
    float wave3 = sin((pos.x + pos.y) * 0.2 + uTime * 1.1) * 0.08;
    float elevation = wave1 + wave2 + wave3;
    pos.z += elevation;
    vElevation = elevation;
    vNormal = normalize(normal + vec3(0.0, 0.0, elevation * 0.5));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColorDeep;
  uniform vec3 uColorShallow;
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vNormal;

  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    vec3 color = mix(uColorDeep, uColorShallow, vElevation * 2.0 + 0.5);
    color += fresnel * 0.15;
    gl_FragColor = vec4(color, 0.95);
  }
`;

export function OceanPlane() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorDeep: { value: new THREE.Color("#0B2027") },
      uColorShallow: { value: new THREE.Color("#1a3a42") },
    }),
    []
  );

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[30, 30, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
