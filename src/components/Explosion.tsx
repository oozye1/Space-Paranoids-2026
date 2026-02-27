import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ExplosionProps {
  position: THREE.Vector3;
  color: string;
  count?: number;
  onComplete: () => void;
  intensity?: 'small' | 'medium' | 'large';
}

interface SparkData {
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

interface EmberData {
  velocity: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

export default function Explosion({ position, color, onComplete, intensity = 'medium' }: ExplosionProps) {
  const groupRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const sparkGroupRef = useRef<THREE.Group>(null);
  const emberGroupRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  const config = useMemo(() => {
    switch (intensity) {
      case 'small':  return { sparks: 8, embers: 0, flashSize: 0, ringSize: 0, duration: 0.6 };
      case 'large':  return { sparks: 20, embers: 6, flashSize: 3, ringSize: 6, duration: 2.0 };
      default:       return { sparks: 14, embers: 4, flashSize: 2, ringSize: 4, duration: 1.5 };
    }
  }, [intensity]);

  const hasFlash = config.flashSize > 0;
  const hasRing = config.ringSize > 0;

  const colorObj = useMemo(() => new THREE.Color(color), [color]);
  const hotColor = useMemo(() => new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.7), [color]);

  const [sparks] = useState(() =>
    Array.from({ length: config.sparks }).map((): SparkData => {
      const dir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() * 0.8 - 0.1,
        Math.random() - 0.5
      ).normalize();
      return {
        velocity: dir.multiplyScalar(12 + Math.random() * 25),
        life: 0,
        maxLife: 0.2 + Math.random() * 0.6,
        size: 0.06 + Math.random() * 0.12,
      };
    })
  );

  const [embers] = useState(() =>
    Array.from({ length: config.embers }).map((): EmberData => {
      const dir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() * 0.5 + 0.2,
        Math.random() - 0.5
      ).normalize();
      return {
        velocity: dir.multiplyScalar(3 + Math.random() * 7),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
        ),
        life: 0,
        maxLife: 0.8 + Math.random() * 1.5,
        size: 0.15 + Math.random() * 0.35,
      };
    })
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    time.current += delta;
    if (time.current > config.duration) { onComplete(); return; }

    // Core flash
    if (hasFlash && flashRef.current) {
      const fp = Math.min(time.current / 0.12, 1);
      flashRef.current.scale.setScalar(Math.max(0.01, config.flashSize * (1 - fp * fp)));
      (flashRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - fp);
    }

    // Shockwave ring
    if (hasRing && ringRef.current) {
      const rp = Math.min(time.current / 0.6, 1);
      const rs = config.ringSize * rp;
      ringRef.current.scale.set(rs, rs, 1);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 * (1 - rp));
    }

    // Sparks
    sparkGroupRef.current?.children.forEach((child, i) => {
      const s = sparks[i];
      if (!s) return;
      s.life += delta;
      if (s.life > s.maxLife) { child.scale.setScalar(0); return; }
      const lp = s.life / s.maxLife;

      s.velocity.y -= 10 * delta;
      s.velocity.multiplyScalar(1 - 2.5 * delta);

      child.position.x += s.velocity.x * delta;
      child.position.y += s.velocity.y * delta;
      child.position.z += s.velocity.z * delta;

      child.scale.setScalar(Math.max(0, s.size * (1 - lp * lp)));

      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (lp < 0.2) {
        mat.color.copy(hotColor).lerp(colorObj, lp / 0.2);
      } else {
        mat.color.copy(colorObj).multiplyScalar(Math.max(0.1, 1 - (lp - 0.2) / 0.8));
      }
      mat.opacity = Math.max(0, 1 - lp * lp);
    });

    // Embers
    emberGroupRef.current?.children.forEach((child, i) => {
      const e = embers[i];
      if (!e) return;
      e.life += delta;
      if (e.life > e.maxLife) { child.scale.setScalar(0); return; }
      const lp = e.life / e.maxLife;

      e.velocity.y -= 6 * delta;
      e.velocity.multiplyScalar(1 - 0.8 * delta);

      child.position.x += e.velocity.x * delta;
      child.position.y += e.velocity.y * delta;
      child.position.z += e.velocity.z * delta;

      child.rotation.x += e.rotSpeed.x * delta;
      child.rotation.y += e.rotSpeed.y * delta;
      child.rotation.z += e.rotSpeed.z * delta;
      e.rotSpeed.multiplyScalar(1 - 0.3 * delta);

      child.scale.setScalar(Math.max(0, e.size * (1 - lp)));

      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.9 * (1 - lp));

      if (child.position.y < -position.y) {
        child.position.y = -position.y;
        e.velocity.y *= -0.2;
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {hasFlash && (
        <mesh ref={flashRef}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
      {hasRing && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 1, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
      <group ref={sparkGroupRef}>
        {sparks.map((s, i) => (
          <mesh key={`s${i}`} scale={s.size}>
            <sphereGeometry args={[1, 4, 4]} />
            <meshBasicMaterial color={color} transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>
      <group ref={emberGroupRef}>
        {embers.map((e, i) => (
          <mesh key={`e${i}`} scale={e.size}>
            <boxGeometry args={[1, 1, 0.3]} />
            <meshBasicMaterial color={color} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
