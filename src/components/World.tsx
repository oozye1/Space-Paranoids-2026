import { useMemo } from 'react';
import { Edges } from '@react-three/drei';

const WALL_HEIGHT = 40;
const WALL_THICKNESS = 2;
const MAZE_SIZE = 90;

function generateMazeWalls() {
  const walls: { pos: [number, number, number]; size: [number, number, number] }[] = [];

  const addWall = (x1: number, z1: number, x2: number, z2: number) => {
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    const lx = Math.abs(x2 - x1) || WALL_THICKNESS;
    const lz = Math.abs(z2 - z1) || WALL_THICKNESS;
    walls.push({ pos: [cx, WALL_HEIGHT / 2 - 2, cz], size: [lx, WALL_HEIGHT, lz] });
  };

  // Outer boundary
  addWall(-MAZE_SIZE, -MAZE_SIZE, MAZE_SIZE, -MAZE_SIZE);
  addWall(-MAZE_SIZE, MAZE_SIZE, MAZE_SIZE, MAZE_SIZE);
  addWall(-MAZE_SIZE, -MAZE_SIZE, -MAZE_SIZE, MAZE_SIZE);
  addWall(MAZE_SIZE, -MAZE_SIZE, MAZE_SIZE, MAZE_SIZE);

  // Interior maze walls - corridors with gaps
  addWall(-60, -50, -10, -50);
  addWall(20, -50, 70, -50);
  addWall(-70, -20, -30, -20);
  addWall(0, -20, 50, -20);
  addWall(-50, 10, 0, 10);
  addWall(30, 10, 80, 10);
  addWall(-80, 40, -20, 40);
  addWall(10, 40, 60, 40);
  addWall(-40, 65, 40, 65);

  addWall(-50, -80, -50, -30);
  addWall(-50, -10, -50, 30);
  addWall(-20, -70, -20, -25);
  addWall(-20, 15, -20, 55);
  addWall(15, -60, 15, -5);
  addWall(15, 25, 15, 75);
  addWall(50, -80, 50, -30);
  addWall(50, 0, 50, 50);
  addWall(-70, -70, -70, 0);
  addWall(70, -40, 70, 40);

  return walls;
}

export default function World() {
  const walls = useMemo(() => generateMazeWalls(), []);

  return (
    <group>
      {/* Floor Grid */}
      <gridHelper
        args={[200, 50, 0x00ffff, 0x0044aa]}
        position={[0, -2, 0]}
      />

      {/* Ceiling Grid */}
      <gridHelper
        args={[200, 20, 0x4400aa, 0x220055]}
        position={[0, WALL_HEIGHT - 2, 0]}
        rotation={[Math.PI, 0, 0]}
      />

      {/* Maze Walls - solid dark with cyan edge glow */}
      {walls.map((wall, i) => (
        <mesh key={i} position={wall.pos}>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial
            color="#000d1a"
            emissive="#001133"
            emissiveIntensity={0.3}
          />
          <Edges color="#0088cc" />
        </mesh>
      ))}

      {/* Ambient floor glow at intersections */}
      {[[-50, -50], [-50, 10], [-20, -20], [15, 10], [50, -50], [50, 40], [-20, 40], [15, 65]].map(([x, z], i) => (
        <pointLight key={`pl-${i}`} position={[x, 0, z]} color="#00ffff" intensity={0.5} distance={20} decay={2} />
      ))}
    </group>
  );
}
