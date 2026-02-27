import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function World() {
  const gridRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (gridRef.current) {
      // Subtle pulse effect on the grid
      const time = state.clock.getElapsedTime();
      gridRef.current.position.y = Math.sin(time * 0.5) * 0.2 - 2;
    }
  });

  return (
    <group>
      {/* Floor Grid */}
      <gridHelper 
        args={[200, 50, 0x00ffff, 0x0044aa]} 
        position={[0, -2, 0]} 
      />
      
      {/* Ceiling Grid (faint) */}
      <gridHelper 
        args={[200, 20, 0x4400aa, 0x220055]} 
        position={[0, 20, 0]} 
        rotation={[Math.PI, 0, 0]}
      />

      {/* Random geometric mountains/structures */}
      {Array.from({ length: 20 }).map((_, i) => {
        const x = (Math.random() - 0.5) * 150;
        const z = (Math.random() - 0.5) * 150;
        // Keep center clear for player
        if (Math.abs(x) < 20 && Math.abs(z) < 20) return null;
        
        const height = Math.random() * 10 + 5;
        
        return (
          <mesh key={i} position={[x, height / 2 - 2, z]}>
            <boxGeometry args={[Math.random() * 5 + 2, height, Math.random() * 5 + 2]} />
            <meshStandardMaterial 
              color="#001133" 
              emissive="#0044aa"
              emissiveIntensity={0.5}
              wireframe
            />
          </mesh>
        );
      })}
    </group>
  );
}
