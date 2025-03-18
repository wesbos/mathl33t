import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';

interface MathProblemProps {
  position: [number, number, number];
}

function generateMathProblem() {
  const operations = ['+', '-', '*', '/'];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  let num1: number, num2: number, answer: number;

  switch (operation) {
    case '+':
      num1 = Math.floor(Math.random() * 20) + 1;
      num2 = Math.floor(Math.random() * 20) + 1;
      answer = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * 20) + 1;
      num2 = Math.floor(Math.random() * num1) + 1;
      answer = num1 - num2;
      break;
    case '*':
      num1 = Math.floor(Math.random() * 12) + 1;
      num2 = Math.floor(Math.random() * 12) + 1;
      answer = num1 * num2;
      break;
    case '/':
      num2 = Math.floor(Math.random() * 12) + 1;
      answer = Math.floor(Math.random() * 12) + 1;
      num1 = num2 * answer;
      break;
    default:
      num1 = 0;
      num2 = 0;
      answer = 0;
  }

  const options = [
    answer,
    answer + Math.floor(Math.random() * 5) + 1,
    answer - Math.floor(Math.random() * 5) + 1,
    Math.abs(answer * 2 - Math.floor(Math.random() * 5))
  ].sort(() => Math.random() - 0.5);

  return {
    question: `${num1} ${operation} ${num2} = ?`,
    answer,
    options
  };
}

export default function MathProblem({ position }: MathProblemProps) {
  const meshRef = useRef<any>();
  const [active, setActive] = React.useState(false);
  const currentProblem = useGameStore(state => state.currentProblem);
  const setProblem = useGameStore(state => state.setProblem);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const handleCollision = () => {
    if (!currentProblem) {
      setActive(true);
      const problem = generateMathProblem();
      setProblem(problem);

      // Play activation sound
      new Audio('/sounds/activate.mp3').play().catch(() => {});

      // Reset active state after 0.5 seconds
      setTimeout(() => {
        setActive(false);
      }, 500);
    }
  };

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.5}
      floatIntensity={0.5}
    >
      <RigidBody
        type="fixed"
        position={position}
        sensor
        onIntersectionEnter={handleCollision}
      >
        <mesh
          ref={meshRef}
          scale={active ? 1.2 : 1}
        >
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial
            color={active ? "#4CAF50" : "#2196F3"}
            emissive={active ? "#4CAF50" : "#000000"}
            emissiveIntensity={active ? 0.8 : 0}
            metalness={0.5}
            roughness={0.2}
            transparent
            opacity={0.9}
          />
        </mesh>
        <CuboidCollider args={[2, 2, 2]} sensor />
        <Text
          position={[0, 0, 1.1]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {active ? "Solving..." : "Math Problem!"}
        </Text>
      </RigidBody>
    </Float>
  );
}
