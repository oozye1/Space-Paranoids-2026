import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWallRects } from '../mazeData';

const BULLET_SPEED = 120;
const BOLT_LENGTH = 3;

interface BulletProps {
  startPosition: THREE.Vector3;
  direction: THREE.Vector3;
  onRemove: () => void;
}

export default function Bullet({ startPosition, direction, onRemove }: BulletProps) {
  const groupRef = useRef<THREE.Group>(null);
  const position = useRef(startPosition.clone());
  const velocity = useRef(direction.clone().normalize().multiplyScalar(BULLET_SPEED));
  const id = useRef(Date.now() + Math.random());
  const wallRects = useMemo(() => getWallRects(), []);

  // Compute rotation to orient bolt along its direction
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    return q;
  }, [direction]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    position.current.add(velocity.current.clone().multiplyScalar(delta));
    groupRef.current.position.copy(position.current);

    // Check bounds
    if (Math.abs(position.current.x) > 260 || Math.abs(position.current.z) > 260) {
      onRemove();
      return;
    }

    // Wall collision
    for (const w of wallRects) {
      if (
        position.current.x >= w.minX && position.current.x <= w.maxX &&
        position.current.z >= w.minZ && position.current.z <= w.maxZ &&
        position.current.y >= -2 && position.current.y <= 38
      ) {
        window.dispatchEvent(new CustomEvent('bullet-hit', {
          detail: { id: id.current, position: position.current.clone() }
        }));
        onRemove();
        return;
      }
    }

    // Dispatch update for enemy collision detection
    window.dispatchEvent(new CustomEvent('bullet-update', {
      detail: { position: position.current, id: id.current }
    }));
  });

  useEffect(() => {
    const handleHit = (e: any) => {
      if (e.detail.id === id.current) {
        onRemove();
      }
    };
    window.addEventListener('bullet-hit', handleHit);
    return () => window.removeEventListener('bullet-hit', handleHit);
  }, [onRemove]);

  return (
    <group ref={groupRef} position={startPosition} quaternion={quaternion}>
      {/* Core bolt - bright thin beam */}
      <mesh>
        <cylinderGeometry args={[0.06, 0.06, BOLT_LENGTH, 4]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Inner glow */}
      <mesh>
        <cylinderGeometry args={[0.15, 0.1, BOLT_LENGTH * 0.8, 4]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Outer glow halo */}
      <mesh>
        <cylinderGeometry args={[0.3, 0.2, BOLT_LENGTH * 0.5, 4]} />
        <meshBasicMaterial
          color="#0088ff"
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Tip glow */}
      <mesh position={[0, BOLT_LENGTH / 2, 0]}>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
