import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

interface Position {
  x: number;
  y: number;
}

export default function TouchControls() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState<Position>({ x: 0, y: 0 });
  const [isJumping, setIsJumping] = useState(false);

  // Store the controls state in the game store
  const setControls = useGameStore(state => state.setTouchControls);

  useEffect(() => {
    // Check if device supports touch
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    if (!isDragging) {
      setControls({ forward: false, backward: false, left: false, right: false });
    }
  }, [isDragging, setControls]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const pos = { x: touch.clientX, y: touch.clientY };
    setStartPos(pos);
    setCurrentPos(pos);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const pos = { x: touch.clientX, y: touch.clientY };
    setCurrentPos(pos);

    // Calculate direction based on joystick position
    const deltaX = pos.x - startPos.x;
    const deltaY = pos.y - startPos.y;
    const threshold = 20; // Minimum movement to trigger direction

    setControls({
      forward: deltaY < -threshold,
      backward: deltaY > threshold,
      left: deltaX < -threshold,
      right: deltaX > threshold
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setCurrentPos(startPos);
  };

  const handleJumpStart = () => {
    setIsJumping(true);
    setControls({ jump: true });
  };

  const handleJumpEnd = () => {
    setIsJumping(false);
    setControls({ jump: false });
  };

  if (!isTouchDevice) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-50 p-4">
      <div className="flex justify-between items-center max-w-4xl mx-auto">
        {/* Joystick */}
        <div
          className="w-36 h-36 bg-black/20 rounded-full pointer-events-auto relative touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white/40"
            style={{
              transform: isDragging
                ? `translate(${currentPos.x - startPos.x}px, ${currentPos.y - startPos.y}px)`
                : 'translate(-50%, -50%)'
            }}
          />
        </div>

        {/* Jump Button */}
        <button
          className={`w-24 h-24 rounded-full pointer-events-auto ${
            isJumping
              ? 'bg-white/40 backdrop-blur-sm'
              : 'bg-white/20 backdrop-blur-sm'
          } border-2 border-white/40 flex items-center justify-center`}
          onTouchStart={handleJumpStart}
          onTouchEnd={handleJumpEnd}
        >
          <span className="text-4xl">↑</span>
        </button>
      </div>
    </div>
  );
}
