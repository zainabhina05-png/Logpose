"use client";

export function CompassRing() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.2, 0.08, 16, 64]} />
        <meshStandardMaterial
          color="#C9973B"
          metalness={0.85}
          roughness={0.3}
          emissive="#C9973B"
          emissiveIntensity={0.1}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.0, 0.02, 8, 64]} />
        <meshStandardMaterial color="#8B6914" metalness={0.9} roughness={0.4} />
      </mesh>
      {/* Cardinal marks */}
      {[0, 90, 180, 270].map((deg) => (
        <mesh
          key={deg}
          position={[
            Math.sin((deg * Math.PI) / 180) * 2.0,
            0.05,
            Math.cos((deg * Math.PI) / 180) * 2.0,
          ]}
        >
          <boxGeometry args={[0.04, 0.02, 0.12]} />
          <meshStandardMaterial color="#EDE3D0" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
