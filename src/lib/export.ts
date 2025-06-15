
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { MediaClip } from '@/types';

type ExportProps = {
  timelineClips: MediaClip[];
  audioFile: File;
  setExportProgress: (progress: number) => void;
  ffmpeg: FFmpeg;
};

export async function exportVideo({
  timelineClips,
  audioFile,
  setExportProgress,
  ffmpeg
}: ExportProps): Promise<Blob> {
  
  // Using a specific version from unpkg for stability
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  
  ffmpeg.on('progress', ({ progress }) => {
    // Progress is a value from 0 to 1
    setExportProgress(Math.round(progress * 100));
  });

  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  }

  // Write files to ffmpeg's virtual filesystem
  await ffmpeg.writeFile(audioFile.name, await fetchFile(audioFile));
  
  const videoFileNames: string[] = [];
  for (const clip of timelineClips) {
    await ffmpeg.writeFile(clip.file.name, await fetchFile(clip.file));
    videoFileNames.push(clip.file.name);
  }

  // Create a file listing all videos to concatenate
  const concatFileContent = videoFileNames.map(name => `file '${name.replace(/'/g, "'\\''")}'`).join('\n');
  await ffmpeg.writeFile('concat.txt', concatFileContent);

  // Note: -c:v copy is fast but requires all clips to have compatible codecs, resolution, etc.
  // For a more robust solution, re-encoding (-c:v libx264) would be needed, but it's much slower.
  await ffmpeg.exec([
    '-f', 'concat',
    '-safe', '0',
    '-i', 'concat.txt',
    '-i', audioFile.name,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-shortest',
    'output.mp4',
  ]);

  const data = await ffmpeg.readFile('output.mp4');
  return new Blob([data], { type: 'video/mp4' });
}
