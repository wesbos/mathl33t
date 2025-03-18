import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Vector3, Quaternion, Euler } from 'three';
import { useKeyboardControls } from '@react-three/drei';

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
  const [canDoubleJump, setCanDoubleJump] = useState(true);
  const [isGrounded, setIsGrounded] = useState(false);

  // Animation refs
  const leftLegRef = useRef<any>();
  const rightLegRef = useRef<any>();
  const leftArmRef = useRef<any>();
  const rightArmRef = useRef<any>();

  const MOVE_SPEED = 15;
  const JUMP_FORCE = 12;
  const DOUBLE_JUMP_FORCE = 10;
  const CAMERA_HEIGHT = 3;
  const CAMERA_DISTANCE = 8;
  const CAMERA_LAG = 0.1;
  const GRAVITY_MULTIPLIER = 2000;

  // Persistent vectors to avoid creating new ones every frame
  const moveDirection = new Vector3();
  const cameraDirection = new Vector3();
  const sideDirection = new Vector3();
  const targetPosition = new Vector3();
  const cameraPosition = new Vector3();
  const cameraOffset = new Vector3();
  const playerRotation = new Quaternion();
  const targetRotation = new Quaternion();

  useFrame((state, delta) => {
    if (!playerRef.current) return;

    const { forward, backward, left, right, jump } = getKeys();
    const position = playerRef.current.translation();
    const velocity = playerRef.current.linvel();

    // Apply extra gravity when falling
    if (velocity.y < 0) {
      playerRef.current.applyImpulse({ x: 0, y: -9.81 * GRAVITY_MULTIPLIER * delta, z: 0 });
    } else if (velocity.y > 0) {
      // Almost no gravity while going up for a quick burst
      playerRef.current.applyImpulse({ x: 0, y: -9.81 * (GRAVITY_MULTIPLIER * 0.02) * delta, z: 0 }); // Even less upward gravity
    }

    // Check if player is grounded (adjusted threshold for snappier response)
    const isNowGrounded = Math.abs(velocity.y) < 0.01; // Even lower threshold for more responsive jumping
    if (isNowGrounded && !isGrounded) {
      setIsGrounded(true);
      setCanDoubleJump(true);
    } else if (!isNowGrounded && isGrounded) {
      setIsGrounded(false);
    }

    // Get camera direction (ignoring y component)
    cameraDirection.set(0, 0, -1).applyQuaternion(camera.quaternion);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    // Get side direction
    sideDirection.copy(cameraDirection).cross(new Vector3(0, 1, 0));

    // Calculate movement direction
    moveDirection.set(0, 0, 0);
    if (forward) moveDirection.add(cameraDirection);
    if (backward) moveDirection.sub(cameraDirection);
    if (left) moveDirection.sub(sideDirection);
    if (right) moveDirection.add(sideDirection);
    moveDirection.normalize().multiplyScalar(MOVE_SPEED);

    // Apply movement
    const moveVelocity = {
      x: moveDirection.x,
      y: velocity.y,
      z: moveDirection.z
    };

    // Apply velocity
    playerRef.current.setLinvel(moveVelocity);

    // Handle jumping
    if (jump) {
      if (isGrounded) {
        // First jump
        playerRef.current.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 });
        setIsGrounded(false);
        // Play jump sound
        new Audio('/sounds/jump.mp3').play().catch(() => {});
      } else if (canDoubleJump) {
        // Double jump
        playerRef.current.setLinvel({ x: moveVelocity.x, y: 0, z: moveVelocity.z }); // Reset vertical velocity
        playerRef.current.applyImpulse({ x: 0, y: DOUBLE_JUMP_FORCE, z: 0 });
        setCanDoubleJump(false);
        // Play double jump sound
        new Audio('/sounds/doublejump.mp3').play().catch(() => {});
      }
    }

    // Rotate player to face movement direction if moving
    if (moveVelocity.x !== 0 || moveVelocity.z !== 0) {
      const angle = Math.atan2(moveVelocity.x, moveVelocity.z);
      targetRotation.setFromEuler(new Euler(0, angle, 0));
      playerRotation.slerp(targetRotation, 0.2);
      playerRef.current.setRotation(playerRotation);

      // Animate limbs while moving
      const animSpeed = 10;
      const legSwing = Math.sin(state.clock.elapsedTime * animSpeed) * 0.5;
      const armSwing = Math.sin(state.clock.elapsedTime * animSpeed) * 0.4;

      if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -armSwing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = armSwing;
    } else {
      // Reset limbs to default position when not moving
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
    }

    // Reset position if player falls off the world
    if (position.y < -10) {
      playerRef.current.setTranslation({ x: 0, y: 3, z: 0 });
      playerRef.current.setLinvel({ x: 0, y: 0, z: 0 });
    }

    // Update camera position
    targetPosition.set(position.x, position.y + 1.5, position.z);

    // Calculate camera offset while preserving cameraDirection
    cameraOffset.copy(cameraDirection).multiplyScalar(-CAMERA_DISTANCE);
    cameraPosition.copy(targetPosition).add(cameraOffset);
    cameraPosition.y = position.y + CAMERA_HEIGHT;

    // Smoothly interpolate camera position
    camera.position.lerp(cameraPosition, 1 - Math.pow(CAMERA_LAG, delta * 60));
    camera.lookAt(targetPosition);
  });

  return (
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
      <CuboidCollider args={[0.4, 0.8, 0.4]} />
      <group>
        {/* Body */}
        <mesh castShadow position={[0, 0.8, 0]}>
          <boxGeometry args={[0.8, 1.2, 0.4]} />
          <meshStandardMaterial color="#5B84B1" metalness={0.1} roughness={0.8} />
        </mesh>

        {/* Head */}
        <mesh castShadow position={[0, 1.6, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#FC766A" metalness={0.1} roughness={0.8} />
        </mesh>

        {/* Arms */}
        <group ref={leftArmRef} position={[0.6, 1.2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 1.2, 0.4]} />
            <meshStandardMaterial color="#5B84B1" metalness={0.1} roughness={0.8} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[-0.6, 1.2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 1.2, 0.4]} />
            <meshStandardMaterial color="#5B84B1" metalness={0.1} roughness={0.8} />
          </mesh>
        </group>

        {/* Legs */}
        <group ref={leftLegRef} position={[0.2, 0.6, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 1.2, 0.4]} />
            <meshStandardMaterial color="#355C7D" metalness={0.1} roughness={0.8} />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[-0.2, 0.6, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 1.2, 0.4]} />
            <meshStandardMaterial color="#355C7D" metalness={0.1} roughness={0.8} />
          </mesh>
        </group>
      </group>
    </RigidBody>
  );
}
