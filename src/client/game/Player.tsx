import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Vector3, Quaternion, Euler } from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { useGameStore } from '../store/gameStore';

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
  const appearance = useGameStore(state => state.appearance);

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

  const updatePlayerPosition = useGameStore(state => state.updatePlayerPosition);

  useFrame((state, delta) => {
    if (!playerRef.current) return;

    const keyboardControls = getKeys();
    const touchControls = useGameStore.getState().touchControls;

    // Combine keyboard and touch controls
    const controls = {
      forward: keyboardControls.forward || touchControls.forward || false,
      backward: keyboardControls.backward || touchControls.backward || false,
      left: keyboardControls.left || touchControls.left || false,
      right: keyboardControls.right || touchControls.right || false,
      jump: keyboardControls.jump || touchControls.jump || false
    };

    const position = playerRef.current.translation();
    const velocity = playerRef.current.linvel();
    const rotation = playerRef.current.rotation();

    // Send position update to server every frame
    updatePlayerPosition(
      { x: position.x, y: position.y, z: position.z },
      { x: rotation.x, y: rotation.y, z: rotation.z }
    );

    // Apply extra gravity when falling
    if (velocity.y < 0) {
      playerRef.current.applyImpulse({ x: 0, y: -9.81 * GRAVITY_MULTIPLIER * delta, z: 0 });
    } else if (velocity.y > 0) {
      playerRef.current.applyImpulse({ x: 0, y: -9.81 * (GRAVITY_MULTIPLIER * 0.02) * delta, z: 0 });
    }

    // Check if player is grounded
    const isNowGrounded = Math.abs(velocity.y) < 0.01;
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
    if (controls.forward) moveDirection.add(cameraDirection);
    if (controls.backward) moveDirection.sub(cameraDirection);
    if (controls.left) moveDirection.sub(sideDirection);
    if (controls.right) moveDirection.add(sideDirection);
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
    if (controls.jump) {
      if (isGrounded) {
        playerRef.current.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 });
        setIsGrounded(false);
        new Audio('/sounds/jump.mp3').play().catch(() => {});
      } else if (canDoubleJump) {
        playerRef.current.setLinvel({ x: moveVelocity.x, y: 0, z: moveVelocity.z });
        playerRef.current.applyImpulse({ x: 0, y: DOUBLE_JUMP_FORCE, z: 0 });
        setCanDoubleJump(false);
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
          <meshStandardMaterial color={appearance.shirtColor} metalness={0.1} roughness={0.8} />
        </mesh>

        {/* Head */}
        <mesh castShadow position={[0, 1.6, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color={appearance.skinColor} metalness={0.1} roughness={0.8} />
        </mesh>

        {/* Hair */}
        {appearance.hairStyle !== 'bald' && (
          <group position={[0, 2, 0]}>
            {/* Base hair */}
            <mesh castShadow position={[0, -0.2, 0]}>
              <boxGeometry args={[0.85, 0.2, 0.85]} />
              <meshStandardMaterial color={appearance.hairColor} metalness={0.1} roughness={0.8} />
            </mesh>

            {/* Hair style specific geometry */}
            {appearance.hairStyle === 'short' && (
              <mesh castShadow position={[0, -0.1, 0]}>
                <boxGeometry args={[0.82, 0.1, 0.82]} />
                <meshStandardMaterial color={appearance.hairColor} metalness={0.1} roughness={0.8} />
              </mesh>
            )}

            {appearance.hairStyle === 'medium' && (
              <mesh castShadow position={[0, -0.3, 0.2]}>
                <boxGeometry args={[0.8, 0.4, 0.4]} />
                <meshStandardMaterial color={appearance.hairColor} metalness={0.1} roughness={0.8} />
              </mesh>
            )}

            {appearance.hairStyle === 'long' && (
              <mesh castShadow position={[0, -0.6, 0.2]}>
                <boxGeometry args={[0.7, 0.8, 0.3]} />
                <meshStandardMaterial color={appearance.hairColor} metalness={0.1} roughness={0.8} />
              </mesh>
            )}

            {appearance.hairStyle === 'curly' && (
              <>
                {[[-0.3, 0.1, -0.3], [0.3, 0.1, -0.3], [-0.3, 0.1, 0.3], [0.3, 0.1, 0.3]].map((pos, i) => (
                  <mesh key={i} castShadow position={pos}>
                    <sphereGeometry args={[0.2]} />
                    <meshStandardMaterial color={appearance.hairColor} metalness={0.1} roughness={0.8} />
                  </mesh>
                ))}
              </>
            )}

            {appearance.hairStyle === 'spiky' && (
              <>
                {[[-0.2, 0.2, -0.2], [0.2, 0.2, -0.2], [0, 0.2, 0], [-0.2, 0.2, 0.2], [0.2, 0.2, 0.2]].map((pos, i) => (
                  <mesh key={i} castShadow position={pos}>
                    <coneGeometry args={[0.1, 0.3, 4]} />
                    <meshStandardMaterial color={appearance.hairColor} metalness={0.1} roughness={0.8} />
                  </mesh>
                ))}
              </>
            )}
          </group>
        )}

        {/* Eyes */}
        <group position={[0, 1.6, 0.4]}>
          <mesh castShadow position={[-0.2, 0, 0]}>
            <sphereGeometry args={[0.1]} />
            <meshStandardMaterial color={appearance.eyeColor} metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh castShadow position={[0.2, 0, 0]}>
            <sphereGeometry args={[0.1]} />
            <meshStandardMaterial color={appearance.eyeColor} metalness={0.5} roughness={0.5} />
          </mesh>
        </group>

        {/* Lips */}
        <mesh castShadow position={[0, 1.45, 0.4]}>
          <boxGeometry args={[0.3, 0.1, 0.1]} />
          <meshStandardMaterial color={appearance.lipColor} metalness={0.2} roughness={0.8} />
        </mesh>

        {/* Arms */}
        <group ref={leftArmRef} position={[0.6, 1.2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 1.2, 0.4]} />
            <meshStandardMaterial color={appearance.shirtColor} metalness={0.1} roughness={0.8} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[-0.6, 1.2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 1.2, 0.4]} />
            <meshStandardMaterial color={appearance.shirtColor} metalness={0.1} roughness={0.8} />
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
