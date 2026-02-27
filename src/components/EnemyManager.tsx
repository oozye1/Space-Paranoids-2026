import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store';

// Recognizer Enemy Component
function Recognizer({ position, onHit, playerPos }: { position: THREE.Vector3, onHit: (pos: THREE.Vector3) => void, playerPos: THREE.Vector3 }) {
  const ref = useRef<THREE.Group>(null);
  const health = useRef(3); // Use ref for logic
  const [isDead, setIsDead] = useState(false);
  const speed = 5 + Math.random() * 5; // Faster enemies
  const lastShot = useRef(0);
  const loseLife = useGameStore(state => state.loseLife);
  const lastDamageTime = useRef(0);

  useFrame((state, delta) => {
    if (isDead || !ref.current) return;

    // Float up and down
    ref.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 2 + position.x) * 0.5;

    // Move towards player
    const direction = new THREE.Vector3().subVectors(playerPos, ref.current.position);
    direction.y = 0; // Keep level
    direction.normalize();
    
    // Move
    ref.current.position.add(direction.multiplyScalar(speed * delta));
    
    // Rotate to face player
    ref.current.lookAt(playerPos.x, ref.current.position.y, playerPos.z);

    // Player Collision Check
    const distToPlayer = ref.current.position.distanceTo(playerPos);
    if (distToPlayer < 5) {
      const now = state.clock.elapsedTime;
      if (now - lastDamageTime.current > 2) { // 2 seconds invulnerability/cooldown
        loseLife();
        lastDamageTime.current = now;
        // Push enemy back
        ref.current.position.sub(direction.multiplyScalar(10));
      }
    }
  });

  useEffect(() => {
    const handleBulletUpdate = (e: any) => {
      if (isDead || !ref.current) return;
      
      const bulletPos = e.detail.position as THREE.Vector3;
      const bulletId = e.detail.id;
      
      // Simple distance check for collision
      // Recognizer is roughly 4x6x2
      const distance = ref.current.position.distanceTo(bulletPos);
      
      if (distance < 4) {
        // Hit!
        window.dispatchEvent(new CustomEvent('bullet-hit', { detail: { id: bulletId, position: bulletPos } }));
        
        health.current -= 1;
        
        if (health.current <= 0) {
          setIsDead(true);
          onHit(ref.current.position.clone()); // Pass current position
        }
      }
    };

    window.addEventListener('bullet-update', handleBulletUpdate);
    return () => window.removeEventListener('bullet-update', handleBulletUpdate);
  }, [isDead, onHit]);

  if (isDead) return null;

  return (
    <group ref={ref} position={position}>
      {/* The Recognizer Shape (Arch) */}
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[6, 1, 2]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff0000" emissiveIntensity={2} wireframe />
      </mesh>
      <mesh position={[-2.5, 2, 0]}>
        <boxGeometry args={[1, 4, 2]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff0000" emissiveIntensity={2} wireframe />
      </mesh>
      <mesh position={[2.5, 2, 0]}>
        <boxGeometry args={[1, 4, 2]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff0000" emissiveIntensity={2} wireframe />
      </mesh>
      <pointLight position={[0, 3, 0]} color="red" intensity={2} distance={10} />
    </group>
  );
}

export default function EnemyManager({ onExplode }: { onExplode: (pos: THREE.Vector3) => void }) {
  const [enemies, setEnemies] = useState<{ id: number; position: THREE.Vector3 }[]>([]);
  const { camera } = useThree();
  const addScore = useGameStore(state => state.addScore);
  const playerPos = useRef(new THREE.Vector3());

  useFrame(() => {
    playerPos.current.copy(camera.position);
    // Keep player pos at ground level for logic
    playerPos.current.y = 0; 
  });

  useEffect(() => {
    // Spawn enemies periodically
    const interval = setInterval(() => {
      if (enemies.length < 5) { // Max 5 enemies at once
        const angle = Math.random() * Math.PI * 2;
        const radius = 60 + Math.random() * 20; // Spawn further away
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        setEnemies(prev => [...prev, {
          id: Date.now(),
          position: new THREE.Vector3(x, 2, z)
        }]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [enemies.length]);

  const handleEnemyDeath = (id: number, position: THREE.Vector3) => {
    addScore(100);
    onExplode(position);
    setEnemies(prev => prev.filter(e => e.id !== id));
  };

  return (
    <>
      {enemies.map(enemy => (
        <Recognizer 
          key={enemy.id} 
          position={enemy.position} 
          onHit={(pos) => handleEnemyDeath(enemy.id, pos)}
          playerPos={playerPos.current}
        />
      ))}
    </>
  );
}
