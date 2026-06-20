"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { CardMesh } from "./CardMesh";

export function TableScene() {
  return (
    <Canvas camera={{ position: [0, 4, 6], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#1a5c3a" />
      </mesh>
      <CardMesh color="Red" type="Five" position={[0, 0.05, 0]} />
      <OrbitControls maxPolarAngle={Math.PI / 2.2} />
    </Canvas>
  );
}
