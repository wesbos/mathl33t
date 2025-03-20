import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { KeyboardControls } from '@react-three/drei';
import GameScene from './game/GameScene';
import HUD from './components/HUD';
import CharacterCustomizer from './components/CharacterCustomizer';
import Store from './components/Store';
import { useGameStore } from './store/gameStore';

type Controls = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
};

export default function App() {
  const isLoggedIn = useGameStore(state => state.isLoggedIn);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-500 to-purple-600">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold mb-4 text-center">MathL33t</h1>
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition"
            onClick={() => useGameStore.setState({ isLoggedIn: true })}
          >
            Start Playing
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <KeyboardControls<Controls>
        map={[
          { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
          { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
          { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
          { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
          { name: 'jump', keys: ['Space'] },
        ]}
      >
        <Canvas
          shadows
          camera={{ position: [0, 5, 10], fov: 75 }}
          className="w-screen h-screen"
        >
          <Physics>
            <GameScene />
          </Physics>
        </Canvas>
        <HUD />
        <CharacterCustomizer />
        <Store />
      </KeyboardControls>
    </>
  );
}
