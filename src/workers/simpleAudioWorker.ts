// Simple audio processing worker without FFmpeg dependency
self.onmessage = async (e: MessageEvent) => {
  const { chunks, fileType } = e.data;

  try {
    console.log('🔊 SIMPLE-WORKER: Processing audio chunks');
    
    // Combine chunks into single Uint8Array
    let totalLength = 0;
    for (const chunk of chunks) {
      totalLength += chunk.length;
    }
    
    const fullData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      fullData.set(chunk, offset);
      offset += chunk.length;
    }
    
    console.log('🔊 SIMPLE-WORKER: Combined chunks, total size:', fullData.length);
    
    // Create blob and decode using Web Audio API
    const audioBlob = new Blob([fullData], { type: fileType });
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    console.log('🔊 SIMPLE-WORKER: Created array buffer, decoding...');
    
    // Use Web Audio API to decode
    const audioContext = new (self.AudioContext || (self as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    console.log('🔊 SIMPLE-WORKER: Audio decoded successfully, duration:', audioBuffer.duration);
    
    // Apply simple normalization
    const channelData = audioBuffer.getChannelData(0);
    let maxAmplitude = 0;
    
    // Find peak amplitude
    for (let i = 0; i < channelData.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(channelData[i]));
    }
    
    // Normalize if needed (gentle normalization to 0.8 to avoid clipping)
    if (maxAmplitude > 0.1) {
      const normalizationFactor = 0.8 / maxAmplitude;
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] *= normalizationFactor;
      }
      console.log('🔊 SIMPLE-WORKER: Applied normalization, factor:', normalizationFactor);
    }
    
    self.postMessage({ audioBuffer });
  } catch (err) {
    console.error('🔊 SIMPLE-WORKER: Error:', err);
    self.postMessage({ error: err instanceof Error ? err.message : 'Audio processing failed' });
  }
};