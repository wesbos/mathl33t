import React, { useRef } from 'react';
import { Sky } from '@react-three/drei';
import Player from './Player';
import Ground from './Ground';
import MathProblem from './MathProblem';

export default function GameScene() {
  const problemsRef = useRef<Array<{ position: [number, number, number] }>>([
    { position: [10, 1, 10] },
    { position: [-10, 1, -10] },
    { position: [10, 1, -10] },
    { position: [-10, 1, 10] },
  ]);

  return (
    <>
      <Sky sunPosition={[100, 20, 100]} />
      <ambientLight intensity={0.3} />
      <directionalLight
        castShadow
        position={[50, 50, 50]}
        intensity={1.5}
        shadow-mapSize={[4096, 4096]}
      />

      <Player />
      <Ground />

      {problemsRef.current.map((problem, index) => (
        <MathProblem key={index} position={problem.position} />
      ))}
    </>
  );
}
