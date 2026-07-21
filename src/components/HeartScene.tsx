import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, OrbitControls, Sparkles } from "@react-three/drei";
import { useMemo, useRef, Suspense } from "react";
import * as THREE from "three";
import type { Group, Mesh } from "three";

/** Build an anatomically-inspired heart via an extruded 2D silhouette. */
function useHeartGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    // Silhouette drawn top-down; apex tapers naturally at the bottom.
    // Coordinates are in a ~2-unit box; we rescale after extrusion.
    shape.moveTo(0, 0.55);
    // Left atrium (upper lobe)
    shape.bezierCurveTo(-0.35, 1.15, -1.25, 1.05, -1.25, 0.35);
    // Left ventricle wall curving toward apex
    shape.bezierCurveTo(-1.25, -0.15, -0.9, -0.55, -0.35, -0.95);
    // Apex — soft, slightly rounded rather than a sharp point
    shape.bezierCurveTo(-0.18, -1.15, 0.18, -1.15, 0.35, -0.95);
    // Right ventricle back up
    shape.bezierCurveTo(0.9, -0.55, 1.25, -0.15, 1.25, 0.35);
    // Right atrium (upper lobe)
    shape.bezierCurveTo(1.25, 1.05, 0.35, 1.15, 0, 0.55);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.9,
      bevelEnabled: true,
      bevelThickness: 0.35,
      bevelSize: 0.32,
      bevelSegments: 14,
      curveSegments: 64,
      steps: 2,
    });
    geo.center();
    // Slight non-uniform scale to make it feel like a real heart, not a flat cutout.
    geo.scale(1.0, 1.0, 0.95);
    geo.computeVertexNormals();
    return geo;
  }, []);
}

function HeartMesh() {
  const group = useRef<Group>(null);
  const mesh = useRef<Mesh>(null);
  const geometry = useHeartGeometry();

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    // Two-phase heartbeat (systole/diastole) — subtle and organic.
    const beat =
      1 +
      0.045 * Math.max(0, Math.sin(t * 2.4)) +
      0.028 * Math.max(0, Math.sin(t * 2.4 - 0.35));
    if (mesh.current) {
      mesh.current.scale.setScalar(beat);
    }
    if (group.current) {
      // Gentle, slow drift — never rapid spinning.
      group.current.rotation.y += delta * 0.15;
      group.current.rotation.x = Math.sin(t * 0.3) * 0.08;
    }
  });

  return (
    <group ref={group} rotation={[0, 0, Math.PI]}>
      {/* rotate π on Z so the apex points down as drawn */}
      <mesh ref={mesh} geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#c02236"
          roughness={0.28}
          metalness={0.05}
          clearcoat={0.9}
          clearcoatRoughness={0.18}
          sheen={0.5}
          sheenColor="#ff8a9a"
          sheenRoughness={0.6}
          reflectivity={0.35}
          emissive="#3b0810"
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* Soft inner glow to hint at translucency */}
      <mesh scale={0.82}>
        <sphereGeometry args={[0.9, 48, 48]} />
        <meshBasicMaterial color="#ff5a72" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

export function HeartScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 4.4], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#00000000"]} />

      {/* Warm, editorial lighting */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} color="#fff2e8" />
      <pointLight position={[-4, -2, 2]} intensity={0.9} color="#f7b58c" />
      <pointLight position={[3, -3, -2]} intensity={0.5} color="#e9c5e9" />
      <pointLight position={[0, 5, 2]} intensity={0.35} color="#b89af6" />

      <Suspense fallback={null}>
        <Environment preset="studio" />
        <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.35}>
          <HeartMesh />
        </Float>
        <Sparkles count={40} scale={5.5} size={1.6} speed={0.25} color="#f7b58c" opacity={0.55} />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        rotateSpeed={0.6}
        makeDefault
      />
    </Canvas>
  );
}
