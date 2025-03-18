import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export default function HUD() {
  const score = useGameStore(state => state.score);
  const streak = useGameStore(state => state.streak);
  const currentProblem = useGameStore(state => state.currentProblem);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleAnswer = (option: number) => {
    setSelectedAnswer(option);

    if (option === currentProblem?.answer) {
      // Play success sound
      new Audio('/sounds/correct.mp3').play().catch(() => {});
      // Update score after delay
      setTimeout(() => {
        useGameStore.setState(state => ({
          score: state.score + 10,
          streak: state.streak + 1,
          currentProblem: null
        }));
        setSelectedAnswer(null);
      }, 1000);
    } else {
      // Play failure sound
      new Audio('/sounds/wrong.mp3').play().catch(() => {});
      // Update score after delay
      setTimeout(() => {
        useGameStore.setState(state => ({
          score: Math.max(0, state.score - 5),
          streak: 0,
          currentProblem: null
        }));
        setSelectedAnswer(null);
      }, 1000);
    }
  };

  const getButtonClass = (option: number) => {
    if (selectedAnswer === null) {
      return "bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-2xl transition-colors";
    }

    if (option === currentProblem?.answer) {
      return "bg-green-500 text-white px-8 py-4 rounded-lg text-2xl transition-colors";
    }

    if (selectedAnswer === option) {
      return "bg-red-500 text-white px-8 py-4 rounded-lg text-2xl transition-colors";
    }

    return "bg-blue-500 opacity-50 text-white px-8 py-4 rounded-lg text-2xl transition-colors";
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-50">
      {/* Score */}
      <div className="absolute top-4 left-4 p-4 bg-black/50 text-white rounded-lg backdrop-blur-sm">
        <div className="text-2xl font-bold">Score: {score}</div>
        <div className="text-xl">Streak: {streak}</div>
      </div>

      {/* Math Problem */}
      {currentProblem && (
        <div className="fixed top-20 left-0 right-0 mx-auto w-[400px] bg-black/70 text-white p-6 rounded-xl backdrop-blur-lg">
          <div className="text-3xl font-bold mb-4 text-center">{currentProblem.question}</div>
          <div className="grid grid-cols-2 gap-4">
            {currentProblem.options.map((option, index) => (
              <button
                key={index}
                className={getButtonClass(option)}
                onClick={() => !selectedAnswer && handleAnswer(option)}
                disabled={selectedAnswer !== null}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="text-center mt-6 text-gray-400 text-lg">
            {selectedAnswer === null ? "Click the correct answer!" :
              selectedAnswer === currentProblem.answer ? "Correct! ✨" : "Wrong! The correct answer was " + currentProblem.answer}
          </div>
        </div>
      )}
    </div>
  );
}
