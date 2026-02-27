import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Must match the Recognizer mesh layout in EnemyManager
const RECOGNIZER_PARTS = [
  { pos: [0, 7, 0], size: [12, 1.5, 3.5] },
  { pos: [0, 7.8, 0.3], size: [3.5, 0.5, 1.8] },
  { pos: [0, 6, 0], size: [9, 0.4, 2.8] },
  { pos: [-3.5, 4.2, 0], size: [2, 3, 2.8] },
  { pos: [-4.8, 1.5, 0], size: [2, 3, 2.8] },
  { pos: [-6, 0.25, 0], size: [2.8, 0.5, 3.5] },
  { pos: [3.5, 4.2, 0], size: [2, 3, 2.8] },
  { pos: [4.8, 1.5, 0], size: [2, 3, 2.8] },
  { pos: [6, 0.25, 0], size: [2.8, 0.5, 3.5] },
];

interface Fragment {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  angularVelocity: THREE.Vector3;
  size: [number, number, number];
}

interface ShatterEffectProps {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  onComplete: () => void;
}

export default function ShatterEffect({ position, quaternion, onComplete }: ShatterEffectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const time = useRef(0);
  const groundY = -position.y;

  const [fragments] = useState(() => {
    const frags: Fragment[] = [];

    // Main structural pieces
    RECOGNIZER_PARTS.forEach(part => {
      const localPos = new THREE.Vector3(part.pos[0], part.pos[1], part.pos[2]);
      localPos.applyQuaternion(quaternion);

      const outDir = localPos.clone().normalize();
      const vel = outDir.multiplyScalar(5 + Math.random() * 10);
      vel.y += 3 + Math.random() * 6;
      vel.x += (Math.random() - 0.5) * 5;
      vel.z += (Math.random() - 0.5) * 5;

      frags.push({
        position: localPos,
        velocity: vel,
        rotation: new THREE.Euler(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI),
        angularVelocity: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
        ),
        size: [part.size[0], part.size[1], part.size[2]],
      });
    });

    // Smaller debris fragments
    for (let i = 0; i < 10; i++) {
      const parent = RECOGNIZER_PARTS[Math.floor(Math.random() * RECOGNIZER_PARTS.length)];
      const localPos = new THREE.Vector3(
        parent.pos[0] + (Math.random() - 0.5) * parent.size[0],
        parent.pos[1] + (Math.random() - 0.5) * parent.size[1],
        parent.pos[2] + (Math.random() - 0.5) * parent.size[2],
      );
      localPos.applyQuaternion(quaternion);

      const vel = localPos.clone().normalize().multiplyScalar(8 + Math.random() * 16);
      vel.y += 4 + Math.random() * 8;
      vel.x += (Math.random() - 0.5) * 8;
      vel.z += (Math.random() - 0.5) * 8;

      const s = 0.15 + Math.random() * 0.4;
      frags.push({
        position: localPos,
        velocity: vel,
        rotation: new THREE.Euler(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, 0),
        angularVelocity: new THREE.Vector3(
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 14,
        ),
        size: [s, s, s * 0.5],
      });
    }

    return frags;
  });

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    time.current += delta;

    if (time.current > 3.5) {
      onComplete();
      return;
    }

    groupRef.current.children.forEach((child, i) => {
      if (i >= fragments.length) return;
      const f = fragments[i];

      f.velocity.y -= 12 * delta;
      f.velocity.multiplyScalar(1 - 1.0 * delta);

      child.position.x += f.velocity.x * delta;
      child.position.y += f.velocity.y * delta;
      child.position.z += f.velocity.z * delta;

      child.rotation.x += f.angularVelocity.x * delta;
      child.rotation.y += f.angularVelocity.y * delta;
      child.rotation.z += f.angularVelocity.z * delta;
      f.angularVelocity.multiplyScalar(1 - 0.3 * delta);

      // Floor bounce
      if (child.position.y < groundY) {
        child.position.y = groundY;
        f.velocity.y *= -0.25;
        f.velocity.x *= 0.7;
        f.velocity.z *= 0.7;
        f.angularVelocity.multiplyScalar(0.3);
      }

      // Fade after 2s
      if (time.current > 2.0) {
        const s = Math.max(0, 1 - (time.current - 2.0) / 1.5);
        child.scale.set(f.size[0] * s, f.size[1] * s, f.size[2] * s);
      }

      // Emissive glow fade
      const mesh = child as THREE.Mesh;
      if (mesh.material) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = Math.max(0, 1.5 * (1 - time.current / 3.0));
        mat.opacity = Math.max(0, 1 - time.current / 3.5);
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {fragments.map((f, i) => (
        <mesh
          key={i}
          position={f.position}
          rotation={f.rotation}
          scale={[f.size[0], f.size[1], f.size[2]]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#1a0000"
            emissive="#ff0000"
            emissiveIntensity={1.5}
            transparent
            opacity={1}
          />
        </mesh>
      ))}
    </group>
  );
}
