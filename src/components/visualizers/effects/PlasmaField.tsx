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
    
    // Plasma shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        bass: { value: 0 },
        mid: { value: 0 },
        treble: { value: 0 },
        energy: { value: 0 },
        beat: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float time;
        uniform float bass;
        uniform float energy;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Audio-reactive vertex displacement
          float wave = sin(pos.x * 0.5 + time * 2.0) * sin(pos.y * 0.5 + time * 1.5);
          pos.z += wave * (0.5 + bass * 2.0);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float time;
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
          vec2 uv = vUv;
          float t = time * 0.5;
          
          // Create plasma pattern
          float plasma = sin(uv.x * 10.0 + t) + 
                        sin(uv.y * 12.0 + t * 1.2) + 
                        sin((uv.x + uv.y) * 8.0 + t * 0.8) +
                        sin(sqrt(uv.x * uv.x + uv.y * uv.y) * 15.0 + t * 2.0);
          
          // Audio reactivity
          plasma += bass * 3.0 * sin(uv.x * 20.0 + t * 3.0);
          plasma += mid * 2.0 * sin(uv.y * 15.0 + t * 2.0);
          plasma += treble * 1.5 * sin((uv.x + uv.y) * 25.0 + t * 4.0);
          
          // Beat pulse
          plasma += beat * 2.0;
          
          // Convert to color
          float hue = plasma * 0.1 + time * 0.2 + energy * 0.5;
          float saturation = 0.8 + energy * 0.2;
          float brightness = 0.5 + energy * 0.3 + abs(sin(plasma * 0.5)) * 0.3;
          
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