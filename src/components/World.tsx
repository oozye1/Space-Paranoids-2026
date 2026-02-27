import { useMemo } from 'react';
import { Edges } from '@react-three/drei';

const WALL_HEIGHT = 40;
const WALL_THICKNESS = 2;
const MAZE_SIZE = 250;
const GRID_SIZE = 500;

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

  // === LONG HORIZONTAL CORRIDORS (running along X) ===

  // Far south band
  addWall(-200, -180, -30, -180);
  addWall(30, -180, 200, -180);

  // South-mid band
  addWall(-220, -120, -80, -120);
  addWall(-20, -120, 140, -120);
  addWall(200, -120, 240, -120);

  // Center-south band
  addWall(-180, -60, 0, -60);
  addWall(60, -60, 220, -60);

  // Center band
  addWall(-160, 0, -40, 0);
  addWall(40, 0, 160, 0);

  // Center-north band
  addWall(-220, 60, -60, 60);
  addWall(0, 60, 180, 60);

  // North-mid band
  addWall(-180, 120, -20, 120);
  addWall(80, 120, 220, 120);

  // Far north band
  addWall(-200, 180, -30, 180);
  addWall(30, 180, 200, 180);

  // === LONG VERTICAL CORRIDORS (running along Z) ===

  // Far west
  addWall(-200, -220, -200, -40);
  addWall(-200, 20, -200, 220);

  // West-mid
  addWall(-140, -200, -140, -80);
  addWall(-140, -20, -140, 100);
  addWall(-140, 160, -140, 230);

  // Center-west
  addWall(-70, -180, -70, -30);
  addWall(-70, 30, -70, 180);

  // Center
  addWall(0, -200, 0, -100);
  addWall(0, -40, 0, 40);
  addWall(0, 100, 0, 200);

  // Center-east
  addWall(70, -180, 70, -30);
  addWall(70, 30, 70, 180);

  // East-mid
  addWall(140, -230, 140, -100);
  addWall(140, -20, 140, 80);
  addWall(140, 160, 140, 230);

  // Far east
  addWall(200, -220, 200, -20);
  addWall(200, 40, 200, 220);

  // === SHORT CONNECTOR WALLS (create dead ends and alcoves) ===
  addWall(-110, -150, -70, -150);
  addWall(70, -150, 140, -150);
  addWall(-140, -30, -70, -30);
  addWall(70, -30, 140, -30);
  addWall(-110, 30, -70, 30);
  addWall(70, 30, 110, 30);
  addWall(-140, 150, -70, 150);
  addWall(70, 150, 140, 150);

  return walls;
}

export default function World() {
  const walls = useMemo(() => generateMazeWalls(), []);

  return (
    <group>
      {/* Floor Grid */}
      <gridHelper
        args={[GRID_SIZE, 100, 0x00ffff, 0x0044aa]}
        position={[0, -2, 0]}
      />

      {/* Ceiling Grid */}
      <gridHelper
        args={[GRID_SIZE, 40, 0x4400aa, 0x220055]}
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

      {/* Corridor lighting - spaced along major paths */}
      {Array.from({ length: 20 }).map((_, i) => {
        const x = (i % 5 - 2) * 100;
        const z = (Math.floor(i / 5) - 2) * 100 + 30;
        return (
          <pointLight key={`pl-${i}`} position={[x, 1, z]} color="#00ffff" intensity={0.4} distance={40} decay={2} />
        );
      })}
    </group>
  );
}
