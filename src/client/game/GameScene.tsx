import React, { useRef, useMemo } from 'react';
import Player from './Player';
import Ground from './Ground';
import MathProblem from './MathProblem';
import SkyScene from './SkyScene';
import { useGameStore } from '../store/gameStore';
import { RigidBody, CuboidCollider, useRapier } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function JumpBlock({ position, color = "#FF9800", size = [3, 2, 3] }: {
  position: [number, number, number],
  color?: string,
  size?: [number, number, number]
}) {
  return (
    <RigidBody type="fixed" position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.8} />
      </mesh>
      <CuboidCollider args={[size[0]/2, size[1]/2, size[2]/2]} />
    </RigidBody>
  );
}

function FloatingPlatform({ position, size = [6, 0.5, 6], color = "#E74C3C", amplitude = 0.2, speed = 1 }: {
  position: [number, number, number],
  size?: [number, number, number],
  color?: string,
  amplitude?: number,
  speed?: number
}) {
  const meshRef = useRef<THREE.Mesh>();
  const startY = position[1];

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = startY + Math.sin(state.clock.elapsedTime * speed) * amplitude;
    }
  });

  return (
    <RigidBody type="fixed" position={position}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>
      <CuboidCollider args={[size[0]/2, size[1]/2, size[2]/2]} />
    </RigidBody>
  );
}

function LavaPit({ position }: { position: [number, number, number] }) {
  const flamesRef = useRef<THREE.Group>();

  useFrame((state) => {
    if (!flamesRef.current) return;
    flamesRef.current.children.forEach((flame, i) => {
      flame.position.y = Math.sin(state.clock.elapsedTime * 2 + i) * 0.2;
      flame.rotation.y += 0.02;
    });
  });

  return (
    <group position={position}>
      {/* Lava base */}
      <mesh position={[0, -1, 0]} receiveShadow>
        <cylinderGeometry args={[5, 5, 2, 32]} />
        <meshStandardMaterial
          color="#FF4500"
          emissive="#FF0000"
          emissiveIntensity={2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Flames */}
      <group ref={flamesRef}>
        {Array.from({ length: 20 }).map((_, i) => (
          <mesh
            key={i}
            position={[
              Math.sin(i) * 3,
              0,
              Math.cos(i) * 3
            ]}
          >
            <coneGeometry args={[0.5, 2, 8]} />
            <meshPhongMaterial
              color="#FF8C00"
              emissive="#FF4500"
              emissiveIntensity={2}
              transparent
              opacity={0.8}
            />
          </mesh>
        ))}
      </group>

      {/* Damage trigger */}
      <CuboidCollider
        args={[5, 1, 5]}
        sensor
        onIntersectionEnter={() => {
          new Audio('/sounds/burn.mp3').play().catch(() => {});
        }}
      />
    </group>
  );
}

function EvilGoose({ startPosition }: { startPosition: [number, number, number] }) {
  const gooseRef = useRef<THREE.Group>();
  const wingLeftRef = useRef<THREE.Mesh>();
  const wingRightRef = useRef<THREE.Mesh>();
  const neckRef = useRef<THREE.Mesh>();

  useFrame((state) => {
    if (!gooseRef.current || !wingLeftRef.current || !wingRightRef.current || !neckRef.current) return;

    // Flap wings
    const wingFlap = Math.sin(state.clock.elapsedTime * 10) * 0.5;
    wingLeftRef.current.rotation.z = wingFlap;
    wingRightRef.current.rotation.z = -wingFlap;

    // Bob neck
    neckRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.2;

    // Chase player (simple circular motion for now)
    const radius = 5;
    gooseRef.current.position.x = startPosition[0] + Math.cos(state.clock.elapsedTime) * radius;
    gooseRef.current.position.z = startPosition[2] + Math.sin(state.clock.elapsedTime) * radius;
    gooseRef.current.rotation.y = state.clock.elapsedTime;

    // Random honks
    if (Math.random() < 0.001) {
      new Audio('/sounds/honk.mp3').play().catch(() => {});
    }
  });

  return (
    <group ref={gooseRef} position={startPosition}>
      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.3, 0.8, 8]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>

      {/* Neck */}
      <mesh ref={neckRef} position={[0, 0.5, 0.4]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.6]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.8, 0.4]} castShadow>
        <sphereGeometry args={[0.15]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>

      {/* Beak */}
      <mesh position={[0, 0.8, 0.6]} castShadow>
        <coneGeometry args={[0.05, 0.2, 4]} />
        <meshStandardMaterial color="#FFA500" roughness={0.3} />
      </mesh>

      {/* Wings */}
      <mesh ref={wingLeftRef} position={[0.3, 0.3, 0]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.4]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
      <mesh ref={wingRightRef} position={[-0.3, 0.3, 0]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.4]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>

      {/* Damage trigger */}
      <CuboidCollider
        args={[0.4, 0.4, 0.6]}
        sensor
        onIntersectionEnter={() => {
          new Audio('/sounds/goose-attack.mp3').play().catch(() => {});
        }}
      />
    </group>
  );
}

