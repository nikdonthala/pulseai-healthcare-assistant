import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, OrbitControls, Sparkles } from "@react-three/drei";
import { useRef, Suspense } from "react";
import type { Mesh, Group } from "three";

function HeartShape() {
  const group = useRef<Group>(null);
  const inner = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Simulated heartbeat: two quick pulses per cycle
    const beat =
      1 + 0.06 * Math.max(0, Math.sin(t * 3.2)) + 0.04 * Math.max(0, Math.sin(t * 3.2 - 0.35));
    if (group.current) {
      group.current.scale.setScalar(beat);
      group.current.rotation.y = Math.sin(t * 0.4) * 0.35;
    }
    if (inner.current) {
      inner.current.rotation.x = t * 0.2;
      inner.current.rotation.z = t * 0.15;
    }
  });

  // A stylized heart built from two spheres + a cone — no external model needed.
  return (
    <group ref={group}>
      {/* left lobe */}
      <mesh position={[-0.55, 0.35, 0]}>
        <sphereGeometry args={[0.9, 64, 64]} />
        <MeshDistortMaterial
          color="#ff3b5c"
          distort={0.28}
          speed={2}
          roughness={0.25}
          metalness={0.15}
          emissive="#801020"
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* right lobe */}
      <mesh position={[0.55, 0.35, 0]}>
        <sphereGeometry args={[0.9, 64, 64]} />
        <MeshDistortMaterial
          color="#ff4a68"
          distort={0.28}
          speed={2.2}
          roughness={0.25}
          metalness={0.15}
          emissive="#8a1226"
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* apex */}
      <mesh position={[0, -0.75, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[1.35, 1.9, 64]} />
        <MeshDistortMaterial
          color="#e63052"
          distort={0.22}
          speed={1.8}
          roughness={0.3}
          metalness={0.2}
          emissive="#6b0e1e"
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* inner glow core */}
      <mesh ref={inner} position={[0, -0.1, 0]}>
        <icosahedronGeometry args={[0.55, 2]} />
        <meshStandardMaterial
          color="#22e6c8"
          emissive="#22e6c8"
          emissiveIntensity={1.4}
          transparent
          opacity={0.35}
          wireframe
        />
      </mesh>
    </group>
  );
}

export function HeartScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 5], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#00000000"]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 4, 4]} intensity={2.2} color="#7de5ff" />
      <pointLight position={[-4, -2, -3]} intensity={1.6} color="#ff5570" />
      <pointLight position={[0, -5, 3]} intensity={0.9} color="#22e6c8" />

      <Suspense fallback={null}>
        <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.5}>
          <HeartShape />
        </Float>
        <Sparkles count={80} scale={6} size={2} speed={0.4} color="#7de5ff" opacity={0.6} />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.6}
        makeDefault
      />
    </Canvas>
  );
}
