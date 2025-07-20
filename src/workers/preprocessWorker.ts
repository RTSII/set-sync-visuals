// Use dynamic imports for web worker compatibility
let FFmpeg: any;
let fetchFile: any;

// Initialize FFmpeg dynamically
const initFFmpeg = async () => {
  if (!FFmpeg) {
    const ffmpegModule = await import('@ffmpeg/ffmpeg');
    const utilModule = await import('@ffmpeg/util');
    FFmpeg = ffmpegModule.FFmpeg;
    fetchFile = utilModule.fetchFile;
  }
};

let ffmpeg: any;



self.onmessage = async (e: MessageEvent) => {
  const { chunks, fileType } = e.data;

  try {
    // Initialize FFmpeg if not already done
    await initFFmpeg();
    
    if (!ffmpeg) {
      ffmpeg = new FFmpeg();
    }

    if (!ffmpeg.loaded) {
      self.postMessage({ error: 'FFmpeg loading failed. This feature requires FFmpeg which may not be available in this environment.' });
      return;
    }
    if (!ffmpeg.loaded) {
      await ffmpeg.load();
    }

    // Write chunks to FFmpeg filesystem
    const inputFile = 'input.' + (fileType === 'audio/mpeg' ? 'mp3' : 'wav');
    let fullData = new Uint8Array(0);
    for (const chunk of chunks) {
      const newData = new Uint8Array(fullData.length + chunk.length);
      newData.set(fullData);
      newData.set(chunk, fullData.length);
      fullData = newData;
    }
    
    // Write file using modern FFmpeg API
    await ffmpeg.writeFile(inputFile, fullData);

    // Preprocess: Decode to PCM, resample to 44.1kHz, normalize with loudnorm, preserve lows
    await ffmpeg.exec([
      '-i', inputFile,
      '-af', 'ashelf=type=lowshelf:frequency=100:gain=3:width_type=h:width=200, loudnorm=I=-16:TP=-1:LRA=11',
      '-ar', '44100',
      '-f', 's16le',
      'output.pcm'
    ]);

    const outputData = await ffmpeg.readFile('output.pcm');
    
    // Convert to AudioBuffer
    const arrayBuffer = (outputData as Uint8Array).buffer;
    const audioContext = new (self.AudioContext || (self as any).webkitAudioContext)();
    
    // Create buffer for PCM data (16-bit signed, 44.1kHz, mono)
    const audioBuffer = audioContext.createBuffer(1, arrayBuffer.byteLength / 2, 44100);
    const channelData = audioBuffer.getChannelData(0);
    const pcmData = new Int16Array(arrayBuffer);
    
    // Convert PCM to float
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 32768.0;
    }

    self.postMessage({ audioBuffer });
  } catch (err) {
    self.postMessage({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};
