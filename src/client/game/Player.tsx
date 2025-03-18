import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Vector3, Quaternion, Euler } from 'three';
import { useKeyboardControls, OrbitControls } from '@react-three/drei';

type Controls = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
};

export default function Player() {
  const playerRef = useRef<any>();
  const { camera } = useThree();
  const [, getKeys] = useKeyboardControls<Controls>();

  const MOVE_SPEED = 15;
  const JUMP_FORCE = 5;
  const cameraOffset = new Vector3(0, 3, 8);
  const cameraTarget = new Vector3();
  const playerRotation = new Quaternion();
  const targetRotation = new Quaternion();

  useFrame(() => {
    if (!playerRef.current) return;

    const { forward, backward, left, right, jump } = getKeys();
    const position = playerRef.current.translation();

    // Simple directional movement
    const velocity = {
      x: 0,
      y: playerRef.current.linvel().y,
      z: 0
    };

    if (forward) velocity.z = -MOVE_SPEED;
    if (backward) velocity.z = MOVE_SPEED;
    if (left) velocity.x = -MOVE_SPEED;
    if (right) velocity.x = MOVE_SPEED;

    // Apply velocity
    playerRef.current.setLinvel(velocity);

    // Rotate player to face movement direction if moving
    if (velocity.x !== 0 || velocity.z !== 0) {
      const angle = Math.atan2(velocity.x, velocity.z);
      targetRotation.setFromEuler(new Euler(0, angle, 0));
      playerRotation.slerp(targetRotation, 0.2);
      playerRef.current.setRotation(playerRotation);
    }

    // Handle jumping
    if (jump && Math.abs(velocity.y) < 0.1) {
      playerRef.current.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 });
    }

    // Reset position if player falls off the world
    if (position.y < -10) {
      playerRef.current.setTranslation({ x: 0, y: 3, z: 0 });
      playerRef.current.setLinvel({ x: 0, y: 0, z: 0 });
    }

    // Update camera position and target
    cameraTarget.set(position.x, position.y + 1.5, position.z);
    camera.position.copy(cameraTarget).add(cameraOffset);
    camera.lookAt(cameraTarget);
  });

  return (
    <>
      <OrbitControls
        target={cameraTarget}
        enablePan={false}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minDistance={4}
        maxDistance={10}
      />
      <RigidBody
        ref={playerRef}
        colliders={false}
        mass={1}
        type="dynamic"
        position={[0, 3, 0]}
        enabledRotations={[false, true, false]}
        lockRotations={true}
        friction={0.7}
        restitution={0}
        linearDamping={0.95}
      >
        <CuboidCollider args={[0.5, 1, 0.5]} />
        <group>
          <mesh castShadow position={[0, 1, 0]}>
            <capsuleGeometry args={[0.5, 1, 8]} />
            <meshStandardMaterial color="#1E88E5" />
          </mesh>
          {/* Head */}
          <mesh castShadow position={[0, 2, 0]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color="#1E88E5" />
          </mesh>
          {/* Eyes */}
          <mesh position={[0.2, 2.1, 0.3]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[-0.2, 2.1, 0.3]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>
      </RigidBody>
    </>
  );
}
