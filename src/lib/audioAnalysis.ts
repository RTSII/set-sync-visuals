export interface FrequencyWaveformData {
  bass: number[];
  mids: number[];
  highs: number[];
  combined: number[];
}

export const analyzeAudioFile = async (file: File): Promise<FrequencyWaveformData> => {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Analyze frequency content
        const frequencyData = analyzeFrequencies(audioBuffer, audioContext);
        
        // Clean up
        await audioContext.close();
        
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

const analyzeFrequencies = (audioBuffer: AudioBuffer, audioContext: AudioContext): FrequencyWaveformData => {
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const sampleRate = audioBuffer.sampleRate;
  const segmentLength = Math.floor(sampleRate * 0.1); // 100ms segments
  const segments = Math.floor(channelData.length / segmentLength);
  
  const bass: number[] = [];
  const mids: number[] = [];
  const highs: number[] = [];
  const combined: number[] = [];

  for (let i = 0; i < segments; i++) {
    const start = i * segmentLength;
    const end = Math.min(start + segmentLength, channelData.length);
    const segment = channelData.slice(start, end);
    
    // Perform FFT analysis for frequency separation
    const frequencies = performFFT(segment);
    
    // Separate frequency bands
    const bassRange = frequencies.slice(0, Math.floor(frequencies.length * 0.1)); // 0-10% (bass)
    const midsRange = frequencies.slice(
      Math.floor(frequencies.length * 0.1), 
      Math.floor(frequencies.length * 0.6)
    ); // 10-60% (mids)
    const highsRange = frequencies.slice(Math.floor(frequencies.length * 0.6)); // 60-100% (highs)
    
    // Calculate RMS for each frequency band
    const bassLevel = calculateRMS(bassRange);
    const midsLevel = calculateRMS(midsRange);
    const highsLevel = calculateRMS(highsRange);
    
    // Calculate overall amplitude for this segment
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

const performFFT = (samples: Float32Array): number[] => {
  // Simple DFT implementation for frequency analysis
  const N = samples.length;
  const frequencies: number[] = [];
  
  for (let k = 0; k < N / 2; k++) {
    let real = 0;
    let imag = 0;
    
    for (let n = 0; n < N; n++) {
      const angle = -2 * Math.PI * k * n / N;
      real += samples[n] * Math.cos(angle);
      imag += samples[n] * Math.sin(angle);
    }
    
    const magnitude = Math.sqrt(real * real + imag * imag);
    frequencies.push(magnitude);
  }
  
  return frequencies;
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