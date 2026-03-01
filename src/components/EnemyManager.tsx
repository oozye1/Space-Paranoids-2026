import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { resolveCircleWallCollisions } from '../mazeData';
import { sound } from '../audio/SoundManager';

const NORMAL_EMISSIVE = new THREE.Color(0x330000);
const FLASH_EMISSIVE = new THREE.Color(0xffffff);

// Recognizer enemy - TRON-accurate multi-part arch with solid surfaces + edge glow
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
  const baseHeight = useRef(-1 + Math.random() * 3);

  useFrame((state, delta) => {
    if (isDead || !ref.current) return;

    // Float with gentle bob
    ref.current.position.y = baseHeight.current + Math.sin(state.clock.elapsedTime * 1.5 + position.x) * 1;

    // Move towards player
    const toPlayer = new THREE.Vector3().subVectors(playerPos, ref.current.position);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();
    toPlayer.normalize();

    ref.current.position.add(toPlayer.clone().multiplyScalar(speed * delta));

    // Resolve wall collisions - enemy slides along walls
    const resolved = resolveCircleWallCollisions(ref.current.position.x, ref.current.position.z, 7);
    ref.current.position.x = resolved.x;
    ref.current.position.z = resolved.z;

    ref.current.lookAt(playerPos.x, ref.current.position.y, playerPos.z);

    // Hit flash - smooth decay
    if (hitFlash.current > 0) {
      hitFlash.current -= delta;
      const flashAmount = Math.max(0, hitFlash.current / 0.15);
      ref.current.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat.emissive) {
            mat.emissive.copy(NORMAL_EMISSIVE).lerp(FLASH_EMISSIVE, flashAmount);
            mat.emissiveIntensity = 0.5 + flashAmount * 5;
          }
        }
      });
    }

    // Player collision - use center of recognizer (y+4 from base)
    const centerPos = ref.current.position.clone();
    centerPos.y += 4;
    const playerCenter = playerPos.clone();
    playerCenter.y = 2;
    if (centerPos.distanceTo(playerCenter) < 8) {
      const now = state.clock.elapsedTime;
      if (now - lastDamageTime.current > 2) {
        loseLife();
        sound.damage();
        window.dispatchEvent(new CustomEvent('player-damage'));
        window.dispatchEvent(new CustomEvent('screen-shake', { detail: { intensity: 0.3 } }));
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

      // Check from recognizer center mass (y+4 from base)
      const centerPos = ref.current.position.clone();
      centerPos.y += 4;
      const distance = centerPos.distanceTo(bulletPos);

      if (distance < 7) {
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

  const bodyColor = "#1a0000";

  return (
    <group ref={ref} position={position}>
      {/* === HEAD SECTION === */}
      {/* Main head beam - wide and flat */}
      <mesh position={[0, 7, 0]}>
        <boxGeometry args={[12, 1.5, 3.5]} />
        <meshStandardMaterial color={bodyColor} emissive="#660000" emissiveIntensity={0.6} />
      </mesh>
      {/* Cockpit ridge - raised center sensor area */}
      <mesh position={[0, 7.8, 0.3]}>
        <boxGeometry args={[3.5, 0.5, 1.8]} />
        <meshStandardMaterial color={bodyColor} emissive="#ff0000" emissiveIntensity={1.0} />
      </mesh>
      {/* Under-head chin panel */}
      <mesh position={[0, 6, 0]}>
        <boxGeometry args={[9, 0.4, 2.8]} />
        <meshStandardMaterial color={bodyColor} emissive="#440000" emissiveIntensity={0.5} />
      </mesh>

      {/* === LEFT LEG === */}
      <mesh position={[-3.5, 4.2, 0]} rotation={[0, 0, 0.12]}>
        <boxGeometry args={[2, 3, 2.8]} />
        <meshStandardMaterial color={bodyColor} emissive="#550000" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[-4.8, 1.5, 0]} rotation={[0, 0, 0.12]}>
        <boxGeometry args={[2, 3, 2.8]} />
        <meshStandardMaterial color={bodyColor} emissive="#550000" emissiveIntensity={0.6} />
      </mesh>
      {/* Left foot */}
      <mesh position={[-6, 0.25, 0]}>
        <boxGeometry args={[2.8, 0.5, 3.5]} />
        <meshStandardMaterial color={bodyColor} emissive="#550000" emissiveIntensity={0.6} />
      </mesh>

      {/* === RIGHT LEG === */}
      <mesh position={[3.5, 4.2, 0]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[2, 3, 2.8]} />
        <meshStandardMaterial color={bodyColor} emissive="#550000" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[4.8, 1.5, 0]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[2, 3, 2.8]} />
        <meshStandardMaterial color={bodyColor} emissive="#550000" emissiveIntensity={0.6} />
      </mesh>
      {/* Right foot */}
      <mesh position={[6, 0.25, 0]}>
        <boxGeometry args={[2.8, 0.5, 3.5]} />
        <meshStandardMaterial color={bodyColor} emissive="#550000" emissiveIntensity={0.6} />
      </mesh>
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
        const radius = 80 + Math.random() * 60;
        setEnemies(prev => [...prev, {
          id: Date.now(),
          position: new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
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
