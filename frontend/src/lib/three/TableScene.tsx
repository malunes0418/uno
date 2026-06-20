"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, useProgress } from "@react-three/drei";
import { SceneContent } from "./SceneContent";
import { CardTextureProvider } from "./CardTextureProvider";

function TableLoadingOverlay() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div
        style={{
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          whiteSpace: "nowrap",
        }}
      >
        Loading table… {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function TableScene() {
  const dpr = useMemo<[number, number]>(() => [1, isMobileDevice() ? 1 : 2], []);

  return (
    <Canvas
      camera={{ position: [0, 4, 6], fov: 45 }}
      dpr={dpr}
      performance={{ min: 0.5 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#1a5c3a" />
      </mesh>
      <Suspense fallback={<TableLoadingOverlay />}>
        <CardTextureProvider>
          <SceneContent />
        </CardTextureProvider>
      </Suspense>
      <OrbitControls maxPolarAngle={Math.PI / 2.2} />
    </Canvas>
  );
}
