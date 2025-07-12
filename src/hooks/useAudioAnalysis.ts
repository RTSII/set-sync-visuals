import { useEffect, useRef, useState } from 'react';

export interface AudioAnalysisData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  bass: number;
  mid: number;
  treble: number;
  energy: number;
  beatDetected: boolean;
}

export const useAudioAnalysis = (audioElement: HTMLAudioElement | null) => {
  const [analysisData, setAnalysisData] = useState<AudioAnalysisData | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Beat detection variables
  const bassHistoryRef = useRef<number[]>([]);
  const lastBeatTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!audioElement) return;

    const initAudioContext = async () => {
      try {
        // Create audio context
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create analyser
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0.8;
        
        // Create source from audio element
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
        
        // Connect: source -> analyser -> destination
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        
        // Start analysis loop
        startAnalysis();
        
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };

    const startAnalysis = () => {
      if (!analyserRef.current) return;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const frequencyData = new Uint8Array(bufferLength);
      const timeData = new Uint8Array(bufferLength);
      
      const analyze = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(frequencyData);
        analyserRef.current.getByteTimeDomainData(timeData);
        
        // Calculate frequency ranges
        const bass = getFrequencyRange(frequencyData, 0, 60);
        const mid = getFrequencyRange(frequencyData, 60, 180);
        const treble = getFrequencyRange(frequencyData, 180, bufferLength);
        
        // Calculate overall energy
        const energy = frequencyData.reduce((sum, value) => sum + value, 0) / bufferLength / 255;
        
        // Beat detection
        const beatDetected = detectBeat(bass);
        
        setAnalysisData({
          frequencyData: new Uint8Array(frequencyData),
          timeData: new Uint8Array(timeData),
          bass,
          mid,
          treble,
          energy,
          beatDetected
        });
        
        animationRef.current = requestAnimationFrame(analyze);
      };
      
      analyze();
    };

    const getFrequencyRange = (data: Uint8Array, start: number, end: number): number => {
      const slice = data.slice(start, end);
      return slice.reduce((sum, value) => sum + value, 0) / slice.length / 255;
    };

    const detectBeat = (bassLevel: number): boolean => {
      const now = Date.now();
      const history = bassHistoryRef.current;
      
      // Add current bass level to history
      history.push(bassLevel);
      if (history.length > 20) history.shift();
      
      // Calculate average
      const average = history.reduce((sum, val) => sum + val, 0) / history.length;
      
      // Beat detected if current bass is significantly higher than average
      // and enough time has passed since last beat
      const threshold = average * 1.3;
      const timeSinceLastBeat = now - lastBeatTimeRef.current;
      
      if (bassLevel > threshold && timeSinceLastBeat > 200) {
        lastBeatTimeRef.current = now;
        return true;
      }
      
      return false;
    };

    // Initialize when audio starts playing
    const handlePlay = () => {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      if (!analyserRef.current) {
        initAudioContext();
      }
    };

    audioElement.addEventListener('play', handlePlay);
    
    // Cleanup
    return () => {
      audioElement.removeEventListener('play', handlePlay);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioElement]);

  return analysisData;
};