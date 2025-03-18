import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float, useTexture } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useGameStore } from '../store/gameStore';
import * as THREE from 'three';

interface MathProblemProps {
  position: [number, number, number];
  id: string;
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

export default function MathProblem({ position, id }: MathProblemProps) {
  const meshRef = useRef<any>();
  const particlesRef = useRef<any>();
  const [active, setActive] = React.useState(false);
  const currentProblem = useGameStore(state => state.currentProblem);
  const setProblem = useGameStore(state => state.setProblem);
  const addSolvedProblem = useGameStore(state => state.addSolvedProblem);

  // Create particles for the mystery box effect
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 20; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = Math.random() * 2 - 1;
      const yFactor = Math.random() * 2 - 1;
      const zFactor = Math.random() * 2 - 1;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, []);

  // Create mystery box texture
  const boxTexture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d')!;

    // Draw question mark pattern
    context.fillStyle = '#2196F3';
    context.fillRect(0, 0, size, size);

    // Add grid pattern
    context.strokeStyle = '#1565C0';
    context.lineWidth = 2;
    for (let i = 0; i < size; i += 16) {
      context.beginPath();
      context.moveTo(i, 0);
      context.lineTo(i, size);
      context.stroke();
      context.beginPath();
      context.moveTo(0, i);
      context.lineTo(size, i);
      context.stroke();
    }

    // Draw question mark
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 80px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('?', size/2, size/2);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }

    if (particlesRef.current && active) {
      let i = 0;
      const positions = particlesRef.current.geometry.attributes.position.array;

      for (const particle of particles) {
        particle.t += particle.speed;

        positions[i] = Math.sin(particle.t) * particle.xFactor;
        positions[i + 1] = Math.cos(particle.t) * particle.yFactor;
        positions[i + 2] = Math.sin(particle.t) * particle.zFactor;
        i += 3;
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const handleAnswer = (selectedAnswer: number) => {
    if (currentProblem && selectedAnswer === currentProblem.answer) {
      // Mark problem as solved
      addSolvedProblem(id);
      setProblem(null);

      // Play success sound
      new Audio('/sounds/success.mp3').play().catch(() => {});

      // Add particle effect for solved problem
      setActive(true);
      setTimeout(() => {
        setActive(false);
      }, 1000);
    }
  };

  const handleCollision = () => {
    if (!currentProblem) {
      setActive(true);
      const problem = generateMathProblem();
      setProblem({
        ...problem,
        onAnswer: handleAnswer
      });

      // Play activation sound
      new Audio('/sounds/activate.mp3').play().catch(() => {});

      // Reset active state after 0.5 seconds
      setTimeout(() => {
        setActive(false);
      }, 500);
    }
  };

  const handleExit = () => {
    // Dismiss the problem when player walks away
    if (currentProblem) {
      setProblem(null);
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
        onIntersectionExit={handleExit}
      >
        <mesh
          ref={meshRef}
          scale={active ? 1.2 : 1}
        >
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial
            color="#2196F3"
            emissive="#4CAF50"
            emissiveIntensity={active ? 0.5 : 0}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Question text on three sides */}
        {currentProblem && (
          <>
            {/* Front */}
            <Text
              position={[0, 0, 1.1]}
              fontSize={0.4}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.05}
              outlineColor="#000000"
            >
              {currentProblem.question}
            </Text>
            {/* Left */}
            <Text
              position={[-1.1, 0, 0]}
              fontSize={0.4}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.05}
              outlineColor="#000000"
              rotation={[0, Math.PI / 2, 0]}
            >
              {currentProblem.question}
            </Text>
            {/* Right */}
            <Text
              position={[1.1, 0, 0]}
              fontSize={0.4}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.05}
              outlineColor="#000000"
              rotation={[0, -Math.PI / 2, 0]}
            >
              {currentProblem.question}
            </Text>
          </>
        )}

        {/* Particles */}
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particles.length}
              array={new Float32Array(particles.length * 3)}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.1}
            color="#4CAF50"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </points>

        <CuboidCollider args={[1, 1, 1]} sensor />
      </RigidBody>
    </Float>
  );
}
