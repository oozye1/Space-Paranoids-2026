import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ExplosionProps {
  position: THREE.Vector3;
  color: string;
  count?: number;
  onComplete: () => void;
}

export default function Explosion({ position, color, count = 20, onComplete }: ExplosionProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [particles] = useState(() => {
    return Array.from({ length: count }).map(() => {
      const direction = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      
      return {
        position: new THREE.Vector3(0, 0, 0), // Relative to group
        velocity: direction.multiplyScalar(5 + Math.random() * 10),
        rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        rotationSpeed: new THREE.Vector3(
            Math.random() - 0.5, 
            Math.random() - 0.5, 
            Math.random() - 0.5
        ).multiplyScalar(5),
        scale: 0.5 + Math.random() * 0.5,
      };
    });
  });

  const time = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    time.current += delta;

    // End explosion after 1.5 seconds
    if (time.current > 1.5) {
      onComplete();
      return;
    }

    // Update particles manually for performance
    // We are modifying the children meshes directly
    groupRef.current.children.forEach((child, i) => {
      const p = particles[i];
      
      // Physics
      p.velocity.y -= 15 * delta; // Gravity
      p.velocity.multiplyScalar(0.95); // Drag
      
      child.position.x += p.velocity.x * delta;
      child.position.y += p.velocity.y * delta;
      child.position.z += p.velocity.z * delta;
      
      child.rotation.x += p.rotationSpeed.x * delta;
      child.rotation.y += p.rotationSpeed.y * delta;
      child.rotation.z += p.rotationSpeed.z * delta;

      // Scale down at end
      if (time.current > 1.0) {
        const s = p.scale * (1.5 - time.current) * 2;
        child.scale.setScalar(Math.max(0, s));
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {particles.map((p, i) => (
        <mesh key={i} position={p.position} rotation={p.rotation} scale={p.scale}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}
