import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store';

const NORMAL_EMISSIVE = new THREE.Color(0xff0000);
const FLASH_EMISSIVE = new THREE.Color(0xffffff);

// Recognizer enemy - TRON-accurate multi-part arch shape
function Recognizer({ position, onHit, playerPos }: {
  position: THREE.Vector3;
  onHit: (pos: THREE.Vector3, quat: THREE.Quaternion) => void;
  playerPos: THREE.Vector3;
}) {
  const ref = useRef<THREE.Group>(null);
  const health = useRef(3);
  const [isDead, setIsDead] = useState(false);
  const speed = 5 + Math.random() * 5;
  const loseLife = useGameStore(state => state.loseLife);
  const lastDamageTime = useRef(0);
  const hitFlash = useRef(0);
  const baseHeight = useRef(2 + Math.random() * 8); // Enemies fly at varying heights

  useFrame((state, delta) => {
    if (isDead || !ref.current) return;

    // Float at varying heights
    ref.current.position.y = baseHeight.current + Math.sin(state.clock.elapsedTime * 2 + position.x) * 1.5;

    // Move towards player
    const toPlayer = new THREE.Vector3().subVectors(playerPos, ref.current.position);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();
    toPlayer.normalize();

    ref.current.position.add(toPlayer.clone().multiplyScalar(speed * delta));
    ref.current.lookAt(playerPos.x, ref.current.position.y, playerPos.z);

    // Hit flash - smooth decay
    if (hitFlash.current > 0) {
      hitFlash.current -= delta;
      const flashAmount = Math.max(0, hitFlash.current / 0.15);
      ref.current.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          mat.emissive.copy(NORMAL_EMISSIVE).lerp(FLASH_EMISSIVE, flashAmount);
          mat.emissiveIntensity = 2 + flashAmount * 4;
        }
      });
    }

    // Player collision
    if (distToPlayer < 6) {
      const now = state.clock.elapsedTime;
      if (now - lastDamageTime.current > 2) {
        loseLife();
        lastDamageTime.current = now;
        ref.current.position.sub(toPlayer.clone().multiplyScalar(10));
      }
    }
  });

  useEffect(() => {
    const handleBulletUpdate = (e: any) => {
      if (isDead || !ref.current) return;

      const bulletPos = e.detail.position as THREE.Vector3;
      const bulletId = e.detail.id;
      const distance = ref.current.position.distanceTo(bulletPos);

      if (distance < 5) {
        window.dispatchEvent(new CustomEvent('bullet-hit', { detail: { id: bulletId, position: bulletPos } }));
        health.current -= 1;

        if (health.current <= 0) {
          setIsDead(true);
          onHit(ref.current.position.clone(), ref.current.quaternion.clone());
        } else {
          hitFlash.current = 0.15;
          window.dispatchEvent(new CustomEvent('screen-shake', { detail: { intensity: 0.08 } }));
        }
      }
    };

    window.addEventListener('bullet-update', handleBulletUpdate);
    return () => window.removeEventListener('bullet-update', handleBulletUpdate);
  }, [isDead, onHit]);

  if (isDead) return null;

  return (
    <group ref={ref} position={position}>
      {/* Top beam - left half */}
      <mesh position={[-1.8, 4.5, 0]}>
        <boxGeometry args={[3.2, 0.8, 2.5]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff0000" emissiveIntensity={2} wireframe />
      </mesh>
      {/* Top beam - right half */}
      <mesh position={[1.8, 4.5, 0]}>
        <boxGeometry args={[3.2, 0.8, 2.5]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff0000" emissiveIntensity={2} wireframe />
      </mesh>
      {/* Cockpit ridge */}
      <mesh position={[0, 5.2, 0]}>
        <boxGeometry args={[2, 0.4, 1.2]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff0000" emissiveIntensity={2} wireframe />
      </mesh>
      {/* Left upper leg - angled outward */}
      <mesh position={[-1.8, 3.2, 0]} rotation={[0, 0, 0.12]}>
        <boxGeometry args={[1.2, 1.8, 2.2]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff0000" emissiveIntensity={2} wireframe />
      </mesh>
      {/* Left lower leg - angled outward */}
      <mesh position={[-2.8, 1.2, 0]} rotation={[0, 0, 0.12]}>
        <boxGeometry args={[1.2, 2.2, 2.2]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff0000" emissiveIntensity={2} wireframe />
      </mesh>
      {/* Left foot - flared */}
      <mesh position={[-3.8, 0.2, 0]}>
        <boxGeometry args={[2.2, 0.4, 3]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff0000" emissiveIntensity={2} wireframe />
      </mesh>
      {/* Right upper leg - angled outward */}
      <mesh position={[1.8, 3.2, 0]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[1.2, 1.8, 2.2]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff0000" emissiveIntensity={2} wireframe />
      </mesh>
      {/* Right lower leg - angled outward */}
      <mesh position={[2.8, 1.2, 0]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[1.2, 2.2, 2.2]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff0000" emissiveIntensity={2} wireframe />
      </mesh>
      {/* Right foot - flared */}
      <mesh position={[3.8, 0.2, 0]}>
        <boxGeometry args={[2.2, 0.4, 3]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff0000" emissiveIntensity={2} wireframe />
      </mesh>
      {/* Glow lighting */}
      <pointLight position={[0, 4.5, 0]} color="red" intensity={3} distance={15} />
      <pointLight position={[0, 2, 0]} color="#ff3300" intensity={1.5} distance={10} />
    </group>
  );
}

export default function EnemyManager({ onExplode }: { onExplode: (pos: THREE.Vector3, quat: THREE.Quaternion) => void }) {
  const [enemies, setEnemies] = useState<{ id: number; position: THREE.Vector3 }[]>([]);
  const { camera } = useThree();
  const addScore = useGameStore(state => state.addScore);
  const playerPos = useRef(new THREE.Vector3());

  useFrame(() => {
    playerPos.current.copy(camera.position);
    playerPos.current.y = 0;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (enemies.length < 5) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 60 + Math.random() * 20;
        setEnemies(prev => [...prev, {
          id: Date.now(),
          position: new THREE.Vector3(Math.cos(angle) * radius, 2, Math.sin(angle) * radius)
        }]);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [enemies.length]);

  const handleEnemyDeath = (id: number, position: THREE.Vector3, quaternion: THREE.Quaternion) => {
    addScore(100);
    onExplode(position, quaternion);
    setEnemies(prev => prev.filter(e => e.id !== id));
  };

  return (
    <>
      {enemies.map(enemy => (
        <Recognizer
          key={enemy.id}
          position={enemy.position}
          onHit={(pos, quat) => handleEnemyDeath(enemy.id, pos, quat)}
          playerPos={playerPos.current}
        />
      ))}
    </>
  );
}
