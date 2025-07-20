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
    setStatus('Processing... (Converting and analyzing audio)');

    try {
      console.log('🎵 AUDIO-DIRECT: Starting direct audio processing');
      
      // Stream file to chunks and process directly in main thread
      const chunks = await streamFileToChunks(file);
      
      // Combine chunks
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
      
      console.log('🎵 AUDIO-DIRECT: Combined chunks, decoding audio...');
      
      // Create blob and decode using Web Audio API in main thread
      const audioBlob = new Blob([fullData], { type: file.type });
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log('🎵 AUDIO-DIRECT: Audio decoded successfully, duration:', audioBuffer.duration);
      
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
        console.log('🎵 AUDIO-DIRECT: Applied normalization, factor:', normalizationFactor);
      }
      
      // Process the audio buffer
      onProcessed(audioBuffer);
      if (onVisualize) onVisualize(audioBuffer);
      setStatus('Processing complete. Enhanced waveform ready!');
      
    } catch (err) {
      console.error('🎵 AUDIO-DIRECT: Error:', err);
      setStatus(`Error processing audio: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
