import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store';
import Bullet from './Bullet';

const PLAYER_SPEED = 15;
const FIRE_RATE = 250; // ms

export default function Player({ onShoot }: { onShoot: (pos: THREE.Vector3) => void }) {
  const { camera } = useThree();
  // Store bullet data in state to render Bullet components
  // We use a simple ID generator
  const [bullets, setBullets] = useState<{ id: number; startPosition: THREE.Vector3; direction: THREE.Vector3 }[]>([]);
  const lastFireTime = useRef(0);
  const playerRef = useRef<THREE.Group>(null);
  const shakeIntensity = useRef(0);

  // Movement state
  const keys = useRef({ w: false, a: false, s: false, d: false });
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Reset camera and player position on mount
    camera.position.set(0, 2, 0);
    camera.rotation.set(0, 0, 0);
    if (playerRef.current) {
      playerRef.current.position.set(0, 0, 0);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'w') keys.current.w = true;
      if (e.key.toLowerCase() === 'a') keys.current.a = true;
      if (e.key.toLowerCase() === 's') keys.current.s = true;
      if (e.key.toLowerCase() === 'd') keys.current.d = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'w') keys.current.w = false;
      if (e.key.toLowerCase() === 'a') keys.current.a = false;
      if (e.key.toLowerCase() === 's') keys.current.s = false;
      if (e.key.toLowerCase() === 'd') keys.current.d = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleMouseDown = () => {
      const now = Date.now();
      if (now - lastFireTime.current > FIRE_RATE) {
        fireBullet();
        lastFireTime.current = now;
      }
    };

    const handleShake = (e: any) => {
      shakeIntensity.current = Math.max(shakeIntensity.current, e.detail?.intensity || 0.3);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('screen-shake', handleShake);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('screen-shake', handleShake);
    };
  }, []);

  const fireBullet = () => {
    if (!playerRef.current) return;
    
    const position = playerRef.current.position.clone();
    // Adjust start position slightly forward
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    position.add(direction.clone().multiplyScalar(2));

    setBullets(prev => [
      ...prev, 
      { 
        id: Date.now(), 
        startPosition: position, 
        direction: direction 
      }
    ]);
  };

  const removeBullet = (id: number) => {
    setBullets(prev => prev.filter(b => b.id !== id));
  };

  useFrame((state, delta) => {
    if (!playerRef.current) return;

    // Movement
    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3(0, 0, Number(keys.current.s) - Number(keys.current.w));
    const sideVector = new THREE.Vector3(Number(keys.current.a) - Number(keys.current.d), 0, 0);

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(PLAYER_SPEED * delta)
      .applyEuler(camera.rotation);

    // Constrain movement to XZ plane
    playerRef.current.position.x += direction.x;
    playerRef.current.position.z += direction.z;
    
    // Keep player within bounds
    playerRef.current.position.x = THREE.MathUtils.clamp(playerRef.current.position.x, -90, 90);
    playerRef.current.position.z = THREE.MathUtils.clamp(playerRef.current.position.z, -90, 90);

    // Camera rotation
    camera.position.copy(playerRef.current.position);
    camera.position.y = 2; // Eye height

    // Screen shake
    if (shakeIntensity.current > 0.005) {
      camera.position.x += (Math.random() - 0.5) * shakeIntensity.current * 2;
      camera.position.y += (Math.random() - 0.5) * shakeIntensity.current;
      shakeIntensity.current = Math.max(0, shakeIntensity.current - delta * 2);
    }

    // Rotate camera based on mouse position
    const turnSpeed = 2.0;
    if (Math.abs(mouse.current.x) > 0.1) {
        camera.rotation.y -= mouse.current.x * turnSpeed * delta;
    }
  });

  // Listen for bullet hits to remove them
  useEffect(() => {
    const handleHit = (e: any) => {
      setBullets(prev => prev.filter(b => b.id !== e.detail.id));
      
      // Small spark effect at hit location if provided
      if (e.detail.position) {
          onShoot(e.detail.position);
      }
    };
    window.addEventListener('bullet-hit', handleHit);
    return () => window.removeEventListener('bullet-hit', handleHit);
  }, [onShoot]);

  return (
    <group ref={playerRef} position={[0, 0, 0]}>
      {bullets.map(bullet => (
        <Bullet 
          key={bullet.id}
          startPosition={bullet.startPosition}
          direction={bullet.direction}
          onRemove={() => removeBullet(bullet.id)}
        />
      ))}
    </group>
  );
}
