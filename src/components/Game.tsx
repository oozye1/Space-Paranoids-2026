import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useState } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../store';

// Components
import Player from './Player';
import EnemyManager from './EnemyManager';
import World from './World';
import HUD from './HUD';
import Explosion from './Explosion';

function GameScene() {
  const isPlaying = useGameStore((state) => state.isPlaying);
  const [explosions, setExplosions] = useState<{ id: number; position: THREE.Vector3; color: string; count: number }[]>([]);

  const triggerExplosion = (position: THREE.Vector3, color: string, count: number = 20) => {
    setExplosions(prev => [...prev, { id: Date.now() + Math.random(), position, color, count }]);
  };

  const removeExplosion = (id: number) => {
    setExplosions(prev => prev.filter(e => e.id !== id));
  };
  
  return (
    <>
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 10, 100]} />
      
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
      
      <World />
      
      {explosions.map(e => (
        <Explosion 
          key={e.id} 
          position={e.position} 
          color={e.color} 
          count={e.count} 
          onComplete={() => removeExplosion(e.id)} 
        />
      ))}
      
      {isPlaying && (
        <>
          <Player onShoot={(pos) => triggerExplosion(pos, '#00ffff', 5)} />
          <EnemyManager onExplode={(pos) => triggerExplosion(pos, '#ff0000', 30)} />
        </>
      )}
      
      {!isPlaying && (
        <OrbitControls 
          autoRotate 
          autoRotateSpeed={0.5} 
          maxPolarAngle={Math.PI / 2.1} 
          minPolarAngle={Math.PI / 3}
          enableZoom={false}
        />
      )}
    </>
  );
}

export default function Game() {
  const isPlaying = useGameStore((state) => state.isPlaying);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const startGame = useGameStore((state) => state.startGame);
  const resetGame = useGameStore((state) => state.resetGame);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden font-mono">
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
          <GameScene />
        </Suspense>
      </Canvas>
      
      <HUD />
      
      {(!isPlaying && !isGameOver) && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm">
          <div className="text-center border-4 border-cyan-500 p-12 rounded-lg shadow-[0_0_50px_rgba(0,255,255,0.3)] bg-black/90">
            <h1 className="text-6xl font-bold text-cyan-400 mb-4 tracking-tighter" style={{ textShadow: '0 0 10px cyan' }}>
              SPACE PARANOIDS
            </h1>
            <p className="text-cyan-200 mb-8 text-xl tracking-widest">INSERT COIN TO START</p>
            <button 
              onClick={startGame}
              className="px-8 py-4 bg-transparent border-2 border-cyan-500 text-cyan-400 text-xl font-bold hover:bg-cyan-500 hover:text-black transition-all duration-300 uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,255,0.5)]"
            >
              Start Game
            </button>
            <div className="mt-8 text-cyan-700 text-sm">
              WASD to Move • MOUSE to Aim • CLICK to Shoot
            </div>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-red-900/20 backdrop-blur-sm">
          <div className="text-center border-4 border-red-500 p-12 rounded-lg shadow-[0_0_50px_rgba(255,0,0,0.3)] bg-black/90">
            <h1 className="text-6xl font-bold text-red-500 mb-4 tracking-tighter" style={{ textShadow: '0 0 10px red' }}>
              GAME OVER
            </h1>
            <p className="text-red-200 mb-8 text-xl tracking-widest">SYSTEM FAILURE</p>
            <button 
              onClick={startGame}
              className="px-8 py-4 bg-transparent border-2 border-red-500 text-red-400 text-xl font-bold hover:bg-red-500 hover:text-black transition-all duration-300 uppercase tracking-widest shadow-[0_0_20px_rgba(255,0,0,0.5)]"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
