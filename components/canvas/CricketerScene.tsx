"use client";

import { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Stars, Float, useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';

// Fallback component if video is missing
function AvatarPlaceholder({ emotion, getAudioLevel }: { emotion: string, getAudioLevel: () => number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Subtle pulsing/floating based on emotion and Audio Sync
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Base float
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;

      // Audio reactive jitter/scale (Lip-sync anti-gravity effect)
      const volume = getAudioLevel(); // 0 to 255
      const targetScale = 1 + (volume / 255) * 0.2; // Scale up to 1.2x based on volume
      
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 15);
    }
  });

  // Determine a color based on the emotion
  const color = 
    emotion === 'happy' ? '#00ffcc' : 
    emotion === 'serious' ? '#ff3366' : 
    emotion === 'laughing' ? '#ffcc00' : 
    '#3366ff'; // idle

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <planeGeometry args={[3, 4]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.5} 
          wireframe={true} 
          transparent 
          opacity={0.8}
        />
      </mesh>
    </Float>
  );
}

function VideoAvatar({ emotion, getAudioLevel }: { emotion: string, getAudioLevel: () => number }) {
  const texture = useVideoTexture(`/videos/${emotion}.mp4`);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const volume = getAudioLevel();
      const targetScale = 1 + (volume / 255) * 0.1; // More subtle scale for the video
      
      // Preserve aspect ratio 16:9 while scaling
      meshRef.current.scale.lerp(new THREE.Vector3(1.6 * targetScale, 1 * targetScale, 1), delta * 15);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
      <mesh ref={meshRef} scale={[1.6, 1, 1]}>
        <planeGeometry args={[16, 9]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </Float>
  );
}

export function CricketerScene({ emotion, getAudioLevel }: { emotion: string, getAudioLevel: () => number }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Deep space environment */}
      <Environment preset="night" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* For now, we render the placeholder. */}
      <AvatarPlaceholder emotion={emotion} getAudioLevel={getAudioLevel} />
      
      {/* 
        <Suspense fallback={<AvatarPlaceholder emotion={emotion} getAudioLevel={getAudioLevel} />}>
          <VideoAvatar emotion={emotion} getAudioLevel={getAudioLevel} />
        </Suspense>
      */}
    </>
  );
}
