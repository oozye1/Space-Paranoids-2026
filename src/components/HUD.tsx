import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store';

export default function HUD() {
  const score = useGameStore((state) => state.score);
  const lives = useGameStore((state) => state.lives);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const [kills, setKills] = useState(0);
  const [killFlash, setKillFlash] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const prevScore = useRef(0);

  // Animated score counter
  useEffect(() => {
    if (score === displayScore) return;
    const step = Math.max(1, Math.ceil((score - displayScore) / 10));
    const id = setInterval(() => {
      setDisplayScore(prev => {
        if (prev + step >= score) { clearInterval(id); return score; }
        return prev + step;
      });
    }, 30);
    return () => clearInterval(id);
  }, [score]);

  // Track kills and kill flash
  useEffect(() => {
    if (score > prevScore.current && prevScore.current > 0) {
      setKills(k => k + 1);
      setKillFlash(true);
      setTimeout(() => setKillFlash(false), 400);
    }
    prevScore.current = score;
  }, [score]);

  // Damage flash
  useEffect(() => {
    const handleDamage = () => {
      setDamageFlash(true);
      setTimeout(() => setDamageFlash(false), 300);
    };
    window.addEventListener('player-damage', handleDamage);
    return () => window.removeEventListener('player-damage', handleDamage);
  }, []);

  if (!isPlaying) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Damage vignette flash */}
      {damageFlash && (
        <div className="absolute inset-0 pointer-events-none animate-pulse"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(255,0,0,0.4) 100%)',
            animation: 'fadeOut 0.3s ease-out forwards'
          }}
        />
      )}

      {/* Kill flash */}
      {killFlash && (
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,100,0,0.15) 0%, transparent 70%)',
            animation: 'fadeOut 0.4s ease-out forwards'
          }}
        />
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start">
        {/* Score */}
        <div className="flex flex-col gap-1">
          <div className="text-cyan-500/60 text-[10px] tracking-[0.3em] uppercase">Score</div>
          <div className="text-cyan-400 font-bold text-3xl tracking-widest"
            style={{ textShadow: '0 0 10px rgba(0,255,255,0.8), 0 0 30px rgba(0,255,255,0.3)' }}>
            {displayScore.toString().padStart(6, '0')}
          </div>
        </div>

        {/* Kills */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-orange-500/60 text-[10px] tracking-[0.3em] uppercase">Kills</div>
          <div className={`font-bold text-2xl tracking-widest transition-all duration-200 ${killFlash ? 'text-white scale-125' : 'text-orange-400'}`}
            style={{ textShadow: killFlash ? '0 0 20px rgba(255,200,0,1)' : '0 0 10px rgba(255,100,0,0.5)' }}>
            {kills}
          </div>
        </div>

        {/* Lives */}
        <div className="flex flex-col items-end gap-1">
          <div className="text-red-500/60 text-[10px] tracking-[0.3em] uppercase">Energy</div>
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}
                className={`w-6 h-3 border transition-all duration-300 ${
                  i < lives
                    ? 'bg-red-500/80 border-red-400 shadow-[0_0_8px_rgba(255,0,0,0.6)]'
                    : 'bg-transparent border-red-900/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Outer ring */}
        <div className="w-10 h-10 border border-cyan-500/30 rounded-full absolute -top-5 -left-5" />
        {/* Cross lines */}
        <div className="absolute -top-4 left-0 w-px h-3 bg-cyan-400/60" style={{ boxShadow: '0 0 4px rgba(0,255,255,0.5)' }} />
        <div className="absolute top-1 left-0 w-px h-3 bg-cyan-400/60" style={{ boxShadow: '0 0 4px rgba(0,255,255,0.5)' }} />
        <div className="absolute top-0 -left-4 w-3 h-px bg-cyan-400/60" style={{ boxShadow: '0 0 4px rgba(0,255,255,0.5)' }} />
        <div className="absolute top-0 left-1 w-3 h-px bg-cyan-400/60" style={{ boxShadow: '0 0 4px rgba(0,255,255,0.5)' }} />
        {/* Center dot */}
        <div className="w-1 h-1 bg-cyan-400 rounded-full absolute -top-0.5 -left-0.5"
          style={{ boxShadow: '0 0 6px rgba(0,255,255,0.8)' }} />
      </div>

      {/* Bottom left - System status */}
      <div className="absolute bottom-6 left-6 w-48 border-l border-b border-cyan-500/20 p-3 rounded-bl-xl">
        <div className="text-cyan-500/40 text-[9px] tracking-[0.25em] uppercase mb-2">Sys.Status</div>
        <div className="space-y-1">
          {['TARGETING', 'SHIELDS', 'SYSTEMS'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="text-cyan-600/40 text-[8px] w-16">{label}</div>
              <div className="flex-1 h-0.5 bg-cyan-900/30 overflow-hidden">
                <div className="h-full bg-cyan-500/40 animate-pulse"
                  style={{ width: `${70 + i * 10}%`, animationDelay: `${i * 0.15}s` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom right - Threat indicator */}
      <div className="absolute bottom-6 right-6 w-48 border-r border-b border-red-500/20 p-3 rounded-br-xl text-right">
        <div className="text-red-500/40 text-[9px] tracking-[0.25em] uppercase mb-1">Threat.Level</div>
        <div className="text-red-500/60 font-mono text-sm animate-pulse">HOSTILE</div>
      </div>

      {/* CSS animation */}
      <style>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
