import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AudioAnalysisData } from '@/hooks/useAudioAnalysis';
import * as THREE from 'three';

interface ParticleSystemProps {
  audioData: AudioAnalysisData | null;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ audioData }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 5000;
  
  const { positions, colors, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random positions in sphere
      const radius = Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Random velocities
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
      
      // Random colors
      const hue = Math.random();
      const color = new THREE.Color().setHSL(hue, 1, 0.5);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    return { positions, colors, velocities };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
  }, []);

  useFrame(() => {
    if (!audioData || !pointsRef.current) return;
    
    const positionAttribute = pointsRef.current.geometry.getAttribute('position');
    const colorAttribute = pointsRef.current.geometry.getAttribute('color');
    const positions = positionAttribute.array as Float32Array;
    const colors = colorAttribute.array as Float32Array;
    
    const bassIntensity = audioData.bass * 5;
    const energy = audioData.energy;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Update positions with audio-reactive movement
      positions[i3] += velocities[i3] * (1 + bassIntensity);
      positions[i3 + 1] += velocities[i3 + 1] * (1 + bassIntensity);
      positions[i3 + 2] += velocities[i3 + 2] * (1 + bassIntensity);
      
      // Boundary wrapping
      if (Math.abs(positions[i3]) > 15) velocities[i3] *= -1;
      if (Math.abs(positions[i3 + 1]) > 15) velocities[i3 + 1] *= -1;
      if (Math.abs(positions[i3 + 2]) > 15) velocities[i3 + 2] *= -1;
      
      // Audio-reactive colors
      const hue = (Date.now() * 0.001 + i * 0.01) % 1;
      const saturation = 0.8 + energy * 0.2;
      const lightness = 0.3 + audioData.treble * 0.5;
      
      const color = new THREE.Color().setHSL(hue, saturation, lightness);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    
    // Beat-reactive scale
    if (audioData.beatDetected) {
      pointsRef.current.scale.setScalar(1.2);
    } else {
      pointsRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  );
};