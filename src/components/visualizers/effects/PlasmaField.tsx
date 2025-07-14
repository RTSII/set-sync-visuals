import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AudioAnalysisData } from '@/hooks/useAudioAnalysis';
import * as THREE from 'three';

interface PlasmaFieldProps {
  audioData: AudioAnalysisData | null;
}

export const PlasmaField: React.FC<PlasmaFieldProps> = ({ audioData }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(20, 20, 128, 128);
    
    // Plasma burst shader material with black background
    const material = new THREE.ShaderMaterial({
        uniforms: {
        time: { value: 0 },
        subBass: { value: 0 },
        bass: { value: 0 },
        mid: { value: 0 },
        treble: { value: 0 },
        energy: { value: 0 },
        beat: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float time;
        uniform float subBass;
        uniform float bass;
        uniform float energy;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Audio-reactive vertex displacement for plasma bursts
          float burst = subBass * 3.0 + bass * 1.5;
          float wave = sin(pos.x * 2.0 + time * 3.0) * cos(pos.y * 2.0 + time * 2.0);
          pos.z += wave * burst * 0.8;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float time;
        uniform float subBass;
        uniform float bass;
        uniform float mid;
        uniform float treble;
        uniform float energy;
        uniform float beat;
        
        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        
        void main() {
          vec2 uv = vUv - 0.5; // Center UV coordinates
          float t = time * 0.8;
          
          // Create multiple plasma burst centers
          vec2 center1 = vec2(sin(t * 0.7) * 0.3, cos(t * 0.5) * 0.4);
          vec2 center2 = vec2(cos(t * 1.1) * 0.4, sin(t * 0.9) * 0.3);
          vec2 center3 = vec2(sin(t * 1.3) * 0.2, cos(t * 1.7) * 0.5);
          
          // Distance-based plasma bursts
          float dist1 = length(uv - center1);
          float dist2 = length(uv - center2);
          float dist3 = length(uv - center3);
          
          // Audio-reactive plasma intensity
          float kickBurst = subBass * 8.0 + beat * 4.0;
          float bassBurst = bass * 5.0;
          float midBurst = mid * 3.0;
          
          // Create plasma bursts with audio reactivity
          float plasma1 = sin(dist1 * 15.0 - t * 4.0 + kickBurst) * exp(-dist1 * 2.0);
          float plasma2 = sin(dist2 * 12.0 - t * 3.0 + bassBurst) * exp(-dist2 * 3.0);
          float plasma3 = sin(dist3 * 18.0 - t * 5.0 + midBurst) * exp(-dist3 * 2.5);
          
          // Combine plasma bursts
          float totalPlasma = plasma1 + plasma2 + plasma3;
          
          // Add treble-reactive sparkles
          float sparkle = treble * 2.0 * sin(uv.x * 50.0 + t * 6.0) * sin(uv.y * 50.0 + t * 4.0);
          totalPlasma += sparkle * 0.3;
          
          // Color mapping for bursts
          float hue = totalPlasma * 0.2 + t * 0.3 + energy * 0.4;
          float saturation = 0.9;
          float brightness = max(0.0, totalPlasma) * (0.8 + energy * 0.2);
          
          // Black background - only show bright plasma areas
          brightness = smoothstep(0.1, 0.8, brightness);
          
          vec3 color = hsv2rgb(vec3(hue, saturation, brightness));
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: true
    });
    
    return { geometry, material };
  }, []);

  useFrame((state) => {
    if (!audioData || !meshRef.current) return;
    
    const material = meshRef.current.material as THREE.ShaderMaterial;
    const time = state.clock.elapsedTime;
    
    // Update shader uniforms with audio data
    material.uniforms.time.value = time;
    material.uniforms.subBass.value = audioData.subBass;
    material.uniforms.bass.value = audioData.bass;
    material.uniforms.mid.value = audioData.mid;
    material.uniforms.treble.value = audioData.treble;
    material.uniforms.energy.value = audioData.energy;
    material.uniforms.beat.value = audioData.beatDetected ? 1.0 : 0.0;
    
    // Rotate the plasma field
    meshRef.current.rotation.z = time * 0.1 + audioData.energy * 0.5;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
};