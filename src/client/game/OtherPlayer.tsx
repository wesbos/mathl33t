import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface OtherPlayerProps {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  username: string;
}

export default function OtherPlayer({ position, rotation, username }: OtherPlayerProps) {
  const leftLegRef = useRef<THREE.Mesh>();
  const rightLegRef = useRef<THREE.Mesh>();
  const leftArmRef = useRef<THREE.Mesh>();
  const rightArmRef = useRef<THREE.Mesh>();

  useFrame((state) => {
    // Animate limbs while moving
    const animSpeed = 10;
    const legSwing = Math.sin(state.clock.elapsedTime * animSpeed) * 0.5;
    const armSwing = Math.sin(state.clock.elapsedTime * animSpeed) * 0.4;

    if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -armSwing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = armSwing;
  });

  return (
    <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Username */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.5}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {username}
      </Text>

      {/* Body */}
      <mesh castShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[0.8, 1.2, 0.4]} />
        <meshStandardMaterial color="#FF6B6B" metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Head */}
      <mesh castShadow position={[0, 1.6, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#4ECDC4" metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Arms */}
      <group ref={leftArmRef} position={[0.6, 1.2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshStandardMaterial color="#FF6B6B" metalness={0.1} roughness={0.8} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[-0.6, 1.2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshStandardMaterial color="#FF6B6B" metalness={0.1} roughness={0.8} />
        </mesh>
      </group>

      {/* Legs */}
      <group ref={leftLegRef} position={[0.2, 0.6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshStandardMaterial color="#45B7D1" metalness={0.1} roughness={0.8} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[-0.2, 0.6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshStandardMaterial color="#45B7D1" metalness={0.1} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
