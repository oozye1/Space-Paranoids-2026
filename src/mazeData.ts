export const WALL_HEIGHT = 40;
export const WALL_THICKNESS = 2;
export const MAZE_SIZE = 250;
export const GRID_SIZE = 500;

export interface WallDef {
  pos: [number, number, number];
  size: [number, number, number];
}

export interface WallRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function addWall(walls: WallDef[], x1: number, z1: number, x2: number, z2: number) {
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const lx = Math.abs(x2 - x1) || WALL_THICKNESS;
  const lz = Math.abs(z2 - z1) || WALL_THICKNESS;
  walls.push({ pos: [cx, WALL_HEIGHT / 2 - 2, cz], size: [lx, WALL_HEIGHT, lz] });
}

export function generateMazeWalls(): WallDef[] {
  const walls: WallDef[] = [];

  // Outer boundary
  addWall(walls, -MAZE_SIZE, -MAZE_SIZE, MAZE_SIZE, -MAZE_SIZE);
  addWall(walls, -MAZE_SIZE, MAZE_SIZE, MAZE_SIZE, MAZE_SIZE);
  addWall(walls, -MAZE_SIZE, -MAZE_SIZE, -MAZE_SIZE, MAZE_SIZE);
  addWall(walls, MAZE_SIZE, -MAZE_SIZE, MAZE_SIZE, MAZE_SIZE);

  // === LONG HORIZONTAL CORRIDORS (running along X) ===
  addWall(walls, -200, -180, -30, -180);
  addWall(walls, 30, -180, 200, -180);
  addWall(walls, -220, -120, -80, -120);
  addWall(walls, -20, -120, 140, -120);
  addWall(walls, 200, -120, 240, -120);
  addWall(walls, -180, -60, 0, -60);
  addWall(walls, 60, -60, 220, -60);
  addWall(walls, -160, 0, -40, 0);
  addWall(walls, 40, 0, 160, 0);
  addWall(walls, -220, 60, -60, 60);
  addWall(walls, 0, 60, 180, 60);
  addWall(walls, -180, 120, -20, 120);
  addWall(walls, 80, 120, 220, 120);
  addWall(walls, -200, 180, -30, 180);
  addWall(walls, 30, 180, 200, 180);

  // === LONG VERTICAL CORRIDORS (running along Z) ===
  addWall(walls, -200, -220, -200, -40);
  addWall(walls, -200, 20, -200, 220);
  addWall(walls, -140, -200, -140, -80);
  addWall(walls, -140, -20, -140, 100);
  addWall(walls, -140, 160, -140, 230);
  addWall(walls, -70, -180, -70, -30);
  addWall(walls, -70, 30, -70, 180);
  addWall(walls, 0, -200, 0, -100);
  addWall(walls, 0, -40, 0, 40);
  addWall(walls, 0, 100, 0, 200);
  addWall(walls, 70, -180, 70, -30);
  addWall(walls, 70, 30, 70, 180);
  addWall(walls, 140, -230, 140, -100);
  addWall(walls, 140, -20, 140, 80);
  addWall(walls, 140, 160, 140, 230);
  addWall(walls, 200, -220, 200, -20);
  addWall(walls, 200, 40, 200, 220);

  // === SHORT CONNECTOR WALLS (create dead ends and alcoves) ===
  addWall(walls, -110, -150, -70, -150);
  addWall(walls, 70, -150, 140, -150);
  addWall(walls, -140, -30, -70, -30);
  addWall(walls, 70, -30, 140, -30);
  addWall(walls, -110, 30, -70, 30);
  addWall(walls, 70, 30, 110, 30);
  addWall(walls, -140, 150, -70, 150);
  addWall(walls, 70, 150, 140, 150);

  return walls;
}

// Precomputed 2D collision rectangles (cached)
let _wallRects: WallRect[] | null = null;
export function getWallRects(): WallRect[] {
  if (!_wallRects) {
    _wallRects = generateMazeWalls().map(w => ({
      minX: w.pos[0] - w.size[0] / 2,
      maxX: w.pos[0] + w.size[0] / 2,
      minZ: w.pos[2] - w.size[2] / 2,
      maxZ: w.pos[2] + w.size[2] / 2,
    }));
  }
  return _wallRects;
}

// Resolve a circle against all wall AABBs - returns corrected position
export function resolveCircleWallCollisions(x: number, z: number, radius: number): { x: number; z: number } {
  const rects = getWallRects();
  let rx = x, rz = z;

  // Two iterations for better convergence at corners
  for (let iter = 0; iter < 2; iter++) {
    for (const w of rects) {
      const closestX = Math.max(w.minX, Math.min(rx, w.maxX));
      const closestZ = Math.max(w.minZ, Math.min(rz, w.maxZ));
      const dx = rx - closestX;
      const dz = rz - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        if (distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const overlap = radius - dist;
          rx += (dx / dist) * overlap;
          rz += (dz / dist) * overlap;
        } else {
          // Center inside wall - push out shortest axis
          const toLeft = rx - w.minX;
          const toRight = w.maxX - rx;
          const toTop = rz - w.minZ;
          const toBottom = w.maxZ - rz;
          const min = Math.min(toLeft, toRight, toTop, toBottom);
          if (min === toLeft) rx = w.minX - radius;
          else if (min === toRight) rx = w.maxX + radius;
          else if (min === toTop) rz = w.minZ - radius;
          else rz = w.maxZ + radius;
        }
      }
    }
  }

  return { x: rx, z: rz };
}
