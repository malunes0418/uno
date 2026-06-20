"use client";

const TABLE_WIDTH = 12;
const TABLE_DEPTH = 8;
const RIM_INSET = 0.45;
const BEVEL_LIFT = 0.012;

const PLAYING_COLOR = "#1a5c3a";
const RIM_COLOR = "#0f3d25";

export function TableSurface() {
  const innerWidth = TABLE_WIDTH - RIM_INSET * 2;
  const innerDepth = TABLE_DEPTH - RIM_INSET * 2;

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[TABLE_WIDTH, TABLE_DEPTH]} />
        <meshStandardMaterial color={RIM_COLOR} roughness={0.95} metalness={0} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, BEVEL_LIFT, 0]}
        receiveShadow
      >
        <planeGeometry args={[innerWidth, innerDepth]} />
        <meshStandardMaterial
          color={PLAYING_COLOR}
          roughness={0.92}
          metalness={0}
        />
      </mesh>
    </group>
  );
}
