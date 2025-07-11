export interface FrequencyWaveformData {
  bass: number[];
  mids: number[];
  highs: number[];
  combined: number[];
}

export const analyzeAudioFile = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<FrequencyWaveformData> => {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      try {
        onProgress?.(0.2); // File loaded
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        onProgress?.(0.4); // Starting decode
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        onProgress?.(0.6); // Decode complete, starting analysis
        const frequencyData = analyzeFrequencies(audioBuffer, onProgress);
        
        onProgress?.(0.9); // Analysis complete
        await audioContext.close();
        
        onProgress?.(1.0); // Done
        resolve(frequencyData);
      } catch (error) {
        console.error('Error analyzing audio:', error);
        reject(error);
      }
    };

    fileReader.onerror = () => reject(new Error('Failed to read audio file'));
    fileReader.readAsArrayBuffer(file);
  });
};

const analyzeFrequencies = (
  audioBuffer: AudioBuffer, 
  onProgress?: (progress: number) => void
): FrequencyWaveformData => {
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const sampleRate = audioBuffer.sampleRate;
  const segmentLength = Math.floor(sampleRate * 0.05); // 50ms segments for better performance
  const segments = Math.floor(channelData.length / segmentLength);
  
  const bass: number[] = [];
  const mids: number[] = [];
  const highs: number[] = [];
  const combined: number[] = [];

  for (let i = 0; i < segments; i++) {
    // Update progress periodically
    if (i % 100 === 0) {
      onProgress?.(0.6 + (i / segments) * 0.3);
    }

    const start = i * segmentLength;
    const end = Math.min(start + segmentLength, channelData.length);
    const segment = channelData.slice(start, end);
    
    // Use much more efficient amplitude-based frequency estimation
    const { bassLevel, midsLevel, highsLevel } = estimateFrequencyContent(segment);
    const combinedLevel = calculateRMS(segment);
    
    bass.push(bassLevel);
    mids.push(midsLevel);
    highs.push(highsLevel);
    combined.push(combinedLevel);
  }

  return {
    bass: normalizeArray(bass),
    mids: normalizeArray(mids),
    highs: normalizeArray(highs),
    combined: normalizeArray(combined)
  };
};

// Much more efficient frequency estimation based on amplitude patterns
const estimateFrequencyContent = (samples: Float32Array): {
  bassLevel: number;
  midsLevel: number;
  highsLevel: number;
} => {
  const length = samples.length;
  let bassLevel = 0;
  let midsLevel = 0;
  let highsLevel = 0;

  // Simple frequency content estimation using amplitude patterns
  // Bass: slower amplitude changes, higher RMS
  // Highs: faster amplitude changes, lower RMS but more variation
  
  let highFreqActivity = 0;
  let lowFreqActivity = 0;
  
  for (let i = 1; i < length; i++) {
    const diff = Math.abs(samples[i] - samples[i - 1]);
    const amplitude = Math.abs(samples[i]);
    
    // High frequency activity (rapid changes)
    if (i % 2 === 0) {
      highFreqActivity += diff;
    }
    
    // Low frequency activity (sustained amplitude)
    lowFreqActivity += amplitude;
  }
  
  // Normalize by length
  highFreqActivity /= length / 2;
  lowFreqActivity /= length;
  
  // Estimate frequency content
  bassLevel = lowFreqActivity * 0.8; // Bass tends to have sustained amplitude
  highsLevel = highFreqActivity * 1.2; // Highs have rapid changes
  midsLevel = (lowFreqActivity + highFreqActivity) * 0.5; // Mids are a blend
  
  return { bassLevel, midsLevel, highsLevel };
};

const calculateRMS = (samples: Float32Array | number[]): number => {
  if (samples.length === 0) return 0;
  
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  
  return Math.sqrt(sum / samples.length);
};

const normalizeArray = (array: number[]): number[] => {
  if (array.length === 0) return [];
  
  const max = Math.max(...array);
  if (max === 0) return array;
  
  return array.map(value => value / max);
};