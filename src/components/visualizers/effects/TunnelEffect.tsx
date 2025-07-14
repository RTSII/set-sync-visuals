import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AudioAnalysisData } from '@/hooks/useAudioAnalysis';
import * as THREE from 'three';

interface TunnelEffectProps {
  audioData: AudioAnalysisData | null;
}

export const TunnelEffect: React.FC<TunnelEffectProps> = ({ audioData }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Mesh[]>([]);
  
  const ringCount = 50;
  
  const rings = useMemo(() => {
    const ringArray = [];
    for (let i = 0; i < ringCount; i++) {
      const geometry = new THREE.RingGeometry(0.5, 1, 32);
      const material = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color().setHSL(i / ringCount, 1, 0.5),
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      
      ringArray.push({
        geometry,
        material,
        position: [0, 0, -i * 2]
      });
    }
    return ringArray;
  }, []);

  useFrame((state) => {
    if (!audioData || !groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    // Use sub-bass for kick drum detection and bass for bass synths
    const subBassIntensity = audioData.subBass;
    const bassIntensity = audioData.bass;
    const energy = audioData.energy;
    
    ringsRef.current.forEach((ring, index) => {
      if (ring) {
        // Move rings towards camera with kick drum acceleration
        ring.position.z += 0.2 + subBassIntensity * 0.8 + bassIntensity * 0.3;
        
        // Reset ring position when it passes camera
        if (ring.position.z > 5) {
          ring.position.z = -ringCount * 2;
        }
        
        // Audio-reactive scaling - stronger reaction to kick drums
        const scale = 1 + Math.sin(time * 2 + index * 0.2) * 0.2 + subBassIntensity * 0.8 + bassIntensity * 0.3;
        ring.scale.setScalar(scale);
        
        // Rotating color effect
        const hue = (time * 0.5 + index * 0.02) % 1;
        const saturation = 0.8 + energy * 0.2;
        const lightness = 0.4 + audioData.treble * 0.4;
        
        (ring.material as THREE.MeshBasicMaterial).color.setHSL(hue, saturation, lightness);
        
        // Beat-reactive rotation
        ring.rotation.z += 0.01 + (audioData.beatDetected ? 0.1 : 0);
      }
    });
    
    // Camera movement effect
    if (groupRef.current) {
      groupRef.current.rotation.z += energy * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {rings.map((ring, index) => (
        <mesh
          key={index}
          ref={(el) => {
            if (el) ringsRef.current[index] = el;
          }}
          geometry={ring.geometry}
          material={ring.material}
          position={ring.position}
        />
      ))}
    </group>
  );
};