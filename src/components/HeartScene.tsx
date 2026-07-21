import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls, Sparkles } from "@react-three/drei";
import { useMemo, useRef, Suspense } from "react";
import * as THREE from "three";
import type { Group, Mesh } from "three";

/** Anatomically-inspired heart via extruded silhouette + subtle atria bumps. */
function useHeartGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    // Classic cardioid silhouette with a naturally tapered apex.
    shape.moveTo(0, 0.5);
    shape.bezierCurveTo(-0.25, 1.1, -1.15, 1.05, -1.15, 0.3);
    shape.bezierCurveTo(-1.15, -0.25, -0.75, -0.6, -0.28, -1.0);
    shape.bezierCurveTo(-0.14, -1.18, 0.14, -1.18, 0.28, -1.0);
    shape.bezierCurveTo(0.75, -0.6, 1.15, -0.25, 1.15, 0.3);
    shape.bezierCurveTo(1.15, 1.05, 0.25, 1.1, 0, 0.5);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 1.05,
      bevelEnabled: true,
      bevelThickness: 0.45,
      bevelSize: 0.42,
      bevelSegments: 18,
      curveSegments: 96,
      steps: 3,
    });
    geo.center();
    // Slightly compress the "back" so the profile isn't a puffy pillow.
    geo.scale(1.0, 1.0, 0.85);
    geo.computeVertexNormals();
    return geo;
  }, []);
}

function HeartMesh({ bpm = 74 }: { bpm?: number }) {
  const group = useRef<Group>(null);
  const mesh = useRef<Mesh>(null);
  const glow = useRef<Mesh>(null);
  const geometry = useHeartGeometry();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const hz = Math.max(0.8, Math.min(1.6, bpm / 60));
    // Two-phase heartbeat (systole/diastole).
    const phase = (t * hz) % 1;
    const contract = phase < 0.18 ? Math.sin((phase / 0.18) * Math.PI) : 0;
    const rebound = phase >= 0.22 && phase < 0.34
      ? Math.sin(((phase - 0.22) / 0.12) * Math.PI) * 0.5
      : 0;
    const beat = 1 + 0.055 * contract + 0.025 * rebound;
    if (mesh.current) {
      mesh.current.scale.setScalar(beat);
      mesh.current.rotation.z = Math.sin(t * hz * Math.PI) * 0.012;
    }
    if (glow.current) {
      const mat = glow.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.07 + 0.11 * contract;
      glow.current.scale.setScalar(0.9 + 0.05 * contract);
    }
  });

  return (
    <group ref={group}>
      <mesh ref={mesh} geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#c02236"
          roughness={0.32}
          metalness={0.04}
          clearcoat={0.95}
          clearcoatRoughness={0.16}
          sheen={0.6}
          sheenColor="#ff8a9a"
          sheenRoughness={0.55}
          reflectivity={0.4}
          emissive="#3b0810"
          emissiveIntensity={0.32}
          transmission={0.05}
          thickness={0.6}
        />
      </mesh>
      {/* Inner pulse glow synchronized to heartbeat */}
      <mesh ref={glow}>
        <sphereGeometry args={[1.0, 48, 48]} />
        <meshBasicMaterial color="#ff5a72" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

export function HeartScene({ bpm = 74 }: { bpm?: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 4.6], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      shadows
    >
      <color attach="background" args={["#00000000"]} />

      {/* Warm editorial lighting */}
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[3, 4, 5]}
        intensity={1.3}
        color="#fff2e8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-4, -2, 2]} intensity={0.9} color="#f7b58c" />
      <pointLight position={[3, -3, -2]} intensity={0.55} color="#e9c5e9" />
      <pointLight position={[0, 5, 2]} intensity={0.4} color="#b89af6" />

      <Suspense fallback={null}>
        <Environment preset="studio" />
        <HeartMesh bpm={bpm} />
        <ContactShadows
          position={[0, -1.7, 0]}
          opacity={0.35}
          scale={7}
          blur={2.4}
          far={3}
          color="#5b1226"
        />
        <Sparkles count={40} scale={5.5} size={1.6} speed={0.25} color="#f7b58c" opacity={0.55} />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.8}
        autoRotate
        autoRotateSpeed={0.9}
        // Allow full 360° in every direction
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        makeDefault
      />
    </Canvas>
  );
}
