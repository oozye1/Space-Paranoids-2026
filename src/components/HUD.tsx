import { useGameStore } from '../store';

export default function HUD() {
  const score = useGameStore((state) => state.score);
  const lives = useGameStore((state) => state.lives);
  const isPlaying = useGameStore((state) => state.isPlaying);

  if (!isPlaying) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start">
        <div className="text-cyan-400 font-bold text-2xl tracking-widest drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">
          SCORE: {score.toString().padStart(6, '0')}
        </div>
        <div className="text-red-400 font-bold text-2xl tracking-widest drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]">
          LIVES: {Array(lives).fill('▰').join(' ')}
        </div>
      </div>

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-2 border-cyan-500/50 rounded-full flex items-center justify-center">
        <div className="w-1 h-1 bg-cyan-500 rounded-full" />
      </div>
      
      {/* Decorative HUD Lines */}
      <div className="absolute bottom-8 left-8 w-64 h-32 border-l-2 border-b-2 border-cyan-500/30 rounded-bl-3xl p-4">
        <div className="text-cyan-500/50 text-xs">SYS.DIAGNOSTIC</div>
        <div className="mt-2 h-1 w-full bg-cyan-900/50 overflow-hidden">
          <div className="h-full bg-cyan-500/50 w-[80%] animate-pulse" />
        </div>
        <div className="mt-1 h-1 w-full bg-cyan-900/50 overflow-hidden">
          <div className="h-full bg-cyan-500/50 w-[60%] animate-pulse delay-75" />
        </div>
        <div className="mt-1 h-1 w-full bg-cyan-900/50 overflow-hidden">
          <div className="h-full bg-cyan-500/50 w-[90%] animate-pulse delay-150" />
        </div>
      </div>
      
      <div className="absolute bottom-8 right-8 w-64 h-32 border-r-2 border-b-2 border-red-500/30 rounded-br-3xl p-4 text-right">
        <div className="text-red-500/50 text-xs">THREAT.LEVEL</div>
        <div className="mt-2 text-red-500/80 font-mono text-xl animate-pulse">DETECTED</div>
      </div>
    </div>
  );
}