function Car({ position }: { position: [number, number, number] }) {
  const vehicleRef = useRef<THREE.Group>();
  const wheelRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    if (!vehicleRef.current) return;

    // Spin wheels
    wheelRefs.current.forEach(wheel => {
      if (wheel) wheel.rotation.x += 0.1;
    });

    // Make car bounce slightly
    vehicleRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
  });

  return (
    <RigidBody type="dynamic" position={position} colliders="hull">
      <group ref={vehicleRef}>
        {/* Car body */}
        <mesh castShadow>
          <boxGeometry args={[3, 1, 4]} />
          <meshStandardMaterial color="#4169E1" metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Cabin */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[2, 0.8, 2]} />
          <meshStandardMaterial color="#4169E1" metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Wheels */}
        {[
          [1, -0.5, 1.5],
          [-1, -0.5, 1.5],
          [1, -0.5, -1.5],
          [-1, -0.5, -1.5]
        ].map((wheelPos, i) => (
          <mesh
            key={i}
            ref={el => wheelRefs.current[i] = el}
            position={wheelPos}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        ))}
      </group>
    </RigidBody>
  );
}

export default function GameScene() {
  const solvedProblems = useGameStore(state => state.solvedProblems);

  // Generate world elements
  const worldElements = useMemo(() => {
    const elements = {
      platforms: [] as { position: [number, number, number], size?: [number, number, number], color?: string, amplitude?: number, speed?: number }[],
      jumpBlocks: [] as { position: [number, number, number], color?: string, size?: [number, number, number] }[],
      problems: [] as { position: [number, number, number], id: string }[]
    };

    // Create main floating islands
    const islandPositions = [
      [-20, 2, -20], [0, 3, -20], [20, 2, -20],
      [-20, 3, 0], [20, 3, 0],
      [-20, 2, 20], [0, 3, 20], [20, 2, 20]
    ] as [number, number, number][];

    islandPositions.forEach(pos => {
      elements.platforms.push({
        position: pos,
        size: [8, 1, 8],
        color: "#2ECC71",
        amplitude: 0.3,
        speed: 0.5
      });
    });

    // Add challenging jump block sequences
    const jumpSequences = [
      // Spiral staircase
      ...Array.from({ length: 8 }, (_, i) => ({
        position: [
          Math.cos(i * Math.PI / 4) * 12,
          3 + i * 1.5,
          Math.sin(i * Math.PI / 4) * 12
        ] as [number, number, number],
        color: "#FF9800",
        size: [2.5, 1, 2.5]
      })),
      // Zigzag path
      ...Array.from({ length: 6 }, (_, i) => ({
        position: [
          -15 + i * 6,
          5 + (i % 2) * 2,
          -10
        ] as [number, number, number],
        color: "#9B59B6",
        size: [2, 1, 2]
      }))
    ];

    elements.jumpBlocks.push(...jumpSequences);

    // Add floating platforms at various heights
    const floatingPlatforms = [
      { pos: [0, 8, 0], size: [10, 0.5, 10], color: "#3498DB" },
      { pos: [-15, 6, -15], size: [4, 0.5, 4], color: "#E74C3C" },
      { pos: [15, 7, 15], size: [4, 0.5, 4], color: "#F1C40F" },
      { pos: [-15, 7, 15], size: [4, 0.5, 4], color: "#1ABC9C" },
      { pos: [15, 6, -15], size: [4, 0.5, 4], color: "#E67E22" }
    ];

    floatingPlatforms.forEach(({ pos, size, color }) => {
      elements.platforms.push({
        position: pos as [number, number, number],
        size: size,
        color: color,
        amplitude: 0.4,
        speed: 0.8
      });
    });

    // Add small challenge platforms
    const challengePlatforms = [
      [-8, 10, -8], [8, 11, -8],
      [-8, 11, 8], [8, 10, 8],
      [0, 12, 0]
    ] as [number, number, number][];

    challengePlatforms.forEach(pos => {
      elements.platforms.push({
        position: pos,
        size: [3, 0.3, 3],
        color: "#E74C3C",
        amplitude: 0.5,
        speed: 1.2
      });
    });

    // Place math problems strategically
    const problemLocations = [
      // On main islands
      ...islandPositions.map(pos => ([pos[0], pos[1] + 2, pos[2]])),
      // On high platforms
      ...challengePlatforms.map(pos => ([pos[0], pos[1] + 2, pos[2]])),
      // On spiral staircase
      ...jumpSequences.slice(0, 4).map(block => ([
        block.position[0],
        block.position[1] + 2,
        block.position[2]
      ]))
    ] as [number, number, number][];

    // Select random locations for problems
    const selectedLocations = problemLocations
      .sort(() => Math.random() - 0.5)
      .slice(0, 12);

    elements.problems = selectedLocations.map((position, i) => ({
      position,
      id: `problem-${i}`
    }));

    return elements;
  }, []);

  return (
    <>
      <SkyScene />
      <ambientLight intensity={0.4} />
      <directionalLight
        castShadow
        position={[50, 50, 50]}
        intensity={1.5}
        shadow-mapSize={[4096, 4096]}
      />

      <Player />
      <Ground />

      {/* Add new dangerous and fun elements */}
      <LavaPit position={[0, -1, -15]} />
      <EvilGoose startPosition={[10, 1, 10]} />
      <Car position={[-10, 1, -10]} />

      {/* Render jump blocks */}
      {worldElements.jumpBlocks.map((block, index) => (
        <JumpBlock
          key={`block-${index}`}
          position={block.position}
          color={block.color}
          size={block.size}
        />
      ))}

      {/* Render platforms */}
      {worldElements.platforms.map((platform, index) => (
        <FloatingPlatform
          key={`platform-${index}`}
          position={platform.position}
          size={platform.size}
          color={platform.color}
          amplitude={platform.amplitude}
          speed={platform.speed}
        />
      ))}

      {/* Render unsolved math problems */}
      {worldElements.problems.map((problem) => (
        !solvedProblems.includes(problem.id) && (
          <MathProblem
            key={problem.id}
            position={problem.position}
            id={problem.id}
          />
        )
      ))}
    </>
  );
}
