import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { resolveCircleWallCollisions } from '../mazeData';
import { sound } from '../audio/SoundManager';
import Bullet from './Bullet';

const PLAYER_SPEED = 18;
const FIRE_RATE = 180; // ms - slightly faster fire rate

export default function Player({ onShoot }: { onShoot: (pos: THREE.Vector3) => void }) {
  const { camera } = useThree();
  const [bullets, setBullets] = useState<{ id: number; startPosition: THREE.Vector3; direction: THREE.Vector3 }[]>([]);
  const lastFireTime = useRef(0);
  const playerRef = useRef<THREE.Group>(null);
  const shakeIntensity = useRef(0);
  const muzzleFlash = useRef(0);

  // Movement state
  const keys = useRef({ w: false, a: false, s: false, d: false });
  const yaw = useRef(0);
  const isLocked = useRef(false);
  const isFiring = useRef(false);

  useEffect(() => {
    camera.position.set(20, 2, -70);
    camera.rotation.set(0, 0, 0);
    yaw.current = 0;
    if (playerRef.current) {
      playerRef.current.position.set(20, 0, -70);
    }
    sound.startAmbient();

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
      if (!isLocked.current) return;
      yaw.current -= e.movementX * 0.002;
    };

    const handleMouseDown = () => {
      if (!isLocked.current) {
        document.body.requestPointerLock();
        return;
      }
      isFiring.current = true;
      tryFire();
    };

    const handleMouseUp = () => {
      isFiring.current = false;
    };

    const handleLockChange = () => {
      isLocked.current = document.pointerLockElement === document.body;
      if (!isLocked.current) isFiring.current = false;
    };

    const handleShake = (e: any) => {
      shakeIntensity.current = Math.max(shakeIntensity.current, e.detail?.intensity || 0.3);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('pointerlockchange', handleLockChange);
    window.addEventListener('screen-shake', handleShake);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('pointerlockchange', handleLockChange);
      window.removeEventListener('screen-shake', handleShake);
      if (document.pointerLockElement) document.exitPointerLock();
      sound.stopAmbient();
    };
  }, []);

  const tryFire = () => {
    const now = Date.now();
    if (now - lastFireTime.current > FIRE_RATE) {
      fireBullet();
      lastFireTime.current = now;
    }
  };

  const fireBullet = () => {
    if (!playerRef.current) return;

    const pos = playerRef.current.position.clone();
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    pos.add(dir.clone().multiplyScalar(2));
    pos.y = 2; // Fire from eye height

    sound.shoot();
    muzzleFlash.current = 0.06;

    setBullets(prev => [
      ...prev,
      { id: Date.now() + Math.random(), startPosition: pos, direction: dir }
    ]);
  };

  const removeBullet = (id: number) => {
    setBullets(prev => prev.filter(b => b.id !== id));
  };

  useFrame((_, delta) => {
    if (!playerRef.current) return;

    // Auto-fire while holding mouse button
    if (isFiring.current) tryFire();

    // Movement
    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3(0, 0, Number(keys.current.s) - Number(keys.current.w));
    const sideVector = new THREE.Vector3(Number(keys.current.a) - Number(keys.current.d), 0, 0);

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(PLAYER_SPEED * delta)
      .applyEuler(camera.rotation);

    playerRef.current.position.x += direction.x;
    playerRef.current.position.z += direction.z;

    // Wall collision
    const resolved = resolveCircleWallCollisions(playerRef.current.position.x, playerRef.current.position.z, 1.5);
    playerRef.current.position.x = resolved.x;
    playerRef.current.position.z = resolved.z;

    // Camera follows player
    camera.position.copy(playerRef.current.position);
    camera.position.y = 2;

    // Screen shake
    if (shakeIntensity.current > 0.005) {
      camera.position.x += (Math.random() - 0.5) * shakeIntensity.current * 2;
      camera.position.y += (Math.random() - 0.5) * shakeIntensity.current;
      shakeIntensity.current = Math.max(0, shakeIntensity.current - delta * 2);
    }

    // Muzzle flash decay
    if (muzzleFlash.current > 0) muzzleFlash.current -= delta;

    camera.rotation.set(0, yaw.current, 0);
  });

  // Bullet hit handler
  useEffect(() => {
    const handleHit = (e: any) => {
      setBullets(prev => prev.filter(b => b.id !== e.detail.id));
      if (e.detail.position) {
        sound.hit();
        onShoot(e.detail.position);
      }
    };
    window.addEventListener('bullet-hit', handleHit);
    return () => window.removeEventListener('bullet-hit', handleHit);
  }, [onShoot]);

  return (
    <>
      <group ref={playerRef} position={[20, 0, -70]} />
      {/* Bullets rendered outside player group so world-space positions work correctly */}
      {bullets.map(bullet => (
        <Bullet
          key={bullet.id}
          startPosition={bullet.startPosition}
          direction={bullet.direction}
          onRemove={() => removeBullet(bullet.id)}
        />
      ))}
    </>
  );
}
