import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const BULLET_SPEED = 100;

interface BulletProps {
  startPosition: THREE.Vector3;
  direction: THREE.Vector3;
  onRemove: () => void;
}

export default function Bullet({ startPosition, direction, onRemove }: BulletProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const position = useRef(startPosition.clone());
  const velocity = useRef(direction.clone().multiplyScalar(BULLET_SPEED));
  const id = useRef(Date.now() + Math.random());

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Update position
    position.current.add(velocity.current.clone().multiplyScalar(delta));
    meshRef.current.position.copy(position.current);

    // Check bounds
    if (position.current.length() > 200) {
      onRemove();
      return;
    }

    // Dispatch update event for collision detection
    // We dispatch this every frame so enemies can check collision against it
    const event = new CustomEvent('bullet-update', { 
      detail: { 
        position: position.current, 
        id: id.current 
      } 
    });
    window.dispatchEvent(event);
  });

  // Listen for hit confirmation to remove self
  useEffect(() => {
    const handleHit = (e: any) => {
      if (e.detail.id === id.current) {
        // Trigger spark
        if (e.detail.position) {
            const event = new CustomEvent('explosion', { 
              detail: { 
                  position: e.detail.position, 
                  color: '#00ffff', 
                  count: 5, 
                  speed: 5 
              } 
          });
          window.dispatchEvent(event);
        }
        onRemove();
      }
    };
    window.addEventListener('bullet-hit', handleHit);
    return () => window.removeEventListener('bullet-hit', handleHit);
  }, [onRemove]);

  return (
    <mesh ref={meshRef} position={startPosition}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshBasicMaterial color="cyan" />
      <pointLight intensity={0.5} distance={5} color="cyan" />
    </mesh>
  );
}
