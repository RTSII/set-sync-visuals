import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { streamFileToChunks } from '@/utils/fetchFile';

interface AudioUploaderProps {
  onProcessed: (audioBuffer: AudioBuffer) => void;
  onVisualize?: (audioBuffer: AudioBuffer) => void; // New prop for visualization handoff
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ onProcessed, onVisualize }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('Upload an MP3 or WAV file (up to 300MB)');
  const workerRef = useRef<Worker | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 300 * 1024 * 1024) {
        setStatus('File too large (max 300MB)');
        return;
      }
      setFile(selectedFile);
      setStatus('File selected. Click Process to start.');
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setStatus('Processing... (This may take 30-60s for large files)');

    // Initialize Web Worker
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('@/workers/preprocessWorker.ts', import.meta.url));
      workerRef.current.onmessage = (e) => {
        if (e.data.error) {
          setStatus(`Error: ${e.data.error}`);
        } else {
          const audioBuffer = e.data.audioBuffer as AudioBuffer;
          onProcessed(audioBuffer);
          if (onVisualize) onVisualize(audioBuffer); // Trigger visualization
          setStatus('Processing complete. AudioBuffer ready for next step.');
        }
      };
    }

    try {
      // Stream file to chunks and send to worker
      const chunks = await streamFileToChunks(file);
      workerRef.current.postMessage({ chunks, fileType: file.type });
    } catch (err) {
      setStatus(`Error streaming file: ${err.message}`);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Audio Uploader</CardTitle>
      </CardHeader>
      <CardContent>
        <Input type="file" accept=".mp3,.wav" onChange={handleFileChange} />
        <Button onClick={handleProcess} disabled={!file} className="mt-4">
          Process Audio
        </Button>
        <p className="mt-2 text-sm">{status}</p>
      </CardContent>
    </Card>
  );
};

export default AudioUploader;
