import React from 'react';
import { RigidBody } from '@react-three/rapier';

export default function Ground() {
  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          color="#458745"
          metalness={0}
          roughness={0.8}
        />
      </mesh>
    </RigidBody>
  );
}
