"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
} from "@react-three/drei";
import { Suspense } from "react";
import { Trees } from "./Trees";

export default function TropicalScene() {
  return (
    <div className="size-full  ">
      <Canvas shadows>
        {/* Camera - FIXED for wider view */}
        <PerspectiveCamera makeDefault position={[-1020, 180, -795]} fov={80} />

        {/* Lighting - FIXED */}
        <ambientLight intensity={1.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[-10, 5, -10]} intensity={0.5} color="#FFF5E1" />

        {/* Environment */}
        <Environment preset="sunset" />

        {/* 3D Model */}
        <Suspense fallback={null}>
          <Trees
            position={[0, -1, 0]}
            scale={2.5}
            rotation={[0, Math.PI / 4, 0]}
          />
        </Suspense>

        {/* Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
          minDistance={50}
          maxDistance={200}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
