import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Cloud, Text } from '@react-three/drei';
import * as THREE from 'three';

const MATH_SYMBOLS = ['π', '∑', '÷', '×', '±', '∞', '√'];
const NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

function Bird({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>();
  const wingRef = useRef<THREE.Mesh>();

  useFrame((state) => {
    if (!groupRef.current || !wingRef.current) return;

    // Move forward and slightly up/down
    groupRef.current.position.x += 0.05;
    groupRef.current.position.y += Math.sin(state.clock.elapsedTime) * 0.01;

    // Flap wings
    wingRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 10) * 0.5;

    // Reset position when off screen
    if (groupRef.current.position.x > 50) {
      groupRef.current.position.x = -50;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={0.2}>
      <mesh>
        <coneGeometry args={[0.5, 2, 4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh ref={wingRef} position={[0, 0.2, 0]}>
        <boxGeometry args={[2, 0.1, 0.5]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}

function Plane({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>();
  const propellerRef = useRef<THREE.Mesh>();

  useFrame((state) => {
    if (!groupRef.current || !propellerRef.current) return;

    // Move forward with slight banking
    groupRef.current.position.x -= 0.15;
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.1;

    // Spin propeller
    propellerRef.current.rotation.z += 0.5;

    // Reset position when off screen
    if (groupRef.current.position.x < -50) {
      groupRef.current.position.x = 50;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={0.5}>
      {/* Fuselage */}
      <mesh>
        <cylinderGeometry args={[0.2, 0.2, 2, 8]} />
        <meshStandardMaterial color="#DDD" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Wings */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.1, 3]} />
        <meshStandardMaterial color="#DDD" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Tail */}
      <mesh position={[-0.8, 0.3, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.1]} />
        <meshStandardMaterial color="#DDD" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Propeller */}
      <mesh ref={propellerRef} position={[1, 0, 0]}>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}

// Voxel patterns for symbols and numbers
const VOXEL_PATTERNS = {
  '1': [[0,1,0], [1,1,0], [0,1,0], [0,1,0], [1,1,1]],
  '2': [[1,1,1], [0,0,1], [1,1,1], [1,0,0], [1,1,1]],
  '3': [[1,1,1], [0,0,1], [1,1,1], [0,0,1], [1,1,1]],
  '4': [[1,0,1], [1,0,1], [1,1,1], [0,0,1], [0,0,1]],
  '5': [[1,1,1], [1,0,0], [1,1,1], [0,0,1], [1,1,1]],
  '6': [[1,1,1], [1,0,0], [1,1,1], [1,0,1], [1,1,1]],
  '7': [[1,1,1], [0,0,1], [0,1,0], [1,0,0], [1,0,0]],
  '8': [[1,1,1], [1,0,1], [1,1,1], [1,0,1], [1,1,1]],
  '9': [[1,1,1], [1,0,1], [1,1,1], [0,0,1], [1,1,1]],
  'π': [[1,1,1], [1,0,1], [1,0,1], [1,0,1], [1,0,1]],
  '∑': [[1,1,1], [1,0,0], [1,1,0], [1,0,0], [1,1,1]],
  '÷': [[0,1,0], [0,0,0], [1,1,1], [0,0,0], [0,1,0]],
  '×': [[1,0,1], [0,1,0], [1,0,1], [0,1,0], [1,0,1]],
  '±': [[0,1,0], [1,1,1], [0,1,0], [1,1,1], [0,1,0]],
  '∞': [[1,0,1], [1,1,1], [1,0,1], [1,1,1], [1,0,1]],
  '√': [[1,1,0], [0,0,1], [0,1,0], [1,0,0], [1,0,0]]
};

function VoxelCloud({ symbol, position }: { symbol: string, position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>();
  const pattern = VOXEL_PATTERNS[symbol] || VOXEL_PATTERNS['1'];

  const blockGeometry = useMemo(() => new THREE.BoxGeometry(1.5, 1.5, 1.5), []);
  const blockMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    metalness: 0.2,
    roughness: 0.7,
    emissive: '#444444',
    emissiveIntensity: 0.2,
  }), []);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Gentle floating motion
    groupRef.current.position.x -= 0.02;
    groupRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.005;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;

    // Reset position when off screen
    if (groupRef.current.position.x < -100) {
      groupRef.current.position.x = 100;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={2}>
      {pattern.map((row, y) =>
        row.map((cell, x) =>
          cell === 1 && (
            <mesh
              key={`symbol-${x}-${y}`}
              geometry={blockGeometry}
              material={blockMaterial}
              position={[x * 1.6 - 1.5, -y * 1.6 + 3, 0]}
              castShadow
            >
              <meshStandardMaterial
                color="#FFFFFF"
                metalness={0.2}
                roughness={0.7}
                emissive="#444444"
                emissiveIntensity={0.2}
              />
            </mesh>
          )
        )
      )}
    </group>
  );
}

export default function SkyScene() {
  // Generate random positions for sky elements
  const skyElements = useMemo(() => {
    const elements = [];

    // Add fewer math symbol clouds, higher up and smaller
    for (let i = 0; i < 5; i++) {
      const symbol = Math.random() < 0.5
        ? MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)]
        : NUMBERS[Math.floor(Math.random() * NUMBERS.length)];

      elements.push({
        type: 'cloud',
        symbol,
        position: [
          Math.random() * 100 - 50,  // Less spread
          Math.random() * 20 + 30,   // Much higher up (30-50 units)
          Math.random() * 100 - 50   // Less spread
        ] as [number, number, number]
      });
    }

    // Add birds
    for (let i = 0; i < 4; i++) {
      elements.push({
        type: 'bird',
        position: [
          Math.random() * 100 - 50,
          Math.random() * 5 + 20,
          Math.random() * 100 - 50
        ] as [number, number, number]
      });
    }

    // Add planes
    for (let i = 0; i < 2; i++) {
      elements.push({
        type: 'plane',
        position: [
          Math.random() * 100 - 50,
          Math.random() * 5 + 30,
          Math.random() * 100 - 50
        ] as [number, number, number]
      });
    }

    return elements;
  }, []);

  return (
    <>
      <Sky sunPosition={[100, 20, 100]} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 20, 10]} intensity={2} castShadow />
      {skyElements.map((element, index) => {
        if (element.type === 'cloud') {
          return (
            <VoxelCloud
              key={`cloud-${index}`}
              symbol={element.symbol || '1'}
              position={element.position}
              scale={1} // Make clouds smaller (was 2 before)
            />
          );
        } else if (element.type === 'bird') {
          return (
            <Bird
              key={`bird-${index}`}
              position={element.position}
            />
          );
        } else {
          return (
            <Plane
              key={`plane-${index}`}
              position={element.position}
            />
          );
        }
      })}
    </>
  );
}
