import React, { useRef, useMemo, useState } from 'react';
import Player from './Player';
import Ground from './Ground';
import MathProblem from './MathProblem';
import SkyScene from './SkyScene';
import { useGameStore } from '../store/gameStore';
import { RigidBody, CuboidCollider, useRapier } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import OtherPlayer from './OtherPlayer';

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
  const setScore = useGameStore(state => state.setScore);

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
        onIntersectionEnter={(e) => {
          // Play death sound
          new Audio('/sounds/burn.mp3').play().catch(() => {});

          // Reset player position and momentum
          if (e.rigidBody) {
            e.rigidBody.setTranslation({ x: 0, y: 3, z: 0 });
            e.rigidBody.setLinvel({ x: 0, y: 0, z: 0 });
            e.rigidBody.setAngvel({ x: 0, y: 0, z: 0 });
          }

          // Reset score and streak
          setScore(0);
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

function MathBlock({ position, id, question }: {
  position: [number, number, number],
  id: string,
  question: string
}) {
  const setProblem = useGameStore(state => state.setProblem);
  const addSolvedProblem = useGameStore(state => state.addSolvedProblem);
  const solvedProblems = useGameStore(state => state.solvedProblems);

  // Don't render if this problem is already solved
  if (solvedProblems.includes(id)) {
    console.log(`MathBlock ${id} - Already solved, not rendering`);
    return null;
  }

  console.log(`MathBlock ${id} - Rendering`);

  const calculateAnswer = (question: string): number => {
    // Remove the "= ?" part and any spaces
    const expression = question.replace('= ?', '').trim();
    const [num1, operator, num2] = expression.split(' ');
    const a = parseInt(num1);
    const b = parseInt(num2);

    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return a / b;
      default: return 0;
    }
  };

  const generateOptions = (answer: number): number[] => {
    const options = [answer];
    // Generate 3 wrong answers that are close to the correct answer
    while (options.length < 4) {
      const offset = Math.floor(Math.random() * 5) + 1;
      const wrongAnswer = Math.random() < 0.5 ? answer + offset : answer - offset;
      if (!options.includes(wrongAnswer) && wrongAnswer > 0) {
        options.push(wrongAnswer);
      }
    }
    // Shuffle the options
    return options.sort(() => Math.random() - 0.5);
  };

  const handleCollision = () => {
    console.log(`MathBlock ${id} - Collision detected`);
    const answer = calculateAnswer(question);
    setProblem({
      question,
      answer,
      options: generateOptions(answer),
      onAnswer: (selectedAnswer) => {
        if (selectedAnswer === answer) {
          console.log(`MathBlock ${id} - Correct answer selected, marking as solved`);
          // Mark problem as solved in the store
          addSolvedProblem(id);
          setProblem(null);

          // Play success sound
          new Audio('/sounds/success.mp3').play().catch(() => {});
        }
      }
    });
    new Audio('/sounds/activate.mp3').play().catch(() => {});
  };

  const handleExit = () => {
    console.log(`MathBlock ${id} - Player walked away, clearing problem`);
    setProblem(null);
  };

  return (
    <RigidBody
      type="fixed"
      position={position}
      sensor
      onIntersectionEnter={handleCollision}
      onIntersectionExit={handleExit}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[4, 2, 4]} />
        <meshStandardMaterial
          color="#2196F3"
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      {/* Question text on all sides */}
      {[
        [0, 0, 2.01], // front
        [0, 0, -2.01], // back
        [2.01, 0, 0], // right
        [-2.01, 0, 0], // left
      ].map((pos, i) => (
        <Text
          key={i}
          position={pos as [number, number, number]}
          rotation={[0, i < 2 ? 0 : Math.PI / 2, 0]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {question}
        </Text>
      ))}
      <CuboidCollider args={[2, 1, 2]} sensor />
    </RigidBody>
  );
}

function StoreBuilding({ position = [15, 0, 0] }: { position?: [number, number, number] }) {
  const [isPlayerInside, setIsPlayerInside] = useState(false);
  const score = useGameStore(state => state.score);
  const storeItems = useGameStore(state => state.storeItems);
  const inventory = useGameStore(state => state.inventory);
  const purchaseItem = useGameStore(state => state.purchaseItem);

  const handleEnterStore = () => {
    console.log('Player entered store');
    setIsPlayerInside(true);
    new Audio('/sounds/store-enter.mp3').play().catch(() => {});
  };

  const handleExitStore = () => {
    console.log('Player exited store');
    setIsPlayerInside(false);
  };

  return (
    <group position={position}>
      {/* Store Building */}
      <group>
        {/* Floor */}
        <RigidBody type="fixed" colliders="hull">
          <mesh receiveShadow position={[0, 0.1, 0]}>
            <boxGeometry args={[8, 0.2, 8]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
        </RigidBody>

        {/* Back Wall */}
        <RigidBody type="fixed" colliders="hull">
          <mesh castShadow receiveShadow position={[0, 2.5, -4]}>
            <boxGeometry args={[8, 5, 0.2]} />
            <meshStandardMaterial color="#E8D5B7" />
          </mesh>
        </RigidBody>

        {/* Left Wall */}
        <RigidBody type="fixed" colliders="hull">
          <mesh castShadow receiveShadow position={[-4, 2.5, 0]}>
            <boxGeometry args={[0.2, 5, 8]} />
            <meshStandardMaterial color="#E8D5B7" />
          </mesh>
        </RigidBody>

        {/* Right Wall */}
        <RigidBody type="fixed" colliders="hull">
          <mesh castShadow receiveShadow position={[4, 2.5, 0]}>
            <boxGeometry args={[0.2, 5, 8]} />
            <meshStandardMaterial color="#E8D5B7" />
          </mesh>
        </RigidBody>

        {/* Front Wall Left */}
        <RigidBody type="fixed" colliders="hull">
          <mesh castShadow receiveShadow position={[-2.5, 2.5, 4]}>
            <boxGeometry args={[3, 5, 0.2]} />
            <meshStandardMaterial color="#E8D5B7" />
          </mesh>
        </RigidBody>

        {/* Front Wall Right */}
        <RigidBody type="fixed" colliders="hull">
          <mesh castShadow receiveShadow position={[2.5, 2.5, 4]}>
            <boxGeometry args={[3, 5, 0.2]} />
            <meshStandardMaterial color="#E8D5B7" />
          </mesh>
        </RigidBody>

        {/* Door Frame Top */}
        <RigidBody type="fixed" colliders="hull">
          <mesh castShadow receiveShadow position={[0, 4.5, 4]}>
            <boxGeometry args={[2.2, 1, 0.2]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
        </RigidBody>

        {/* Roof */}
        <RigidBody type="fixed" colliders="hull">
          <mesh castShadow position={[0, 5.5, 0]}>
            <coneGeometry args={[6, 2, 4]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
        </RigidBody>

        {/* Store Sign */}
        <Text
          position={[0, 4.5, 4.1]}
          scale={[2, 2, 2]}
          color="#FFD700"
          fontSize={0.5}
          maxWidth={2}
          lineHeight={1}
          letterSpacing={0.1}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="#000000"
        >
          STORE
        </Text>

        {/* "ENTER" text above door */}
        <Text
          position={[0, 3.2, 4.1]}
          scale={[1, 1, 1]}
          color="#FFD700"
          fontSize={0.3}
          maxWidth={2}
          lineHeight={1}
          letterSpacing={0.1}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          ENTER
        </Text>

        {/* Available Items Display */}
        {storeItems.map((item, index) => {
          const yPos = 3 - index * 0.6;
          const canAfford = score >= item.price;
          const owned = inventory.includes(item.id);

          return (
            <group key={item.id} position={[0, yPos, -3.8]}>
              <Text
                position={[-2, 0, 0]}
                fontSize={0.3}
                color={owned ? "#4CAF50" : canAfford ? "#FFFFFF" : "#999999"}
                anchorX="left"
              >
                {`${item.icon} ${item.name}`}
              </Text>
              <Text
                position={[2, 0, 0]}
                fontSize={0.3}
                color={canAfford ? "#FFD700" : "#FF0000"}
                anchorX="right"
              >
                {`${item.price} pts`}
              </Text>
            </group>
          );
        })}
      </group>

      {/* Store entrance trigger zone */}
      <CuboidCollider
        args={[5, 2, 5]}  // Much larger trigger zone
        sensor
        position={[0, 2, 0]}  // Positioned in the center of the store
        onIntersectionEnter={handleEnterStore}
        onIntersectionExit={handleExitStore}
      />

      {/* Purchase zones */}
      {isPlayerInside && storeItems.map((item, index) => {
        // Create a grid layout: 2 items per row
        const row = Math.floor(index / 2);
        const col = index % 2;
        const xPos = -2 + col * 4; // Spread items horizontally
        const zPos = -2 + row * 4; // Spread items vertically

        return (
          <group key={item.id}>
            {/* Purchase zone collider */}
            <CuboidCollider
              args={[1.5, 1.5, 1.5]} // Larger purchase zones
              sensor
              position={[xPos, 1.5, zPos]}
              onIntersectionEnter={() => {
                if (!inventory.includes(item.id)) {
                  if (score >= item.price) {
                    purchaseItem(item.id);
                    new Audio('/sounds/purchase.mp3').play().catch(() => {});
                  } else {
                    new Audio('/sounds/error.mp3').play().catch(() => {});
                  }
                }
              }}
            />

            {/* Visual indicator for purchase zone */}
            <mesh position={[xPos, 0.1, zPos]} receiveShadow>
              <cylinderGeometry args={[1, 1, 0.1, 32]} />
              <meshStandardMaterial
                color={inventory.includes(item.id) ? "#4CAF50" : score >= item.price ? "#2196F3" : "#FF5252"}
                transparent
                opacity={0.5}
              />
            </mesh>

            {/* Item label */}
            <Text
              position={[xPos, 0.2, zPos]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.3}
              color="#FFFFFF"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.05}
              outlineColor="#000000"
            >
              {`${item.icon} ${item.name}`}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

export default function GameScene() {
  const players = useGameStore(state => state.players);

  return (
    <>
      <SkyScene />
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 20, 10]} intensity={2} castShadow />

      {/* Ground */}
      <Ground />

      {/* Player */}
      <Player />

      {/* Lava Pit */}
      <LavaPit position={[0, -2, -15]} />

      {/* Math Problems */}
      <MathProblem position={[5, 1, 5]} id="math1" question="5 + 7 = ?" />
      <MathProblem position={[-5, 1, -5]} id="math2" question="12 - 4 = ?" />
      <MathProblem position={[8, 1, -8]} id="math3" question="3 × 6 = ?" />
      <MathProblem position={[-8, 1, 8]} id="math4" question="15 ÷ 3 = ?" />
      <MathProblem position={[0, 1, 10]} id="math5" question="8 + 9 = ?" />

      {/* Store */}
      <StoreBuilding position={[15, 0, 0]} />

      {/* Fun Elements */}
      <JumpBlock position={[5, 1, 0]} />
      <FloatingPlatform position={[-5, 2, 0]} />
      <EvilGoose startPosition={[0, 1, -5]} />
      <Car position={[10, 1, 10]} />

      {/* Other Players */}
      {Array.from(players.values()).map((player) => (
        <OtherPlayer
          key={player.id}
          position={[player.position.x, player.position.y, player.position.z]}
          rotation={[player.rotation.x, player.rotation.y, player.rotation.z]}
          username={player.username}
        />
      ))}
    </>
  );
}
