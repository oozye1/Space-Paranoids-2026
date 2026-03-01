import { create } from 'zustand';

interface GameState {
  score: number;
  lives: number;
  isPlaying: boolean;
  isGameOver: boolean;
  startGame: () => void;
  endGame: () => void;
  addScore: (points: number) => void;
  loseLife: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  lives: 5,
  isPlaying: false,
  isGameOver: false,
  startGame: () => set({ isPlaying: true, isGameOver: false, score: 0, lives: 5 }),
  endGame: () => set({ isPlaying: false, isGameOver: true }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  loseLife: () => set((state) => {
    const newLives = state.lives - 1;
    if (newLives <= 0) {
      return { lives: 0, isPlaying: false, isGameOver: true };
    }
    return { lives: newLives };
  }),
  resetGame: () => set({ score: 0, lives: 5, isPlaying: false, isGameOver: false }),
}));
