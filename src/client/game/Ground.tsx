import React, { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

export default function Ground() {
  // Create a checkerboard texture for the ground
  const groundTexture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d')!;

    // Draw grass pattern
    context.fillStyle = '#7CB342'; // Base grass color
    context.fillRect(0, 0, size, size);

    // Add darker patches
    context.fillStyle = '#558B2F';
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const s = Math.random() * 20 + 5;
      context.fillRect(x, y, s, s);
    }

    // Add noise pattern
    for (let i = 0; i < size; i += 4) {
      for (let j = 0; j < size; j += 4) {
        if (Math.random() < 0.1) {
          context.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
          context.fillRect(i, j, 4, 4);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    return texture;
  }, []);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          map={groundTexture}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </RigidBody>
  );
}
