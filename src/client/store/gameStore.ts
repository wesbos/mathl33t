import { create } from 'zustand';

interface MathProblem {
  question: string;
  answer: number;
  options: number[];
}

interface GameState {
  isLoggedIn: boolean;
  username: string | null;
  score: number;
  streak: number;
  highScore: number;
  currentProblem: MathProblem | null;
  setLoggedIn: (status: boolean) => void;
  setUsername: (username: string) => void;
  setScore: (score: number) => void;
  setProblem: (problem: MathProblem | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  isLoggedIn: false,
  username: null,
  score: 0,
  streak: 0,
  highScore: 0,
  currentProblem: null,
  setLoggedIn: (status) => set({ isLoggedIn: status }),
  setUsername: (username) => set({ username }),
  setScore: (score) => set((state) => ({
    score,
    highScore: Math.max(state.highScore, score)
  })),
  setProblem: (problem) => set({ currentProblem: problem })
}));
