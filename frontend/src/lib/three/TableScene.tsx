"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls, useProgress } from "@react-three/drei";
import { SceneContent } from "./SceneContent";
import { CardTextureProvider } from "./CardTextureProvider";
import { TableSurface } from "./TableSurface";

/** Frames center piles (z≈0) and player hand (z≈3.2). */
const CAMERA_TARGET: [number, number, number] = [0, 0, 1.2];
const CAMERA_POSITION: [number, number, number] = [0, 5.5, 6.8];

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
      camera={{ position: CAMERA_POSITION, fov: 42 }}
      dpr={dpr}
      performance={{ min: 0.5 }}
      shadows
    >
      <color attach="background" args={["#0a1612"]} />

      <ambientLight intensity={0.45} />
      <hemisphereLight args={["#c8e6d4", "#1a3d2a", 0.35]} />
      <directionalLight
        position={[5, 10, 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      <TableSurface />

      <ContactShadows
        position={[0, 0.002, 0]}
        opacity={0.45}
        scale={14}
        blur={2.5}
        far={3.5}
        resolution={512}
        color="#000000"
      />

      <Suspense fallback={<TableLoadingOverlay />}>
        <CardTextureProvider>
          <SceneContent />
        </CardTextureProvider>
      </Suspense>

      <OrbitControls
        target={CAMERA_TARGET}
        enablePan={false}
        minDistance={5.5}
        maxDistance={13}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={0.35}
      />
    </Canvas>
  );
}
