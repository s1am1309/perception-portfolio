"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export default function Star() {
  const points = useRef<THREE.Points>(null);
  const { camera } = useThree();

  const count = 1800;

  const positions = useMemo(() => {
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius =
        Math.pow(Math.random(), 0.65) * 28;

      array[i * 3] =
        Math.cos(angle) * radius;

      array[i * 3 + 1] =
        Math.sin(angle) * radius;

      array[i * 3 + 2] =
        -Math.random() * 140;
    }

    return array;
  }, []);

  useFrame(() => {
    if (!points.current) return;

    const progress =
      THREE.MathUtils.clamp(
        (5 - camera.position.z) / 126,
        0,
        1
      );

    const speed =
      0.015 + progress * 0.12;

    points.current.position.z += speed;

    if (points.current.position.z > 20) {
      points.current.position.z = 0;
    }

    /*
      Subtle wormhole rotation.
      Kept slow so it doesn't interfere
      with the existing portfolio movement.
    */
    points.current.rotation.z +=
      0.0002 + progress * 0.0008;
  });

  return (
    <points
      ref={points}
      position={[0, 0, 0]}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>

      <pointsMaterial
        color="#ffffff"
        size={0.025}
        sizeAttenuation
        transparent
        opacity={0.65}
        depthWrite={false}
      />
    </points>
  );
}