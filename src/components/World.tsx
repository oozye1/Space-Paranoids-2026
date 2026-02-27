import { useMemo } from 'react';
import { generateMazeWalls, GRID_SIZE, WALL_HEIGHT } from '../mazeData';

export default function World() {
  const walls = useMemo(() => generateMazeWalls(), []);

  return (
    <group>
      {/* Floor plane - receives shadows from debris */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshStandardMaterial color="#000811" emissive="#001122" emissiveIntensity={0.1} />
      </mesh>

      {/* Floor Grid - slightly above floor to avoid z-fighting */}
      <gridHelper
        args={[GRID_SIZE, 50, 0x00ffff, 0x003366]}
        position={[0, -1.99, 0]}
      />

      {/* Ceiling Grid */}
      <gridHelper
        args={[GRID_SIZE, 20, 0x4400aa, 0x220055]}
        position={[0, WALL_HEIGHT - 2, 0]}
        rotation={[Math.PI, 0, 0]}
      />

      {/* Maze Walls */}
      {walls.map((wall, i) => (
        <mesh key={i} position={wall.pos} receiveShadow>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial
            color="#000d1a"
            emissive="#004488"
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}
