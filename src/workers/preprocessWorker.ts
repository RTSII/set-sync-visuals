import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ log: true });

self.onmessage = async (e: MessageEvent) => {
  const { chunks, fileType } = e.data;

  try {
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }

    // Write chunks to FFmpeg FS
    const inputFile = 'input.' + (fileType === 'audio/mpeg' ? 'mp3' : 'wav');
    let fullData = new Uint8Array(0);
    for (const chunk of chunks) {
      const newData = new Uint8Array(fullData.length + chunk.length);
      newData.set(fullData);
      newData.set(chunk, fullData.length);
      fullData = newData;
    }
    ffmpeg.FS('writeFile', inputFile, await fetchFile(fullData));

    // Preprocess: Decode to PCM, resample to 44.1kHz, normalize with loudnorm, preserve lows (low-shelf boost for 20-250Hz)
    await ffmpeg.run(
      '-i', inputFile,
      '-af', 'ashelf=type=lowshelf:frequency=100:gain=3:width_type=h:width=200, loudnorm=I=-16:TP=-1:LRA=11', // Low-shelf for electronic lows + loudnorm
      '-ar', '44100', // Resample to 44.1kHz
      '-f', 's16le', // PCM output
      'output.pcm'
    );

    const outputData = ffmpeg.FS('readFile', 'output.pcm');
    const audioContext = new (self.AudioContext || (self as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(outputData.buffer);

    self.postMessage({ audioBuffer });
  } catch (err) {
    self.postMessage({ error: err.message });
  }
};
